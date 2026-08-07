import fs from 'fs';
import path from 'path';
import { db } from '../db';
import {
  phase4DeploymentConfigsTable,
  phase4DeploymentsTable,
  phase4RevisionsTable,
  phase4ReleaseGatesTable,
  phase4HealthChecksTable,
  phase4MigrationHistoryTable,
  phase4IncidentsTable,
  phase4RollbacksTable,
  phase4EnvConfigsTable,
  Phase4DeploymentConfigRow,
  Phase4DeploymentRow,
  Phase4RevisionRow,
  Phase4ReleaseGateRow,
  Phase4HealthCheckRow,
  Phase4MigrationHistoryRow,
  Phase4IncidentRow,
  Phase4RollbackRow,
  Phase4EnvConfigRow,
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface DeploymentConfig {
  tenantId: string;
  provider: string; // cloudrun | vercel | docker | custom
  environment: string; // development | preview | staging | production
  deploymentTarget: string;
  buildSettings: Record<string, any>;
  updatedAt?: Date;
}

export interface DeploymentRecord {
  id: string;
  tenantId: string;
  projectId: string;
  environment: string;
  releaseVersion: string;
  gitSha: string;
  provider: string;
  status: 'NOT_CONFIGURED' | 'DEPLOYING' | 'VERIFYING' | 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'CANCELLED';
  logs: Array<{ timestamp: string; level: string; message: string }>;
  initiatedBy: string;
  startedAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface RevisionRecord {
  id: string;
  tenantId: string;
  projectId: string;
  environment: string;
  revisionId: string;
  gitSha: string;
  imageTag?: string;
  status: string;
  isKnownGood: boolean;
  createdBy: string;
  createdAt: string;
}

export interface ReleaseGateRecord {
  id: string;
  tenantId: string;
  projectId: string;
  environment: string;
  gitSha: string;
  decision: 'GO' | 'NO_GO' | 'NOT_CONFIGURED';
  blockingReasons: string[];
  checks: Record<string, { status: 'PASS' | 'FAIL' | 'WARN' | 'NOT_CONFIGURED'; details?: string }>;
  evaluatedAt: string;
}

export interface HealthCheckRecord {
  id: string;
  tenantId: string;
  projectId: string;
  environment: string;
  endpoint: string;
  status: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'NOT_MEASURED' | 'NOT_CONFIGURED';
  httpCode?: number;
  latencyMs?: number;
  details: Record<string, any>;
  checkedAt: string;
}

export interface MigrationHistoryRecord {
  id: string;
  tenantId: string;
  environment: string;
  migrationName: string;
  isDestructive: boolean;
  actorId: string;
  confirmedBy?: string;
  status: 'APPLIED' | 'BLOCKED' | 'REVERTED' | 'FAILED';
  executedAt: string;
}

export interface IncidentRecord {
  id: string;
  tenantId: string;
  projectId: string;
  environment: string;
  failureCategory:
    | 'BUILD_FAILURE'
    | 'TEST_FAILURE'
    | 'SECURITY_GATE_FAILURE'
    | 'MIGRATION_FAILURE'
    | 'DEPLOYMENT_FAILURE'
    | 'HEALTH_CHECK_FAILURE'
    | 'SMOKE_TEST_FAILURE'
    | 'PROVIDER_FAILURE'
    | 'CONFIGURATION_FAILURE';
  summary: string;
  evidence: Record<string, any>;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'MITIGATED';
  remediation?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface RollbackRecord {
  id: string;
  tenantId: string;
  projectId: string;
  environment: string;
  targetRevisionId: string;
  fromRevisionId: string;
  reason: string;
  initiatedBy: string;
  status: 'EXECUTED' | 'FAILED' | 'REJECTED';
  verificationResult: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'NOT_VERIFIED';
  executedAt: string;
}

export interface EnvConfigRecord {
  id: string;
  tenantId: string;
  environment: string;
  varKey: string;
  status: 'CONFIGURED' | 'MISSING' | 'INVALID_REFERENCE';
  isRequired: boolean;
  updatedAt: string;
}

const STORE_FILE = path.resolve(process.cwd(), '.phase4_store.json');

interface InMemoryPhase4Data {
  configs: Record<string, DeploymentConfig>;
  deployments: DeploymentRecord[];
  revisions: RevisionRecord[];
  releaseGates: ReleaseGateRecord[];
  healthChecks: HealthCheckRecord[];
  migrationHistory: MigrationHistoryRecord[];
  incidents: IncidentRecord[];
  rollbacks: RollbackRecord[];
  envConfigs: EnvConfigRecord[];
}

let inMemoryStore: InMemoryPhase4Data = {
  configs: {},
  deployments: [],
  revisions: [],
  releaseGates: [],
  healthChecks: [],
  migrationHistory: [],
  incidents: [],
  rollbacks: [],
  envConfigs: [],
};

function loadDiskStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, 'utf-8');
      inMemoryStore = JSON.parse(raw);
    }
  } catch (err) {
    // fallback to empty store
  }
}

