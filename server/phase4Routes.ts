import { Router } from 'express';
import { AuthRequest, requireAuth } from './auth';
import { logSecurityAudit } from './audit';
import { isKillSwitchActive } from '../src/lib/killSwitch';
import { orchestrateDeployment } from '../src/lib/phase4DeploymentEngine';
import { evaluateReleaseGate } from '../src/lib/phase4ReleaseGate';
import { validateEnvironmentConfig } from '../src/lib/phase4EnvGovernance';
import { getPendingMigrationsSafety, executeControlledMigration } from '../src/lib/phase4MigrationSafety';
import { inspectRuntimeHealth } from '../src/lib/phase4HealthObservability';
import { executeControlledRollback } from '../src/lib/phase4RollbackEngine';
import { createOperationalIncident, getTenantIncidents } from '../src/lib/phase4IncidentManager';
import { attemptAutonomousRecovery } from '../src/lib/phase4AutonomousRecovery';
import {
  getDeploymentsByTenant,
  getLatestReleaseGate,
  getLatestHealthCheck,
  getAllRevisions,
  getRollbacksByTenant,
} from '../src/lib/phase4Store';

const router = Router();

// Helper to derive tenant context safely from authenticated user
function getAuthenticatedTenant(req: AuthRequest): string {
  if (!req.user || !req.user.id) {
    throw new Error('UNAUTHENTICATED');
  }
  return req.user.orgId || `org_${req.user.id}`;
}

// 1. Deployment Orchestration
router.post('/api/phase4/deployments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const projectId = req.body.projectId || 'proj_oprox_code';

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, {
      action: 'DEPLOYMENT_TRIGGERED',
      tenantId,
      projectId,
      environment: req.body.environment || 'production',
    });

    const result = await orchestrateDeployment({
      tenantId,
      projectId,
      environment: req.body.environment || 'production',
      provider: req.body.provider,
      initiatedBy: req.user!.id,
      actorRole: req.user!.role,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Deployment orchestration failed.' });
  }
});

router.get('/api/phase4/deployments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const environment = req.query.environment as string | undefined;
    const deployments = await getDeploymentsByTenant(tenantId, environment);
    res.json({ deployments });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to fetch deployments.' });
  }
});

// 2. Production Release Gate
router.post('/api/phase4/release-gate/evaluate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const projectId = req.body.projectId || 'proj_oprox_code';
    const environment = req.body.environment || 'production';

    const decision = await evaluateReleaseGate(tenantId, projectId, environment);
    res.json(decision);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Release gate evaluation failed.' });
  }
});

router.get('/api/phase4/release-gate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const environment = (req.query.environment as string) || 'production';
    const latest = await getLatestReleaseGate(tenantId, environment);
    res.json({ releaseGate: latest || null });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to fetch release gate decision.' });
  }
});

// 3. Environment & Secret Governance
router.get('/api/phase4/env/validate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const environment = (req.query.environment as string) || 'production';
    const report = await validateEnvironmentConfig(tenantId, environment);
    res.json(report);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Environment validation failed.' });
  }
});

// 4. Runtime Health & Observability
router.get('/api/phase4/health/inspect', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const projectId = (req.query.projectId as string) || 'proj_oprox_code';
    const environment = (req.query.environment as string) || 'production';

    const health = await inspectRuntimeHealth(tenantId, projectId, environment);
    res.json(health);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Runtime health inspection failed.' });
  }
});

// 5. Database Migration Safety
router.get('/api/phase4/migrations/safety', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const environment = (req.query.environment as string) || 'production';
    const safetyReport = await getPendingMigrationsSafety(tenantId, environment);
    res.json(safetyReport);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to inspect migration safety.' });
  }
});

router.post('/api/phase4/migrations/execute', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, {
      action: 'MIGRATION_EXECUTION_ATTEMPT',
      tenantId,
      migrationName: req.body.migrationName,
    });

    const result = await executeControlledMigration({
      tenantId,
      environment: req.body.environment || 'production',
      migrationName: req.body.migrationName,
      actorId: req.user!.id,
      confirmedBy: req.body.confirmedBy,
      actorRole: req.user!.role,
    });

    res.json({ success: true, migration: result });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Migration execution failed.' });
  }
});

// 6. Safe Rollback Engine
router.post('/api/phase4/rollback/execute', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, {
      action: 'ROLLBACK_TRIGGERED',
      tenantId,
      targetRevisionId: req.body.targetRevisionId,
      reason: req.body.reason,
    });

    const result = await executeControlledRollback({
      tenantId,
      projectId: req.body.projectId || 'proj_oprox_code',
      environment: req.body.environment || 'production',
      targetRevisionId: req.body.targetRevisionId,
      reason: req.body.reason || 'Manual administrative rollback',
      initiatedBy: req.user!.id,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Rollback execution failed.' });
  }
});

router.get('/api/phase4/revisions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const environment = req.query.environment as string | undefined;
    const revisions = await getAllRevisions(tenantId, environment);
    res.json({ revisions });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to fetch revisions.' });
  }
});

// 7. Incident Management
router.get('/api/phase4/incidents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const environment = req.query.environment as string | undefined;
    const incidents = await getTenantIncidents(tenantId, environment);
    res.json({ incidents });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to fetch incidents.' });
  }
});

router.post('/api/phase4/incidents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const incident = await createOperationalIncident({
      tenantId,
      projectId: req.body.projectId || 'proj_oprox_code',
      environment: req.body.environment || 'production',
      failureCategory: req.body.failureCategory || 'DEPLOYMENT_FAILURE',
      summary: req.body.summary,
      evidence: req.body.evidence,
      remediation: req.body.remediation,
    });
    res.json({ success: true, incident });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create incident.' });
  }
});

// 8. Autonomous Recovery
router.post('/api/phase4/recovery/attempt', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, {
      action: 'AUTONOMOUS_RECOVERY_ATTEMPT',
      tenantId,
      failureCategory: req.body.failureCategory,
    });

    const result = await attemptAutonomousRecovery({
      tenantId,
      projectId: req.body.projectId || 'proj_oprox_code',
      environment: req.body.environment || 'production',
      failureCategory: req.body.failureCategory || 'DEPLOYMENT_FAILURE',
      attemptNumber: req.body.attemptNumber || 1,
      allowAutoRollback: req.body.allowAutoRollback ?? false,
      actorRole: req.user!.role,
    });

    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Autonomous recovery attempt failed.' });
  }
});

export default router;
