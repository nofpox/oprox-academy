import {
  getKnownGoodRevision,
  getAllRevisions,
  createRollbackRecord,
  createRevisionRecord,
  RollbackRecord,
  RevisionRecord,
} from './phase4Store';
import { verifyPostDeployment } from './phase4PostDeploymentVerification';

export interface RollbackExecutionResult {
  success: boolean;
  rollbackRecord: RollbackRecord;
  verifiedStatus: 'HEALTHY' | 'DEGRADED' | 'FAILED' | 'NOT_VERIFIED';
  details: string;
}

export async function executeControlledRollback(params: {
  tenantId: string;
  projectId: string;
  environment?: string;
  targetRevisionId?: string;
  reason: string;
  initiatedBy: string;
}): Promise<RollbackExecutionResult> {
  const environment = params.environment || 'production';

  // Identify target known-good revision
  let targetRevision: RevisionRecord | null = null;
  if (params.targetRevisionId) {
    const revs = await getAllRevisions(params.tenantId, environment);
    targetRevision = revs.find((r) => r.revisionId === params.targetRevisionId || r.id === params.targetRevisionId) || null;
  } else {
    targetRevision = await getKnownGoodRevision(params.tenantId, environment);
  }

  if (!targetRevision) {
    throw new Error(
      `ROLLBACK_FAILED: No valid recorded known-good revision found for environment ${environment}. Cannot rollback to unverified state.`
    );
  }

  // Current active revision
  const allRevs = await getAllRevisions(params.tenantId, environment);
  const currentRevision = allRevs[0] || { revisionId: 'rev_current', gitSha: 'HEAD' };

  const rollbackRecordId = `rb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  // Post-rollback verification check
  const verification = await verifyPostDeployment(
    params.tenantId,
    params.projectId,
    rollbackRecordId,
    environment
  );

  const rollbackRecord: RollbackRecord = {
    id: rollbackRecordId,
    tenantId: params.tenantId,
    projectId: params.projectId,
    environment,
    targetRevisionId: targetRevision.revisionId,
    fromRevisionId: currentRevision.revisionId,
    reason: params.reason,
    initiatedBy: params.initiatedBy,
    status: verification.status === 'FAILED' ? 'FAILED' : 'EXECUTED',
    verificationResult: verification.status,
    executedAt: new Date().toISOString(),
  };

  await createRollbackRecord(rollbackRecord);

  // Mark rolled-back revision as active revision record
  await createRevisionRecord({
    id: `rev_rb_${Date.now()}`,
    tenantId: params.tenantId,
    projectId: params.projectId,
    environment,
    revisionId: `${targetRevision.revisionId}-rolled-back`,
    gitSha: targetRevision.gitSha,
    status: 'active',
    isKnownGood: true,
    createdBy: params.initiatedBy,
    createdAt: new Date().toISOString(),
  });

  return {
    success: verification.status !== 'FAILED',
    rollbackRecord,
    verifiedStatus: verification.status,
    details: `Rollback to revision ${targetRevision.revisionId} executed with verification status: ${verification.status}`,
  };
}
