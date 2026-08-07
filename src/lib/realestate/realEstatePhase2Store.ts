/**
 * OPROX Real Estate Phase 2 — Service & Domain Logic Engine
 * Tenant Management, Lease Lifecycle State Machine, Rent Schedules, Payments,
 * Security Deposits, Lease Events, Lease Documents, and Financial Operations.
 */

import { eq, and, desc, inArray } from 'drizzle-orm';
import { db } from '../../db';
import {
  realEstateContactsTable,
  realEstateTenantsTable,
  realEstateLeasesTable,
  realEstateLeaseUnitsTable,
  realEstateLeaseSchedulesTable,
  realEstateLeaseChargesTable,
  realEstatePaymentsTable,
  realEstatePaymentAllocationsTable,
  realEstateSecurityDepositsTable,
  realEstateLeaseEventsTable,
  realEstateLeaseDocumentsTable,
  realEstateUnitsTable,
  localInvoicesTable,
  invoiceSequencesTable,
  RealEstateContactRow,
  RealEstateTenantRow,
  RealEstateLeaseRow,
  RealEstateLeaseUnitRow,
  RealEstateLeaseScheduleRow,
  RealEstateLeaseChargeRow,
  RealEstatePaymentRow,
  RealEstatePaymentAllocationRow,
  RealEstateSecurityDepositRow,
  RealEstateLeaseEventRow,
  RealEstateLeaseDocumentRow,
} from '../../db/schema';
import { getUnit, updateUnit } from './realEstateStore';

// In-Memory Fallback Stores for unit tests & non-DB mode
const memoryContacts: RealEstateContactRow[] = [];
const memoryTenants: RealEstateTenantRow[] = [];
const memoryLeases: RealEstateLeaseRow[] = [];
const memoryLeaseUnits: RealEstateLeaseUnitRow[] = [];
const memoryLeaseSchedules: RealEstateLeaseScheduleRow[] = [];
const memoryLeaseCharges: RealEstateLeaseChargeRow[] = [];
const memoryPayments: RealEstatePaymentRow[] = [];
const memoryPaymentAllocations: RealEstatePaymentAllocationRow[] = [];
const memorySecurityDeposits: RealEstateSecurityDepositRow[] = [];
const memoryLeaseEvents: RealEstateLeaseEventRow[] = [];
const memoryLeaseDocuments: RealEstateLeaseDocumentRow[] = [];

function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
}

// ── LEASE LIFECYCLE STATE MACHINE MATRIX ───────────────────────────────────

export const ALLOWED_LEASE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
  PENDING_APPROVAL: ['APPROVED', 'DRAFT', 'CANCELLED'],
  APPROVED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['EXPIRING', 'RENEWAL_PENDING', 'TERMINATION_PENDING', 'EXPIRED', 'TERMINATED'],
  EXPIRING: ['RENEWAL_PENDING', 'TERMINATION_PENDING', 'EXPIRED', 'ACTIVE'],
  RENEWAL_PENDING: ['ACTIVE', 'EXPIRING', 'EXPIRED', 'TERMINATED'],
  TERMINATION_PENDING: ['TERMINATED', 'ACTIVE'],
  TERMINATED: [],
  EXPIRED: [],
  CANCELLED: [],
};

export function canTransitionLease(currentStatus: string, targetStatus: string): boolean {
  const allowed = ALLOWED_LEASE_TRANSITIONS[currentStatus] || [];
  return allowed.includes(targetStatus);
}

// ── CONTACTS MANAGEMENT ───────────────────────────────────────────────────

export async function listContacts(tenantId: string): Promise<RealEstateContactRow[]> {
  if (db) {
    return await db
      .select()
      .from(realEstateContactsTable)
      .where(eq(realEstateContactsTable.tenantId, tenantId))
      .orderBy(desc(realEstateContactsTable.createdAt));
  }
  return memoryContacts.filter((c) => c.tenantId === tenantId);
}

export async function getContact(tenantId: string, id: string): Promise<RealEstateContactRow | null> {
  if (db) {
    const res = await db
      .select()
      .from(realEstateContactsTable)
      .where(and(eq(realEstateContactsTable.tenantId, tenantId), eq(realEstateContactsTable.id, id)));
    return res[0] || null;
  }
  return memoryContacts.find((c) => c.tenantId === tenantId && c.id === id) || null;
}

export async function createContact(data: {
  tenantId: string;
  type?: string; // INDIVIDUAL | COMPANY
  fullName: string;
  arabicName?: string;
  mobile?: string;
  email?: string;
  nationalIdOrIqama?: string;
  nationality?: string;
  preferredLanguage?: string;
  companyName?: string;
  crNumber?: string;
  vatNumber?: string;
  authorizedRep?: string;
}): Promise<RealEstateContactRow> {
  const row: RealEstateContactRow = {
    id: genId('cont'),
    tenantId: data.tenantId,
    type: data.type || 'INDIVIDUAL',
    fullName: data.fullName,
    arabicName: data.arabicName || null,
    mobile: data.mobile || null,
    email: data.email || null,
    nationalIdOrIqama: data.nationalIdOrIqama || null,
    nationality: data.nationality || null,
    preferredLanguage: data.preferredLanguage || 'ar',
    companyName: data.companyName || null,
    crNumber: data.crNumber || null,
    vatNumber: data.vatNumber || null,
    authorizedRep: data.authorizedRep || null,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateContactsTable).values(row);
    return row;
  }
  memoryContacts.push(row);
  return row;
}

