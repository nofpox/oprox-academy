import { isKillSwitchActive } from './killSwitch';
import { executeControlledRollback } from './phase4RollbackEngine';
import { createOperationalIncident } from './phase4IncidentManager';

export interface RecoveryAttemptResult {
  attemptNumber: number;
  maxRetries: number;
  actionTaken: string;
  success: boolean;
  isDestructive: boolean;
  policyAuthorized: boolean;
  details: string;
}

export async function attemptAutonomousRecovery(params: {
  tenantId: string;
  projectId: string;
  environment?: string;
  failureCategory: string;
  attemptNumber: number;
  allowAutoRollback?: boolean;
  actorRole?: string;
}): Promise<RecoveryAttemptResult> {
  const environment = params.environment || 'production';
  const MAX_RETRIES = 3;

  // 1. Check KillSwitch
  const isKillSwitchOn = await isKillSwitchActive('deployments');
  if (isKillSwitchOn) {
    return {
      attemptNumber: params.attemptNumber,
      maxRetries: MAX_RETRIES,
      actionTaken: 'KILLSWITCH_BLOCKED',
      success: false,
      isDestructive: false,
      policyAuthorized: false,
      details: 'Autonomous recovery aborted: KillSwitch is active for deployment operations.',
    };
  }

  // 2. Enforce retry limits
  if (params.attemptNumber > MAX_RETRIES) {
    await createOperationalIncident({
      tenantId: params.tenantId,
      projectId: params.projectId,
      environment,
      failureCategory: 'DEPLOYMENT_FAILURE',
      summary: `Autonomous recovery max retry limit (${MAX_RETRIES}) reached. Escalating to human incident.`,
      evidence: { attemptNumber: params.attemptNumber, maxRetries: MAX_RETRIES },
      remediation: 'Manual owner review required.',
    });

    return {
      attemptNumber: params.attemptNumber,
      maxRetries: MAX_RETRIES,
      actionTaken: 'MAX_RETRIES_EXCEEDED',
      success: false,
      isDestructive: false,
      policyAuthorized: false,
      details: `Max retry limit (${MAX_RETRIES}) reached. Incident created for manual review.`,
    };
  }

  // 3. Prevent un-authorized destructive recovery
  if (params.failureCategory === 'MIGRATION_FAILURE') {
    return {
      attemptNumber: params.attemptNumber,
      maxRetries: MAX_RETRIES,
      actionTaken: 'DESTRUCTIVE_ACTION_PREVENTED',
      success: false,
      isDestructive: true,
      policyAuthorized: false,
      details:
        'AI is strictly forbidden from autonomously executing database rollback or destructive recovery without explicit human authorization.',
    };
  }

  // 4. Safe recovery action: Propose or Execute Rollback if explicitly authorized
  if (params.allowAutoRollback && params.actorRole === 'superadmin') {
    try {
      const rollbackRes = await executeControlledRollback({
        tenantId: params.tenantId,
        projectId: params.projectId,
        environment,
        reason: `Autonomous recovery for ${params.failureCategory} (attempt ${params.attemptNumber})`,
        initiatedBy: 'autonomous_recovery_engine',
      });

      return {
        attemptNumber: params.attemptNumber,
        maxRetries: MAX_RETRIES,
        actionTaken: 'AUTO_ROLLBACK_EXECUTED',
        success: rollbackRes.success,
        isDestructive: false,
        policyAuthorized: true,
        details: rollbackRes.details,
      };
    } catch (err: any) {
      return {
        attemptNumber: params.attemptNumber,
        maxRetries: MAX_RETRIES,
        actionTaken: 'AUTO_ROLLBACK_FAILED',
        success: false,
        isDestructive: false,
        policyAuthorized: true,
        details: err?.message || 'Auto rollback failed.',
      };
    }
  }

  // Safe retry probe action
  const backoffMs = Math.pow(2, params.attemptNumber - 1) * 1000;
  return {
    attemptNumber: params.attemptNumber,
    maxRetries: MAX_RETRIES,
    actionTaken: 'TRANSIENT_RETRY_SCHEDULED',
    success: true,
    isDestructive: false,
    policyAuthorized: true,
    details: `Scheduled transient retry attempt ${params.attemptNumber} with exponential backoff (${backoffMs}ms).`,
  };
}
