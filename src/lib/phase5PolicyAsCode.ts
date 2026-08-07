import { logStructured } from './logger';

export interface GovernancePolicyConfig {
  minimumApprovalsLowRisk: number;
  minimumApprovalsMediumRisk: number;
  minimumApprovalsHighRisk: number;
  minimumApprovalsCriticalRisk: number;
  allowSelfApprovalForHighRisk: boolean;
  autonomyLevel: number; // 0..4
  maxAiCostPerTaskUsd: number;
  protectedBranches: string[];
  protectedPaths: string[];
  requireCleanBuildForDeploy: boolean;
  requireReleaseGateForProduction: boolean;
  requirePrivilegedApprovalForDestructiveMigrations: boolean;
  requireSegregationOfDuties: boolean;
}

export interface PolicyValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateGovernancePolicy(config: Partial<GovernancePolicyConfig>): PolicyValidationResult {
  const errors: string[] = [];

  if (config.autonomyLevel !== undefined) {
    if (config.autonomyLevel < 0 || config.autonomyLevel > 4) {
      errors.push('Autonomy level must be an integer between 0 and 4.');
    }
  }

  if (config.maxAiCostPerTaskUsd !== undefined) {
    if (config.maxAiCostPerTaskUsd <= 0 || config.maxAiCostPerTaskUsd > 1000) {
      errors.push('Max AI cost per task USD must be between $0.01 and $1000.00.');
    }
  }

  if (config.minimumApprovalsCriticalRisk !== undefined) {
    if (config.minimumApprovalsCriticalRisk < 1) {
      errors.push('Critical risk changes must require at least 1 approval.');
    }
  }

  if (config.allowSelfApprovalForHighRisk === true && config.requireSegregationOfDuties === true) {
    errors.push('Conflict: Cannot allow self-approval for high risk when segregation of duties is required.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const DEFAULT_GOVERNANCE_POLICY: GovernancePolicyConfig = {
  minimumApprovalsLowRisk: 0,
  minimumApprovalsMediumRisk: 1,
  minimumApprovalsHighRisk: 1,
  minimumApprovalsCriticalRisk: 2,
  allowSelfApprovalForHighRisk: false,
  autonomyLevel: 2,
  maxAiCostPerTaskUsd: 5.0,
  protectedBranches: ['main', 'release/*', 'staging', 'production'],
  protectedPaths: ['/server/**', '/src/db/**', '/security/**', '/deploy/**'],
  requireCleanBuildForDeploy: true,
  requireReleaseGateForProduction: true,
  requirePrivilegedApprovalForDestructiveMigrations: true,
  requireSegregationOfDuties: true,
};