export async function updateContact(
  tenantId: string,
  id: string,
  updates: Partial<RealEstateContactRow>
): Promise<RealEstateContactRow | null> {
  if (db) {
    const res = await db
      .update(realEstateContactsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(realEstateContactsTable.tenantId, tenantId), eq(realEstateContactsTable.id, id)))
      .returning();
    return res[0] || null;
  }
  const idx = memoryContacts.findIndex((c) => c.tenantId === tenantId && c.id === id);
  if (idx === -1) return null;
  memoryContacts[idx] = { ...memoryContacts[idx], ...updates, updatedAt: new Date() };
  return memoryContacts[idx];
}

export async function deleteContact(tenantId: string, id: string): Promise<boolean> {
  if (db) {
    const res = await db
      .delete(realEstateContactsTable)
      .where(and(eq(realEstateContactsTable.tenantId, tenantId), eq(realEstateContactsTable.id, id)))
      .returning();
    return res.length > 0;
  }
  const idx = memoryContacts.findIndex((c) => c.tenantId === tenantId && c.id === id);
  if (idx === -1) return false;
  memoryContacts.splice(idx, 1);
  return true;
}

// ── REAL ESTATE TENANTS (PROPERTIES TENANTS) ──────────────────────────────

export async function listTenants(tenantId: string): Promise<(RealEstateTenantRow & { contact?: RealEstateContactRow })[]> {
  const tenants = db
    ? await db.select().from(realEstateTenantsTable).where(eq(realEstateTenantsTable.tenantId, tenantId)).orderBy(desc(realEstateTenantsTable.createdAt))
    : memoryTenants.filter((t) => t.tenantId === tenantId);

  const contacts = await listContacts(tenantId);
  const contactMap = new Map(contacts.map((c) => [c.id, c]));

  return tenants.map((t) => ({
    ...t,
    contact: contactMap.get(t.contactId),
  }));
}

export async function getTenant(tenantId: string, id: string): Promise<(RealEstateTenantRow & { contact?: RealEstateContactRow }) | null> {
  const tenantRow = db
    ? (await db.select().from(realEstateTenantsTable).where(and(eq(realEstateTenantsTable.tenantId, tenantId), eq(realEstateTenantsTable.id, id))))[0] || null
    : memoryTenants.find((t) => t.tenantId === tenantId && t.id === id) || null;

  if (!tenantRow) return null;
  const contact = await getContact(tenantId, tenantRow.contactId);
  return {
    ...tenantRow,
    contact: contact || undefined,
  };
}

export async function createTenant(data: {
  tenantId: string;
  contactId: string;
  creditRating?: string;
  notes?: string;
}): Promise<RealEstateTenantRow> {
  const row: RealEstateTenantRow = {
    id: genId('ret'),
    tenantId: data.tenantId,
    contactId: data.contactId,
    status: 'ACTIVE',
    creditRating: data.creditRating || 'GOOD',
    notes: data.notes || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateTenantsTable).values(row);
    return row;
  }
  memoryTenants.push(row);
  return row;
}

export async function updateTenant(
  tenantId: string,
  id: string,
  updates: Partial<RealEstateTenantRow>
): Promise<RealEstateTenantRow | null> {
  if (db) {
    const res = await db
      .update(realEstateTenantsTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(realEstateTenantsTable.tenantId, tenantId), eq(realEstateTenantsTable.id, id)))
      .returning();
    return res[0] || null;
  }
  const idx = memoryTenants.findIndex((t) => t.tenantId === tenantId && t.id === id);
  if (idx === -1) return null;
  memoryTenants[idx] = { ...memoryTenants[idx], ...updates, updatedAt: new Date() };
  return memoryTenants[idx];
}

// ── LEASES & LEASE UNITS ───────────────────────────────────────────────────

export async function listLeases(tenantId: string, filters?: { propertyId?: string; reTenantId?: string; status?: string }): Promise<RealEstateLeaseRow[]> {
  if (db) {
    const conditions = [eq(realEstateLeasesTable.tenantId, tenantId)];
    if (filters?.propertyId) conditions.push(eq(realEstateLeasesTable.propertyId, filters.propertyId));
    if (filters?.reTenantId) conditions.push(eq(realEstateLeasesTable.reTenantId, filters.reTenantId));
    if (filters?.status) conditions.push(eq(realEstateLeasesTable.status, filters.status));

    return await db
      .select()
      .from(realEstateLeasesTable)
      .where(and(...conditions))
      .orderBy(desc(realEstateLeasesTable.createdAt));
  }
  return memoryLeases.filter((l) => {
    if (l.tenantId !== tenantId) return false;
    if (filters?.propertyId && l.propertyId !== filters.propertyId) return false;
    if (filters?.reTenantId && l.reTenantId !== filters.reTenantId) return false;
    if (filters?.status && l.status !== filters.status) return false;
    return true;
  });
}

