import { db } from '../db';
import {
  phase6RepositoryConnectionsTable,
  phase6RepositoryBranchesTable,
  phase6CommitProvenanceTable,
  phase6CiPipelineDefinitionsTable,
  phase6CiPipelineRunsTable,
  phase6BuildArtifactsTable,
  phase6DevEnvironmentsTable,
  phase6PreviewEnvironmentsTable,
  phase6ProviderEventsTable,
  phase6OperationLocksTable,
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logStructured } from './logger';

// In-memory fallback stores for unit testing / non-Postgres environments
const memoryRepoConnections: any[] = [];
const memoryBranches: any[] = [];
const memoryCommitProvenance: any[] = [];
const memoryCiDefinitions: any[] = [];
const memoryCiRuns: any[] = [];
const memoryBuildArtifacts: any[] = [];
const memoryDevEnvironments: any[] = [];
const memoryPreviewEnvironments: any[] = [];
const memoryProviderEvents: any[] = [];
const memoryOperationLocks: Map<string, any> = new Map();

export function clearPhase6MemoryStore(): void {
  memoryRepoConnections.length = 0;
  memoryBranches.length = 0;
  memoryCommitProvenance.length = 0;
  memoryCiDefinitions.length = 0;
  memoryCiRuns.length = 0;
  memoryBuildArtifacts.length = 0;
  memoryDevEnvironments.length = 0;
  memoryPreviewEnvironments.length = 0;
  memoryProviderEvents.length = 0;
  memoryOperationLocks.clear();
}

// ── Repository Connections ──────────────────────────────────────────────────
export async function createRepoConnectionInStore(data: {
  id: string;
  tenantId: string;
  orgId: string;
  projectId?: string;
  provider: string;
  repoIdentifier: string;
  repoOwner: string;
  defaultBranch?: string;
  connectionStatus?: string;
  accountRef?: string;
  createdBy: string;
}) {
  const row = {
    id: data.id,
    tenantId: data.tenantId,
    orgId: data.orgId,
    projectId: data.projectId || null,
    provider: data.provider,
    repoIdentifier: data.repoIdentifier,
    repoOwner: data.repoOwner,
    defaultBranch: data.defaultBranch || 'main',
    connectionStatus: data.connectionStatus || 'CONFIGURED',
    accountRef: data.accountRef || null,
    createdBy: data.createdBy,
    createdAt: new Date(),
    lastVerifiedAt: new Date(),
  };

  memoryRepoConnections.push(row);
  if (db) {
    try {
      await db.insert(phase6RepositoryConnectionsTable).values(row as any);
    } catch (err: any) {
      logStructured('warn', 'Failed DB insert for repo connection', { error: err?.message });
    }
  }
  return row;
}

export async function getRepoConnectionsFromStore(tenantId: string, projectId?: string) {
  if (db) {
    try {
      const conditions = [eq(phase6RepositoryConnectionsTable.tenantId, tenantId)];
      if (projectId) {
        conditions.push(eq(phase6RepositoryConnectionsTable.projectId, projectId));
      }
      const res = await db.select().from(phase6RepositoryConnectionsTable).where(and(...conditions));
      if (res.length > 0) return res;
    } catch (err: any) {
      logStructured('warn', 'DB select failed for repo connections', { error: err?.message });
    }
  }

  return memoryRepoConnections.filter(c => c.tenantId === tenantId && (!projectId || c.projectId === projectId));
}

export async function getRepoConnectionByIdFromStore(id: string, tenantId: string) {
  if (db) {
    try {
      const res = await db.select().from(phase6RepositoryConnectionsTable).where(
        and(eq(phase6RepositoryConnectionsTable.id, id), eq(phase6RepositoryConnectionsTable.tenantId, tenantId))
      );
      if (res.length > 0) return res[0];
    } catch (err: any) {
      logStructured('warn', 'DB select failed for repo connection by id', { error: err?.message });
    }
  }
  return memoryRepoConnections.find(c => c.id === id && c.tenantId === tenantId) || null;
}

export async function deleteRepoConnectionInStore(id: string, tenantId: string) {
  const idx = memoryRepoConnections.findIndex(c => c.id === id && c.tenantId === tenantId);
  if (idx !== -1) memoryRepoConnections.splice(idx, 1);

  if (db) {
    try {
      await db.delete(phase6RepositoryConnectionsTable).where(
        and(eq(phase6RepositoryConnectionsTable.id, id), eq(phase6RepositoryConnectionsTable.tenantId, tenantId))
      );
    } catch (err: any) {
      logStructured('warn', 'DB delete failed for repo connection', { error: err?.message });
    }
  }
  return true;
}

