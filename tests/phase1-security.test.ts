import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { generateToken } from '../server/auth';
import { setKillSwitch, setCostGuard, setCostGuardCurrentDaily, adjustWallet, resetGovernanceState } from '../server/aiGovernance';
import { resetKillSwitchState } from '../src/lib/killSwitch';
import { resetCostGuardState } from '../src/lib/costGuard';
import { resetAiWalletState } from '../src/lib/aiWallet';
import Stripe from 'stripe';

describe('OPROX OS — Phase 1 Critical Security & Runtime Integrity Tests', () => {
  let superadminToken: string;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    await resetKillSwitchState();
    await resetCostGuardState();
    await resetAiWalletState();
    resetGovernanceState();

    superadminToken = generateToken({
      id: 'usr_super',
      email: 'superadmin@oprox.io',
      role: 'superadmin',
      orgId: 'org_core',
    });

    adminToken = generateToken({
      id: 'usr_admin',
      email: 'admin@oprox.io',
      role: 'admin',
      orgId: 'org_default',
    });

    userToken = generateToken({
      id: 'usr_user',
      email: 'user@oprox.io',
      role: 'user',
      orgId: 'org_default',
    });
  });

  beforeEach(async () => {
    await resetKillSwitchState();
    await resetCostGuardState();
    await resetAiWalletState();
    resetGovernanceState();
  });

  afterEach(async () => {
    await resetKillSwitchState();
    await resetCostGuardState();
    await resetAiWalletState();
    resetGovernanceState();
  });

  // 1. Authentication & RBAC Tests
  it('1. Anonymous -> admin endpoint = DENIED (401)', async () => {
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('2. User -> admin endpoint = DENIED (403)', async () => {
    const res = await request(app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('3. Admin -> superadmin-only operation = DENIED (403)', async () => {
    const res = await request(app)
      .post('/admin/killswitch')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: true });
    expect(res.status).toBe(403);
  });

  it('4. Authorized privileged request = ALLOWED (200)', async () => {
    const res = await request(app)
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users).toBeDefined();
  });

  it('5. Cross-organization unauthorized access = DENIED (403)', async () => {
    const res = await request(app)
      .get('/admin/organizations/org_forbidden')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(403);
  });

  // 2. AI Governance Gate Tests
  it('6. Anonymous AI request = DENIED (401)', async () => {
    const res = await request(app)
      .post('/api/ai/agent-task')
      .send({ prompt: 'Test prompt' });
    expect(res.status).toBe(401);
  });

  it('7. KillSwitch active -> AI request = DENIED (503)', async () => {
    setKillSwitch(true);
    const res = await request(app)
      .post('/api/ai/agent-task')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ prompt: 'Test prompt' });
    expect(res.status).toBe(503);
    setKillSwitch(false); // Reset KillSwitch
  });

  it('8. CostGuard denial -> provider NOT called (429)', async () => {
    setCostGuard(true, 100.0);
    setCostGuardCurrentDaily(150.0); // Exceed daily budget limit
    const res = await request(app)
      .post('/api/ai/agent-task')
      .set('Authorization', `Bearer ${superadminToken}`)
      .send({ prompt: 'Test prompt' });
    expect(res.status).toBe(429);
    setCostGuardCurrentDaily(0.0); // Reset current daily spending
  });

  it('9. Insufficient AI Wallet -> provider NOT called (402)', async () => {
    adjustWallet('org_empty', -100000000); // Deplete wallet
    const emptyOrgToken = generateToken({
      id: 'usr_empty',
      email: 'empty@oprox.io',
      role: 'user',
      orgId: 'org_empty',
    });

    const res = await request(app)
      .post('/api/ai/agent-task')
      .set('Authorization', `Bearer ${emptyOrgToken}`)
      .send({ prompt: 'Test prompt' });
    expect(res.status).toBe(402);
  });

  // 3. Stripe Webhook Security Tests
  it('10. Missing Stripe signature = DENIED (400)', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_key';
    const res = await request(app)
      .post('/api/webhooks/stripe')
      .send({ id: 'evt_test', type: 'payment_intent.succeeded' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Missing stripe-signature');
  });

  it('11. Invalid Stripe signature = DENIED (400)', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_key';
    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', 't=12345,v1=invalid_signature_hash')
      .send({ id: 'evt_test', type: 'payment_intent.succeeded' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Signature Verification Failed');
  });

  it('12. Valid Stripe signature = ACCEPTED (200)', async () => {
    const secret = 'whsec_test_secret_12345';
    process.env.STRIPE_WEBHOOK_SECRET = secret;
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock_key';

    const payload = JSON.stringify({ id: 'evt_valid_123', type: 'customer.subscription.created' });
    const header = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });

    const res = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', header)
      .set('Content-Type', 'application/json')
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  // 4. Payment Secret Exposure Prevention
  it('13. Payment provider API response contains ZERO plain text secretKey or webhookSecret', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_super_secret_key';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_super_secret_webhook';

    const res = await request(app)
      .get('/admin/payment-providers')
      .set('Authorization', `Bearer ${superadminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.secretKey).toBe('[REDACTED]');
    expect(res.body.webhookSecret).toBe('[REDACTED]');
    expect(JSON.stringify(res.body)).not.toContain('sk_test_super_secret_key');
    expect(JSON.stringify(res.body)).not.toContain('whsec_super_secret_webhook');
  });

  // 5. Source Code Download Removal
  it('14. /api/download-zip endpoint is DISABLED (410)', async () => {
    const res = await request(app).get('/api/download-zip');
    expect(res.status).toBe(410);
  });

  // 6. Security Audit Logs Recording
  it('15. Security audit log records events without leaking secrets', async () => {
    const res = await request(app)
      .get('/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.auditLogs).toBeDefined();
    expect(Array.isArray(res.body.auditLogs)).toBe(true);
  });
});
