import { db, memoryDb } from "../db";
import { paymentMethodsConfigTable, PaymentMethodConfigRow } from "../db/schema";
import { eq } from "drizzle-orm";

export interface SavedPaymentMethod {
  id: string;
  userId: string;
  type: string;
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
  createdAt: Date;
}

// In-Memory fallback store for user saved payment methods and auto-renew settings
const savedMethodsStore = new Map<string, SavedPaymentMethod[]>();
const autoRenewStore = new Map<string, boolean>();

// Pre-seed default user payment method
savedMethodsStore.set("usr_admin01", [
  {
    id: "pm_default_4242",
    userId: "usr_admin01",
    type: "unified",
    brand: "Visa / mada",
    last4: "4242",
    expMonth: 9,
    expYear: 2028,
    isDefault: true,
    createdAt: new Date(),
  },
]);

export async function getPaymentMethodsConfig(): Promise<PaymentMethodConfigRow[]> {
  if (db) {
    try {
      return await db.select().from(paymentMethodsConfigTable);
    } catch {
      // Fallback
    }
  }
  return Array.from(memoryDb.paymentMethodsConfig.values());
}

export async function getPaymentMethodById(id: string): Promise<PaymentMethodConfigRow | null> {
  if (db) {
    try {
      const rows = await db.select().from(paymentMethodsConfigTable).where(eq(paymentMethodsConfigTable.id, id)).limit(1);
      if (rows.length > 0) return rows[0];
    } catch {
      // Fallback
    }
  }
  return memoryDb.paymentMethodsConfig.get(id) || null;
}

export async function updatePaymentMethodConfig(id: string, updates: Partial<PaymentMethodConfigRow>): Promise<PaymentMethodConfigRow> {
  const existing = await getPaymentMethodById(id);
  const now = new Date();

  const record: PaymentMethodConfigRow = {
    id,
    name: updates.name || (existing ? existing.name : id),
    provider: updates.provider || (existing ? existing.provider : "stripe"),
    enabled: updates.enabled !== undefined ? updates.enabled : (existing ? existing.enabled : true),
    currency: updates.currency || (existing ? existing.currency : "SAR"),
    paymentMethodType: updates.paymentMethodType || (existing ? existing.paymentMethodType : id),
    status: updates.status || (existing ? existing.status : "active"),
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(paymentMethodsConfigTable).values(record).onConflictDoUpdate({
        target: paymentMethodsConfigTable.id,
        set: record,
      });
    } catch {
      // Fallback
    }
  }

  memoryDb.paymentMethodsConfig.set(id, record);
  return record;
}

/**
 * Validates whether a payment method or unified checkout option is permitted by OPROX policy.
 * Supported instruments:
 * Saudi: mada, STC Pay, Barq, Bank Transfer, Visa, Mastercard
 * International: Visa, Mastercard, International Bank Transfer
 * Unified checkout is the primary payment experience.
 */
export async function validatePaymentMethodAllowed(methodId: string): Promise<{ allowed: boolean; reason?: string; config?: PaymentMethodConfigRow }> {
  const normalizedId = methodId.toLowerCase().trim();

  // Standalone credit_card option check for commercial policy
  if (normalizedId === "credit_card") {
    const existing = await getPaymentMethodById("credit_card");
    if (!existing || !existing.enabled) {
      return {
        allowed: false,
        reason: "Payment method 'Credit Card' is disabled by OPROX commercial policy.",
      };
    }
  }
  if (["unified", "unified_checkout", "unified_payment", "pay_now", "one_click"].includes(normalizedId)) {
    return {
      allowed: true,
      config: {
        id: "unified",
        name: "Unified Payment Checkout",
        provider: "stripe",
        enabled: true,
        currency: "SAR",
        paymentMethodType: "unified",
        status: "active",
        updatedAt: new Date(),
      },
    };
  }

  // List of approved Saudi and International payment instruments
  const supportedInstruments = [
    "mada",
    "stc_pay",
    "barq",
    "barq_pay",
    "bank_transfer",
    "international_bank_transfer",
    "visa",
    "mastercard",
    "credit_card",
    "card",
    "apple_pay",
  ];

  if (supportedInstruments.includes(normalizedId)) {
    const existing = await getPaymentMethodById(normalizedId);
    if (existing && (!existing.enabled || existing.status !== "active")) {
      return {
        allowed: false,
        reason: `Payment method '${existing.name}' is currently disabled or restricted.`,
        config: existing,
      };
    }
    return {
      allowed: true,
      config: existing || {
        id: normalizedId,
        name: normalizedId.toUpperCase(),
        provider: "stripe",
        enabled: true,
        currency: "SAR",
        paymentMethodType: normalizedId,
        status: "active",
        updatedAt: new Date(),
      },
    };
  }

  const method = await getPaymentMethodById(normalizedId);
  if (!method) {
    return {
      allowed: false,
      reason: `Payment method '${methodId}' is not configured in the payment provider abstraction.`,
    };
  }

  if (!method.enabled || method.status !== "active") {
    return {
      allowed: false,
      reason: `Payment method '${method.name}' is currently disabled or restricted by policy.`,
      config: method,
    };
  }

  return { allowed: true, config: method };
}

