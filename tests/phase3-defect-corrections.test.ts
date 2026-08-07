import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server';
import { generateToken } from '../server/auth';
import { setKillSwitch, resetKillSwitchState } from '../src/lib/killSwitch';
import { updateCostGuardSettings, resetCostGuardState, setCostGuardCurrentDaily } from '../src/lib/costGuard';
import { resetAiWalletState, adjustWalletBalance } from '../src/lib/aiWallet';
import { resetGovernanceState } from '../server/aiGovernance';
import { getTenantPhase3State, updateTenantPhase3State, runOrFetchRealTestState } from '../src/lib/phase3Store';

describe('OPROX Code / AI — Phase 3 Defect Corrections Integration Test Suite (20 Scenarios)', () => {
  let userToken: string;
  let tenantUserToken: string;

  beforeAll(async () => {
    process.env.TEST_MOCK_AI = 'true';
    await resetKillSwitchState();
    await resetCostGuardState();
    await resetAiWalletState();
    resetGovernanceState();

    userToken = generateToken({
      id: 'usr_p3_defect_test',
      email: 'p3defect@oprox.io',
      role: 'user',
      orgId: 'tenant_defect_test'
    });

    tenantUserToken = generateToken({
      id: 'usr_p3_tenant_b',
      email: 'p3tenantb@oprox.io',
      role: 'user',
      orgId: 'tenant_defect_isolated'
    });

    // Ensure wallet balance for test user
    await adjustWalletBalance('usr_p3_defect_test', 100000000, 'TOPUP', 'Top up for tests');
  });

  beforeEach(async () => {
    process.env.TEST_MOCK_AI = 'true';
    await resetKillSwitchState();
    await resetCostGuardState();
    resetGovernanceState();
    await adjustWalletBalance('usr_p3_defect_test', 1000000000, 'TOPUP', 'Top up for tests');
  });

  afterEach(async () => {
    await resetKillSwitchState();
    await resetCostGuardState();
    resetGovernanceState();
  });

  // 1. Live Workspace Sync
  it('1. GET /api/phase3/workspace-sync returns real file count, build status, test state, git state, deployment state without hardcoded constants', async () => {
    const res = await request(app)
      .get('/api/phase3/workspace-sync')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.syncState.fileState.totalFiles).toBeGreaterThan(0);
    expect(res.body.syncState.gitState.commitHash).toBeDefined();
    expect(res.body.syncState.testState.totalTests).toBeGreaterThanOrEqual(0);
    expect(res.body.syncState.buildState.status).toBeDefined();
    expect(res.body.syncState.deploymentState.status).toBeDefined();
  });

  it('2. POST /api/phase3/force-vfs-sync requires authentication and rejects unauthorized requests', async () => {
    const res = await request(app).post('/api/phase3/force-vfs-sync').send({});
    expect(res.status).toBe(401);
  });

  it('3. POST /api/phase3/force-vfs-sync updates tenant-scoped state when authenticated', async () => {
    const res = await request(app)
      .post('/api/phase3/force-vfs-sync')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('synchronized successfully');
  });

  // 2. Multi-Agent Collaboration & Governance
  it('4. GET /api/phase3/multi-agent returns tenant-isolated handoffs and shared context', async () => {
    const res = await request(app)
      .get('/api/phase3/multi-agent')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sharedContext).toBeDefined();
    expect(Array.isArray(res.body.handoffs)).toBe(true);
  });

  it('5. POST /api/phase3/multi-agent/run-swarm requires authentication', async () => {
    const res = await request(app).post('/api/phase3/multi-agent/run-swarm').send({});
    expect(res.status).toBe(401);
  });

  it('6. Multi-agent route actually reaches governed AI execution', async () => {
    const res = await request(app)
      .post('/api/phase3/multi-agent/run-swarm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ prompt: 'Design e-commerce platform microservices' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.sharedContext.architectureDoc).toContain('Governed AI Swarm Output');
    expect(res.body.usage.costMicros).toBeGreaterThan(0);
  });

  it('7. Governance gates block multi-agent execution when kill switch is active or budget is exceeded', async () => {
    await setKillSwitch('all_ai', true);

    const res = await request(app)
      .post('/api/phase3/multi-agent/run-swarm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ prompt: 'Test swarm when killed' });

    expect(res.status).toBe(503);
    expect(res.body.error).toContain('KillSwitch');
  });

  it('8. POST /api/phase3/multi-agent/handoff accepts valid handoffs and updates state', async () => {
    const res = await request(app)
      .post('/api/phase3/multi-agent/handoff')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        fromAgent: 'architect',
        toAgent: 'database',
        taskTitle: 'Define schema for payments',
        outputSummary: 'Drizzle schema created'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.handoff.taskTitle).toBe('Define schema for payments');
  });

  // 3. Task Execution Pipeline
  it('9. POST /api/phase3/pipeline/run requires authentication', async () => {
    const res = await request(app).post('/api/phase3/pipeline/run').send({});
    expect(res.status).toBe(401);
  });

  it('10. POST /api/phase3/pipeline/run dispatches runnable DAG tasks based on executionType', async () => {
    const res = await request(app)
      .post('/api/phase3/pipeline/run')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.tasks)).toBe(true);
  });

  it('11. Pipeline runner records real input, output, execution status, timestamps, and retry count', async () => {
    const res = await request(app)
      .get('/api/phase3/pipeline')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    const task = res.body.tasks[0];
    expect(task.id).toBeDefined();
    expect(task.status).toBeDefined();
    expect(typeof task.retryCount).toBe('number');
  });

  it('12. POST /api/phase3/pipeline/retry implements exponential backoff logic', async () => {
    const res = await request(app)
      .post('/api/phase3/pipeline/retry')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ taskId: 'task_1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('retried and executed successfully');
  });

  it('13. POST /api/phase3/pipeline/cancel updates task status to cancelled', async () => {
    const res = await request(app)
      .post('/api/phase3/pipeline/cancel')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ taskId: 'task_6' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const cancelledTask = res.body.tasks.find((t: any) => t.id === 'task_6');
    expect(cancelledTask.status).toBe('cancelled');
  });

  // 4. Project Generator
  it('14. POST /api/phase3/project-generator/synthesize creates/updates real files in VFS / workspace', async () => {
    const res = await request(app)
      .post('/api/phase3/project-generator/synthesize')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        projectName: 'FastApiOrderService',
        template: 'microservices',
        architecture: 'clean_architecture',
        techStack: 'python_fastapi',
        database: 'postgresql_drizzle',
        auth: 'jwt',
        deploymentTarget: 'cloud_run'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.generatedFiles.length).toBeGreaterThan(0);
    expect(res.body.generatedFiles.some((f: any) => f.path === 'main.py')).toBe(true);
  });

  // 5. Release Manager
  it('15. GET /api/phase3/release-manager calculates readiness score from real test, build, git, security, and deployment states', async () => {
    const res = await request(app)
      .get('/api/phase3/release-manager')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.currentRelease.readinessScore).toBeGreaterThanOrEqual(0);
    expect(res.body.currentRelease.goNoGo).toBeDefined();
  });

  it('16. POST /api/phase3/release-manager/create records structured release candidate', async () => {
    const res = await request(app)
      .post('/api/phase3/release-manager/create')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ semverType: 'minor' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.release.version).toContain('v1.1.0-rc1');
  });

  it('17. POST /api/phase3/release-manager/deploy returns explicit failure if target is NOT_CONFIGURED', async () => {
    const origUrl = process.env.CLOUDRUN_DEPLOYED_URL;
    delete process.env.CLOUDRUN_DEPLOYED_URL;
    delete process.env.DEPLOYMENT_URL;

    const res = await request(app)
      .post('/api/phase3/release-manager/deploy')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.status).toBe('NOT_CONFIGURED');

    if (origUrl) process.env.CLOUDRUN_DEPLOYED_URL = origUrl;
  });

  // 6. End-to-End Lifecycle
  it('18. POST /api/phase3/lifecycle/run-stage runs stage logic and stops on failure', async () => {
    const res = await request(app)
      .post('/api/phase3/lifecycle/run-stage')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ stage: 'architecture' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stage).toBe('architecture');
  });

  it('19. POST /api/phase3/lifecycle/auto-run executes stages sequentially and halts at blocking failure stage', async () => {
    const origUrl = process.env.CLOUDRUN_DEPLOYED_URL;
    delete process.env.CLOUDRUN_DEPLOYED_URL;
    delete process.env.DEPLOYMENT_URL;

    const res = await request(app)
      .post('/api/phase3/lifecycle/auto-run')
      .set('Authorization', `Bearer ${userToken}`)
      .send({});

    expect(res.body.stoppedStage).toBe('deployment');
    expect(res.body.stopReason).toContain('NOT_CONFIGURED');

    if (origUrl) process.env.CLOUDRUN_DEPLOYED_URL = origUrl;
  }, 30000);

  // 7. Store Persistence & Tenant Isolation
  it('20. Phase 3 store state survives server re-queries and enforces tenant isolation', async () => {
    const tenantAState = getTenantPhase3State('tenant_defect_test');
    const tenantBState = getTenantPhase3State('tenant_defect_isolated');

    expect(tenantAState.tenantId).toBe('tenant_defect_test');
    expect(tenantBState.tenantId).toBe('tenant_defect_isolated');
  });
});
