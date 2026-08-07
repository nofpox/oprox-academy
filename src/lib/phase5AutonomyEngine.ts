import { isKillSwitchActive } from './killSwitch';
import { isCostGuardExceeded } from './costGuard';
import { checkAiWalletBalance } from './aiWallet';
import { logStructured } from './logger';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FileChangeInput {
  path: string;
  content?: string;
  oldContent?: string;
  diff?: string;
}

export interface RiskClassificationResult {
  riskLevel: RiskLevel;
  reasons: string[];
  requiresDualApproval: boolean;
  isDestructiveMigration: boolean;
}

export function classifyChangeRisk(files: FileChangeInput[]): RiskClassificationResult {
  const reasons: string[] = [];
  let isDestructiveMigration = false;
  let hasCriticalSecuritySignal = false;
  let hasHighBillingSignal = false;
  let hasDbSchemaSignal = false;
  let hasInfraSignal = false;

  if (files.length > 25) {
    reasons.push(`High file volume (${files.length} files changed)`);
    hasCriticalSecuritySignal = true;
  } else if (files.length > 10) {
    reasons.push(`Moderate file volume (${files.length} files changed)`);
  }

  for (const f of files) {
    const path = f.path.toLowerCase();
    const content = (f.content || '') + (f.diff || '');

    // 1. Database Schema & Migration Checks
    if (path.includes('schema.ts') || path.includes('drizzle/') || path.endsWith('.sql')) {
      hasDbSchemaSignal = true;
      if (/DROP\ TABLE|DROP\ COLUMN|TRUNCATE|ALTER\ TABLE.*DROP/i.test(content)) {
        isDestructiveMigration = true;
        reasons.push(`Destructive database migration pattern detected in ${f.path}`);
      } else {
        reasons.push(`Database schema or migration change in ${f.path}`);
      }
    }

    // 2. Security & Auth Files
    if (path.includes('auth.ts') || path.includes('security') || path.includes('encryption.ts') || path.includes('killswitch')) {
      hasCriticalSecuritySignal = true;
      reasons.push(`Authentication/Security critical path modified: ${f.path}`);
    }

    // 3. Billing & Payments
    if (path.includes('billing') || path.includes('stripe') || path.includes('payment') || path.includes('wallet')) {
      hasHighBillingSignal = true;
      reasons.push(`Financial/Billing sensitive path modified: ${f.path}`);
    }

    // 4. Infrastructure & Deployments
    if (path.includes('dockerfile') || path.includes('deploy') || path.includes('cloudrun') || path.endsWith('.yaml') || path.endsWith('.yml')) {
      hasInfraSignal = true;
      reasons.push(`Infrastructure or deployment configuration modified: ${f.path}`);
    }

    // 5. Dependency modifications
    if (path.includes('package.json') || path.includes('package-lock.json')) {
      reasons.push(`Project dependencies modified: ${f.path}`);
    }
  }

  let riskLevel: RiskLevel = 'LOW';

  if (isDestructiveMigration || hasCriticalSecuritySignal) {
    riskLevel = 'CRITICAL';
  } else if (hasHighBillingSignal || hasDbSchemaSignal || hasInfraSignal) {
    riskLevel = 'HIGH';
  } else if (reasons.length > 0 || files.length > 3) {
    riskLevel = 'MEDIUM';
  }

  return {
    riskLevel,
    reasons: reasons.length > 0 ? reasons : ['Standard low-risk workspace code modification'],
    requiresDualApproval: riskLevel === 'CRITICAL' || isDestructiveMigration,
    isDestructiveMigration,
  };
}

export interface AutonomyCheckResult {
  allowed: boolean;
  autonomyLevel: number; // 0 to 4
  denialCode?: string;
  reason?: string;
}

export async function checkAiAutonomyGate(
  tenantId: string,
  userId: string,
  autonomyLevel: number,
  actionRisk: RiskLevel
): Promise<AutonomyCheckResult> {
  // 1. KillSwitch Check
  const killSwitchActive = await isKillSwitchActive('all_ai');
  if (killSwitchActive) {
    logStructured('warn', 'AI_AUTONOMY_BLOCKED_KILLSWITCH', { tenantId, userId });
    return {
      allowed: false,
      autonomyLevel,
      denialCode: 'KILLSWITCH_ACTIVE',
      reason: 'Global KillSwitch is currently ACTIVE. All autonomous AI actions are suspended.',
    };
  }

  // 2. CostGuard Check
  const costGuardBlocked = await isCostGuardExceeded(tenantId);
  if (costGuardBlocked) {
    logStructured('warn', 'AI_AUTONOMY_BLOCKED_COSTGUARD', { tenantId, userId });
    return {
      allowed: false,
      autonomyLevel,
      denialCode: 'COSTGUARD_EXCEEDED',
      reason: 'CostGuard budget threshold exceeded for this tenant.',
    };
  }

  // 3. AI Wallet Balance Check
  const walletCheck = await checkAiWalletBalance(userId);
  if (!walletCheck.hasSufficientBalance) {
    logStructured('warn', 'AI_AUTONOMY_BLOCKED_INSUFFICIENT_WALLET', { tenantId, userId });
    return {
      allowed: false,
      autonomyLevel,
      denialCode: 'INSUFFICIENT_AI_WALLET',
      reason: 'AI Wallet balance is below the $0.01 execution threshold.',
    };
  }

  // 4. Autonomy Level Boundaries
  if (autonomyLevel === 0) {
    return {
      allowed: false,
      autonomyLevel: 0,
      denialCode: 'AUTONOMY_LEVEL_ZERO',
      reason: 'Autonomy Level 0 (Suggest Only) prevents automated code edits or task executions.',
    };
  }

  if (actionRisk === 'CRITICAL' && autonomyLevel < 4) {
    return {
      allowed: false,
      autonomyLevel,
      denialCode: 'INSUFFICIENT_AUTONOMY_FOR_CRITICAL_RISK',
      reason: 'Critical-risk changes require Autonomy Level 4 or explicit human change request approval.',
    };
  }

  return { allowed: true, autonomyLevel };
}
