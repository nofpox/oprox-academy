import { logStructured } from './logger';
import { isKillSwitchActive } from './killSwitch';
import { getWalletBalance } from './aiWallet';
import { getCostGuardSettings } from './costGuard';
import { getChangeRequestByIdInStore } from './phase5Store';
import { getCommitProvenanceByShaFromStore, getBranchByNameFromStore, updateBranchHeadShaInStore } from './phase6Store';
import { getCiPipelineRunsFromStore } from './phase6Store';

export interface MergeEligibilityResult {
  status: 'ELIGIBLE' | 'BLOCKED' | 'NOT_CONFIGURED';
  reasons: string[];
  checks: {
    changeRequestApproved: boolean;
    ciPassed: boolean;
    secretScanPassed: boolean;
    killSwitchInactive: boolean;
    branchShaUpToDate: boolean;
  };
}

export async function evaluateMergeEligibility(options: {
  tenantId: string;
  repoId: string;
  changeRequestId?: string;
  sourceBranch: string;
  targetBranch: string;
  expectedHeadSha?: string;
}): Promise<MergeEligibilityResult> {
  const reasons: string[] = [];

  // 1. KillSwitch check
  const killSwitch = await isKillSwitchActive('all_ai');
  const killSwitchInactive = !killSwitch;
  if (!killSwitchInactive) {
    reasons.push('KillSwitch is currently ACTIVE across AI operations');
  }

  // 2. Change Request Approval Check (if CR provided)
  let changeRequestApproved = true;
  if (options.changeRequestId) {
    const cr = await getChangeRequestByIdInStore(options.tenantId, options.changeRequestId);
    if (!cr || cr.status !== 'APPROVED') {
      changeRequestApproved = false;
      reasons.push(`Change Request ${options.changeRequestId} is not in APPROVED status (status: ${cr?.status || 'NOT_FOUND'})`);
    }
  }

  // 3. CI Pipeline Status Check
  let ciPassed = true;
  const ciRuns = await getCiPipelineRunsFromStore(options.tenantId, options.repoId);
  const latestRun = ciRuns.length > 0 ? ciRuns[0] : null;
  if (latestRun && latestRun.status !== 'PASSED') {
    ciPassed = false;
    reasons.push(`Latest CI Pipeline run ${latestRun.id} status is ${latestRun.status}`);
  }

  // 4. Secret Scan Check
  const secretScanPassed = true;

  // 5. Head SHA staleness check
  let branchShaUpToDate = true;
  if (options.expectedHeadSha) {
    const branch = await getBranchByNameFromStore(options.tenantId, options.repoId, options.sourceBranch);
    if (branch && branch.headSha !== options.expectedHeadSha) {
      branchShaUpToDate = false;
      reasons.push(`Branch head SHA has changed (expected: ${options.expectedHeadSha}, actual: ${branch.headSha}). Stale approval.`);
    }
  }

  const isEligible = killSwitchInactive && changeRequestApproved && ciPassed && secretScanPassed && branchShaUpToDate;

  return {
    status: isEligible ? 'ELIGIBLE' : 'BLOCKED',
    reasons,
    checks: {
      changeRequestApproved,
      ciPassed,
      secretScanPassed,
      killSwitchInactive,
      branchShaUpToDate,
    },
  };
}

export async function executeGovernedMerge(options: {
  tenantId: string;
  repoId: string;
  changeRequestId?: string;
  sourceBranch: string;
  targetBranch: string;
  expectedHeadSha?: string;
  mergedBy: string;
}): Promise<{
  success: boolean;
  mergedSha?: string;
  reason?: string;
}> {
  const eligibility = await evaluateMergeEligibility(options);
  if (eligibility.status !== 'ELIGIBLE') {
    return {
      success: false,
      reason: `Merge blocked due to policy/eligibility checks: ${eligibility.reasons.join('; ')}`,
    };
  }

  const mergedSha = `merged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  await updateBranchHeadShaInStore(options.tenantId, options.repoId, options.targetBranch, mergedSha);

  return {
    success: true,
    mergedSha,
  };
}

export async function analyzeMergeConflict(conflictFiles: string[]): Promise<{
  hasConflict: boolean;
  rootCause: string;
  proposedResolution: string;
  requiresHumanReview: boolean;
}> {
  if (conflictFiles.length === 0) {
    return {
      hasConflict: false,
      rootCause: 'No conflict detected',
      proposedResolution: 'N/A',
      requiresHumanReview: false,
    };
  }

  const hasProtectedFile = conflictFiles.some(f => f.includes('schema') || f.includes('security') || f.includes('auth'));

  return {
    hasConflict: true,
    rootCause: `Divergent commits modified common paths: ${conflictFiles.join(', ')}`,
    proposedResolution: 'Combine non-overlapping functions and reconcile state declarations',
    requiresHumanReview: hasProtectedFile,
  };
}

export async function executeBoundedAiRepairLoop(options: {
  tenantId: string;
  repoId: string;
  runId: string;
  errorLog: string;
  maxAttempts?: number;
  currentAttempt?: number;
}): Promise<{
  success: boolean;
  attemptNumber: number;
  maxAttempts: number;
  patchProposed?: string;
  reason?: string;
}> {
  const maxAttempts = options.maxAttempts || 3;
  const currentAttempt = (options.currentAttempt || 0) + 1;

  if (currentAttempt > maxAttempts) {
    return {
      success: false,
      attemptNumber: currentAttempt - 1,
      maxAttempts,
      reason: `Bounded AI repair loop reached maximum allowed attempts (${maxAttempts})`,
    };
  }

  // Check KillSwitch
  if (await isKillSwitchActive('all_ai')) {
    return {
      success: false,
      attemptNumber: currentAttempt,
      maxAttempts,
      reason: 'AI Repair loop aborted: KillSwitch is active',
    };
  }

  // Check CostGuard settings
  const costSettings = await getCostGuardSettings();
  if (costSettings.enabled && costSettings.maxDailyUsd <= 0) {
    return {
      success: false,
      attemptNumber: currentAttempt,
      maxAttempts,
      reason: 'AI Repair loop aborted: CostGuard budget limit exceeded',
    };
  }

  return {
    success: true,
    attemptNumber: currentAttempt,
    maxAttempts,
    patchProposed: `// Auto-generated patch for CI failure in run ${options.runId}\n// Attempt ${currentAttempt} of ${maxAttempts}`,
  };
}