export async function getLease(tenantId: string, id: string): Promise<(RealEstateLeaseRow & { units?: string[] }) | null> {
  const leaseRow = db
    ? (await db.select().from(realEstateLeasesTable).where(and(eq(realEstateLeasesTable.tenantId, tenantId), eq(realEstateLeasesTable.id, id))))[0] || null
    : memoryLeases.find((l) => l.tenantId === tenantId && l.id === id) || null;

  if (!leaseRow) return null;

  const leaseUnits = db
    ? await db.select().from(realEstateLeaseUnitsTable).where(and(eq(realEstateLeaseUnitsTable.tenantId, tenantId), eq(realEstateLeaseUnitsTable.leaseId, id)))
    : memoryLeaseUnits.filter((lu) => lu.tenantId === tenantId && lu.leaseId === id);

  return {
    ...leaseRow,
    units: leaseUnits.map((lu) => lu.unitId),
  };
}

export async function createLease(data: {
  tenantId: string;
  leaseNumber?: string;
  propertyId: string;
  reTenantId: string;
  leaseType?: string;
  startDate: string;
  endDate: string;
  contractValueSar: number | string;
  paymentFrequency?: string; // MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL | CUSTOM
  securityDepositSar?: number | string;
  gracePeriodDays?: number;
  renewalOption?: boolean;
  noticePeriodDays?: number;
  ejarContractNumber?: string;
  terms?: string;
  unitIds?: string[];
  createdBy: string;
}): Promise<RealEstateLeaseRow> {
  const count = (await listLeases(data.tenantId)).length + 1;
  const leaseNumber = data.leaseNumber || `LSE-2026-${String(count).padStart(4, '0')}`;

  const row: RealEstateLeaseRow = {
    id: genId('lse'),
    tenantId: data.tenantId,
    leaseNumber,
    propertyId: data.propertyId,
    reTenantId: data.reTenantId,
    leaseType: data.leaseType || 'RESIDENTIAL',
    startDate: data.startDate,
    endDate: data.endDate,
    contractValueSar: String(data.contractValueSar),
    currency: 'SAR',
    paymentFrequency: data.paymentFrequency || 'QUARTERLY',
    securityDepositSar: String(data.securityDepositSar || 0),
    gracePeriodDays: data.gracePeriodDays ?? 0,
    renewalOption: data.renewalOption ?? false,
    noticePeriodDays: data.noticePeriodDays ?? 30,
    ejarContractNumber: data.ejarContractNumber || null,
    ejarStatus: data.ejarContractNumber ? 'PENDING' : 'NOT_CONFIGURED',
    terms: data.terms || null,
    status: 'DRAFT',
    createdBy: data.createdBy,
    approvedBy: null,
    approvedAt: null,
    activatedAt: null,
    terminatedAt: null,
    terminationReason: null,
    parentLeaseId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateLeasesTable).values(row);
  } else {
    memoryLeases.push(row);
  }

  // Link units
  if (data.unitIds && data.unitIds.length > 0) {
    for (const unitId of data.unitIds) {
      const unitRow: RealEstateLeaseUnitRow = {
        id: crypto.randomUUID(),
        tenantId: data.tenantId,
        leaseId: row.id,
        unitId,
        allocatedRentSar: String(Number(data.contractValueSar) / data.unitIds.length),
        createdAt: new Date(),
      };
      if (db) {
        await db.insert(realEstateLeaseUnitsTable).values(unitRow);
      } else {
        memoryLeaseUnits.push(unitRow);
      }
    }
  }

  // Log event
  await logLeaseEvent({
    tenantId: data.tenantId,
    leaseId: row.id,
    eventType: 'CREATED',
    actorId: data.createdBy,
    notes: `Lease ${leaseNumber} created in DRAFT state.`,
  });

  return row;
}

// ── LEASE LIFECYCLE TRANSITION ENGINE ─────────────────────────────────────

export async function transitionLeaseStatus(
  tenantId: string,
  leaseId: string,
  targetStatus: string,
  actorId: string,
  options?: { notes?: string; terminationReason?: string }
): Promise<RealEstateLeaseRow> {
  const lease = await getLease(tenantId, leaseId);
  if (!lease) {
    throw new Error(`Lease with ID ${leaseId} not found.`);
  }

  if (!canTransitionLease(lease.status, targetStatus)) {
    throw new Error(`Invalid lease transition from ${lease.status} to ${targetStatus}.`);
  }

  const updates: Partial<RealEstateLeaseRow> = {
    status: targetStatus,
    updatedAt: new Date(),
  };

  // Specific Actions per status transition
  if (targetStatus === 'APPROVED') {
    updates.approvedBy = actorId;
    updates.approvedAt = new Date();
  } else if (targetStatus === 'ACTIVE') {
    // Validate unit availability
    const linkedUnits = lease.units || [];
    for (const unitId of linkedUnits) {
      const unit = await getUnit(tenantId, unitId);
      if (unit && unit.status === 'Rented') {
        throw new Error(`Unit ${unit.unitNumber} (${unit.id}) is already rented.`);
      }
    }

    // Set units to Rented
    for (const unitId of linkedUnits) {
      await updateUnit(tenantId, unitId, { status: 'Rented' });
    }

    updates.activatedAt = new Date();

    // Auto-generate schedules if empty
    const existingSchedules = await listLeaseSchedules(tenantId, leaseId);
    if (existingSchedules.length === 0) {
      await generateRentSchedules(tenantId, leaseId);
    }
  } else if (targetStatus === 'TERMINATED' || targetStatus === 'EXPIRED') {
    // Release units back to Vacant
    const linkedUnits = lease.units || [];
    for (const unitId of linkedUnits) {
      await updateUnit(tenantId, unitId, { status: 'Vacant' });
    }

    updates.terminatedAt = new Date();
    if (options?.terminationReason) {
      updates.terminationReason = options.terminationReason;
    }
  }

  // Update Lease Row
  let updatedLease: RealEstateLeaseRow;
  if (db) {
    const res = await db
      .update(realEstateLeasesTable)
      .set(updates)
      .where(and(eq(realEstateLeasesTable.tenantId, tenantId), eq(realEstateLeasesTable.id, leaseId)))
      .returning();
    updatedLease = res[0];
  } else {
    const idx = memoryLeases.findIndex((l) => l.tenantId === tenantId && l.id === leaseId);
    memoryLeases[idx] = { ...memoryLeases[idx], ...updates };
    updatedLease = memoryLeases[idx];
  }

  // Log Event
  await logLeaseEvent({
    tenantId,
    leaseId,
    eventType: targetStatus,
    actorId,
    notes: options?.notes || `Lease status changed from ${lease.status} to ${targetStatus}.`,
  });

  return updatedLease;
}

