import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { encryptSecret, decryptSecret, isEncrypted } from '../src/lib/encryption';
import {
  reserveAiWalletBalance,
  finalizeAiWalletTransaction,
  rollbackAiWalletReservation,
  adjustWalletBalance,
  getWalletBalance,
  resetAiWalletState,
} from '../src/lib/aiWallet';
import { createSubscriptionAtomic, updatePaymentProviderConfig, getPaymentProviderConfig } from '../src/lib/billing';
import {
  getCostGuardDailyUsage,
  recordCostGuardUsage,
  getCostGuardSettings,
  updateCostGuardSettings,
  resetCostGuardState,
} from '../src/lib/costGuard';
import { isKillSwitchActive, setKillSwitch, resetKillSwitchState } from '../src/lib/killSwitch';
import { resetGovernanceState } from '../server/aiGovernance';

describe('OPROX OS — Phase 2 Complete Verification Suite', () => {
  const testUserId = 'usr_phase2_test';

  beforeAll(async () => {
    await resetKillSwitchState();
    await resetCostGuardState();
    await resetAiWalletState();
    resetGovernanceState();

    // Ensure test user has initial wallet balance
    await adjustWalletBalance(testUserId, 20000000, 'topup', 'Test topup $20');
  });

  beforeEach(async () => {
    await resetKillSwitchState();
    await resetCostGuardState();
    await resetAiWalletState();
    resetGovernanceState();
    await adjustWalletBalance(testUserId, 20000000, 'topup', 'Test topup $20');
  });

  afterEach(async () => {
    await resetKillSwitchState();
    await resetCostGuardState();
    await resetAiWalletState();
    resetGovernanceState();
  });

  // 1. Encryption at Rest Tests (Phase 2.2)
  describe('Phase 2.2 — Encryption at Rest', () => {
    it('encrypts plaintext secrets using AES-256-GCM format', () => {
      const plaintext = 'sk_test_super_secret_key_12345';
      const encrypted = encryptSecret(plaintext);

      expect(encrypted).not.toEqual(plaintext);
      expect(isEncrypted(encrypted)).toBe(true);
      expect(encrypted.startsWith('aes256gcm:')).toBe(true);
    });

    it('decrypts encrypted secrets back to original plaintext', () => {
      const plaintext = 'whsec_test_webhook_secret_67890';
      const encrypted = encryptSecret(plaintext);
      const decrypted = decryptSecret(encrypted);

      expect(decrypted).toEqual(plaintext);
    });

    it('throws an error if ciphertext or authentication tag is tampered with', () => {
      const encrypted = encryptSecret('sensitive_api_key');
      const lastChar = encrypted.slice(-1);
      const replacementChar = lastChar === '0' ? '1' : '0';
      const tampered = encrypted.slice(0, -1) + replacementChar;

      expect(() => decryptSecret(tampered)).toThrow();
    });

    it('fails closed in production if MASTER_ENCRYPTION_KEY is missing', () => {
      const originalEnv = process.env.NODE_ENV;
      const originalKey = process.env.MASTER_ENCRYPTION_KEY;

      try {
        process.env.NODE_ENV = 'production';
        delete process.env.MASTER_ENCRYPTION_KEY;

        expect(() => encryptSecret('test_secret')).toThrow('MASTER_ENCRYPTION_KEY environment variable is required in production mode');
      } finally {
        process.env.NODE_ENV = originalEnv;
        if (originalKey) process.env.MASTER_ENCRYPTION_KEY = originalKey;
      }
    });

    it('encrypts payment provider secret keys on config update', async () => {
      await updatePaymentProviderConfig({
        secretKey: 'sk_test_secret_key_to_be_encrypted',
        webhookSecret: 'whsec_webhook_secret_to_be_encrypted',
      });

      const configRaw = await getPaymentProviderConfig({ decryptSecrets: false });
      expect(isEncrypted(configRaw.secretKey!)).toBe(true);
      expect(isEncrypted(configRaw.webhookSecret!)).toBe(true);

      const configDecrypted = await getPaymentProviderConfig({ decryptSecrets: true });
      expect(configDecrypted.secretKey).toBe('sk_test_secret_key_to_be_encrypted');
      expect(configDecrypted.webhookSecret).toBe('whsec_webhook_secret_to_be_encrypted');
    });
  });

  // 2. AI Wallet Transaction Engine Tests (Phase 2.3)
  describe('Phase 2.3 — AI Wallet Transaction Engine (Reserve → Execute → Finalize)', () => {
    it('reserves estimated cost atomically and locks wallet balance', async () => {
      const initialBalance = await getWalletBalance(testUserId);
      const estimatedCost = 5000000; // $5.00 in micros

      const res = await reserveAiWalletBalance(testUserId, estimatedCost);
      expect(res.success).toBe(true);
      expect(res.reservationId).toBeDefined();

      const balanceAfterReserve = await getWalletBalance(testUserId);
      expect(balanceAfterReserve.walletMicros).toBe(initialBalance.walletMicros - estimatedCost);
    });

    it('finalizes actual usage cost and refunds over-reserved delta', async () => {
      const initialBalance = await getWalletBalance(testUserId);
      const estimatedCost = 3000000; // $3.00
      const actualCost = 2000000; // $2.00 (spent $1 less than reserved)

      const reserveRes = await reserveAiWalletBalance(testUserId, estimatedCost);
      expect(reserveRes.success).toBe(true);

      const finalizeRes = await finalizeAiWalletTransaction(reserveRes.reservationId!, actualCost, {
        provider: 'gemini',
        model: 'gemini-3.6-flash',
        promptTokens: 1000,
        completionTokens: 500,
      });

      expect(finalizeRes.success).toBe(true);
      expect(finalizeRes.actualCostMicros).toBe(actualCost);

      const finalBalance = await getWalletBalance(testUserId);
      expect(finalBalance.walletMicros).toBe(initialBalance.walletMicros - actualCost);
    });

    it('rolls back reservation completely on execution failure', async () => {
      const initialBalance = await getWalletBalance(testUserId);
      const estimatedCost = 4000000; // $4.00

      const reserveRes = await reserveAiWalletBalance(testUserId, estimatedCost);
      expect(reserveRes.success).toBe(true);

      const rollbackRes = await rollbackAiWalletReservation(reserveRes.reservationId!, 'API execution timed out');
      expect(rollbackRes.success).toBe(true);
      if ('status' in rollbackRes) {
        expect(rollbackRes.status).toBe('rolled_back');
      }

      const balanceAfterRollback = await getWalletBalance(testUserId);
      expect(balanceAfterRollback.walletMicros).toBe(initialBalance.walletMicros);
    });

    it('denies reservation when requested micros exceed available wallet balance', async () => {
      const hugeCost = 1000000000; // $1,000.00
      const res = await reserveAiWalletBalance(testUserId, hugeCost);

      expect(res.success).toBe(false);
      expect(res.reason).toBe('INSUFFICIENT_FUNDS');
    });

    it('handles concurrent reservation attempts safely without double spending', async () => {
      // Top up to exact $10.00 (10,000,000 micros)
      await adjustWalletBalance(testUserId, 10000000, 'topup', 'Exact balance test');
      const currentBal = (await getWalletBalance(testUserId)).walletMicros;

      // Make 3 concurrent reservation requests of currentBal / 2 each (only 2 should succeed)
      const costPerReq = Math.floor(currentBal / 2);
      const promises = [
        reserveAiWalletBalance(testUserId, costPerReq),
        reserveAiWalletBalance(testUserId, costPerReq),
        reserveAiWalletBalance(testUserId, costPerReq),
      ];

      const results = await Promise.all(promises);
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);

      expect(successful.length).toBe(2);
      expect(failed.length).toBe(1);
    });
  });

  // 3. Billing & CostGuard Atomicity Tests (Phase 2.4)
  describe('Phase 2.4 — Billing and CostGuard Atomicity', () => {
    it('creates subscription, invoice, and credits wallet atomically', async () => {
      const res = await createSubscriptionAtomic({
        userId: testUserId,
        orgId: 'org_oprox',
        planId: 'enterprise',
        amountCents: 19900, // $199.00
        walletCreditMicros: 50000000, // $50.00 wallet credit
      });

      expect(res.subscription).toBeDefined();
      expect(res.invoice).toBeDefined();
      expect(res.subscription.planId).toBe('enterprise');
      expect(res.invoice.amountPaid).toBe(19900);
    });

    it('records CostGuard daily usage persistently and updates daily accumulator', async () => {
      const initialUsage = await getCostGuardDailyUsage();
      const addedUsd = 2.50;

      const newTotal = await recordCostGuardUsage(addedUsd);
      expect(newTotal).toBeCloseTo(initialUsage + addedUsd, 2);

      const verifiedUsage = await getCostGuardDailyUsage();
      expect(verifiedUsage).toBeCloseTo(newTotal, 2);
    });

    it('automatically triggers global KillSwitch when usage exceeds autoKillAtUsd threshold', async () => {
      await updateCostGuardSettings({ autoKillAtUsd: 100.0, enabled: true });
      await setKillSwitch('all_ai', false);

      // Record spend exceeding threshold
      await recordCostGuardUsage(150.0);

      const killSwitchActive = await isKillSwitchActive('all_ai');
      expect(killSwitchActive).toBe(true);

      // Reset KillSwitch
      await setKillSwitch('all_ai', false);
    });
  });

  // 4. Multi-Instance Readiness Tests (Phase 2.5)
  describe('Phase 2.5 — Multi-Instance Readiness', () => {
    it('persists and reflects KillSwitch state updates consistently', async () => {
      await setKillSwitch('code_studio', true);
      let active = await isKillSwitchActive('code_studio');
      expect(active).toBe(true);

      await setKillSwitch('code_studio', false);
      active = await isKillSwitchActive('code_studio');
      expect(active).toBe(false);
    });

    it('retrieves updated CostGuard settings consistently', async () => {
      await updateCostGuardSettings({ maxDailyUsd: 75.0, notifyAtPercentage: 85 });
      const settings = await getCostGuardSettings();

      expect(settings.maxDailyUsd).toBe(75.0);
      expect(settings.notifyAtPercentage).toBe(85);
    });
  });
});