function saveDiskStore() {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(inMemoryStore, null, 2), 'utf-8');
  } catch (err) {
    // fallback ignore
  }
}

loadDiskStore();

// ── Deployment Configs ───────────────────────────────────────────────────────
export async function getDeploymentConfig(tenantId: string): Promise<DeploymentConfig> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase4DeploymentConfigsTable)
        .where(eq(phase4DeploymentConfigsTable.tenantId, tenantId));
      if (rows.length > 0) {
        return {
          tenantId: rows[0].tenantId,
          provider: rows[0].provider,
          environment: rows[0].environment,
          deploymentTarget: rows[0].deploymentTarget,
          buildSettings: (rows[0].buildSettings as Record<string, any>) || {},
          updatedAt: rows[0].updatedAt,
        };
      }
    } catch (err) {
      // Fallback
    }
  }

  if (!inMemoryStore.configs[tenantId]) {
    inMemoryStore.configs[tenantId] = {
      tenantId,
      provider: process.env.DEPLOYMENT_PROVIDER || 'cloudrun',
      environment: process.env.NODE_ENV || 'production',
      deploymentTarget: 'cloudrun',
      buildSettings: { nodeVersion: '20.x', buildCommand: 'npm run build' },
    };
  }
  return inMemoryStore.configs[tenantId];
}

export async function saveDeploymentConfig(config: DeploymentConfig): Promise<DeploymentConfig> {
  if (db) {
    try {
      await db
        .insert(phase4DeploymentConfigsTable)
        .values({
          tenantId: config.tenantId,
          provider: config.provider,
          environment: config.environment,
          deploymentTarget: config.deploymentTarget,
          buildSettings: config.buildSettings || {},
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: phase4DeploymentConfigsTable.tenantId,
          set: {
            provider: config.provider,
            environment: config.environment,
            deploymentTarget: config.deploymentTarget,
            buildSettings: config.buildSettings || {},
            updatedAt: new Date(),
          },
        });
    } catch (err) {
      // Memory fallback
    }
  }

  inMemoryStore.configs[config.tenantId] = config;
  saveDiskStore();
  return config;
}

// ── Deployments ─────────────────────────────────────────────────────────────
export async function createDeploymentRecord(record: DeploymentRecord): Promise<DeploymentRecord> {
  if (db) {
    try {
      await db.insert(phase4DeploymentsTable).values({
        id: record.id,
        tenantId: record.tenantId,
        projectId: record.projectId,
        environment: record.environment,
        releaseVersion: record.releaseVersion,
        gitSha: record.gitSha,
        provider: record.provider,
        status: record.status,
        logs: record.logs || [],
        initiatedBy: record.initiatedBy,
        startedAt: new Date(record.startedAt),
        completedAt: record.completedAt ? new Date(record.completedAt) : null,
        failureReason: record.failureReason || null,
      });
    } catch (err) {
      // Memory fallback
    }
  }

  inMemoryStore.deployments.unshift(record);
  saveDiskStore();
  return record;
}

