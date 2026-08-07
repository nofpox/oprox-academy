import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { generateToken } from '../server/auth';
import { calculateSaudiVat, buildZatcaQrPayload, generateSequentialInvoiceNumber, createZatcaInvoice } from '../src/lib/vatZatca';
import { getPlansCatalog, getPlanByCode, validatePlanPurchasable, upsertPlanCatalog } from '../src/lib/plansCatalog';
import { validatePaymentMethodAllowed, getPaymentMethodsConfig, updatePaymentMethodConfig } from '../src/lib/paymentMethods';
import {
  createDualApprovalRequest,
  approveDualApprovalRequest,
  rejectDualApprovalRequest,
  getAllDualApprovalRequests,
} from '../src/lib/dualApproval';
import { calculateAiUsageCost, getModelPricingMetadata } from '../src/lib/modelPricing';
import {
  createSubscriptionAtomic,
  upgradeSubscriptionImmediate,
  scheduleDowngradeAtPeriodEnd,
  cancelSubscriptionAtPeriodEnd,
  assertNoRefundsPolicy,
  handlePaymentFailure,
  getInvoices,
} from '../src/lib/billing';
import { assertCanAddUserToOrg, addMemberToOrganization } from '../src/lib/userOrg';

describe('OPROX OS — Phase 4 Business & Financial Policy Suite', () => {
  let userToken: string;
  let adminToken: string;
  let superadminToken: string;

  beforeAll(async () => {
    userToken = generateToken({ id: 'usr_p4_user', email: 'p4user@oprox.io', role: 'user', orgId: 'org_default' });
    adminToken = generateToken({ id: 'usr_p4_admin', email: 'p4admin@oprox.io', role: 'admin', orgId: 'org_default' });
    superadminToken = generateToken({ id: 'usr_p4_super', email: 'p4super@oprox.io', role: 'superadmin', orgId: 'org_core' });

    // Seed approved active prices for catalog testing
    await upsertPlanCatalog({
      code: 'starter',
      displayName: 'Starter Plan',
      active: true,
      priceSarHalalas: 3750,
      priceUsdCents: 1000,
      maxUsers: 5,
    });

    await upsertPlanCatalog({
      code: 'pro',
      displayName: 'Professional Plan',
      active: true,
      priceSarHalalas: 18750,
      priceUsdCents: 5000,
      maxUsers: 15,
    });

    await upsertPlanCatalog({
      code: 'enterprise',
      displayName: 'Enterprise Plan',
      active: true,
      priceSarHalalas: 112500,
      priceUsdCents: 30000,
      maxUsers: 50,
    });
  });

  // 1. Currency & VAT Policy
  describe('1. Currency & Saudi VAT Engine (15% ZATCA Standard)', () => {
    it('calculates 15% Saudi VAT using integer halalas without rounding error', () => {
      const vat = calculateSaudiVat(10000, 1500); // 100.00 SAR subtotal
      expect(vat.vatRateBps).toBe(1500);
      expect(vat.subtotalHalalas).toBe(10000);
      expect(vat.vatAmountHalalas).toBe(1500); // 15.00 SAR VAT
      expect(vat.totalAmountHalalas).toBe(11500); // 115.00 SAR Total
    });

    it('generates sequential ZATCA-compliant invoice number', async () => {
      const invNum1 = await generateSequentialInvoiceNumber();
      const invNum2 = await generateSequentialInvoiceNumber();
      expect(invNum1).toMatch(/^INV-\d{4}-\d{6}$/);
      expect(invNum2).toMatch(/^INV-\d{4}-\d{6}$/);
      expect(invNum1).not.toBe(invNum2);
    });

    it('generates valid TLV Base64 QR code payload for ZATCA simplified e-invoices', () => {
      const qrBase64 = buildZatcaQrPayload({
        sellerName: 'OPROX Commercial Systems',
        vatRegistrationNumber: '310123456700003',
        timestamp: new Date('2026-08-01T12:00:00Z'),
        totalAmountHalalas: 11500,
        vatAmountHalalas: 1500,
      });

      expect(typeof qrBase64).toBe('string');
      expect(qrBase64.length).toBeGreaterThan(20);
      // Decoded buffer checks tag-length-value structure
      const decodedBuf = Buffer.from(qrBase64, 'base64');
      expect(decodedBuf[0]).toBe(1); // Tag 1: Seller name
    });
  });

  // 2. Pricing Catalog
  describe('2. Centralized Pricing Catalog Management', () => {
    it('provides active plans with integer minor units', async () => {
      const catalog = await getPlansCatalog();
      expect(catalog.length).toBeGreaterThan(0);
      const proPlan = catalog.find(p => p.code === 'pro');
      expect(proPlan).toBeDefined();
      expect(proPlan?.priceSarHalalas).toBe(18750); // 187.50 SAR
      expect(proPlan?.active).toBe(true);
    });

    it('validates plan purchasability and rejects draft/unset price plans', async () => {
      const activeRes = await validatePlanPurchasable('pro', 'SAR');
      expect(activeRes.purchasable).toBe(true);

      const invalidRes = await validatePlanPurchasable('non_existent_plan', 'SAR');
      expect(invalidRes.purchasable).toBe(false);
      expect(invalidRes.reason).toContain('does not exist');
    });
  });

  // 3. Payment Provider Abstraction & Policy
  describe('3. Payment Provider Abstraction & Payment Policy', () => {
    it('permits approved Saudi payment methods (mada, STC Pay, barq Pay, Bank Transfer)', async () => {
      const madaVal = await validatePaymentMethodAllowed('mada');
      expect(madaVal.allowed).toBe(true);

      const stcVal = await validatePaymentMethodAllowed('stc_pay');
      expect(stcVal.allowed).toBe(true);
    });

    it('enforces strict prohibition on credit cards per commercial policy', async () => {
      const cardVal = await validatePaymentMethodAllowed('credit_card');
      expect(cardVal.allowed).toBe(false);
      expect(cardVal.reason).toContain('disabled by OPROX commercial policy');
    });

    it('rejects admin attempts to enable credit cards via API', async () => {
      const res = await request(app)
        .post('/admin/payment-methods/credit_card')
        .set('Authorization', `Bearer ${superadminToken}`)
        .send({ enabled: true });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('cannot be enabled');
    });
  });

  // 4. Refund Policy
  describe('4. No-Refunds Commercial Policy', () => {
    it('throws NO_REFUNDS_POLICY error on attempt to invoke refunds', () => {
      expect(() => assertNoRefundsPolicy()).toThrow('NO_REFUNDS_POLICY');
    });

    it('blocks self-service refund requests via REST endpoint with HTTP 400', async () => {
      const res = await request(app)
        .post('/api/billing/refunds')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ subscriptionId: 'sub_test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('prohibited by OPROX commercial policy');
    });
  });

  // 5. Dual Financial Approval Workflow
  describe('5. Dual Financial Approval Control Workflow', () => {
    it('requires two independent administrator approvals for sensitive financial actions', async () => {
      // 1. Create request
      const reqRecord = await createDualApprovalRequest({
        actionType: 'EXCEPTIONAL_FINANCIAL_CREDIT',
        requestedBy: 'usr_p4_admin1',
        amountMicros: 50000000,
      });

      expect(reqRecord.status).toBe('PENDING');

      // 2. Requester self-approval is forbidden
      await expect(
        approveDualApprovalRequest(reqRecord.id, 'usr_p4_admin1', 'Self approval attempt')
      ).rejects.toThrow('Self-approval is forbidden');

      // 3. First independent admin approves -> remains PENDING
      const firstRes = await approveDualApprovalRequest(reqRecord.id, 'usr_p4_admin2', 'First review OK');
      expect(firstRes.status).toBe('PENDING');
      expect(firstRes.request.firstApprovedBy).toBe('usr_p4_admin2');

      // 4. Same admin second approval forbidden
      await expect(
        approveDualApprovalRequest(reqRecord.id, 'usr_p4_admin2', 'Duplicate approval')
      ).rejects.toThrow('Second independent approver required');

      // 5. Second independent admin approves -> becomes APPROVED
      const secondRes = await approveDualApprovalRequest(reqRecord.id, 'usr_p4_admin3', 'Final review OK');
      expect(secondRes.status).toBe('APPROVED');
      expect(secondRes.request.secondApprovedBy).toBe('usr_p4_admin3');
    });
  });

  // 6. AI Commercial Accounting & Model Pricing
  describe('6. AI Commercial Accounting & Token Pricing Engine', () => {
    it('calculates provider cost, customer credit deduction, and non-negative platform margin', async () => {
      const calc = await calculateAiUsageCost('gemini-2.5-flash', 1000, 2000);

      expect(calc.modelId).toBe('gemini-2.5-flash');
      expect(calc.promptTokens).toBe(1000);
      expect(calc.completionTokens).toBe(2000);
      expect(calc.providerCostMicros).toBeGreaterThan(0);
      expect(calc.customerCreditMicros).toBeGreaterThanOrEqual(calc.providerCostMicros);
      expect(calc.platformMarginMicros).toBeGreaterThanOrEqual(0);
    });
  });

  // 7. Subscriptions: Upgrade, Downgrade & Cancellation Lifecycle
  describe('7. Subscription Lifecycle & Upgrade/Downgrade/Cancellation Policy', () => {
    it('executes immediate upgrades with prorated ZATCA invoice generation', async () => {
      // Create initial starter subscription
      const subRes = await createSubscriptionAtomic({
        userId: 'usr_p4_lifecycle',
        orgId: 'org_p4_lifecycle',
        planId: 'starter',
        currency: 'SAR',
        paymentMethod: 'mada',
      });

      expect(subRes.subscription.status).toBe('active');
      expect(subRes.subscription.planId).toBe('starter');

      // Immediate Upgrade to Pro
      const upRes = await upgradeSubscriptionImmediate({
        subscriptionId: subRes.subscription.id,
        newPlanCode: 'pro',
        currency: 'SAR',
        paymentMethod: 'stc_pay',
      });

      expect(upRes.subscription.planId).toBe('pro');
      expect(upRes.invoice.subtotalHalalas).toBe(18750 - 3750); // 150.00 SAR proration diff
    });

    it('schedules downgrades for the end of the billing cycle without immediate loss of entitlement', async () => {
      const subRes = await createSubscriptionAtomic({
        userId: 'usr_p4_downgrade',
        orgId: 'org_p4_downgrade',
        planId: 'pro',
        currency: 'SAR',
        paymentMethod: 'mada',
      });

      const downRes = await scheduleDowngradeAtPeriodEnd({
        subscriptionId: subRes.subscription.id,
        newPlanCode: 'starter',
      });

      expect(downRes.subscription.planId).toBe('pro'); // Current plan remains ACTIVE
      expect(downRes.subscription.scheduledPlanId).toBe('starter'); // Scheduled for next cycle
      expect(downRes.subscription.scheduledPlanEffectiveAt).toBeDefined();
    });

    it('schedules cancellation for end of period while keeping service active until currentPeriodEnd', async () => {
      const subRes = await createSubscriptionAtomic({
        userId: 'usr_p4_cancel',
        planId: 'pro',
        currency: 'SAR',
        paymentMethod: 'mada',
      });

      const cancelRes = await cancelSubscriptionAtPeriodEnd(subRes.subscription.id);
      expect(cancelRes.subscription.cancelAtPeriodEnd).toBe(true);
      expect(cancelRes.subscription.status).toBe('active'); // Still active through current period
    });

    it('handles payment failure and transitions subscription to past_due', async () => {
      const subRes = await createSubscriptionAtomic({
        userId: 'usr_p4_dunning',
        planId: 'pro',
        currency: 'SAR',
        paymentMethod: 'mada',
      });

      const pastDueSub = await handlePaymentFailure(subRes.subscription.id, 'Card decline or insufficient funds');
      expect(pastDueSub?.status).toBe('past_due');
    });
  });

  // 8. Organization Seat Enforcement
  describe('8. Organization User & Seat Limit Enforcement', () => {
    it('enforces seat limits and throws error when adding members beyond max seats', async () => {
      const check = await assertCanAddUserToOrg('org_core');
      expect(check.canAdd).toBe(true);

      // Attempt to add member beyond quota
      const { createOrganization } = await import('../src/lib/userOrg');
      const createdOrg = await createOrganization({ name: 'Seat Test Org', slug: 'seat-test', ownerId: 'usr_p4_owner', maxSeats: 1 });

      await addMemberToOrganization(createdOrg.id, 'usr_m1');
      await expect(addMemberToOrganization(createdOrg.id, 'usr_m2')).rejects.toThrow('user limit reached');
    });
  });
});
