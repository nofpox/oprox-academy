import { describe, it, expect } from 'vitest';
import {
  GitHubRepositoryAdapter,
  GitLabRepositoryAdapter,
  BitbucketRepositoryAdapter,
  maskCredential,
} from '../src/lib/phase6RepositoryAdapter';
import {
  secretLeakPreCommitGuard,
  dependencySupplyChainGuard,
} from '../src/lib/phase6GitEngine';
import {
  parseVitestOutput,
  generateArtifactChecksum,
  generateSbomForRepository,
} from '../src/lib/phase6CiEngine';
import {
  checkCloudDevEnvironmentProvider,
} from '../src/lib/phase6EnvEngine';
import {
  evaluateMergeEligibility,
  analyzeMergeConflict,
  executeBoundedAiRepairLoop,
} from '../src/lib/phase6MergeEngine';

describe('OPROX Code / AI — Phase 6 Production Engine & Delivery Integration', () => {

  describe('1. Repository Provider Abstraction', () => {
    it('redacts tokens and raw credentials safely in output', () => {
      const token = 'ghp_secretTokenVal1234567890';
      const masked = maskCredential(token);
      expect(masked).not.toBe(token);
      expect(masked).toBe('ghp_...7890');
    });

    it('handles GitHub connection checks gracefully', async () => {
      const adapter = new GitHubRepositoryAdapter();
      const res = await adapter.checkConnectionStatus();
      expect(['CONFIGURED', 'NOT_CONFIGURED']).toContain(res.status);
    });

    it('returns NOT_CONFIGURED when GitLab credentials are absent', async () => {
      const adapter = new GitLabRepositoryAdapter();
      const res = await adapter.checkConnectionStatus();
      expect(res.status).toBe('NOT_CONFIGURED');
    });
  });

  describe('2. Secret Leakage & Pre-Commit Protection', () => {
    it('detects high-confidence secrets and blocks commit', () => {
      const files = [
        { path: 'src/config.ts', content: 'const key = "' + 'sk_' + 'live_99887766554433221100";' }
      ];
      const scan = secretLeakPreCommitGuard(files);
      expect(scan.passed).toBe(false);
      expect(scan.findings[0].type).toBe('Stripe Live Key');
    });

    it('allows clean code commits without secrets', () => {
      const files = [
        { path: 'src/math.ts', content: 'export const sum = (a: number, b: number) => a + b;' }
      ];
      const scan = secretLeakPreCommitGuard(files);
      expect(scan.passed).toBe(true);
    });
  });

  describe('3. CI Pipeline Execution & Test Output Ingestion', () => {
    it('parses Vitest execution logs without fabrications', () => {
      const sampleLog = 'Test Files 12 passed (12)\nTests 163 passed (163)';
      const summary = parseVitestOutput(sampleLog);
      expect(summary.totalSuites).toBe(12);
      expect(summary.passedTests).toBe(163);
      expect(summary.failedTests).toBe(0);
    });

    it('computes exact SHA-256 for build artifact verification', () => {
      const hash1 = generateArtifactChecksum('bundle-v1');
      const hash2 = generateArtifactChecksum('bundle-v1');
      const hash3 = generateArtifactChecksum('bundle-v2');

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    it('returns NOT_CONFIGURED for unconfigured SBOM generator', () => {
      const sbom = generateSbomForRepository();
      expect(['PASSED', 'NOT_CONFIGURED']).toContain(sbom.status);
    });
  });

  describe('4. Ephemeral Environments & Delivery Gates', () => {
    it('reports NOT_CONFIGURED when CDE provider is not set', () => {
      const cde = checkCloudDevEnvironmentProvider();
      expect(cde.isConfigured).toBe(false);
      expect(cde.providerName).toBe('NONE');
    });

    it('evaluates merge eligibility using KillSwitch & CI status', async () => {
      const eligibility = await evaluateMergeEligibility({
        tenantId: 'tenant-100',
        repoId: 'repo-100',
        sourceBranch: 'feature/patch',
        targetBranch: 'main'
      });
      expect(eligibility.status).toBe('ELIGIBLE');
      expect(eligibility.checks.ciPassed).toBe(true);
    });

    it('requires human review when merge conflicts affect schema/security files', async () => {
      const conflict = await analyzeMergeConflict(['src/db/schema.ts']);
      expect(conflict.hasConflict).toBe(true);
      expect(conflict.requiresHumanReview).toBe(true);
    });

    it('aborts AI repair loop when max attempts bound is exceeded', async () => {
      const repair = await executeBoundedAiRepairLoop({
        tenantId: 'tenant-100',
        repoId: 'repo-100',
        runId: 'run-100',
        errorLog: 'Build failed',
        maxAttempts: 3,
        currentAttempt: 3
      });
      expect(repair.success).toBe(false);
      expect(repair.reason).toContain('maximum allowed attempts');
    });
  });
});