export async function updateDeploymentRecord(
  id: string,
  tenantId: string,
  updates: Partial<DeploymentRecord>
): Promise<DeploymentRecord | null> {
  let updatedRecord: DeploymentRecord | null = null;

  if (db) {
    try {
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.logs) dbUpdates.logs = updates.logs;
      if (updates.completedAt) dbUpdates.completedAt = new Date(updates.completedAt);
      if (updates.failureReason) dbUpdates.failureReason = updates.failureReason;

      await db
        .update(phase4DeploymentsTable)
        .set(dbUpdates)
        .where(and(eq(phase4DeploymentsTable.id, id), eq(phase4DeploymentsTable.tenantId, tenantId)));
    } catch (err) {
      // Memory fallback
    }
  }

  const idx = inMemoryStore.deployments.findIndex((d) => d.id === id && d.tenantId === tenantId);
  if (idx !== -1) {
    inMemoryStore.deployments[idx] = { ...inMemoryStore.deployments[idx], ...updates };
    updatedRecord = inMemoryStore.deployments[idx];
    saveDiskStore();
  }
  return updatedRecord;
}

export async function getDeploymentsByTenant(
  tenantId: string,
  environment?: string
): Promise<DeploymentRecord[]> {
  if (db) {
    try {
      const query = db
        .select()
        .from(phase4DeploymentsTable)
        .where(
          environment
            ? and(
                eq(phase4DeploymentsTable.tenantId, tenantId),
                eq(phase4DeploymentsTable.environment, environment)
              )
            : eq(phase4DeploymentsTable.tenantId, tenantId)
        )
        .orderBy(desc(phase4DeploymentsTable.startedAt));
      const rows = await query;
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          tenantId: r.tenantId,
          projectId: r.projectId,
          environment: r.environment,
          releaseVersion: r.releaseVersion,
          gitSha: r.gitSha,
          provider: r.provider,
          status: r.status as any,
          logs: (r.logs as any) || [],
          initiatedBy: r.initiatedBy,
          startedAt: r.startedAt.toISOString(),
          completedAt: r.completedAt ? r.completedAt.toISOString() : undefined,
          failureReason: r.failureReason || undefined,
        }));
      }
    } catch (err) {
      // Memory fallback
    }
  }

  return inMemoryStore.deployments.filter(
    (d) => d.tenantId === tenantId && (!environment || d.environment === environment)
  );
}

// ── Revisions ───────────────────────────────────────────────────────────────
export async function createRevisionRecord(record: RevisionRecord): Promise<RevisionRecord> {
  if (db) {
    try {
      await db.insert(phase4RevisionsTable).values({
        id: record.id,
        tenantId: record.tenantId,
        projectId: record.projectId,
        environment: record.environment,
        revisionId: record.revisionId,
        gitSha: record.gitSha,
        imageTag: record.imageTag || null,
        status: record.status,
        isKnownGood: record.isKnownGood,
        createdBy: record.createdBy,
        createdAt: new Date(record.createdAt),
      });
    } catch (err) {
      // Memory fallback
    }
  }

  inMemoryStore.revisions.unshift(record);
  saveDiskStore();
  return record;
}

export async function getKnownGoodRevision(
  tenantId: string,
  environment: string
): Promise<RevisionRecord | null> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase4RevisionsTable)
        .where(
          and(
            eq(phase4RevisionsTable.tenantId, tenantId),
            eq(phase4RevisionsTable.environment, environment),
            eq(phase4RevisionsTable.isKnownGood, true)
          )
        )
        .orderBy(desc(phase4RevisionsTable.createdAt))
        .limit(1);

      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          tenantId: r.tenantId,
          projectId: r.projectId,
          environment: r.environment,
          revisionId: r.revisionId,
          gitSha: r.gitSha,
          imageTag: r.imageTag || undefined,
          status: r.status,
          isKnownGood: r.isKnownGood,
          createdBy: r.createdBy,
          createdAt: r.createdAt.toISOString(),
        };
      }
    } catch (err) {
      // Memory fallback
    }
  }

  const revs = inMemoryStore.revisions.filter(
    (r) => r.tenantId === tenantId && r.environment === environment && r.isKnownGood
  );
  return revs[0] || null;
}

