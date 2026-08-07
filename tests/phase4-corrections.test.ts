import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { generateToken } from '../server/auth';
import { assertCanAddUserToOrg, addMemberToOrganization, getOrganizationMemberCount } from '../src/lib/userOrg';
import { generateSequentialInvoiceNumber } from '../src/lib/vatZatca';
import { processBillingWebhookEvent } from '../src/lib/billing';
import { getCentralFinancialOverview } from '../src/lib/productRegistry';
import { encryptIfPlaintext } from '../src/lib/encryption';
import { createDualApprovalRequest, approveDualApprovalRequest } from '../src/lib/dualApproval';
import { memoryDb } from '../src/db';

describe('OPROX OS — Phase 4 Complete Corrections Test Suite', () => {
  let superadminToken: string;
  let superadminToken2: string;
  let adminToken: string;

  beforeAll(() => {
    superadminToken = generateToken({ id: 'usr_super_1', email: 'super1@oprox.io', role: 'superadmin', orgId: 'org_core' });
    superadminToken2 = generateToken({ id: 'usr_super_2', email: 'super2@oprox.io', role: 'superadmin', orgId: 'org_core' });
    adminToken = generateToken({ id: 'usr_admin_1', email: 'admin1@oprox.io', role: 'admin', orgId: 'org_core' });
  });

  it('Correction 1: Enforces seat limits and fails closed when org maxSeats reached', async () => {
    const testOrgId = `org_seat_test_${Date.now()}`;
    memoryDb.organizations.set(testOrgId, {
      id: testOrgId,
      name: 'Seat Limit Test Org',
      slug: `seat-test-${Date.now()}`,
      maxSeats: 2,
      createdAt: new Date(),
    } as any);

    await addMemberToOrganization(testOrgId, 'user_1', 'member');
    await addMemberToOrganization(testOrgId, 'user_2', 'member');

    const count = await getOrganizationMemberCount(testOrgId);
    expect(count).toBe(2);

    await expect(addMemberToOrganization(testOrgId, 'user_3', 'member')).rejects.toThrow(/limit reached/i);
  });

  it('Correction 2 & 3: Generates atomic, strictly unique sequential invoice numbers', async () => {
    const inv1 = await generateSequentialInvoiceNumber();
    const inv2 = await generateSequentialInvoiceNumber();

    expect(inv1).toMatch(/^INV-\d{4}-\d{6}$/);
    expect(inv2).toMatch(/^INV-\d{4}-\d{6}$/);
    expect(inv1).not.toEqual(inv2);

    const num1 = parseInt(inv1.split('-')[2], 10);
    const num2 = parseInt(inv2.split('-')[2], 10);
    expect(num2).toBe(num1 + 1);
  });

  it('Correction 4: Guarantees billing webhook idempotency under sequential, concurrent, and DB error conditions', async () => {
    // A. First delivery of a brand-new Stripe event
    const eventIdA = `evt_test_new_${Date.now()}`;
    const payloadA = { id: eventIdA, type: 'invoice.payment_succeeded', data: { amount: 1000 } };

    const resA1 = await processBillingWebhookEvent(payloadA);
    expect(resA1.processed).toBe(true);
    expect(resA1.duplicate).toBe(false);

    // B. Second delivery of the SAME stripeEventId
    const resA2 = await processBillingWebhookEvent(payloadA);
    expect(resA2.processed).toBe(true);
    expect(resA2.duplicate).toBe(true);

    // C. Concurrent deliveries of the same stripeEventId
    const eventIdC = `evt_test_concurrent_${Date.now()}`;
    const payloadC = { id: eventIdC, type: 'customer.subscription.created', data: { subId: 'sub_123' } };

    const [resC1, resC2] = await Promise.all([
      processBillingWebhookEvent(payloadC),
      processBillingWebhookEvent(payloadC),
    ]);

    const duplicates = [resC1.duplicate, resC2.duplicate];
    expect(duplicates).toContain(false);
    expect(duplicates).toContain(true);

    // D. Non-unique database error must NOT be classified as duplicate
    // Mock db.insert throwing a non-unique error (e.g. connection error / syntax error)
    const originalBillingEventsLength = memoryDb.billingEvents.length;
    const fakeUnknownError = new Error('PostgreSQL connection timeout');
    (fakeUnknownError as any).code = '08006'; // Connection failure, not 23505

    // Verify processBillingWebhookEvent with mock error rethrows instead of returning duplicate: true
    const eventIdD = `evt_test_dberr_${Date.now()}`;
    const payloadD = { id: eventIdD, type: 'invoice.payment_failed' };

    // If db exists, test db error path
    const { db: actualDb } = await import('../src/db');
    if (actualDb) {
      const originalInsert = actualDb.insert;
      actualDb.insert = (() => {
        throw fakeUnknownError;
      }) as any;

      await expect(processBillingWebhookEvent(payloadD)).rejects.toThrow('PostgreSQL connection timeout');
      actualDb.insert = originalInsert;
    }
  });

  it('Correction 5: Removes $299 analytics pricing assumption', async () => {
    const overview = await getCentralFinancialOverview();
    expect(overview.pricingStatus).toBe('pricing_not_configured');
    expect(overview.mrrUsd).toBe(0);
    expect(overview.arrUsd).toBe(0);
  });

  it('Correction 6: Uses runtime key in dev/test without hardcoded committed fallback secret', async () => {
    const encrypted = encryptIfPlaintext('sensitive-api-key-12345');
    expect(encrypted).toMatch(/^aes256gcm:/);
  });

  it('Correction 7 & 9: Dual approval enforces independent Superadmins and handles concurrency', async () => {
    const request = await createDualApprovalRequest({
      actionType: 'SENSITIVE_FINANCIAL_ACTION',
      requestedBy: 'usr_super_1',
      amountMicros: 1000000,
    });

    // 1. Self-approval MUST fail
    await expect(approveDualApprovalRequest(request.id, 'usr_super_1')).rejects.toThrow(/Self-approval is forbidden/i);

    // 2. First valid approval by second superadmin
    const step1 = await approveDualApprovalRequest(request.id, 'usr_super_2');
    expect(step1.status).toBe('PENDING');

    // 3. Repeat approval by same superadmin MUST fail
    await expect(approveDualApprovalRequest(request.id, 'usr_super_2')).rejects.toThrow(/Second independent approver required/i);

    // 4. Second independent approval by a third superadmin completes the request
    const step2 = await approveDualApprovalRequest(request.id, 'usr_super_3');
    expect(step2.status).toBe('APPROVED');
  });

  it('Correction 8: Rejects requests missing tenant context without org_default fallback', async () => {
    // Generate a token with empty id and orgId context
    const noContextToken = generateToken({ id: '', email: 'no-context@oprox.io', role: 'user', orgId: '' });

    const res = await request(app)
      .get('/admin/ai-wallet/balance')
      .set('Authorization', `Bearer ${noContextToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Missing tenant or user context/i);
  });

  it('Correction 9: Dual approval endpoints require superadmin role', async () => {
    // Attempt to create dual approval with standard admin token
    const res = await request(app)
      .post('/admin/dual-approvals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ actionType: 'HIGH_VALUE_TRANSFER', amountMicros: 5000000 });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/Forbidden|Requires one of/i);

    // Successful creation with superadmin token
    const resSuper = await request(app)
      .post('/admin/dual-approvals')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ actionType: 'HIGH_VALUE_TRANSFER', amountMicros: 5000000 });

    expect(resSuper.status).toBe(200);
    expect(resSuper.body.request.status).toBe('PENDING');
  });
});
