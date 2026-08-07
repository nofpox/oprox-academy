/**
 * OPROX Real Estate Phase 3 — CRM, Leads, Viewings, Offers & Reservations Store Engine
 * Authoritative dual-mode (Database + In-Memory) backend data store with multi-tenant isolation.
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '../../db';
import {
  realEstateLeadsTable,
  realEstateLeadActivitiesTable,
  realEstateLeadPropertyMatchesTable,
  realEstateViewingsTable,
  realEstateOffersTable,
  realEstateReservationsTable,
  realEstatePropertiesTable,
  realEstateUnitsTable,
  realEstateContactsTable,
  realEstateTenantsTable,
  RealEstateLeadRow,
  RealEstateLeadActivityRow,
  RealEstateLeadPropertyMatchRow,
  RealEstateViewingRow,
  RealEstateOfferRow,
  RealEstateReservationRow,
} from '../../db/schema';

import { createLease, createTenant, createContact, transitionLeaseStatus } from './realEstatePhase2Store';
import { listUnits } from './realEstateStore';

// In-Memory Storage Fallbacks for unit tests & local dev
const memoryLeads: RealEstateLeadRow[] = [];
const memoryLeadActivities: RealEstateLeadActivityRow[] = [];
const memoryLeadPropertyMatches: RealEstateLeadPropertyMatchRow[] = [];
const memoryViewings: RealEstateViewingRow[] = [];
const memoryOffers: RealEstateOfferRow[] = [];
const memoryReservations: RealEstateReservationRow[] = [];

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

// ── LEADS PIPELINE ────────────────────────────────────────────────────────

export async function createLead(data: {
  tenantId: string;
  contactId?: string;
  title: string;
  source?: string; // WEBSITE | PORTAL | DIRECT | REFERRAL | AGENT | PHONE | SOCIAL
  priority?: string; // LOW | MEDIUM | HIGH | URGENT
  budgetSar?: number | string;
  preferredPropertyType?: string;
  preferredCity?: string;
  preferredDistrict?: string;
  notes?: string;
  assignedAgentId?: string;
}): Promise<RealEstateLeadRow> {
  const leadNumber = `LEAD-${new Date().getFullYear()}-${String(memoryLeads.length + 1001).padStart(5, '0')}`;
  const now = new Date();

  const newLead: RealEstateLeadRow = {
    id: genId('lead'),
    tenantId: data.tenantId,
    contactId: data.contactId || null,
    leadNumber,
    title: data.title,
    source: data.source || 'WEBSITE',
    status: 'NEW',
    priority: data.priority || 'MEDIUM',
    budgetSar: data.budgetSar ? String(data.budgetSar) : null,
    preferredPropertyType: data.preferredPropertyType || null,
    preferredCity: data.preferredCity || null,
    preferredDistrict: data.preferredDistrict || null,
    notes: data.notes || null,
    assignedAgentId: data.assignedAgentId || null,
    lostReason: null,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    await db.insert(realEstateLeadsTable).values(newLead);
  } else {
    memoryLeads.push(newLead);
  }

  // Record creation activity
  await addLeadActivity({
    tenantId: data.tenantId,
    leadId: newLead.id,
    activityType: 'INQUIRY',
    summary: `Lead created: ${newLead.title} (${newLead.leadNumber})`,
    details: `Source: ${newLead.source}, Priority: ${newLead.priority}`,
    actorId: data.assignedAgentId || 'system',
  });

  return newLead;
}

export async function getLead(tenantId: string, leadId: string): Promise<RealEstateLeadRow | null> {
  if (db) {
    const res = await db
      .select()
      .from(realEstateLeadsTable)
      .where(and(eq(realEstateLeadsTable.tenantId, tenantId), eq(realEstateLeadsTable.id, leadId)));
    return res[0] || null;
  }
  return memoryLeads.find((l) => l.tenantId === tenantId && l.id === leadId) || null;
}

export async function listLeads(
  tenantId: string,
  filters?: { status?: string; source?: string; priority?: string; search?: string }
): Promise<RealEstateLeadRow[]> {
  let leads: RealEstateLeadRow[] = [];

  if (db) {
    const conditions = [eq(realEstateLeadsTable.tenantId, tenantId)];
    if (filters?.status) conditions.push(eq(realEstateLeadsTable.status, filters.status));
    if (filters?.source) conditions.push(eq(realEstateLeadsTable.source, filters.source));
    if (filters?.priority) conditions.push(eq(realEstateLeadsTable.priority, filters.priority));

    leads = await db
      .select()
      .from(realEstateLeadsTable)
      .where(and(...conditions))
      .orderBy(desc(realEstateLeadsTable.createdAt));
  } else {
    leads = memoryLeads.filter((l) => l.tenantId === tenantId);
    if (filters?.status) leads = leads.filter((l) => l.status === filters.status);
    if (filters?.source) leads = leads.filter((l) => l.source === filters.source);
    if (filters?.priority) leads = leads.filter((l) => l.priority === filters.priority);
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    leads = leads.filter(
      (l) =>
        l.title.toLowerCase().includes(q) ||
        l.leadNumber.toLowerCase().includes(q) ||
        (l.preferredCity && l.preferredCity.toLowerCase().includes(q))
    );
  }

  return leads;
}

export async function updateLead(
  tenantId: string,
  leadId: string,
  updates: Partial<RealEstateLeadRow>
): Promise<RealEstateLeadRow> {
  const lead = await getLead(tenantId, leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found.`);

  const updated: RealEstateLeadRow = {
    ...lead,
    ...updates,
    updatedAt: new Date(),
  };

  if (db) {
    await db.update(realEstateLeadsTable).set(updated).where(eq(realEstateLeadsTable.id, leadId));
  } else {
    const idx = memoryLeads.findIndex((l) => l.id === leadId);
    if (idx !== -1) memoryLeads[idx] = updated;
  }

  return updated;
}

const LEAD_STAGE_FLOW: Record<string, string[]> = {
  NEW: ['QUALIFIED', 'PROPERTY_MATCHED', 'VIEWING_SCHEDULED', 'OFFER_MADE', 'RESERVED', 'LOST'],
  QUALIFIED: ['PROPERTY_MATCHED', 'VIEWING_SCHEDULED', 'OFFER_MADE', 'RESERVED', 'LOST'],
  PROPERTY_MATCHED: ['VIEWING_SCHEDULED', 'OFFER_MADE', 'NEGOTIATING', 'RESERVED', 'LOST'],
  VIEWING_SCHEDULED: ['OFFER_MADE', 'NEGOTIATING', 'RESERVED', 'WON', 'LOST'],
  OFFER_MADE: ['NEGOTIATING', 'RESERVED', 'WON', 'LOST'],
  NEGOTIATING: ['RESERVED', 'WON', 'LOST'],
  RESERVED: ['HANDOVER', 'WON', 'LOST'],
  HANDOVER: ['WON', 'LOST'],
  WON: [],
  LOST: ['NEW', 'QUALIFIED'],
};

export async function transitionLeadStatus(
  tenantId: string,
  leadId: string,
  newStatus: string,
  actorId: string,
  reason?: string
): Promise<RealEstateLeadRow> {
  const lead = await getLead(tenantId, leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found.`);

  const allowed = LEAD_STAGE_FLOW[lead.status] || [];
  if (!allowed.includes(newStatus) && newStatus !== 'LOST') {
    throw new Error(`Invalid lead status transition from ${lead.status} to ${newStatus}.`);
  }

  const updates: Partial<RealEstateLeadRow> = {
    status: newStatus,
    ...(newStatus === 'LOST' ? { lostReason: reason || 'Not specified' } : {}),
  };

  const updatedLead = await updateLead(tenantId, leadId, updates);

  await addLeadActivity({
    tenantId,
    leadId,
    activityType: 'STAGE_CHANGE',
    summary: `Lead status changed from ${lead.status} to ${newStatus}`,
    details: reason ? `Reason: ${reason}` : undefined,
    actorId,
  });

  return updatedLead;
}

// ── LEAD ACTIVITIES ──────────────────────────────────────────────────────

export async function addLeadActivity(data: {
  tenantId: string;
  leadId: string;
  activityType: string; // INQUIRY | NOTE | CALL | EMAIL | MEETING | STAGE_CHANGE | VIEWING_RECORDED | OFFER_RECORDED
  summary: string;
  details?: string;
  actorId: string;
}): Promise<RealEstateLeadActivityRow> {
  const activity: RealEstateLeadActivityRow = {
    id: genId('act'),
    tenantId: data.tenantId,
    leadId: data.leadId,
    activityType: data.activityType,
    summary: data.summary,
    details: data.details || null,
    actorId: data.actorId,
    createdAt: new Date(),
  };

  if (db) {
    await db.insert(realEstateLeadActivitiesTable).values(activity);
  } else {
    memoryLeadActivities.push(activity);
  }

  return activity;
}

export async function listLeadActivities(tenantId: string, leadId: string): Promise<RealEstateLeadActivityRow[]> {
  if (db) {
    return await db
      .select()
      .from(realEstateLeadActivitiesTable)
      .where(and(eq(realEstateLeadActivitiesTable.tenantId, tenantId), eq(realEstateLeadActivitiesTable.leadId, leadId)))
      .orderBy(desc(realEstateLeadActivitiesTable.createdAt));
  }
  return memoryLeadActivities
    .filter((a) => a.tenantId === tenantId && a.leadId === leadId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ── PROPERTY MATCHING ─────────────────────────────────────────────────────

export async function matchPropertiesForLead(
  tenantId: string,
  leadId: string
): Promise<RealEstateLeadPropertyMatchRow[]> {
  const lead = await getLead(tenantId, leadId);
  if (!lead) throw new Error(`Lead ${leadId} not found.`);

  const units = await listUnits(tenantId);
  const availableUnits = units.filter((u) => u.status !== 'rented');

  const matchedUnits: Array<{ propertyId: string; unitId: string; matchScore: number }> = [];

  for (const u of availableUnits) {
    let score = 100;
    if (lead.preferredPropertyType && u.unitType !== lead.preferredPropertyType) {
      score -= 20;
    }
    if (lead.budgetSar && u.rentPriceSar) {
      const b = Number(lead.budgetSar);
      const p = Number(u.rentPriceSar);
      if (p > b * 1.2) score -= 40;
      else if (p > b) score -= 15;
    }
    if (score >= 50) {
      matchedUnits.push({ propertyId: u.propertyId, unitId: u.id, matchScore: score });
    }
  }

  const results: RealEstateLeadPropertyMatchRow[] = [];
  for (const m of matchedUnits) {
    const matchRow: RealEstateLeadPropertyMatchRow = {
      id: genId('lpm'),
      tenantId,
      leadId,
      propertyId: m.propertyId || null,
      unitId: m.unitId || null,
      matchScore: m.matchScore,
      status: 'SHORTLISTED',
      createdAt: new Date(),
    };

    if (db) {
      await db.insert(realEstateLeadPropertyMatchesTable).values(matchRow);
    } else {
      memoryLeadPropertyMatches.push(matchRow);
    }
    results.push(matchRow);
  }

  if (lead.status === 'NEW' || lead.status === 'QUALIFIED') {
    await transitionLeadStatus(tenantId, leadId, 'PROPERTY_MATCHED', 'system');
  }

  return results;
}

export async function listLeadPropertyMatches(
  tenantId: string,
  leadId: string
): Promise<RealEstateLeadPropertyMatchRow[]> {
  if (db) {
    return await db
      .select()
      .from(realEstateLeadPropertyMatchesTable)
      .where(
        and(
          eq(realEstateLeadPropertyMatchesTable.tenantId, tenantId),
          eq(realEstateLeadPropertyMatchesTable.leadId, leadId)
        )
      );
  }
  return memoryLeadPropertyMatches.filter((m) => m.tenantId === tenantId && m.leadId === leadId);
}

// ── VIEWINGS ──────────────────────────────────────────────────────────────

export async function scheduleViewing(data: {
  tenantId: string;
  leadId: string;
  propertyId?: string;
  unitId?: string;
  scheduledAt: string | Date;
  assignedAgentId: string;
}): Promise<RealEstateViewingRow> {
  const lead = await getLead(data.tenantId, data.leadId);
  if (!lead) throw new Error(`Lead ${data.leadId} not found.`);

  const now = new Date();
  const viewing: RealEstateViewingRow = {
    id: genId('vw'),
    tenantId: data.tenantId,
    leadId: data.leadId,
    propertyId: data.propertyId || null,
    unitId: data.unitId || null,
    scheduledAt: new Date(data.scheduledAt),
    completedAt: null,
    status: 'SCHEDULED',
    feedback: null,
    agentRating: null,
    clientInterestLevel: null,
    assignedAgentId: data.assignedAgentId,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    await db.insert(realEstateViewingsTable).values(viewing);
  } else {
    memoryViewings.push(viewing);
  }

  await addLeadActivity({
    tenantId: data.tenantId,
    leadId: data.leadId,
    activityType: 'VIEWING_RECORDED',
    summary: `Viewing scheduled for ${viewing.scheduledAt.toISOString()}`,
    actorId: data.assignedAgentId,
  });

  if (lead.status === 'NEW' || lead.status === 'QUALIFIED' || lead.status === 'PROPERTY_MATCHED') {
    await transitionLeadStatus(data.tenantId, data.leadId, 'VIEWING_SCHEDULED', data.assignedAgentId);
  }

  return viewing;
}

export async function getViewing(tenantId: string, viewingId: string): Promise<RealEstateViewingRow | null> {
  if (db) {
    const res = await db
      .select()
      .from(realEstateViewingsTable)
      .where(and(eq(realEstateViewingsTable.tenantId, tenantId), eq(realEstateViewingsTable.id, viewingId)));
    return res[0] || null;
  }
  return memoryViewings.find((v) => v.tenantId === tenantId && v.id === viewingId) || null;
}

export async function listViewings(
  tenantId: string,
  filters?: { leadId?: string; status?: string; agentId?: string }
): Promise<RealEstateViewingRow[]> {
  if (db) {
    const conditions = [eq(realEstateViewingsTable.tenantId, tenantId)];
    if (filters?.leadId) conditions.push(eq(realEstateViewingsTable.leadId, filters.leadId));
    if (filters?.status) conditions.push(eq(realEstateViewingsTable.status, filters.status));
    if (filters?.agentId) conditions.push(eq(realEstateViewingsTable.assignedAgentId, filters.agentId));

    return await db
      .select()
      .from(realEstateViewingsTable)
      .where(and(...conditions))
      .orderBy(desc(realEstateViewingsTable.scheduledAt));
  }

  let list = memoryViewings.filter((v) => v.tenantId === tenantId);
  if (filters?.leadId) list = list.filter((v) => v.leadId === filters.leadId);
  if (filters?.status) list = list.filter((v) => v.status === filters.status);
  if (filters?.agentId) list = list.filter((v) => v.assignedAgentId === filters.agentId);
  return list.sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime());
}

export async function updateViewingStatus(
  tenantId: string,
  viewingId: string,
  status: string, // COMPLETED | CANCELLED | NO_SHOW
  feedback?: string,
  rating?: number,
  interestLevel?: string // HIGH | MEDIUM | LOW
): Promise<RealEstateViewingRow> {
  const viewing = await getViewing(tenantId, viewingId);
  if (!viewing) throw new Error(`Viewing ${viewingId} not found.`);

  const updated: RealEstateViewingRow = {
    ...viewing,
    status,
    feedback: feedback || viewing.feedback,
    agentRating: rating !== undefined ? rating : viewing.agentRating,
    clientInterestLevel: interestLevel || viewing.clientInterestLevel,
    completedAt: status === 'COMPLETED' ? new Date() : viewing.completedAt,
    updatedAt: new Date(),
  };

  if (db) {
    await db.update(realEstateViewingsTable).set(updated).where(eq(realEstateViewingsTable.id, viewingId));
  } else {
    const idx = memoryViewings.findIndex((v) => v.id === viewingId);
    if (idx !== -1) memoryViewings[idx] = updated;
  }

  await addLeadActivity({
    tenantId,
    leadId: viewing.leadId,
    activityType: 'VIEWING_RECORDED',
    summary: `Viewing marked as ${status}`,
    details: feedback ? `Feedback: ${feedback}` : undefined,
    actorId: viewing.assignedAgentId,
  });

  return updated;
}

// ── OFFERS & NEGOTIATIONS ─────────────────────────────────────────────────

export async function createOffer(data: {
  tenantId: string;
  leadId: string;
  propertyId?: string;
  unitId?: string;
  offeredAmountSar: number | string;
  depositAmountSar?: number | string;
  paymentFrequency?: string; // MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL | CUSTOM
  proposedStartDate?: string;
  proposedEndDate?: string;
  specialTerms?: string;
  createdBy: string;
}): Promise<RealEstateOfferRow> {
  const lead = await getLead(data.tenantId, data.leadId);
  if (!lead) throw new Error(`Lead ${data.leadId} not found.`);

  const offerNumber = `OFR-${new Date().getFullYear()}-${String(memoryOffers.length + 1001).padStart(5, '0')}`;
  const now = new Date();

  const offer: RealEstateOfferRow = {
    id: genId('ofr'),
    tenantId: data.tenantId,
    leadId: data.leadId,
    propertyId: data.propertyId || null,
    unitId: data.unitId || null,
    offerNumber,
    offeredAmountSar: String(data.offeredAmountSar),
    depositAmountSar: String(data.depositAmountSar || 0),
    paymentFrequency: data.paymentFrequency || 'ANNUAL',
    proposedStartDate: data.proposedStartDate || null,
    proposedEndDate: data.proposedEndDate || null,
    status: 'SUBMITTED',
    counterAmountSar: null,
    specialTerms: data.specialTerms || null,
    validUntil: new Date(Date.now() + 7 * 24 * 3600 * 1000), // 7 days default
    createdBy: data.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    await db.insert(realEstateOffersTable).values(offer);
  } else {
    memoryOffers.push(offer);
  }

  await addLeadActivity({
    tenantId: data.tenantId,
    leadId: data.leadId,
    activityType: 'OFFER_RECORDED',
    summary: `Offer ${offerNumber} submitted for SAR ${offer.offeredAmountSar}`,
    actorId: data.createdBy,
  });

  if (lead.status !== 'RESERVED' && lead.status !== 'WON') {
    await transitionLeadStatus(data.tenantId, data.leadId, 'OFFER_MADE', data.createdBy);
  }

  return offer;
}

export async function getOffer(tenantId: string, offerId: string): Promise<RealEstateOfferRow | null> {
  if (db) {
    const res = await db
      .select()
      .from(realEstateOffersTable)
      .where(and(eq(realEstateOffersTable.tenantId, tenantId), eq(realEstateOffersTable.id, offerId)));
    return res[0] || null;
  }
  return memoryOffers.find((o) => o.tenantId === tenantId && o.id === offerId) || null;
}

export async function listOffers(
  tenantId: string,
  filters?: { leadId?: string; status?: string }
): Promise<RealEstateOfferRow[]> {
  if (db) {
    const conditions = [eq(realEstateOffersTable.tenantId, tenantId)];
    if (filters?.leadId) conditions.push(eq(realEstateOffersTable.leadId, filters.leadId));
    if (filters?.status) conditions.push(eq(realEstateOffersTable.status, filters.status));

    return await db
      .select()
      .from(realEstateOffersTable)
      .where(and(...conditions))
      .orderBy(desc(realEstateOffersTable.createdAt));
  }

  let list = memoryOffers.filter((o) => o.tenantId === tenantId);
  if (filters?.leadId) list = list.filter((o) => o.leadId === filters.leadId);
  if (filters?.status) list = list.filter((o) => o.status === filters.status);
  return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function updateOfferStatus(
  tenantId: string,
  offerId: string,
  status: string, // ACCEPTED | REJECTED | COUNTERED | EXPIRED | WITHDRAWN
  counterAmountSar?: number | string,
  specialTerms?: string,
  actorId: string = 'system'
): Promise<RealEstateOfferRow> {
  const offer = await getOffer(tenantId, offerId);
  if (!offer) throw new Error(`Offer ${offerId} not found.`);

  const updated: RealEstateOfferRow = {
    ...offer,
    status,
    counterAmountSar: counterAmountSar ? String(counterAmountSar) : offer.counterAmountSar,
    specialTerms: specialTerms || offer.specialTerms,
    updatedAt: new Date(),
  };

  if (db) {
    await db.update(realEstateOffersTable).set(updated).where(eq(realEstateOffersTable.id, offerId));
  } else {
    const idx = memoryOffers.findIndex((o) => o.id === offerId);
    if (idx !== -1) memoryOffers[idx] = updated;
  }

  await addLeadActivity({
    tenantId,
    leadId: offer.leadId,
    activityType: 'OFFER_RECORDED',
    summary: `Offer ${offer.offerNumber} status updated to ${status}`,
    details: counterAmountSar ? `Counter amount: SAR ${counterAmountSar}` : undefined,
    actorId,
  });

  if (status === 'COUNTERED') {
    await transitionLeadStatus(tenantId, offer.leadId, 'NEGOTIATING', actorId);
  }

  return updated;
}

// ── RESERVATIONS & UNIT LOCKING ───────────────────────────────────────────

export async function createReservation(data: {
  tenantId: string;
  leadId?: string;
  offerId?: string;
  propertyId?: string;
  unitId: string;
  reTenantId?: string;
  reservationFeeSar: number | string;
  reservedDays?: number;
  createdBy: string;
}): Promise<RealEstateReservationRow> {
  // Verify unit is available and not already reserved/rented
  if (db) {
    const unitRes = await db
      .select()
      .from(realEstateUnitsTable)
      .where(and(eq(realEstateUnitsTable.tenantId, data.tenantId), eq(realEstateUnitsTable.id, data.unitId)));
    if (unitRes[0] && unitRes[0].status === 'rented') {
      throw new Error(`Unit ${data.unitId} is already rented and cannot be reserved.`);
    }
  }

  // Check for active conflicting reservations
  const existingRes = memoryReservations.find(
    (r) => r.tenantId === data.tenantId && r.unitId === data.unitId && r.status === 'ACTIVE'
  );
  if (existingRes) {
    throw new Error(`Unit ${data.unitId} is already reserved under reservation ${existingRes.reservationNumber}.`);
  }

  const reservationNumber = `RES-${new Date().getFullYear()}-${String(memoryReservations.length + 1001).padStart(5, '0')}`;
  const now = new Date();
  const reservedDays = data.reservedDays || 14;
  const reservedUntil = new Date(now.getTime() + reservedDays * 24 * 3600 * 1000);

  const reservation: RealEstateReservationRow = {
    id: genId('res'),
    tenantId: data.tenantId,
    leadId: data.leadId || null,
    offerId: data.offerId || null,
    propertyId: data.propertyId || null,
    unitId: data.unitId,
    reTenantId: data.reTenantId || null,
    reservationNumber,
    reservationFeeSar: String(data.reservationFeeSar),
    status: 'ACTIVE',
    reservedUntil,
    convertedLeaseId: null,
    createdBy: data.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  if (db) {
    await db.insert(realEstateReservationsTable).values(reservation);
    await db.update(realEstateUnitsTable).set({ status: 'reserved' }).where(eq(realEstateUnitsTable.id, data.unitId));
  } else {
    memoryReservations.push(reservation);
  }

  if (data.leadId) {
    await addLeadActivity({
      tenantId: data.tenantId,
      leadId: data.leadId,
      activityType: 'STAGE_CHANGE',
      summary: `Unit reserved under ${reservationNumber}. Reserved until ${reservedUntil.toISOString()}`,
      actorId: data.createdBy,
    });

    await transitionLeadStatus(data.tenantId, data.leadId, 'RESERVED', data.createdBy);
  }

  return reservation;
}

export async function getReservation(tenantId: string, reservationId: string): Promise<RealEstateReservationRow | null> {
  if (db) {
    const res = await db
      .select()
      .from(realEstateReservationsTable)
      .where(and(eq(realEstateReservationsTable.tenantId, tenantId), eq(realEstateReservationsTable.id, reservationId)));
    return res[0] || null;
  }
  return memoryReservations.find((r) => r.tenantId === tenantId && r.id === reservationId) || null;
}

export async function listReservations(
  tenantId: string,
  filters?: { status?: string; unitId?: string }
): Promise<RealEstateReservationRow[]> {
  if (db) {
    const conditions = [eq(realEstateReservationsTable.tenantId, tenantId)];
    if (filters?.status) conditions.push(eq(realEstateReservationsTable.status, filters.status));
    if (filters?.unitId) conditions.push(eq(realEstateReservationsTable.unitId, filters.unitId));

    return await db
      .select()
      .from(realEstateReservationsTable)
      .where(and(...conditions))
      .orderBy(desc(realEstateReservationsTable.createdAt));
  }

  let list = memoryReservations.filter((r) => r.tenantId === tenantId);
  if (filters?.status) list = list.filter((r) => r.status === filters.status);
  if (filters?.unitId) list = list.filter((r) => r.unitId === filters.unitId);
  return list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ── CONVERT RESERVATION TO LEASE HANDOFF ──────────────────────────────────

export async function convertReservationToLease(
  tenantId: string,
  reservationId: string,
  leaseDetails: {
    startDate: string;
    endDate: string;
    contractValueSar: number | string;
    paymentFrequency?: string;
    securityDepositSar?: number | string;
    reTenantId?: string;
    contactName?: string;
  },
  actorId: string = 'system'
) {
  const res = await getReservation(tenantId, reservationId);
  if (!res) throw new Error(`Reservation ${reservationId} not found.`);
  if (res.status !== 'ACTIVE') throw new Error(`Reservation ${reservationId} is not ACTIVE.`);

  let targetReTenantId = leaseDetails.reTenantId || res.reTenantId;

  // Auto-create contact and tenant if not provided
  if (!targetReTenantId) {
    const contact = await createContact({
      tenantId,
      fullName: leaseDetails.contactName || 'Reserved Lead Tenant',
      preferredLanguage: 'ar',
    });
    const tenantObj = await createTenant({
      tenantId,
      contactId: contact.id,
      notes: `Converted from reservation ${res.reservationNumber}`,
    });
    targetReTenantId = tenantObj.id;
  }

  // Create lease via Phase 2 Store
  const initialLease = await createLease({
    tenantId,
    propertyId: res.propertyId || '',
    reTenantId: targetReTenantId,
    startDate: leaseDetails.startDate,
    endDate: leaseDetails.endDate,
    contractValueSar: leaseDetails.contractValueSar,
    paymentFrequency: leaseDetails.paymentFrequency || 'ANNUAL',
    securityDepositSar: leaseDetails.securityDepositSar || 0,
    unitIds: [res.unitId],
    createdBy: actorId,
  });

  // Activate lease through state machine (DRAFT -> PENDING_APPROVAL -> APPROVED -> ACTIVE)
  let activeLease = initialLease;
  try {
    const l1 = await transitionLeaseStatus(tenantId, initialLease.id, 'PENDING_APPROVAL', actorId);
    const l2 = await transitionLeaseStatus(tenantId, l1.id, 'APPROVED', actorId);
    activeLease = await transitionLeaseStatus(tenantId, l2.id, 'ACTIVE', actorId);
  } catch {
    activeLease = initialLease;
  }

  // Update reservation status to CONVERTED_TO_LEASE
  const updatedRes: RealEstateReservationRow = {
    ...res,
    status: 'CONVERTED_TO_LEASE',
    reTenantId: targetReTenantId,
    convertedLeaseId: activeLease.id,
    updatedAt: new Date(),
  };

  if (db) {
    await db.update(realEstateReservationsTable).set(updatedRes).where(eq(realEstateReservationsTable.id, reservationId));
  } else {
    const idx = memoryReservations.findIndex((r) => r.id === reservationId);
    if (idx !== -1) memoryReservations[idx] = updatedRes;
  }

  // Update Lead status to WON / HANDOVER
  if (res.leadId) {
    await transitionLeadStatus(tenantId, res.leadId, 'WON', actorId);
  }

  return { reservation: updatedRes, lease: activeLease };
}

export async function cancelReservation(
  tenantId: string,
  reservationId: string,
  reason?: string
): Promise<RealEstateReservationRow> {
  const res = await getReservation(tenantId, reservationId);
  if (!res) throw new Error(`Reservation ${reservationId} not found.`);

  const updated: RealEstateReservationRow = {
    ...res,
    status: 'CANCELLED',
    updatedAt: new Date(),
  };

  if (db) {
    await db.update(realEstateReservationsTable).set(updated).where(eq(realEstateReservationsTable.id, reservationId));
    await db.update(realEstateUnitsTable).set({ status: 'vacant' }).where(eq(realEstateUnitsTable.id, res.unitId));
  } else {
    const idx = memoryReservations.findIndex((r) => r.id === reservationId);
    if (idx !== -1) memoryReservations[idx] = updated;
  }

  if (res.leadId) {
    await addLeadActivity({
      tenantId,
      leadId: res.leadId,
      activityType: 'STAGE_CHANGE',
      summary: `Reservation ${res.reservationNumber} cancelled. ${reason ? 'Reason: ' + reason : ''}`,
      actorId: 'system',
    });
  }

  return updated;
}

// ── CRM DASHBOARD METRICS ─────────────────────────────────────────────────

export async function getPhase3CrmMetrics(tenantId: string) {
  const leads = await listLeads(tenantId);
  const viewings = await listViewings(tenantId);
  const offers = await listOffers(tenantId);
  const reservations = await listReservations(tenantId);

  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'NEW').length;
  const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED').length;
  const activeOffers = offers.filter((o) => o.status === 'SUBMITTED' || o.status === 'COUNTERED').length;
  const activeReservations = reservations.filter((r) => r.status === 'ACTIVE').length;
  const wonLeads = leads.filter((l) => l.status === 'WON').length;
  const conversionRatePct = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const totalReservedFeesSar = reservations
    .filter((r) => r.status === 'ACTIVE')
    .reduce((sum, r) => sum + Number(r.reservationFeeSar || 0), 0);

  return {
    totalLeads,
    newLeads,
    qualifiedLeads,
    activeViewings: viewings.filter((v) => v.status === 'SCHEDULED').length,
    activeOffers,
    activeReservations,
    wonLeads,
    conversionRatePct,
    totalReservedFeesSar,
  };
}