export async function getAllRevisions(tenantId: string, environment?: string): Promise<RevisionRecord[]> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase4RevisionsTable)
        .where(
          environment
            ? and(
                eq(phase4RevisionsTable.tenantId, tenantId),
                eq(phase4RevisionsTable.environment, environment)
              )
            : eq(phase4RevisionsTable.tenantId, tenantId)
        )
        .orderBy(desc(phase4RevisionsTable.createdAt));
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          tenantId: r.tenantId,
          projectId: r.projectId,
          environment: r.environment,
          revisionId: r.revisionId,
          gitSha: r.gitSha,
          imageTag: r.imageTag || undefined,
          status: r.status,
          isKnownGood: r.isKnownGood,
          createdBy: r.createdBy,
          createdAt: r.createdAt.toISOString(),
        }));
      }
    } catch (err) {
      // Memory fallback
    }
  }

  return inMemoryStore.revisions.filter(
    (r) => r.tenantId === tenantId && (!environment || r.environment === environment)
  );
}

// ── Release Gates ────────────────────────────────────────────────────────────
export async function createReleaseGateRecord(record: ReleaseGateRecord): Promise<ReleaseGateRecord> {
  if (db) {
    try {
      await db.insert(phase4ReleaseGatesTable).values({
        id: record.id,
        tenantId: record.tenantId,
        projectId: record.projectId,
        environment: record.environment,
        gitSha: record.gitSha,
        decision: record.decision,
        blockingReasons: record.blockingReasons || [],
        checks: record.checks || {},
        evaluatedAt: new Date(record.evaluatedAt),
      });
    } catch (err) {
      // Memory fallback
    }
  }

  inMemoryStore.releaseGates.unshift(record);
  saveDiskStore();
  return record;
}

export async function getLatestReleaseGate(
  tenantId: string,
  environment: string
): Promise<ReleaseGateRecord | null> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase4ReleaseGatesTable)
        .where(
          and(
            eq(phase4ReleaseGatesTable.tenantId, tenantId),
            eq(phase4ReleaseGatesTable.environment, environment)
          )
        )
        .orderBy(desc(phase4ReleaseGatesTable.evaluatedAt))
        .limit(1);

      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          tenantId: r.tenantId,
          projectId: r.projectId,
          environment: r.environment,
          gitSha: r.gitSha,
          decision: r.decision as any,
          blockingReasons: (r.blockingReasons as any) || [],
          checks: (r.checks as any) || {},
          evaluatedAt: r.evaluatedAt.toISOString(),
        };
      }
    } catch (err) {
      // Memory fallback
    }
  }

  const gates = inMemoryStore.releaseGates.filter(
    (g) => g.tenantId === tenantId && g.environment === environment
  );
  return gates[0] || null;
}

// ── Health Checks ───────────────────────────────────────────────────────────
export async function createHealthCheckRecord(record: HealthCheckRecord): Promise<HealthCheckRecord> {
  if (db) {
    try {
      await db.insert(phase4HealthChecksTable).values({
        id: record.id,
        tenantId: record.tenantId,
        projectId: record.projectId,
        environment: record.environment,
        endpoint: record.endpoint,
        status: record.status,
        httpCode: record.httpCode || null,
        latencyMs: record.latencyMs || null,
        details: record.details || {},
        checkedAt: new Date(record.checkedAt),
      });
    } catch (err) {
      // Memory fallback
    }
  }

  inMemoryStore.healthChecks.unshift(record);
  saveDiskStore();
  return record;
}