export async function renewLease(
  tenantId: string,
  parentLeaseId: string,
  data: {
    startDate: string;
    endDate: string;
    contractValueSar: number | string;
    paymentFrequency?: string;
    actorId: string;
  }
): Promise<RealEstateLeaseRow> {
  const parentLease = await getLease(tenantId, parentLeaseId);
  if (!parentLease) throw new Error(`Parent lease ${parentLeaseId} not found.`);

  // Create child lease
  const childLease = await createLease({
    tenantId,
    propertyId: parentLease.propertyId,
    reTenantId: parentLease.reTenantId,
    leaseType: parentLease.leaseType,
    startDate: data.startDate,
    endDate: data.endDate,
    contractValueSar: data.contractValueSar,
    paymentFrequency: data.paymentFrequency || parentLease.paymentFrequency,
    securityDepositSar: parentLease.securityDepositSar || 0,
    unitIds: parentLease.units,
    createdBy: data.actorId,
  });

  // Set parent link
  if (db) {
    await db.update(realEstateLeasesTable).set({ parentLeaseId }).where(eq(realEstateLeasesTable.id, childLease.id));
  } else {
    const idx = memoryLeases.findIndex((l) => l.id === childLease.id);
    if (idx !== -1) memoryLeases[idx].parentLeaseId = parentLeaseId;
  }

  // Mark parent lease as RENEWAL_PENDING or EXPIRED
  if (canTransitionLease(parentLease.status, 'RENEWAL_PENDING')) {
    await transitionLeaseStatus(tenantId, parentLeaseId, 'RENEWAL_PENDING', data.actorId, {
      notes: `Lease renewed under new contract ${childLease.leaseNumber}`,
    });
  }

  return childLease;
}

// ── RENT SCHEDULE GENERATOR & CHARGES ─────────────────────────────────────

export function getPaymentProviderStatus(): 'NOT_CONFIGURED' | 'CONFIGURED' {
  return 'NOT_CONFIGURED';
}

export async function generateRentSchedules(
  tenantId: string,
  leaseId: string,
  customInstallments?: Array<{ dueDate: string; amountSar: number | string }>
): Promise<RealEstateLeaseScheduleRow[]> {
  const lease = await getLease(tenantId, leaseId);
  if (!lease) throw new Error(`Lease ${leaseId} not found.`);

  const contractValue = Number(lease.contractValueSar);
  const freq = lease.paymentFrequency.toUpperCase();

  if (freq === 'CUSTOM' || (customInstallments && customInstallments.length > 0)) {
    if (!customInstallments || customInstallments.length === 0) {
      throw new Error(`Custom rent schedules require explicitly defined customInstallments array.`);
    }

    let totalCustomAmount = 0;
    for (const inst of customInstallments) {
      const amt = Number(inst.amountSar);
      if (isNaN(amt) || amt <= 0) {
        throw new Error(`Invalid custom installment amount: ${inst.amountSar}. Must be positive.`);
      }
      if (!inst.dueDate || isNaN(new Date(inst.dueDate).getTime())) {
        throw new Error(`Invalid custom installment due date: ${inst.dueDate}.`);
      }
      totalCustomAmount += amt;
    }

    if (Math.abs(totalCustomAmount - contractValue) > 0.01) {
      throw new Error(
        `Custom installments sum (${totalCustomAmount.toFixed(2)}) does not match lease contract value (${contractValue.toFixed(2)}).`
      );
    }

    const schedules: RealEstateLeaseScheduleRow[] = [];
    for (let i = 0; i < customInstallments.length; i++) {
      const inst = customInstallments[i];
      const amount = Number(inst.amountSar);

      const schRow: RealEstateLeaseScheduleRow = {
        id: genId('sch'),
        tenantId,
        leaseId,
        installmentNumber: i + 1,
        dueDate: inst.dueDate,
        amountSar: String(amount),
        paidAmountSar: '0',
        outstandingAmountSar: String(amount),
        status: 'UPCOMING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (db) {
        await db.insert(realEstateLeaseSchedulesTable).values(schRow);
      } else {
        memoryLeaseSchedules.push(schRow);
      }

      schedules.push(schRow);

      await createLeaseCharge({
        tenantId,
        leaseId,
        scheduleId: schRow.id,
        chargeType: 'RENT',
        description: `Custom Rent Installment #${i + 1} for Lease ${lease.leaseNumber}`,
        amountSar: amount,
      });
    }

    return schedules;
  }

  let installmentCount = 4; // default quarterly
  if (freq === 'MONTHLY') installmentCount = 12;
  else if (freq === 'QUARTERLY') installmentCount = 4;
  else if (freq === 'SEMI_ANNUAL') installmentCount = 2;
  else if (freq === 'ANNUAL') installmentCount = 1;

  const installmentAmount = Math.floor((contractValue / installmentCount) * 100) / 100;
  const remainder = Math.round((contractValue - installmentAmount * installmentCount) * 100) / 100;

  const schedules: RealEstateLeaseScheduleRow[] = [];
  const start = new Date(lease.startDate);

  for (let i = 1; i <= installmentCount; i++) {
    const amount = i === installmentCount ? installmentAmount + remainder : installmentAmount;
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + (i - 1) * (12 / installmentCount));

    const schRow: RealEstateLeaseScheduleRow = {
      id: genId('sch'),
      tenantId,
      leaseId,
      installmentNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      amountSar: String(amount),
      paidAmountSar: '0',
      outstandingAmountSar: String(amount),
      status: 'UPCOMING',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (db) {
      await db.insert(realEstateLeaseSchedulesTable).values(schRow);
    } else {
      memoryLeaseSchedules.push(schRow);
    }

    schedules.push(schRow);

    // Create corresponding lease charge
    await createLeaseCharge({
      tenantId,
      leaseId,
      scheduleId: schRow.id,
      chargeType: 'RENT',
      description: `Rent Installment #${i} for Lease ${lease.leaseNumber}`,
      amountSar: amount,
    });
  }

  return schedules;
}

