import { db, memoryDb } from "../db";
import { localInvoicesTable, LocalInvoiceRow } from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface VatCalculationResult {
  subtotalHalalas: number;
  vatRateBps: number;
  vatAmountHalalas: number;
  totalAmountHalalas: number;
}

export const DEFAULT_SAUDI_VAT_BPS = 1500; // 15.00%
export const DEFAULT_SELLER_LEGAL_NAME = "OPROX OS Ecosystem Ltd.";
export const DEFAULT_SELLER_VAT_NUMBER = "310000000000003";

export function calculateSaudiVat(subtotalHalalas: number, vatRateBps: number = DEFAULT_SAUDI_VAT_BPS): VatCalculationResult {
  const safeSubtotal = Math.max(0, Math.round(subtotalHalalas));
  const vatAmountHalalas = Math.round((safeSubtotal * vatRateBps) / 10000);
  const totalAmountHalalas = safeSubtotal + vatAmountHalalas;

  return {
    subtotalHalalas: safeSubtotal,
    vatRateBps,
    vatAmountHalalas,
    totalAmountHalalas,
  };
}

export async function generateSequentialInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  let seqVal = 0;

  if (db) {
    try {
      const result = await db.execute(sql`
        INSERT INTO invoice_sequences (year, last_value)
        VALUES (${year}, 1)
        ON CONFLICT (year) DO UPDATE
        SET last_value = invoice_sequences.last_value + 1
        RETURNING last_value
      `);
      const rows = (result.rows || result) as any[];
      if (rows && rows.length > 0 && rows[0].last_value != null) {
        seqVal = Number(rows[0].last_value);
      }
    } catch {
      // Fallback below if sequence table doesn't exist yet or query fails
    }
  }

  if (seqVal === 0) {
    const currentSeq = memoryDb.invoiceSequences.get(year) || 0;
    seqVal = currentSeq + 1;
    memoryDb.invoiceSequences.set(year, seqVal);
  }

  const padded = String(seqVal).padStart(6, "0");
  return `INV-${year}-${padded}`;
}

export interface ZatcaQrOptions {
  sellerName: string;
  vatRegistrationNumber: string;
  timestamp: string | Date;
  totalAmountHalalas: number;
  vatAmountHalalas: number;
}

/**
 * Builds standard ZATCA TLV (Tag-Length-Value) Base64 QR Code string
 * Tag 1: Seller Name
 * Tag 2: Seller VAT Number
 * Tag 3: Timestamp (ISO 8601)
 * Tag 4: Invoice Total (with VAT)
 * Tag 5: VAT Total
 */
export function buildZatcaQrPayload(
  sellerNameOrOptions: string | ZatcaQrOptions,
  sellerVatNumber?: string,
  timestampIso?: string,
  totalAmountStr?: string,
  vatAmountStr?: string
): string {
  let sellerName: string;
  let vatNum: string;
  let ts: string;
  let totalStr: string;
  let vatStr: string;

  if (typeof sellerNameOrOptions === "object") {
    sellerName = sellerNameOrOptions.sellerName;
    vatNum = sellerNameOrOptions.vatRegistrationNumber;
    ts = sellerNameOrOptions.timestamp instanceof Date ? sellerNameOrOptions.timestamp.toISOString() : sellerNameOrOptions.timestamp;
    totalStr = `${(sellerNameOrOptions.totalAmountHalalas / 100).toFixed(2)} SAR`;
    vatStr = `${(sellerNameOrOptions.vatAmountHalalas / 100).toFixed(2)} SAR`;
  } else {
    sellerName = sellerNameOrOptions;
    vatNum = sellerVatNumber || "";
    ts = timestampIso || "";
    totalStr = totalAmountStr || "";
    vatStr = vatAmountStr || "";
  }

  function encodeTlv(tag: number, value: string): Uint8Array {
    const encoder = new TextEncoder();
    const valueBytes = encoder.encode(value);
    const tagLen = 2 + valueBytes.length;
    const buf = new Uint8Array(tagLen);
    buf[0] = tag;
    buf[1] = valueBytes.length;
    buf.set(valueBytes, 2);
    return buf;
  }

  const t1 = encodeTlv(1, sellerName);
  const t2 = encodeTlv(2, vatNum);
  const t3 = encodeTlv(3, ts);
  const t4 = encodeTlv(4, totalStr);
  const t5 = encodeTlv(5, vatStr);

  const totalLen = t1.length + t2.length + t3.length + t4.length + t5.length;
  const combined = new Uint8Array(totalLen);
  let offset = 0;
  for (const t of [t1, t2, t3, t4, t5]) {
    combined.set(t, offset);
    offset += t.length;
  }

  if (typeof Buffer !== "undefined") {
    return Buffer.from(combined).toString("base64");
  }
  return btoa(String.fromCharCode(...combined));
}