// ── Saved Payment Method Management (Optional Storage Policy) ────────────────

export async function getSavedPaymentMethods(userId: string): Promise<SavedPaymentMethod[]> {
  const list = savedMethodsStore.get(userId) || [];
  return list;
}

export async function addSavedPaymentMethod(
  userId: string,
  data: { type?: string; last4?: string; brand?: string; expMonth?: number; expYear?: number; isDefault?: boolean }
): Promise<SavedPaymentMethod> {
  const userMethods = savedMethodsStore.get(userId) || [];
  const isFirst = userMethods.length === 0;
  const isDefault = data.isDefault !== undefined ? data.isDefault : isFirst;

  if (isDefault) {
    for (const m of userMethods) {
      m.isDefault = false;
    }
  }

  const newMethod: SavedPaymentMethod = {
    id: `pm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    type: data.type || "unified",
    brand: data.brand || "Visa / mada",
    last4: data.last4 || "4242",
    expMonth: data.expMonth || 12,
    expYear: data.expYear || 2028,
    isDefault,
    createdAt: new Date(),
  };

  userMethods.push(newMethod);
  savedMethodsStore.set(userId, userMethods);
  return newMethod;
}

export async function removeSavedPaymentMethod(userId: string, methodId: string): Promise<{ success: boolean }> {
  let list = savedMethodsStore.get(userId) || [];
  const initialLength = list.length;
  list = list.filter((m) => m.id !== methodId);

  // If we deleted default method, set first remaining as default
  if (list.length > 0 && !list.some((m) => m.isDefault)) {
    list[0].isDefault = true;
  }

  savedMethodsStore.set(userId, list);
  return { success: list.length < initialLength };
}

export async function replaceSavedPaymentMethod(
  userId: string,
  oldMethodId: string,
  newMethodData: { type?: string; last4?: string; brand?: string; expMonth?: number; expYear?: number; isDefault?: boolean }
): Promise<SavedPaymentMethod> {
  await removeSavedPaymentMethod(userId, oldMethodId);
  return await addSavedPaymentMethod(userId, newMethodData);
}

export async function setDefaultPaymentMethod(userId: string, methodId: string): Promise<SavedPaymentMethod> {
  const list = savedMethodsStore.get(userId) || [];
  let found: SavedPaymentMethod | null = null;

  for (const m of list) {
    if (m.id === methodId) {
      m.isDefault = true;
      found = m;
    } else {
      m.isDefault = false;
    }
  }

  if (!found) {
    throw new Error(`Saved payment method '${methodId}' not found for user '${userId}'.`);
  }

  savedMethodsStore.set(userId, list);
  return found;
}

// ── Auto-Renew Management (Default OFF Policy) ────────────────────────────────

export async function getAutoRenewSetting(userId: string): Promise<boolean> {
  // Policy Default: AUTO RENEW = OFF (false)
  return autoRenewStore.get(userId) ?? false;
}

export async function setAutoRenewSetting(userId: string, enabled: boolean): Promise<boolean> {
  autoRenewStore.set(userId, enabled);
  return enabled;
}

export async function getWalletBalance(userId: string): Promise<{ balanceUsd: number; balanceHalalas: number }> {
  return { balanceUsd: 100, balanceHalalas: 37500 };
}