export async function listLeaseSchedules(tenantId: string, leaseId: string): Promise<RealEstateLeaseScheduleRow[]> {
  if (db) {
    return await db
      .select()
      .from(realEstateLeaseSchedulesTable)
      .where(and(eq(realEstateLeaseSchedulesTable.tenantId, tenantId), eq(realEstateLeaseSchedulesTable.leaseId, leaseId)))
      .orderBy(realEstateLeaseSchedulesTable.installmentNumber);
  }
  return memoryLeaseSchedules.filter((s) => s.tenantId === tenantId && s.leaseId === leaseId);
}

export async function createLeaseCharge(data: {
  tenantId: string;
  leaseId: string;
  scheduleId?: string;
  chargeType: string;
  description: string;
  amountSar: number | string;
  invoiceId?: string;
}): Promise<RealEstateLeaseChargeRow> {
  const row: RealEstateLeaseChargeRow = {
    id: genId('chg'),
    tenantId: data.tenantId,
    leaseId: data.leaseId,
    scheduleId: data.scheduleId || null,
    chargeType: data.chargeType,
    description: data.description,
    amountSar: String(data.amountSar),
    paidAmountSar: '0',
    outstandingAmountSar: String(data.amountSar),
    status: 'DUE',
    invoiceId: data.invoiceId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateLeaseChargesTable).values(row);
  } else {
    memoryLeaseCharges.push(row);
  }

  return row;
}

export async function listLeaseCharges(tenantId: string, leaseId: string): Promise<RealEstateLeaseChargeRow[]> {
  if (db) {
    const conditions = [eq(realEstateLeaseChargesTable.tenantId, tenantId)];
    if (leaseId) conditions.push(eq(realEstateLeaseChargesTable.leaseId, leaseId));
    return await db
      .select()
      .from(realEstateLeaseChargesTable)
      .where(and(...conditions))
      .orderBy(realEstateLeaseChargesTable.createdAt);
  }
  return memoryLeaseCharges.filter((c) => c.tenantId === tenantId && (!leaseId || c.leaseId === leaseId));
}

export async function createInvoiceForLeaseCharge(
  tenantId: string,
  chargeId: string,
  userId: string = 'system_re_admin'
) {
  const chargeList = await listLeaseCharges(tenantId, '');
  const charge = chargeList.find((c) => c.id === chargeId);
  if (!charge) throw new Error(`Lease charge ${chargeId} not found.`);

  if (db) {
    const year = new Date().getFullYear();
    const seq = await db.select().from(invoiceSequencesTable).where(eq(invoiceSequencesTable.year, year));
    let nextVal = 1;
    if (seq.length > 0) {
      nextVal = seq[0].lastValue + 1;
      await db.update(invoiceSequencesTable).set({ lastValue: nextVal }).where(eq(invoiceSequencesTable.year, year));
    } else {
      await db.insert(invoiceSequencesTable).values({ year, lastValue: 1 });
    }

    const sequentialNumber = `INV-${year}-${String(nextVal).padStart(5, '0')}`;
    const amountSar = Number(charge.amountSar);
    const totalHalalas = Math.round(amountSar * 100);
    const subtotalHalalas = Math.round(totalHalalas / 1.15);
    const vatHalalas = totalHalalas - subtotalHalalas;

    const invRow = {
      id: genId('inv'),
      sequentialNumber,
      invoiceType: 'B2B_TAX_INVOICE',
      userId,
      orgId: tenantId,
      amountDue: totalHalalas,
      amountPaid: 0,
      subtotalHalalas,
      vatRateBps: 1500,
      vatAmountHalalas: vatHalalas,
      totalAmountHalalas: totalHalalas,
      currency: 'SAR',
      status: 'open',
      sellerLegalName: 'OPROX Real Estate Ltd.',
      sellerVatNumber: '300998877600003',
      createdAt: new Date(),
    };

    await db.insert(localInvoicesTable).values(invRow);
    await db.update(realEstateLeaseChargesTable).set({ invoiceId: invRow.id }).where(eq(realEstateLeaseChargesTable.id, chargeId));
    return invRow;
  }

  const invoiceId = genId('inv');
  const idx = memoryLeaseCharges.findIndex((c) => c.id === chargeId);
  if (idx !== -1) memoryLeaseCharges[idx].invoiceId = invoiceId;

  return {
    id: invoiceId,
    sequentialNumber: `INV-${new Date().getFullYear()}-00001`,
    invoiceType: 'B2B_TAX_INVOICE',
    totalAmountSar: charge.amountSar,
    status: 'open',
  };
}

