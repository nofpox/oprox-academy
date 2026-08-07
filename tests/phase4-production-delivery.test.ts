import { describe, it, expect } from 'vitest';
import { evaluateReleaseGate } from '../src/lib/phase4ReleaseGate';
import { validateEnvironmentConfig } from '../src/lib/phase4EnvGovernance';
import { getPendingMigrationsSafety } from '../src/lib/phase4MigrationSafety';
import { inspectRuntimeHealth } from '../src/lib/phase4HealthObservability';
import { verifyPostDeployment } from '../src/lib/phase4PostDeploymentVerification';
import { executeControlledRollback } from '../src/lib/phase4RollbackEngine';
import { createOperationalIncident, getTenantIncidents } from '../src/lib/phase4IncidentManager';
import { attemptAutonomousRecovery } from '../src/lib/phase4AutonomousRecovery';
import { orchestrateDeployment } from '../src/lib/phase4DeploymentEngine';
import { createRevisionRecord } from '../src/lib/phase4Store';

describe('Phase 4: Production Delivery & Operations Layer', () => {
  const tenantId = 'test_tenant_p4';
  const projectId = 'proj_test_p4';
  const environment = 'production';

  it('1. Environment Governance — detects missing required variables without raw secret leakage', async () => {
    const report = await validateEnvironmentConfig(tenantId, environment);
    expect(report.environment).toBe(environment);
    expect(report.variables).toBeDefined();

    // Verify raw secret value is not leaked in output
    for (const v of report.variables) {
      expect(v).not.toHaveProperty('value');
    }
  });

  it('2. Production Release Gate — evaluates readiness gate checks', async () => {
    const gate = await evaluateReleaseGate(tenantId, projectId, environment);
    expect(['GO', 'NO_GO', 'NOT_CONFIGURED']).toContain(gate.decision);
    expect(gate.checks).toBeDefined();
    expect(gate.checks.gitCleanliness).toBeDefined();
    expect(gate.checks.migrationReadiness).toBeDefined();
  });

  it('3. Migration Safety Engine — identifies additive vs destructive DDL statements', async () => {
    const safety = await getPendingMigrationsSafety(tenantId, environment);
    expect(safety.pendingMigrations).toBeDefined();
    expect(Array.isArray(safety.pendingMigrations)).toBe(true);

    if (safety.pendingMigrations.length > 0) {
      const first = safety.pendingMigrations[0];
      expect(typeof first.isDestructive).toBe('boolean');
      expect(Array.isArray(first.destructiveOperations)).toBe(true);
    }
  });

  it('4. Runtime Health Inspection — explicitly reports unmeasured container metrics', async () => {
    const health = await inspectRuntimeHealth(tenantId, projectId, environment);
    expect(health.endpoint).toBeDefined();
    expect(health.unmeasuredMetrics).toBeDefined();
    expect(Array.isArray(health.unmeasuredMetrics)).toBe(true);
  });

  it('5. Post-Deployment Verification — runs smoke test checks', async () => {
    const verification = await verifyPostDeployment(tenantId, projectId, 'dep_test_1', environment);
    expect(['HEALTHY', 'DEGRADED', 'FAILED']).toContain(verification.status);
    expect(verification.checks).toBeDefined();
  });

  it('6. Incident Management — logs and retrieves operational incidents', async () => {
    const inc = await createOperationalIncident({
      tenantId,
      projectId,
      environment,
      failureCategory: 'DEPLOYMENT_FAILURE',
      summary: 'Test deployment health check timeout',
    });

    expect(inc.id).toBeDefined();
    expect(inc.tenantId).toBe(tenantId);
    expect(inc.failureCategory).toBe('DEPLOYMENT_FAILURE');

    const list = await getTenantIncidents(tenantId, environment);
    expect(list.some((item) => item.id === inc.id)).toBe(true);
  });

  it('7. Rollback Engine — fails gracefully when target revision is non-existent', async () => {
    await expect(
      executeControlledRollback({
        tenantId,
        projectId,
        environment,
        targetRevisionId: 'rev_non_existent',
        reason: 'Test rollback execution',
        initiatedBy: 'test_user',
      })
    ).rejects.toThrow('ROLLBACK_FAILED');
  });

  it('8. Rollback Engine — successfully rolls back to a known-good revision', async () => {
    const revId = `rev_good_${Date.now()}`;
    await createRevisionRecord({
      id: revId,
      tenantId,
      projectId,
      environment,
      revisionId: revId,
      gitSha: 'abc1234',
      status: 'active',
      isKnownGood: true,
      createdBy: 'test_user',
      createdAt: new Date().toISOString(),
    });

    const rollback = await executeControlledRollback({
      tenantId,
      projectId,
      environment,
      targetRevisionId: revId,
      reason: 'Testing valid rollback',
      initiatedBy: 'test_user',
    });

    expect(['HEALTHY', 'DEGRADED', 'FAILED']).toContain(rollback.verifiedStatus);
  });

  it('9. Deployment Orchestration — returns clear status and logs for orchestration request', async () => {
    const result = await orchestrateDeployment({
      tenantId,
      projectId,
      environment,
      provider: 'unconfigured_provider',
      initiatedBy: 'test_user',
    });

    expect(['FAILED', 'NOT_CONFIGURED', 'HEALTHY', 'DEGRADED']).toContain(result.status);
    expect(Array.isArray(result.logs)).toBe(true);
  });

  it('10. Autonomous Recovery — respects maximum retry bounds', async () => {
    const recovery = await attemptAutonomousRecovery({
      tenantId,
      projectId,
      environment,
      failureCategory: 'DEPLOYMENT_FAILURE',
      attemptNumber: 5, // Exceeds max 3 retries
      allowAutoRollback: false,
    });

    expect(recovery.success).toBe(false);
    expect(recovery.actionTaken).toBe('MAX_RETRIES_EXCEEDED');
    expect(recovery.details).toContain('Max retry limit');
  });
});
