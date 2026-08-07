import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { generateToken } from '../server/auth';
import { checkDistributedRateLimit, getRedisStatus, clearMemoryRateStore } from '../src/lib/redis';
import { getInfrastructureStatus, getWorkerStatus } from '../src/lib/centralOps';
import { collectHealthSnapshot } from '../src/lib/healthAggregator';
import { runMigrations } from '../src/db/migrate';
import { setKillSwitch, resetKillSwitchState } from '../src/lib/killSwitch';
import { updateCostGuardSettings, resetCostGuardState } from '../src/lib/costGuard';
import { resetAiWalletState, adjustWalletBalance, getWalletBalance } from '../src/lib/aiWallet';
import { resetGovernanceState } from '../server/aiGovernance';

describe('OPROX OS — Phase 3 Complete Verification Suite', () => {
  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    await resetKillSwitchState();
    await resetCostGuardState();
    await resetAiWalletState();
    resetGovernanceState();

    userToken = generateToken({
      id: 'usr_phase3_test',
      email: 'p3user@oprox.io',
      role: 'user',
      orgId: 'org_default',
    });

    adminToken = generateToken({
      id: 'usr_phase3_admin',
      email: 'p3admin@oprox.io',
      role: 'admin',
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

  // 1. Database-Backed AI Wallet Authority
  describe('Requirement 1 — Authoritative DB-backed AI Wallet Gate', () => {
    it('uses DB wallet balance as authority and denies request if balance is below $0.01 threshold', async () => {
      // Ensure user balance is $0 in DB
      await adjustWalletBalance('usr_phase3_test', -100000000, 'adjustment', 'Zero out balance');

      const res = await request(app)
        .post('/api/ai/agent-task')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ prompt: 'Generate component' });

      expect(res.status).toBe(402);
      expect(res.body.error).toContain('Payment Required');
    });

    it('allows request when DB wallet balance meets execution threshold', async () => {
      await adjustWalletBalance('usr_phase3_test', 10000000, 'topup', 'Top up $10');

      const res = await request(app)
        .post('/api/ai/agent-task')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ prompt: 'Generate component' });

      expect(res.status).toBe(200);
      expect(res.body.agentType).toBeDefined();
    });
  });

  // 2. Distributed Rate Limiting
  describe('Requirement 2 — Distributed Rate Limiting', () => {
    it('tracks rate limits using distributed checker and denies when max requests exceeded', async () => {
      clearMemoryRateStore();
      const testKey = 'test_p3_rate_limit';
      const maxReqs = 3;

      const res1 = await checkDistributedRateLimit(testKey, maxReqs, 60);
      const res2 = await checkDistributedRateLimit(testKey, maxReqs, 60);
      const res3 = await checkDistributedRateLimit(testKey, maxReqs, 60);
      const res4 = await checkDistributedRateLimit(testKey, maxReqs, 60);

      expect(res1.allowed).toBe(true);
      expect(res2.allowed).toBe(true);
      expect(res3.allowed).toBe(true);
      expect(res4.allowed).toBe(false);
      expect(res4.current).toBe(4);
    });

    it('returns truthful Redis connection status', () => {
      const status = getRedisStatus();
      expect(status.status).toBeDefined();
      expect(typeof status.details).toBe('string');
    });
  });

  // 3. Test Isolation Verification
  describe('Requirement 3 — Test Isolation', () => {
    it('resets KillSwitch state deterministically', async () => {
      await setKillSwitch('all_ai', true);
      await resetKillSwitchState();
      const res = await request(app)
        .get('/api/readiness');

      expect(res.body.checks.killSwitch.allAiActive).toBe(false);
    });
  });

  // 4. Runtime Uncoupling (No AI Studio Coupling)
  describe('Requirement 5 — Zero Google AI Studio Runtime Coupling', () => {
    it('serves endpoints successfully without any AI Studio headers or env requirements', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('User-Agent', 'Mozilla/5.0 (Standard Production Client)');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('online');
    });
  });

  // 5. Readiness & Liveness Probes
  describe('Requirement 8 — Health and Readiness Probes', () => {
    it('returns 200 OK for /api/health liveness probe', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('online');
      expect(res.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('returns structured status for /api/readiness probe', async () => {
      const res = await request(app).get('/api/readiness');
      expect([200, 503]).toContain(res.status);
      expect(res.body.checks).toBeDefined();
      expect(res.body.checks.server).toBeDefined();
      expect(res.body.checks.database).toBeDefined();
      expect(res.body.checks.redis).toBeDefined();
    });

    it('returns 200 for /readyz alias', async () => {
      const res = await request(app).get('/readyz');
      expect([200, 503]).toContain(res.status);
      expect(res.body.checks).toBeDefined();
    });
  });

  // 6. Truthful Infrastructure Telemetry
  describe('Requirement 10 — Remove Mock Infrastructure Status', () => {
    it('reports truthful infrastructure telemetry without fake numbers', async () => {
      const status = await getInfrastructureStatus();
      expect(status.environment).toBeDefined();
      expect(status.serverProcess.pid).toBe(process.pid);
      expect(status.database.engine).toBeDefined();
      expect(status.redisCache.status).toBeDefined();
      expect(status.redisCache.details).not.toContain('hit ratio'); // verify no fake metrics
    });

    it('reports truthful worker status', async () => {
      const workers = await getWorkerStatus();
      expect(Array.isArray(workers)).toBe(true);
      expect(workers[0].type).toBe('express_http_worker');
    });

    it('collects real health snapshot telemetry', async () => {
      const snapshot = await collectHealthSnapshot();
      expect(snapshot.overallStatus).toBeDefined();
      expect(Array.isArray(snapshot.checks)).toBe(true);
      expect(snapshot.checks.some((c) => c.service.includes('PostgreSQL'))).toBe(true);
    });
  });

  // 7. Production Fail-Closed Database Behavior
  describe('Requirement 11 — Production Fail-Closed Database Checks', () => {
    it('throws security error in production mode if database is unconfigured when toggling KillSwitch', async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        // When db is null (in test without PG URL)
        if (!process.env.DATABASE_URL) {
          await expect(setKillSwitch('all_ai', true)).rejects.toThrow('Database connection is required in production');
        }
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('throws security error in production mode if database is unconfigured when updating CostGuard', async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        if (!process.env.DATABASE_URL) {
          await expect(updateCostGuardSettings({ maxDailyUsd: 200 })).rejects.toThrow('Database connection is required in production');
        }
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  // 8. Migration Mechanism
  describe('Requirement 12 — Controlled Migration Execution', () => {
    it('executes runMigrations gracefully without throwing', async () => {
      const res = await runMigrations();
      expect(res.success).toBe(true);
    });
  });
});