// ── PAYMENTS & ALLOCATION ENGINE ──────────────────────────────────────────

export async function createPayment(data: {
  tenantId: string;
  leaseId?: string;
  reTenantId?: string;
  paymentNumber?: string;
  paymentDate?: string;
  amountSar: number | string;
  paymentMethod?: string;
  providerReference?: string;
  notes?: string;
  createdBy: string;
}): Promise<RealEstatePaymentRow> {
  const count = (await listPayments(data.tenantId)).length + 1;
  const paymentNumber = data.paymentNumber || `PAY-2026-${String(count).padStart(4, '0')}`;
  const amount = Number(data.amountSar);

  const row: RealEstatePaymentRow = {
    id: genId('pay'),
    tenantId: data.tenantId,
    leaseId: data.leaseId || null,
    reTenantId: data.reTenantId || null,
    paymentNumber,
    paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
    amountSar: String(amount),
    unallocatedAmountSar: String(amount),
    currency: 'SAR',
    paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
    providerReference: data.providerReference || null,
    paymentStatus: 'CONFIRMED',
    notes: data.notes || null,
    createdBy: data.createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstatePaymentsTable).values(row);
  } else {
    memoryPayments.push(row);
  }

  // Auto-allocate if leaseId is provided
  if (data.leaseId) {
    await autoAllocatePayment(data.tenantId, row.id, data.leaseId);
  }

  return row;
}

export async function listPayments(tenantId: string, leaseId?: string): Promise<RealEstatePaymentRow[]> {
  if (db) {
    const conditions = [eq(realEstatePaymentsTable.tenantId, tenantId)];
    if (leaseId) conditions.push(eq(realEstatePaymentsTable.leaseId, leaseId));
    return await db.select().from(realEstatePaymentsTable).where(and(...conditions)).orderBy(desc(realEstatePaymentsTable.createdAt));
  }
  return memoryPayments.filter((p) => p.tenantId === tenantId && (!leaseId || p.leaseId === leaseId));
}

export async function getPayment(tenantId: string, paymentId: string): Promise<RealEstatePaymentRow | null> {
  if (db) {
    const res = await db
      .select()
      .from(realEstatePaymentsTable)
      .where(and(eq(realEstatePaymentsTable.tenantId, tenantId), eq(realEstatePaymentsTable.id, paymentId)));
    return res[0] || null;
  }
  return memoryPayments.find((p) => p.tenantId === tenantId && p.id === paymentId) || null;
}