export async function getLatestHealthCheck(
  tenantId: string,
  environment: string
): Promise<HealthCheckRecord | null> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase4HealthChecksTable)
        .where(
          and(
            eq(phase4HealthChecksTable.tenantId, tenantId),
            eq(phase4HealthChecksTable.environment, environment)
          )
        )
        .orderBy(desc(phase4HealthChecksTable.checkedAt))
        .limit(1);

      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          tenantId: r.tenantId,
          projectId: r.projectId,
          environment: r.environment,
          endpoint: r.endpoint,
          status: r.status as any,
          httpCode: r.httpCode || undefined,
          latencyMs: r.latencyMs || undefined,
          details: (r.details as any) || {},
          checkedAt: r.checkedAt.toISOString(),
        };
      }
    } catch (err) {
      // Memory fallback
    }
  }

  const checks = inMemoryStore.healthChecks.filter(
    (h) => h.tenantId === tenantId && h.environment === environment
  );
  return checks[0] || null;
}

// ── Migration History ──────────────────────────────────────────────────────
export async function recordMigrationExecution(record: MigrationHistoryRecord): Promise<MigrationHistoryRecord> {
  if (db) {
    try {
      await db.insert(phase4MigrationHistoryTable).values({
        id: record.id,
        tenantId: record.tenantId,
        environment: record.environment,
        migrationName: record.migrationName,
        isDestructive: record.isDestructive,
        actorId: record.actorId,
        confirmedBy: record.confirmedBy || null,
        status: record.status,
        executedAt: new Date(record.executedAt),
      });
    } catch (err) {
      // Memory fallback
    }
  }

  inMemoryStore.migrationHistory.unshift(record);
  saveDiskStore();
  return record;
}

export async function getMigrationHistory(tenantId: string): Promise<MigrationHistoryRecord[]> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase4MigrationHistoryTable)
        .where(eq(phase4MigrationHistoryTable.tenantId, tenantId))
        .orderBy(desc(phase4MigrationHistoryTable.executedAt));
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          tenantId: r.tenantId,
          environment: r.environment,
          migrationName: r.migrationName,
          isDestructive: r.isDestructive,
          actorId: r.actorId,
          confirmedBy: r.confirmedBy || undefined,
          status: r.status as any,
          executedAt: r.executedAt.toISOString(),
        }));
      }
    } catch (err) {
      // Memory fallback
    }
  }

  return inMemoryStore.migrationHistory.filter((m) => m.tenantId === tenantId);
}

// ── Incidents ───────────────────────────────────────────────────────────────
export async function createIncidentRecord(record: IncidentRecord): Promise<IncidentRecord> {
  if (db) {
    try {
      await db.insert(phase4IncidentsTable).values({
        id: record.id,
        tenantId: record.tenantId,
        projectId: record.projectId,
        environment: record.environment,
        failureCategory: record.failureCategory,
        summary: record.summary,
        evidence: record.evidence || {},
        status: record.status,
        remediation: record.remediation || null,
        createdAt: new Date(record.createdAt),
        resolvedAt: record.resolvedAt ? new Date(record.resolvedAt) : null,
      });
    } catch (err) {
      // Memory fallback
    }
  }

  inMemoryStore.incidents.unshift(record);
  saveDiskStore();
  return record;
}

export async function getIncidentsByTenant(
  tenantId: string,
  environment?: string
): Promise<IncidentRecord[]> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase4IncidentsTable)
        .where(
          environment
            ? and(eq(phase4IncidentsTable.tenantId, tenantId), eq(phase4IncidentsTable.environment, environment))
            : eq(phase4IncidentsTable.tenantId, tenantId)
        )
        .orderBy(desc(phase4IncidentsTable.createdAt));
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          tenantId: r.tenantId,
          projectId: r.projectId,
          environment: r.environment,
          failureCategory: r.failureCategory as any,
          summary: r.summary,
          evidence: (r.evidence as any) || {},
          status: r.status as any,
          remediation: r.remediation || undefined,
          createdAt: r.createdAt.toISOString(),
          resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : undefined,
        }));
      }
    } catch (err) {
      // Memory fallback
    }
  }

  return inMemoryStore.incidents.filter(
    (i) => i.tenantId === tenantId && (!environment || i.environment === environment)
  );
}