export interface CreateInvoiceParams {
  id?: string;
  userId: string;
  orgId?: string | null;
  stripeCustomerId?: string | null;
  subtotalHalalas: number;
  currency?: "SAR" | "USD";
  invoiceType?: "B2B_TAX_INVOICE" | "B2C_SIMPLIFIED_INVOICE";
  buyerLegalName?: string | null;
  buyerVatNumber?: string | null;
  status?: "paid" | "open" | "draft" | "void";
  creditNoteRef?: string | null;
  debitNoteRef?: string | null;
}

export async function createZatcaInvoice(params: CreateInvoiceParams): Promise<LocalInvoiceRow> {
  const currency = params.currency || "SAR";
  const vatCalc = calculateSaudiVat(params.subtotalHalalas, DEFAULT_SAUDI_VAT_BPS);
  const seqNumber = await generateSequentialInvoiceNumber();
  const invoiceId = params.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();
  const issueTimestamp = now.toISOString();

  const totalInUnits = (vatCalc.totalAmountHalalas / 100).toFixed(2);
  const vatInUnits = (vatCalc.vatAmountHalalas / 100).toFixed(2);

  const qrPayload = buildZatcaQrPayload(
    DEFAULT_SELLER_LEGAL_NAME,
    DEFAULT_SELLER_VAT_NUMBER,
    issueTimestamp,
    `${totalInUnits} ${currency}`,
    `${vatInUnits} ${currency}`
  );

  const structuredData = {
    zatcaSpecVersion: "2.0",
    invoiceType: params.invoiceType || "B2C_SIMPLIFIED_INVOICE",
    issueTimestamp,
    sequentialNumber: seqNumber,
    seller: {
      legalName: DEFAULT_SELLER_LEGAL_NAME,
      vatNumber: DEFAULT_SELLER_VAT_NUMBER,
      country: "SA",
    },
    buyer: {
      legalName: params.buyerLegalName || "Consumer",
      vatNumber: params.buyerVatNumber || null,
    },
    pricing: {
      subtotalHalalas: vatCalc.subtotalHalalas,
      vatRateBps: vatCalc.vatRateBps,
      vatAmountHalalas: vatCalc.vatAmountHalalas,
      totalAmountHalalas: vatCalc.totalAmountHalalas,
      currency,
    },
  };

  const invoiceRecord: LocalInvoiceRow = {
    id: invoiceId,
    sequentialNumber: seqNumber,
    invoiceType: params.invoiceType || "B2C_SIMPLIFIED_INVOICE",
    stripeCustomerId: params.stripeCustomerId || null,
    userId: params.userId,
    orgId: params.orgId || null,
    amountDue: vatCalc.subtotalHalalas,
    amountPaid: params.status === "paid" ? vatCalc.subtotalHalalas : 0,
    subtotalHalalas: vatCalc.subtotalHalalas,
    vatRateBps: vatCalc.vatRateBps,
    vatAmountHalalas: vatCalc.vatAmountHalalas,
    totalAmountHalalas: vatCalc.totalAmountHalalas,
    currency,
    status: params.status || "paid",
    sellerLegalName: DEFAULT_SELLER_LEGAL_NAME,
    sellerVatNumber: DEFAULT_SELLER_VAT_NUMBER,
    buyerLegalName: params.buyerLegalName || null,
    buyerVatNumber: params.buyerVatNumber || null,
    qrCodePayload: qrPayload,
    structuredData,
    creditNoteRef: params.creditNoteRef || null,
    debitNoteRef: params.debitNoteRef || null,
    invoicePdfUrl: `/api/billing/invoices/${invoiceId}/view`,
    createdAt: now,
  };

  if (db) {
    try {
      await db.insert(localInvoicesTable).values(invoiceRecord);
    } catch {
      // Fallback
    }
  }

  memoryDb.invoices.set(invoiceId, invoiceRecord);
  return invoiceRecord;
}
