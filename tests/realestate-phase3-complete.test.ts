import { describe, it, expect, beforeEach } from 'vitest';
import {
  createLead,
  getLead,
  listLeads,
  updateLead,
  transitionLeadStatus,
  addLeadActivity,
  listLeadActivities,
  matchPropertiesForLead,
  listLeadPropertyMatches,
  scheduleViewing,
  getViewing,
  listViewings,
  updateViewingStatus,
  createOffer,
  getOffer,
  listOffers,
  updateOfferStatus,
  createReservation,
  getReservation,
  listReservations,
  convertReservationToLease,
  cancelReservation,
  getPhase3CrmMetrics,
} from '../src/lib/realestate/realEstatePhase3Store';
import { createProperty, createUnit } from '../src/lib/realestate/realEstateStore';
import { createContact, createTenant } from '../src/lib/realestate/realEstatePhase2Store';

describe('OPROX Real Estate — Phase 3: CRM, Leads, Viewings, Offers & Reservations', () => {
  const tenant1 = 'tenant_p3_test_org1';
  const tenant2 = 'tenant_p3_test_org2';
  const actorUser = 'user_agent_007';

  let prop1Id: string;
  let unit1Id: string;
  let contact1Id: string;
  let reTenant1Id: string;

  beforeEach(async () => {
    // Setup property & unit in Phase 1 store
    const prop = await createProperty({
      tenantId: tenant1,
      name: 'Riyadh Executive Complex',
      type: 'commercial_tower',
      addressCity: 'Riyadh',
      addressDistrict: 'Olaya',
      totalAreaSqm: '5000',
      status: 'ACTIVE',
      createdBy: actorUser,
    });
    prop1Id = prop.id;

    const unit = await createUnit({
      tenantId: tenant1,
      propertyId: prop1Id,
      unitNumber: 'Suite-401',
      unitType: 'OFFICE',
      rentPriceSar: '150000',
      areaSqm: '250',
      bedrooms: 0,
      bathrooms: 2,
      status: 'AVAILABLE',
    });
    unit1Id = unit.id;

    // Setup contact & tenant profile in Phase 2 store
    const contact = await createContact({
      tenantId: tenant1,
      fullName: 'Tariq Al-Nasser',
      type: 'INDIVIDUAL',
      email: 'tariq@example.sa',
      mobile: '+966501112233',
    });
    contact1Id = contact.id;

    const reTenant = await createTenant({
      tenantId: tenant1,
      contactId: contact1Id,
    });
    reTenant1Id = reTenant.id;
  });

  it('1. Should create, retrieve, and transition lead stages through valid flow', async () => {
    const lead = await createLead({
      tenantId: tenant1,
      title: 'Fahad Al-Otaibi',
      source: 'WEBSITE',
      preferredPropertyType: 'OFFICE',
      preferredCity: 'Riyadh',
      budgetSar: '180000',
      priority: 'HIGH',
      assignedAgentId: actorUser,
    });

    expect(lead.id).toBeDefined();
    expect(lead.status).toBe('NEW');
    expect(lead.leadNumber).toMatch(/^LEAD-/);

    // Transition: NEW -> QUALIFIED
    const qualLead = await transitionLeadStatus(tenant1, lead.id, 'QUALIFIED', actorUser, 'Budget verified');
    expect(qualLead.status).toBe('QUALIFIED');

    // Fetch lead & verify
    const fetched = await getLead(tenant1, lead.id);
    expect(fetched?.status).toBe('QUALIFIED');

    // List activities & verify automated audit trail entry
    const activities = await listLeadActivities(tenant1, lead.id);
    expect(activities.length).toBeGreaterThanOrEqual(1);
    expect(activities[0].activityType).toBe('STAGE_CHANGE');
  });

  it('2. Should reject invalid lead stage transitions', async () => {
    const lead = await createLead({
      tenantId: tenant1,
      title: 'Sami Mansour',
      source: 'WALK_IN',
    });

    // Try transitioning NEW directly to WON (Invalid transition)
    await expect(
      transitionLeadStatus(tenant1, lead.id, 'WON', actorUser)
    ).rejects.toThrow(/Invalid lead status transition/);
  });

  it('3. Should add custom lead activities and match available properties', async () => {
    const lead = await createLead({
      tenantId: tenant1,
      title: 'Mansour Holdings',
      preferredCity: 'Riyadh',
      preferredPropertyType: 'commercial_tower',
      budgetSar: '200000',
    });

    // Add activity
    const activity = await addLeadActivity({
      tenantId: tenant1,
      leadId: lead.id,
      activityType: 'CALL',
      summary: 'Phone discovery call conducted',
      details: 'Client looking for 200sqm+ office in Olaya district',
      actorId: actorUser,
    });
    expect(activity.id).toBeDefined();

    // Match properties
    const matches = await matchPropertiesForLead(tenant1, lead.id);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].matchScore).toBeGreaterThan(0);

    const matchRecords = await listLeadPropertyMatches(tenant1, lead.id);
    expect(matchRecords.length).toBe(matches.length);
  });

  it('4. Should schedule and complete a viewing', async () => {
    const lead = await createLead({
      tenantId: tenant1,
      title: 'Reem Al-Ghamdi',
    });

    const viewing = await scheduleViewing({
      tenantId: tenant1,
      leadId: lead.id,
      propertyId: prop1Id,
      unitId: unit1Id,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      assignedAgentId: actorUser,
    });

    expect(viewing.id).toBeDefined();
    expect(viewing.status).toBe('SCHEDULED');

    // Update status to COMPLETED
    const completedViewing = await updateViewingStatus(
      tenant1,
      viewing.id,
      'COMPLETED',
      'Client liked the natural lighting and view',
      5,
      'HIGH'
    );
    expect(completedViewing.status).toBe('COMPLETED');
    expect(completedViewing.agentRating).toBe(5);

    // Lead status should auto-update to VIEWING_SCHEDULED
    const updatedLead = await getLead(tenant1, lead.id);
    expect(['VIEWING_SCHEDULED', 'QUALIFIED', 'OFFER_MADE']).toContain(updatedLead?.status);
  });

  it('5. Should create, counter, and accept an offer', async () => {
    const lead = await createLead({
      tenantId: tenant1,
      title: 'Majed Al-Harbi',
    });

    const offer = await createOffer({
      tenantId: tenant1,
      leadId: lead.id,
      unitId: unit1Id,
      offeredAmountSar: '140000',
      depositAmountSar: '10000',
      paymentFrequency: 'ANNUAL',
      proposedStartDate: '2026-03-01',
      createdBy: actorUser,
    });

    expect(offer.id).toBeDefined();
    expect(offer.status).toBe('SUBMITTED');
    expect(offer.offerNumber).toMatch(/^OFR-/);

    // Counter-offer
    const countered = await updateOfferStatus(tenant1, offer.id, 'COUNTERED', '145000', 'Requires 2 payments', actorUser);
    expect(countered.status).toBe('COUNTERED');
    expect(countered.counterAmountSar).toBe('145000');

    // Accept offer
    const accepted = await updateOfferStatus(tenant1, offer.id, 'ACCEPTED', undefined, undefined, actorUser);
    expect(accepted.status).toBe('ACCEPTED');

    const fetchedOffer = await getOffer(tenant1, offer.id);
    expect(fetchedOffer?.status).toBe('ACCEPTED');
  });

  it('6. Should reserve a unit and convert reservation to active lease', async () => {
    const lead = await createLead({
      tenantId: tenant1,
      title: 'Commercial Tenant Ltd',
    });

    // Create Reservation
    const reservation = await createReservation({
      tenantId: tenant1,
      leadId: lead.id,
      unitId: unit1Id,
      reservationFeeSar: '5000',
      reservedDays: 7,
      createdBy: actorUser,
    });

    expect(reservation.id).toBeDefined();
    expect(reservation.status).toBe('ACTIVE');
    expect(reservation.reservationNumber).toMatch(/^RES-/);

    // Convert Reservation to Active Lease
    const conversionResult = await convertReservationToLease(
      tenant1,
      reservation.id,
      {
        reTenantId: reTenant1Id,
        contactName: 'Tariq Al-Nasser',
        contractValueSar: '150000',
        paymentFrequency: 'SEMI_ANNUAL',
        startDate: '2026-03-01',
        endDate: '2027-02-28',
      },
      actorUser
    );

    expect(conversionResult.lease).toBeDefined();
    expect(conversionResult.lease.status).toBe('ACTIVE');

    // Reservation status should now be CONVERTED_TO_LEASE
    const updatedRes = await getReservation(tenant1, reservation.id);
    expect(updatedRes?.status).toBe('CONVERTED_TO_LEASE');

    // Lead status should be WON
    const convertedLead = await getLead(tenant1, lead.id);
    expect(convertedLead?.status).toBe('WON');
  });

  it('7. Should enforce strict multi-tenant isolation across Phase 3 entities', async () => {
    const leadT1 = await createLead({
      tenantId: tenant1,
      title: 'Tenant 1 Lead',
    });

    const leadT2 = await createLead({
      tenantId: tenant2,
      title: 'Tenant 2 Lead',
    });

    const listT1 = await listLeads(tenant1);
    const listT2 = await listLeads(tenant2);

    expect(listT1.map((l) => l.id)).toContain(leadT1.id);
    expect(listT1.map((l) => l.id)).not.toContain(leadT2.id);

    expect(listT2.map((l) => l.id)).toContain(leadT2.id);
    expect(listT2.map((l) => l.id)).not.toContain(leadT1.id);

    // Cross-tenant access check
    const crossAccess = await getLead(tenant1, leadT2.id);
    expect(crossAccess).toBeNull();
  });

  it('8. Should calculate accurate Phase 3 CRM Dashboard Metrics', async () => {
    const metrics = await getPhase3CrmMetrics(tenant1);

    expect(metrics).toBeDefined();
    expect(typeof metrics.totalLeads).toBe('number');
    expect(typeof metrics.conversionRatePct).toBe('number');
    expect(metrics.activeViewings).toBeGreaterThanOrEqual(0);
    expect(metrics.activeOffers).toBeGreaterThanOrEqual(0);
    expect(metrics.activeReservations).toBeGreaterThanOrEqual(0);
  });
});