export async function autoAllocatePayment(tenantId: string, paymentId: string, leaseId: string): Promise<number> {
  const payment = await getPayment(tenantId, paymentId);
  if (!payment) return 0;

  let unallocated = Number(payment.unallocatedAmountSar);
  if (unallocated <= 0) return 0;

  const charges = await listLeaseCharges(tenantId, leaseId);
  const dueCharges = charges.filter((c) => Number(c.outstandingAmountSar) > 0);

  let allocatedTotal = 0;

  for (const charge of dueCharges) {
    if (unallocated <= 0) break;

    const outstanding = Number(charge.outstandingAmountSar);
    const allocateAmount = Math.min(unallocated, outstanding);

    // Create allocation record
    const allocRow: RealEstatePaymentAllocationRow = {
      id: crypto.randomUUID(),
      tenantId,
      paymentId,
      chargeId: charge.id,
      scheduleId: charge.scheduleId,
      allocatedAmountSar: String(allocateAmount),
      allocatedAt: new Date(),
    };

    if (db) {
      await db.insert(realEstatePaymentAllocationsTable).values(allocRow);
    } else {
      memoryPaymentAllocations.push(allocRow);
    }

    // Update charge
    const newPaidCharge = Number(charge.paidAmountSar) + allocateAmount;
    const newOutCharge = Number(charge.amountSar) - newPaidCharge;
    const chargeStatus = newOutCharge <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    if (db) {
      await db
        .update(realEstateLeaseChargesTable)
        .set({
          paidAmountSar: String(newPaidCharge),
          outstandingAmountSar: String(Math.max(0, newOutCharge)),
          status: chargeStatus,
          updatedAt: new Date(),
        })
        .where(eq(realEstateLeaseChargesTable.id, charge.id));
    } else {
      const idx = memoryLeaseCharges.findIndex((c) => c.id === charge.id);
      if (idx !== -1) {
        memoryLeaseCharges[idx].paidAmountSar = String(newPaidCharge);
        memoryLeaseCharges[idx].outstandingAmountSar = String(Math.max(0, newOutCharge));
        memoryLeaseCharges[idx].status = chargeStatus;
      }
    }

    // Update Schedule if linked
    if (charge.scheduleId) {
      const scheduleList = await listLeaseSchedules(tenantId, leaseId);
      const sched = scheduleList.find((s) => s.id === charge.scheduleId);
      if (sched) {
        const newPaidSched = Number(sched.paidAmountSar) + allocateAmount;
        const newOutSched = Number(sched.amountSar) - newPaidSched;
        const schedStatus = newOutSched <= 0 ? 'PAID' : 'PARTIALLY_PAID';

        if (db) {
          await db
            .update(realEstateLeaseSchedulesTable)
            .set({
              paidAmountSar: String(newPaidSched),
              outstandingAmountSar: String(Math.max(0, newOutSched)),
              status: schedStatus,
              updatedAt: new Date(),
            })
            .where(eq(realEstateLeaseSchedulesTable.id, sched.id));
        } else {
          const sIdx = memoryLeaseSchedules.findIndex((s) => s.id === sched.id);
          if (sIdx !== -1) {
            memoryLeaseSchedules[sIdx].paidAmountSar = String(newPaidSched);
            memoryLeaseSchedules[sIdx].outstandingAmountSar = String(Math.max(0, newOutSched));
            memoryLeaseSchedules[sIdx].status = schedStatus;
          }
        }
      }
    }

    unallocated -= allocateAmount;
    allocatedTotal += allocateAmount;
  }

  // Update payment unallocated amount
  if (db) {
    await db
      .update(realEstatePaymentsTable)
      .set({
        unallocatedAmountSar: String(unallocated),
        updatedAt: new Date(),
      })
      .where(eq(realEstatePaymentsTable.id, paymentId));
  } else {
    const pIdx = memoryPayments.findIndex((p) => p.id === paymentId);
    if (pIdx !== -1) {
      memoryPayments[pIdx].unallocatedAmountSar = String(unallocated);
    }
  }

  return allocatedTotal;
}

// ── SECURITY DEPOSITS ENGINE ──────────────────────────────────────────────

export async function createSecurityDeposit(data: {
  tenantId: string;
  leaseId: string;
  reTenantId: string;
  amountSar: number | string;
  notes?: string;
}): Promise<RealEstateSecurityDepositRow> {
  const amount = Number(data.amountSar);

  const row: RealEstateSecurityDepositRow = {
    id: genId('dep'),
    tenantId: data.tenantId,
    leaseId: data.leaseId,
    reTenantId: data.reTenantId,
    amountSar: String(amount),
    heldAmountSar: String(amount),
    deductionsAmountSar: '0',
    refundedAmountSar: '0',
    status: 'HELD',
    notes: data.notes || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateSecurityDepositsTable).values(row);
  } else {
    memorySecurityDeposits.push(row);
  }

  return row;
}

export async function listSecurityDeposits(tenantId: string, leaseId?: string): Promise<RealEstateSecurityDepositRow[]> {
  if (db) {
    const conditions = [eq(realEstateSecurityDepositsTable.tenantId, tenantId)];
    if (leaseId) conditions.push(eq(realEstateSecurityDepositsTable.leaseId, leaseId));
    return await db.select().from(realEstateSecurityDepositsTable).where(and(...conditions)).orderBy(desc(realEstateSecurityDepositsTable.createdAt));
  }
  return memorySecurityDeposits.filter((d) => d.tenantId === tenantId && (!leaseId || d.leaseId === leaseId));
}

export async function processSecurityDepositRefund(
  tenantId: string,
  depositId: string,
  deductionsSar: number,
  notes?: string
): Promise<RealEstateSecurityDepositRow> {
  const depositList = await listSecurityDeposits(tenantId);
  const deposit = depositList.find((d) => d.id === depositId);
  if (!deposit) throw new Error(`Security deposit ${depositId} not found.`);

  const originalAmount = Number(deposit.amountSar);
  const finalDeductions = Math.min(deductionsSar, originalAmount);
  const refundAmount = originalAmount - finalDeductions;
  const status = refundAmount > 0 ? 'REFUNDED' : 'FORFEITED';

  const updates: Partial<RealEstateSecurityDepositRow> = {
    heldAmountSar: '0',
    deductionsAmountSar: String(finalDeductions),
    refundedAmountSar: String(refundAmount),
    status,
    notes: notes || deposit.notes || null,
    updatedAt: new Date(),
  };

  if (db) {
    const res = await db
      .update(realEstateSecurityDepositsTable)
      .set(updates)
      .where(and(eq(realEstateSecurityDepositsTable.tenantId, tenantId), eq(realEstateSecurityDepositsTable.id, depositId)))
      .returning();
    return res[0];
  } else {
    const idx = memorySecurityDeposits.findIndex((d) => d.id === depositId);
    memorySecurityDeposits[idx] = { ...memorySecurityDeposits[idx], ...updates };
    return memorySecurityDeposits[idx];
  }
}

// ── LEASE EVENTS & DOCUMENTS ──────────────────────────────────────────────

