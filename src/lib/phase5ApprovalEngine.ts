import crypto from 'crypto';
import { RiskLevel } from './phase5AutonomyEngine';
import { checkDevelopmentPermission } from './phase5Rbac';

export interface ChangeRequestApprovalInput {
  id: string;
  tenantId: string;
  changeRequestId: string;
  authorId: string;
  authorType: 'user' | 'ai_agent';
  riskClassification: RiskLevel;
  contentHash: string; // hash of current filesChanged diff
}

export interface ExistingApproval {
  id: string;
  approverId: string;
  approverRole?: string;
  decision: 'APPROVED' | 'REJECTED';
  approvedContentHash: string;
  status: 'VALID' | 'INVALIDATED';
  createdAt: Date;
}

export interface ApprovalEvaluationResult {
  canMergeOrDeploy: boolean;
  requiredApprovalsCount: number;
  validApprovalsCount: number;
  blockingReasons: string[];
  isInvalidatedDueToHashMismatch: boolean;
}

export function computeContentHash(filesChanged: any[]): string {
  const serialized = JSON.stringify(filesChanged || []);
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

export async function evaluateApprovalCriteria(
  cr: ChangeRequestApprovalInput,
  approvals: ExistingApproval[]
): Promise<ApprovalEvaluationResult> {
  const blockingReasons: string[] = [];
  let isInvalidatedDueToHashMismatch = false;

  // 1. Determine required approval count based on risk
  let requiredApprovalsCount = 0;
  switch (cr.riskClassification) {
    case 'LOW':
      requiredApprovalsCount = 0;
      break;
    case 'MEDIUM':
      requiredApprovalsCount = 1;
      break;
    case 'HIGH':
      requiredApprovalsCount = 1;
      break;
    case 'CRITICAL':
      requiredApprovalsCount = 2; // Multi-approver requirement
      break;
  }

  // Filter valid approvals matching current content hash
  const validApprovals: ExistingApproval[] = [];

  for (const app of approvals) {
    if (app.decision === 'REJECTED' && app.status === 'VALID') {
      blockingReasons.push(`Change Request rejected by approver ${app.approverId}.`);
    }

    if (app.approvedContentHash !== cr.contentHash) {
      isInvalidatedDueToHashMismatch = true;
      continue; // Skip invalidated approval
    }

    if (app.status === 'VALID' && app.decision === 'APPROVED') {
      // Segregation of duties checks:
      // A. Author cannot self-approve HIGH or CRITICAL changes
      if (['HIGH', 'CRITICAL'].includes(cr.riskClassification) && app.approverId === cr.authorId) {
        blockingReasons.push(`Author '${cr.authorId}' cannot self-approve ${cr.riskClassification}-risk change.`);
        continue;
      }

      // B. AI agent cannot approve its own patch
      if (cr.authorType === 'ai_agent' && app.approverId === cr.authorId) {
        blockingReasons.push(`AI Agent '${cr.authorId}' cannot approve its own generated patch.`);
        continue;
      }

      validApprovals.push(app);
    }
  }

  if (isInvalidatedDueToHashMismatch) {
    blockingReasons.push('Previous approvals invalidated because change request diff was updated.');
  }

  // Ensure unique approvers for multi-approver critical changes
  const uniqueApproverIds = new Set(validApprovals.map((a) => a.approverId));
  const validApprovalsCount = uniqueApproverIds.size;

  if (validApprovalsCount < requiredApprovalsCount) {
    blockingReasons.push(
      `Insufficient valid approvals: received ${validApprovalsCount} of ${requiredApprovalsCount} required.`
    );
  }

  const canMergeOrDeploy = validApprovalsCount >= requiredApprovalsCount && blockingReasons.length === 0;

  return {
    canMergeOrDeploy,
    requiredApprovalsCount,
    validApprovalsCount,
    blockingReasons,
    isInvalidatedDueToHashMismatch,
  };
}

export async function validateApprovalEligibility(
  tenantId: string,
  approverId: string,
  approverRole: string,
  cr: ChangeRequestApprovalInput
): Promise<{ eligible: boolean; reason?: string }> {
  // 1. Segregation of duties check for self-approval on high/critical risk
  if (['HIGH', 'CRITICAL'].includes(cr.riskClassification) && approverId === cr.authorId) {
    return {
      eligible: false,
      reason: `Author '${approverId}' cannot self-approve ${cr.riskClassification}-risk change request under enterprise segregation of duties.`,
    };
  }

  // 2. AI agent self-approval check
  if (cr.authorType === 'ai_agent' && approverId === cr.authorId) {
    return {
      eligible: false,
      reason: `AI agent cannot approve its own generated change request proposal.`,
    };
  }

  // 3. RBAC permission check for CODE_APPROVE
  const rbacCheck = await checkDevelopmentPermission(tenantId, approverId, approverRole, 'CODE_APPROVE');
  if (!rbacCheck.allowed) {
    return {
      eligible: false,
      reason: rbacCheck.reason || 'User lacks CODE_APPROVE permission.',
    };
  }

  return { eligible: true };
}