// ── Rollbacks ───────────────────────────────────────────────────────────────
export async function createRollbackRecord(record: RollbackRecord): Promise<RollbackRecord> {
  if (db) {
    try {
      await db.insert(phase4RollbacksTable).values({
        id: record.id,
        tenantId: record.tenantId,
        projectId: record.projectId,
        environment: record.environment,
        targetRevisionId: record.targetRevisionId,
        fromRevisionId: record.fromRevisionId,
        reason: record.reason,
        initiatedBy: record.initiatedBy,
        status: record.status,
        verificationResult: record.verificationResult,
        executedAt: new Date(record.executedAt),
      });
    } catch (err) {
      // Memory fallback
    }
  }

  inMemoryStore.rollbacks.unshift(record);
  saveDiskStore();
  return record;
}

export async function getRollbacksByTenant(tenantId: string): Promise<RollbackRecord[]> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase4RollbacksTable)
        .where(eq(phase4RollbacksTable.tenantId, tenantId))
        .orderBy(desc(phase4RollbacksTable.executedAt));
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          tenantId: r.tenantId,
          projectId: r.projectId,
          environment: r.environment,
          targetRevisionId: r.targetRevisionId,
          fromRevisionId: r.fromRevisionId,
          reason: r.reason,
          initiatedBy: r.initiatedBy,
          status: r.status as any,
          verificationResult: r.verificationResult as any,
          executedAt: r.executedAt.toISOString(),
        }));
      }
    } catch (err) {
      // Memory fallback
    }
  }

  return inMemoryStore.rollbacks.filter((r) => r.tenantId === tenantId);
}

// ── Env Configs ─────────────────────────────────────────────────────────────
export async function getEnvConfigsByTenant(
  tenantId: string,
  environment: string
): Promise<EnvConfigRecord[]> {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase4EnvConfigsTable)
        .where(
          and(eq(phase4EnvConfigsTable.tenantId, tenantId), eq(phase4EnvConfigsTable.environment, environment))
        );
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          tenantId: r.tenantId,
          environment: r.environment,
          varKey: r.varKey,
          status: r.status as any,
          isRequired: r.isRequired,
          updatedAt: r.updatedAt.toISOString(),
        }));
      }
    } catch (err) {
      // Memory fallback
    }
  }

  return inMemoryStore.envConfigs.filter(
    (e) => e.tenantId === tenantId && e.environment === environment
  );
}

export async function upsertEnvConfigRecord(record: EnvConfigRecord): Promise<EnvConfigRecord> {
  if (db) {
    try {
      await db
        .insert(phase4EnvConfigsTable)
        .values({
          id: record.id,
          tenantId: record.tenantId,
          environment: record.environment,
          varKey: record.varKey,
          status: record.status,
          isRequired: record.isRequired,
          updatedAt: new Date(record.updatedAt),
        })
        .onConflictDoUpdate({
          target: [
            phase4EnvConfigsTable.tenantId,
            phase4EnvConfigsTable.environment,
            phase4EnvConfigsTable.varKey,
          ],
          set: {
            status: record.status,
            isRequired: record.isRequired,
            updatedAt: new Date(record.updatedAt),
          },
        });
    } catch (err) {
      // Memory fallback
    }
  }

  const existingIdx = inMemoryStore.envConfigs.findIndex(
    (e) => e.tenantId === record.tenantId && e.environment === record.environment && e.varKey === record.varKey
  );
  if (existingIdx !== -1) {
    inMemoryStore.envConfigs[existingIdx] = record;
  } else {
    inMemoryStore.envConfigs.push(record);
  }
  saveDiskStore();
  return record;
}