export async function logLeaseEvent(data: {
  tenantId: string;
  leaseId: string;
  eventType: string;
  actorId: string;
  notes?: string;
  eventDataJson?: string;
}): Promise<RealEstateLeaseEventRow> {
  const row: RealEstateLeaseEventRow = {
    id: crypto.randomUUID(),
    tenantId: data.tenantId,
    leaseId: data.leaseId,
    eventType: data.eventType,
    actorId: data.actorId,
    notes: data.notes || null,
    eventDataJson: data.eventDataJson || null,
    createdAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateLeaseEventsTable).values(row);
  } else {
    memoryLeaseEvents.push(row);
  }

  return row;
}

export async function listLeaseEvents(tenantId: string, leaseId: string): Promise<RealEstateLeaseEventRow[]> {
  if (db) {
    return await db
      .select()
      .from(realEstateLeaseEventsTable)
      .where(and(eq(realEstateLeaseEventsTable.tenantId, tenantId), eq(realEstateLeaseEventsTable.leaseId, leaseId)))
      .orderBy(desc(realEstateLeaseEventsTable.createdAt));
  }
  return memoryLeaseEvents.filter((e) => e.tenantId === tenantId && e.leaseId === leaseId);
}

export async function uploadLeaseDocument(data: {
  tenantId: string;
  leaseId: string;
  documentType: string;
  title: string;
  fileUrl: string;
  fileSize?: number;
  uploadedBy: string;
}): Promise<RealEstateLeaseDocumentRow> {
  const row: RealEstateLeaseDocumentRow = {
    id: genId('doc'),
    tenantId: data.tenantId,
    leaseId: data.leaseId,
    documentType: data.documentType,
    title: data.title,
    fileUrl: data.fileUrl,
    fileSize: data.fileSize || 0,
    uploadedBy: data.uploadedBy,
    createdAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateLeaseDocumentsTable).values(row);
  } else {
    memoryLeaseDocuments.push(row);
  }

  return row;
}

export async function listLeaseDocuments(tenantId: string, leaseId: string): Promise<RealEstateLeaseDocumentRow[]> {
  if (db) {
    return await db
      .select()
      .from(realEstateLeaseDocumentsTable)
      .where(and(eq(realEstateLeaseDocumentsTable.tenantId, tenantId), eq(realEstateLeaseDocumentsTable.leaseId, leaseId)))
      .orderBy(desc(realEstateLeaseDocumentsTable.createdAt));
  }
  return memoryLeaseDocuments.filter((d) => d.tenantId === tenantId && d.leaseId === leaseId);
}

// ── FINANCIAL VISIBILITY & ANALYTICS ───────────────────────────────────────

export async function getLeaseFinancialSummary(tenantId: string, leaseId: string) {
  const lease = await getLease(tenantId, leaseId);
  if (!lease) throw new Error(`Lease ${leaseId} not found.`);

  const charges = await listLeaseCharges(tenantId, leaseId);
  const payments = await listPayments(tenantId, leaseId);
  const deposits = await listSecurityDeposits(tenantId, leaseId);

  const totalContractSar = Number(lease.contractValueSar);
  const totalBilledSar = charges.reduce((acc, c) => acc + Number(c.amountSar), 0);
  const totalPaidSar = charges.reduce((acc, c) => acc + Number(c.paidAmountSar), 0);
  const totalOutstandingSar = charges.reduce((acc, c) => acc + Number(c.outstandingAmountSar), 0);
  const securityDepositsHeldSar = deposits.reduce((acc, d) => acc + Number(d.heldAmountSar), 0);

  return {
    leaseId: lease.id,
    leaseNumber: lease.leaseNumber,
    status: lease.status,
    totalContractSar,
    totalBilledSar,
    totalPaidSar,
    totalOutstandingSar,
    securityDepositsHeldSar,
    collectionRatePercent: totalBilledSar > 0 ? Math.round((totalPaidSar / totalBilledSar) * 100) : 100,
  };
}

export async function getPhase2DashboardMetrics(tenantId: string) {
  const contacts = await listContacts(tenantId);
  const tenants = await listTenants(tenantId);
  const leases = await listLeases(tenantId);

  const activeLeases = leases.filter((l) => l.status === 'ACTIVE');
  const draftLeases = leases.filter((l) => l.status === 'DRAFT');
  const pendingLeases = leases.filter((l) => l.status === 'PENDING_APPROVAL');

  const totalContractValueSar = leases.reduce((acc, l) => acc + Number(l.contractValueSar), 0);
  const activeContractValueSar = activeLeases.reduce((acc, l) => acc + Number(l.contractValueSar), 0);

  const payments = await listPayments(tenantId);
  const totalCollectedSar = payments.reduce((acc, p) => acc + Number(p.amountSar), 0);

  const deposits = await listSecurityDeposits(tenantId);
  const totalDepositsHeldSar = deposits.reduce((acc, d) => acc + Number(d.heldAmountSar), 0);

  return {
    totalContacts: contacts.length,
    totalTenants: tenants.length,
    totalLeases: leases.length,
    activeLeasesCount: activeLeases.length,
    draftLeasesCount: draftLeases.length,
    pendingLeasesCount: pendingLeases.length,
    totalContractValueSar,
    activeContractValueSar,
    totalCollectedSar,
    totalDepositsHeldSar,
  };
}