// ── Repository Branches ─────────────────────────────────────────────────────
export async function createBranchInStore(data: {
  id: string;
  tenantId: string;
  projectId?: string;
  repoId: string;
  name: string;
  type?: string;
  ownerId: string;
  originatingTaskId?: string;
  changeRequestId?: string;
  baseSha: string;
  headSha: string;
  status?: string;
}) {
  const row = {
    id: data.id,
    tenantId: data.tenantId,
    projectId: data.projectId || null,
    repoId: data.repoId,
    name: data.name,
    type: data.type || 'feature',
    ownerId: data.ownerId,
    originatingTaskId: data.originatingTaskId || null,
    changeRequestId: data.changeRequestId || null,
    baseSha: data.baseSha,
    headSha: data.headSha,
    status: data.status || 'active',
    createdAt: new Date(),
  };

  memoryBranches.push(row);
  if (db) {
    try {
      await db.insert(phase6RepositoryBranchesTable).values(row as any);
    } catch (err: any) {
      logStructured('warn', 'DB insert failed for branch', { error: err?.message });
    }
  }
  return row;
}

export async function getBranchesFromStore(tenantId: string, repoId: string) {
  if (db) {
    try {
      const res = await db.select().from(phase6RepositoryBranchesTable).where(
        and(eq(phase6RepositoryBranchesTable.tenantId, tenantId), eq(phase6RepositoryBranchesTable.repoId, repoId))
      );
      if (res.length > 0) return res;
    } catch (err: any) {
      logStructured('warn', 'DB select failed for branches', { error: err?.message });
    }
  }
  return memoryBranches.filter(b => b.tenantId === tenantId && b.repoId === repoId);
}

export async function getBranchByNameFromStore(tenantId: string, repoId: string, name: string) {
  if (db) {
    try {
      const res = await db.select().from(phase6RepositoryBranchesTable).where(
        and(
          eq(phase6RepositoryBranchesTable.tenantId, tenantId),
          eq(phase6RepositoryBranchesTable.repoId, repoId),
          eq(phase6RepositoryBranchesTable.name, name)
        )
      );
      if (res.length > 0) return res[0];
    } catch (err: any) {
      logStructured('warn', 'DB select failed for branch by name', { error: err?.message });
    }
  }
  return memoryBranches.find(b => b.tenantId === tenantId && b.repoId === repoId && b.name === name) || null;
}

export async function updateBranchHeadShaInStore(tenantId: string, repoId: string, name: string, newHeadSha: string) {
  const branch = memoryBranches.find(b => b.tenantId === tenantId && b.repoId === repoId && b.name === name);
  if (branch) branch.headSha = newHeadSha;

  if (db) {
    try {
      await db.update(phase6RepositoryBranchesTable)
        .set({ headSha: newHeadSha })
        .where(
          and(
            eq(phase6RepositoryBranchesTable.tenantId, tenantId),
            eq(phase6RepositoryBranchesTable.repoId, repoId),
            eq(phase6RepositoryBranchesTable.name, name)
          )
        );
    } catch (err: any) {
      logStructured('warn', 'DB update failed for branch head sha', { error: err?.message });
    }
  }
}

// ── Commit Provenance ───────────────────────────────────────────────────────
export async function createCommitProvenanceInStore(data: {
  id: string;
  tenantId: string;
  repoId: string;
  commitSha: string;
  authorType?: string;
  authorId: string;
  requirementId?: string;
  aiTaskId?: string;
  agentId?: string;
  workspaceId?: string;
  branchName: string;
  changeRequestId?: string;
  riskLevel?: string;
  testStatus?: string;
  securityReviewStatus?: string;
  approvalStatus?: string;
  aiCostUsd?: string | number;
}) {
  const row = {
    id: data.id,
    tenantId: data.tenantId,
    repoId: data.repoId,
    commitSha: data.commitSha,
    authorType: data.authorType || 'human',
    authorId: data.authorId,
    requirementId: data.requirementId || null,
    aiTaskId: data.aiTaskId || null,
    agentId: data.agentId || null,
    workspaceId: data.workspaceId || null,
    branchName: data.branchName,
    changeRequestId: data.changeRequestId || null,
    riskLevel: data.riskLevel || 'LOW',
    testStatus: data.testStatus || 'NOT_RUN',
    securityReviewStatus: data.securityReviewStatus || 'PASSED',
    approvalStatus: data.approvalStatus || 'APPROVED',
    aiCostUsd: String(data.aiCostUsd || '0.0000'),
    createdAt: new Date(),
  };

  memoryCommitProvenance.push(row);
  if (db) {
    try {
      await db.insert(phase6CommitProvenanceTable).values(row as any);
    } catch (err: any) {
      logStructured('warn', 'DB insert failed for commit provenance', { error: err?.message });
    }
  }
  return row;
}

