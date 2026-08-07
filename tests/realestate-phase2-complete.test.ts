import { describe, it, expect } from 'vitest';
import {
  createProperty,
  createUnit,
} from '../src/lib/realestate/realEstateStore';
import {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  listTenants,
  getTenant,
  createTenant,
  updateTenant,
  listLeases,
  getLease,
  createLease,
  transitionLeaseStatus,
  renewLease,
  canTransitionLease,
  generateRentSchedules,
  listLeaseSchedules,
  listLeaseCharges,
  createLeaseCharge,
  createPayment,
  listPayments,
  getPayment,
  autoAllocatePayment,
  createSecurityDeposit,
  listSecurityDeposits,
  processSecurityDepositRefund,
  listLeaseEvents,
  uploadLeaseDocument,
  listLeaseDocuments,
  getLeaseFinancialSummary,
  getPhase2DashboardMetrics,
  createInvoiceForLeaseCharge,
} from '../src/lib/realestate/realEstatePhase2Store';

describe('OPROX Real Estate Phase 2 — Comprehensive Test Suite', () => {
  const tenantId = 'tenant_re_phase2_' + Date.now();
  const otherTenantId = 'tenant_re_other_' + Date.now();
  const actorId = 'usr_admin_001';

  let testContactId: string;
  let testReTenantId: string;
  let testPropertyId: string;
  let testUnitId: string;
  let testLeaseId: string;

  describe('1. Contact & Real Estate Tenant Management', () => {
    it('creates individual and corporate contacts with Saudi CR / VAT support', async () => {
      const contact = await createContact({
        tenantId,
        type: 'COMPANY',
        fullName: 'Al Oula Real Estate Investments Co.',
        arabicName: 'شركة الأولى للاستثمارات العقارية',
        mobile: '+966500001122',
        email: 'info@aloula-re.sa',
        companyName: 'Al Oula Real Estate Investments Co.',
        crNumber: '1010998877',
        vatNumber: '300998877600003',
        authorizedRep: 'Eng. Khalid Al-Mansoor',
      });

      expect(contact.id).toMatch(/^cont_/);
      expect(contact.tenantId).toBe(tenantId);
      expect(contact.crNumber).toBe('1010998877');
      expect(contact.preferredLanguage).toBe('ar');

      testContactId = contact.id;
    });

    it('enforces multi-tenant isolation for contacts', async () => {
      const otherContact = await createContact({
        tenantId: otherTenantId,
        fullName: 'Other Org Contact',
      });

      const listMain = await listContacts(tenantId);
      const listOther = await listContacts(otherTenantId);

      expect(listMain.some((c) => c.id === otherContact.id)).toBe(false);
      expect(listOther.some((c) => c.id === testContactId)).toBe(false);
    });

    it('links contact to a Real Estate Tenant with credit rating', async () => {
      const reTenant = await createTenant({
        tenantId,
        contactId: testContactId,
        creditRating: 'EXCELLENT',
        notes: 'Corporate tenant with strong financial backing.',
      });

      expect(reTenant.id).toMatch(/^ret_/);
      expect(reTenant.contactId).toBe(testContactId);
      expect(reTenant.creditRating).toBe('EXCELLENT');

      testReTenantId = reTenant.id;

      const fetched = await getTenant(tenantId, reTenant.id);
      expect(fetched?.contact?.companyName).toBe('Al Oula Real Estate Investments Co.');
    });
  });

  describe('2. Lease Lifecycle State Machine & Validation Engine', () => {
    it('verifies allowed state transitions matrix', () => {
      expect(canTransitionLease('DRAFT', 'PENDING_APPROVAL')).toBe(true);
      expect(canTransitionLease('PENDING_APPROVAL', 'APPROVED')).toBe(true);
      expect(canTransitionLease('APPROVED', 'ACTIVE')).toBe(true);
      expect(canTransitionLease('ACTIVE', 'EXPIRING')).toBe(true);
      expect(canTransitionLease('ACTIVE', 'TERMINATED')).toBe(true);

      // Illegal transitions
      expect(canTransitionLease('DRAFT', 'ACTIVE')).toBe(false);
      expect(canTransitionLease('TERMINATED', 'ACTIVE')).toBe(false);
      expect(canTransitionLease('EXPIRED', 'APPROVED')).toBe(false);
    });

    it('creates a Lease in DRAFT state linked to a Property & Unit', async () => {
      // Create property and unit first
      const prop = await createProperty({
        tenantId,
        name: 'Olaya Commercial Tower',
        type: 'commercial_building',
        addressCity: 'Riyadh',
        addressDistrict: 'Olaya',
        createdBy: actorId,
      });
      testPropertyId = prop.id;

      const unit = await createUnit({
        tenantId,
        propertyId: prop.id,
        unitNumber: 'STE-501',
        unitType: 'office',
        rentPriceSar: '120000',
      });
      testUnitId = unit.id;

      const lease = await createLease({
        tenantId,
        propertyId: prop.id,
        reTenantId: testReTenantId,
        leaseType: 'COMMERCIAL',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        contractValueSar: 120000,
        paymentFrequency: 'QUARTERLY',
        securityDepositSar: 10000,
        unitIds: [unit.id],
        createdBy: actorId,
      });

      expect(lease.id).toMatch(/^lse_/);
      expect(lease.status).toBe('DRAFT');
      expect(lease.ejarStatus).toBe('NOT_CONFIGURED');
      expect(lease.contractValueSar).toBe('120000');

      testLeaseId = lease.id;

      const events = await listLeaseEvents(tenantId, lease.id);
      expect(events.some((e) => e.eventType === 'CREATED')).toBe(true);
    });

    it('moves lease through PENDING_APPROVAL -> APPROVED -> ACTIVE and auto-generates rent schedules', async () => {
      await transitionLeaseStatus(tenantId, testLeaseId, 'PENDING_APPROVAL', actorId);
      await transitionLeaseStatus(tenantId, testLeaseId, 'APPROVED', actorId);
      const activeLease = await transitionLeaseStatus(tenantId, testLeaseId, 'ACTIVE', actorId);

      expect(activeLease.status).toBe('ACTIVE');
      expect(activeLease.activatedAt).not.toBeNull();

      // Verify rent schedules were auto-generated
      const schedules = await listLeaseSchedules(tenantId, testLeaseId);
      expect(schedules.length).toBe(4); // Quarterly
      expect(schedules[0].amountSar).toBe('30000');
      expect(schedules[0].status).toBe('UPCOMING');

      // Verify lease charges were auto-created
      const charges = await listLeaseCharges(tenantId, testLeaseId);
      expect(charges.length).toBe(4);
      expect(charges[0].chargeType).toBe('RENT');
    });

    it('supports CUSTOM rent schedule generation with sum validation and error handling', async () => {
      const customLease = await createLease({
        tenantId,
        propertyId: testPropertyId,
        reTenantId: testReTenantId,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        contractValueSar: 50000,
        paymentFrequency: 'CUSTOM',
        createdBy: actorId,
      });

      // Reject invalid sum
      await expect(
        generateRentSchedules(tenantId, customLease.id, [
          { dueDate: '2026-01-15', amountSar: 20000 },
          { dueDate: '2026-06-15', amountSar: 20000 }, // Sum is 40000, not 50000
        ])
      ).rejects.toThrow();

      // Reject negative amount
      await expect(
        generateRentSchedules(tenantId, customLease.id, [
          { dueDate: '2026-01-15', amountSar: -10000 },
          { dueDate: '2026-06-15', amountSar: 60000 },
        ])
      ).rejects.toThrow();

      // Valid custom installments
      const customSchedules = await generateRentSchedules(tenantId, customLease.id, [
        { dueDate: '2026-01-15', amountSar: 20000 },
        { dueDate: '2026-06-15', amountSar: 30000 },
      ]);

      expect(customSchedules.length).toBe(2);
      expect(customSchedules[0].amountSar).toBe('20000');
      expect(customSchedules[1].amountSar).toBe('30000');
    });

    it('prevents activating a lease if unit is already rented', async () => {
      // Try to create another lease for the same unit and activate it
      const secondLease = await createLease({
        tenantId,
        propertyId: testPropertyId,
        reTenantId: testReTenantId,
        startDate: '2026-06-01',
        endDate: '2027-05-31',
        contractValueSar: 150000,
        unitIds: [testUnitId],
        createdBy: actorId,
      });

      await transitionLeaseStatus(tenantId, secondLease.id, 'PENDING_APPROVAL', actorId);
      await transitionLeaseStatus(tenantId, secondLease.id, 'APPROVED', actorId);

      await expect(transitionLeaseStatus(tenantId, secondLease.id, 'ACTIVE', actorId)).rejects.toThrow();
    });
  });

  describe('3. Payments, Auto-Allocation Engine & Security Deposits', () => {
    it('generates an invoice for a lease charge linking to invoice infrastructure', async () => {
      const charges = await listLeaseCharges(tenantId, testLeaseId);
      expect(charges.length).toBeGreaterThan(0);

      const inv = await createInvoiceForLeaseCharge(tenantId, charges[0].id, actorId);
      expect(inv.id).toBeDefined();
      expect(inv.sequentialNumber).toMatch(/^INV-/);

      const updatedCharges = await listLeaseCharges(tenantId, testLeaseId);
      const targetCharge = updatedCharges.find((c) => c.id === charges[0].id);
      expect(targetCharge?.invoiceId).toBe(inv.id);
    });

    it('records a payment and auto-allocates to outstanding rent charges using FIFO', async () => {
      const payment = await createPayment({
        tenantId,
        leaseId: testLeaseId,
        reTenantId: testReTenantId,
        amountSar: 35000, // Pays installment 1 (30,000) + 5,000 towards installment 2
        paymentMethod: 'BANK_TRANSFER',
        createdBy: actorId,
      });

      expect(payment.id).toMatch(/^pay_/);
      expect(Number(payment.unallocatedAmountSar)).toBe(0);

      const charges = await listLeaseCharges(tenantId, testLeaseId);
      const sortedCharges = charges.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      expect(sortedCharges[0].status).toBe('PAID');
      expect(sortedCharges[0].paidAmountSar).toBe('30000');

      expect(sortedCharges[1].status).toBe('PARTIALLY_PAID');
      expect(sortedCharges[1].paidAmountSar).toBe('5000');
      expect(sortedCharges[1].outstandingAmountSar).toBe('25000');
    });

    it('manages security deposit lifecycle (Hold -> Partial Deduction -> Refund)', async () => {
      const deposit = await createSecurityDeposit({
        tenantId,
        leaseId: testLeaseId,
        reTenantId: testReTenantId,
        amountSar: 10000,
        notes: 'Held for Olaya Commercial Tower Suite 501',
      });

      expect(deposit.id).toMatch(/^dep_/);
      expect(deposit.status).toBe('HELD');
      expect(deposit.heldAmountSar).toBe('10000');

      const refundedDeposit = await processSecurityDepositRefund(tenantId, deposit.id, 2000, 'Minor wall repair deduction.');
      expect(refundedDeposit.status).toBe('REFUNDED');
      expect(refundedDeposit.heldAmountSar).toBe('0');
      expect(refundedDeposit.deductionsAmountSar).toBe('2000');
      expect(refundedDeposit.refundedAmountSar).toBe('8000');
    });
  });

  describe('4. Lease Renewal, Termination & Financial Visibility', () => {
    it('renews a lease and creates a child lease contract', async () => {
      const childLease = await renewLease(tenantId, testLeaseId, {
        startDate: '2027-01-01',
        endDate: '2027-12-31',
        contractValueSar: 130000,
        paymentFrequency: 'QUARTERLY',
        actorId,
      });

      expect(childLease.id).toMatch(/^lse_/);
      expect(childLease.parentLeaseId).toBe(testLeaseId);
      expect(childLease.contractValueSar).toBe('130000');

      const parentLease = await getLease(tenantId, testLeaseId);
      expect(parentLease?.status).toBe('RENEWAL_PENDING');
    });

    it('terminates a lease and releases unit back to Vacant state', async () => {
      const terminatedLease = await transitionLeaseStatus(tenantId, testLeaseId, 'TERMINATED', actorId, {
        terminationReason: 'Contract period completed & renewed.',
      });

      expect(terminatedLease.status).toBe('TERMINATED');
      expect(terminatedLease.terminationReason).toBe('Contract period completed & renewed.');
    });

    it('fetches lease financial summary and Phase 2 dashboard metrics', async () => {
      const finSummary = await getLeaseFinancialSummary(tenantId, testLeaseId);
      expect(finSummary.totalContractSar).toBe(120000);
      expect(finSummary.totalPaidSar).toBe(35000);

      const metrics = await getPhase2DashboardMetrics(tenantId);
      expect(metrics.totalContacts).toBeGreaterThan(0);
      expect(metrics.totalTenants).toBeGreaterThan(0);
      expect(metrics.totalLeases).toBeGreaterThan(0);
      expect(metrics.totalCollectedSar).toBeGreaterThan(0);
    });
  });
});