export async function getCommitProvenanceByShaFromStore(tenantId: string, commitSha: string) {
  if (db) {
    try {
      const res = await db.select().from(phase6CommitProvenanceTable).where(
        and(eq(phase6CommitProvenanceTable.tenantId, tenantId), eq(phase6CommitProvenanceTable.commitSha, commitSha))
      );
      if (res.length > 0) return res[0];
    } catch (err: any) {
      logStructured('warn', 'DB select failed for commit provenance by sha', { error: err?.message });
    }
  }
  return memoryCommitProvenance.find(c => c.tenantId === tenantId && c.commitSha === commitSha) || null;
}

export async function getCommitProvenanceForRepoFromStore(tenantId: string, repoId: string) {
  if (db) {
    try {
      const res = await db.select().from(phase6CommitProvenanceTable).where(
        and(eq(phase6CommitProvenanceTable.tenantId, tenantId), eq(phase6CommitProvenanceTable.repoId, repoId))
      );
      if (res.length > 0) return res;
    } catch (err: any) {
      logStructured('warn', 'DB select failed for commit provenance by repo', { error: err?.message });
    }
  }
  return memoryCommitProvenance.filter(c => c.tenantId === tenantId && c.repoId === repoId);
}

// ── CI Pipelines & Runs ─────────────────────────────────────────────────────
export async function createCiPipelineDefinitionInStore(data: {
  id: string;
  tenantId: string;
  projectId?: string;
  name: string;
  stages: any[];
  allowlistedCommands: string[];
}) {
  const row = {
    id: data.id,
    tenantId: data.tenantId,
    projectId: data.projectId || null,
    name: data.name,
    stages: data.stages,
    allowlistedCommands: data.allowlistedCommands,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryCiDefinitions.push(row);
  if (db) {
    try {
      await db.insert(phase6CiPipelineDefinitionsTable).values(row as any);
    } catch (err: any) {
      logStructured('warn', 'DB insert failed for CI pipeline definition', { error: err?.message });
    }
  }
  return row;
}

export async function getCiPipelineDefinitionsFromStore(tenantId: string) {
  if (db) {
    try {
      const res = await db.select().from(phase6CiPipelineDefinitionsTable).where(
        eq(phase6CiPipelineDefinitionsTable.tenantId, tenantId)
      );
      if (res.length > 0) return res;
    } catch (err: any) {
      logStructured('warn', 'DB select failed for CI pipeline definitions', { error: err?.message });
    }
  }
  return memoryCiDefinitions.filter(d => d.tenantId === tenantId);
}

export async function createCiPipelineRunInStore(data: {
  id: string;
  tenantId: string;
  projectId?: string;
  repoId: string;
  pipelineId: string;
  commitSha: string;
  branchName: string;
  trigger?: string;
  status?: string;
  stageResults?: any[];
  durationMs?: number;
  artifacts?: any[];
  failureEvidence?: any;
}) {
  const row = {
    id: data.id,
    tenantId: data.tenantId,
    projectId: data.projectId || null,
    repoId: data.repoId,
    pipelineId: data.pipelineId,
    commitSha: data.commitSha,
    branchName: data.branchName,
    trigger: data.trigger || 'manual',
    status: data.status || 'PENDING',
    stageResults: data.stageResults || [],
    durationMs: data.durationMs || 0,
    artifacts: data.artifacts || [],
    failureEvidence: data.failureEvidence || {},
    createdAt: new Date(),
    finishedAt: data.status === 'PASSED' || data.status === 'FAILED' ? new Date() : null,
  };

  memoryCiRuns.push(row);
  if (db) {
    try {
      await db.insert(phase6CiPipelineRunsTable).values(row as any);
    } catch (err: any) {
      logStructured('warn', 'DB insert failed for CI run', { error: err?.message });
    }
  }
  return row;
}

export async function updateCiPipelineRunInStore(id: string, tenantId: string, update: Partial<{
  status: string;
  stageResults: any[];
  durationMs: number;
  artifacts: any[];
  failureEvidence: any;
  finishedAt: Date;
}>) {
  const run = memoryCiRuns.find(r => r.id === id && r.tenantId === tenantId);
  if (run) Object.assign(run, update);

  if (db) {
    try {
      await db.update(phase6CiPipelineRunsTable)
        .set(update as any)
        .where(
          and(eq(phase6CiPipelineRunsTable.id, id), eq(phase6CiPipelineRunsTable.tenantId, tenantId))
        );
    } catch (err: any) {
      logStructured('warn', 'DB update failed for CI run', { error: err?.message });
    }
  }
}

export async function getCiPipelineRunsFromStore(tenantId: string, repoId?: string) {
  if (db) {
    try {
      const conditions = [eq(phase6CiPipelineRunsTable.tenantId, tenantId)];
      if (repoId) conditions.push(eq(phase6CiPipelineRunsTable.repoId, repoId));
      const res = await db.select().from(phase6CiPipelineRunsTable).where(and(...conditions)).orderBy(desc(phase6CiPipelineRunsTable.createdAt));
      if (res.length > 0) return res;
    } catch (err: any) {
      logStructured('warn', 'DB select failed for CI runs', { error: err?.message });
    }
  }
  return memoryCiRuns.filter(r => r.tenantId === tenantId && (!repoId || r.repoId === repoId));
}

export async function getCiPipelineRunByIdFromStore(id: string, tenantId: string) {
  if (db) {
    try {
      const res = await db.select().from(phase6CiPipelineRunsTable).where(
        and(eq(phase6CiPipelineRunsTable.id, id), eq(phase6CiPipelineRunsTable.tenantId, tenantId))
      );
      if (res.length > 0) return res[0];
    } catch (err: any) {
      logStructured('warn', 'DB select failed for CI run by id', { error: err?.message });
    }
  }
  return memoryCiRuns.find(r => r.id === id && r.tenantId === tenantId) || null;
}

// ── Build Artifacts ─────────────────────────────────────────────────────────
export async function createBuildArtifactInStore(data: {
  id: string;
  tenantId: string;
  projectId?: string;
  repoId: string;
  pipelineRunId: string;
  commitSha: string;
  artifactType: string;
  name: string;
  checksumSha256: string;
  sizeBytes: number;
  storageRef: string;
}) {
  const row = {
    id: data.id,
    tenantId: data.tenantId,
    projectId: data.projectId || null,
    repoId: data.repoId,
    pipelineRunId: data.pipelineRunId,
    commitSha: data.commitSha,
    artifactType: data.artifactType,
    name: data.name,
    checksumSha256: data.checksumSha256,
    sizeBytes: data.sizeBytes,
    storageRef: data.storageRef,
    createdAt: new Date(),
  };

  memoryBuildArtifacts.push(row);
  if (db) {
    try {
      await db.insert(phase6BuildArtifactsTable).values(row as any);
    } catch (err: any) {
      logStructured('warn', 'DB insert failed for build artifact', { error: err?.message });
    }
  }
  return row;
}

export async function getBuildArtifactsFromStore(tenantId: string, commitSha?: string) {
  if (db) {
    try {
      const conditions = [eq(phase6BuildArtifactsTable.tenantId, tenantId)];
      if (commitSha) conditions.push(eq(phase6BuildArtifactsTable.commitSha, commitSha));
      const res = await db.select().from(phase6BuildArtifactsTable).where(and(...conditions));
      if (res.length > 0) return res;
    } catch (err: any) {
      logStructured('warn', 'DB select failed for build artifacts', { error: err?.message });
    }
  }
  return memoryBuildArtifacts.filter(a => a.tenantId === tenantId && (!commitSha || a.commitSha === commitSha));
}

// ── Dev Environments & Preview Environments ───────────────────────────────
export async function createDevEnvironmentInStore(data: {
  id: string;
  tenantId: string;
  projectId?: string;
  name: string;
  branchName: string;
  commitSha: string;
  provider?: string;
  status?: string;
  resourceRef?: string;
  createdBy: string;
  expiresAt?: Date;
}) {
  const row = {
    id: data.id,
    tenantId: data.tenantId,
    projectId: data.projectId || null,
    name: data.name,
    branchName: data.branchName,
    commitSha: data.commitSha,
    provider: data.provider || 'local_runner',
    status: data.status || 'REQUESTED',
    resourceRef: data.resourceRef || null,
    createdBy: data.createdBy,
    createdAt: new Date(),
    expiresAt: data.expiresAt || new Date(Date.now() + 3600 * 1000 * 24),
  };

  memoryDevEnvironments.push(row);
  if (db) {
    try {
      await db.insert(phase6DevEnvironmentsTable).values(row as any);
    } catch (err: any) {
      logStructured('warn', 'DB insert failed for dev environment', { error: err?.message });
    }
  }
  return row;
}

export async function getDevEnvironmentsFromStore(tenantId: string) {
  if (db) {
    try {
      const res = await db.select().from(phase6DevEnvironmentsTable).where(
        eq(phase6DevEnvironmentsTable.tenantId, tenantId)
      );
      if (res.length > 0) return res;
    } catch (err: any) {
      logStructured('warn', 'DB select failed for dev environments', { error: err?.message });
    }
  }
  return memoryDevEnvironments.filter(e => e.tenantId === tenantId);
}

export async function updateDevEnvironmentStatusInStore(id: string, tenantId: string, status: string) {
  const env = memoryDevEnvironments.find(e => e.id === id && e.tenantId === tenantId);
  if (env) env.status = status;

  if (db) {
    try {
      await db.update(phase6DevEnvironmentsTable)
        .set({ status })
        .where(
          and(eq(phase6DevEnvironmentsTable.id, id), eq(phase6DevEnvironmentsTable.tenantId, tenantId))
        );
    } catch (err: any) {
      logStructured('warn', 'DB update failed for dev environment status', { error: err?.message });
    }
  }
}

export async function createPreviewEnvironmentInStore(data: {
  id: string;
  tenantId: string;
  projectId?: string;
  changeRequestId: string;
  commitSha: string;
  previewUrl?: string;
  status?: string;
  healthStatus?: string;
  createdBy: string;
  expiresAt?: Date;
}) {
  const row = {
    id: data.id,
    tenantId: data.tenantId,
    projectId: data.projectId || null,
    changeRequestId: data.changeRequestId,
    commitSha: data.commitSha,
    previewUrl: data.previewUrl || null,
    status: data.status || 'REQUESTED',
    healthStatus: data.healthStatus || 'UNKNOWN',
    createdBy: data.createdBy,
    createdAt: new Date(),
    expiresAt: data.expiresAt || new Date(Date.now() + 3600 * 1000 * 48),
  };

  memoryPreviewEnvironments.push(row);
  if (db) {
    try {
      await db.insert(phase6PreviewEnvironmentsTable).values(row as any);
    } catch (err: any) {
      logStructured('warn', 'DB insert failed for preview environment', { error: err?.message });
    }
  }
  return row;
}

export async function getPreviewEnvironmentsFromStore(tenantId: string, changeRequestId?: string) {
  if (db) {
    try {
      const conditions = [eq(phase6PreviewEnvironmentsTable.tenantId, tenantId)];
      if (changeRequestId) conditions.push(eq(phase6PreviewEnvironmentsTable.changeRequestId, changeRequestId));
      const res = await db.select().from(phase6PreviewEnvironmentsTable).where(and(...conditions));
      if (res.length > 0) return res;
    } catch (err: any) {
      logStructured('warn', 'DB select failed for preview environments', { error: err?.message });
    }
  }
  return memoryPreviewEnvironments.filter(e => e.tenantId === tenantId && (!changeRequestId || e.changeRequestId === changeRequestId));
}

// ── Provider Events & Operation Locks ────────────────────────────────────────
export async function createProviderEventInStore(data: {
  id: string;
  tenantId: string;
  provider: string;
  eventType: string;
  repoIdentifier: string;
  payload: any;
  signatureVerified: boolean;
}) {
  const row = {
    id: data.id,
    tenantId: data.tenantId,
    provider: data.provider,
    eventType: data.eventType,
    repoIdentifier: data.repoIdentifier,
    payload: data.payload,
    signatureVerified: data.signatureVerified,
    processed: false,
    createdAt: new Date(),
  };

  memoryProviderEvents.push(row);
  if (db) {
    try {
      await db.insert(phase6ProviderEventsTable).values(row as any);
    } catch (err: any) {
      logStructured('warn', 'DB insert failed for provider event', { error: err?.message });
    }
  }
  return row;
}

export async function acquireOperationLockInStore(tenantId: string, lockKey: string, lockedBy: string, ttlMs: number = 30000): Promise<boolean> {
  const key = `${tenantId}:${lockKey}`;
  const now = Date.now();
  const existing = memoryOperationLocks.get(key);

  if (existing && existing.expiresAt > now) {
    return false; // lock held
  }

  const expiresAt = now + ttlMs;
  memoryOperationLocks.set(key, { tenantId, lockKey, lockedBy, expiresAt });
  return true;
}

export async function releaseOperationLockInStore(tenantId: string, lockKey: string, lockedBy: string): Promise<boolean> {
  const key = `${tenantId}:${lockKey}`;
  const existing = memoryOperationLocks.get(key);
  if (existing && existing.lockedBy === lockedBy) {
    memoryOperationLocks.delete(key);
    return true;
  }
  return false;
}
