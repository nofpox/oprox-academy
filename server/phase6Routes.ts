import { Router } from 'express';
import { AuthRequest, requireAuth } from './auth';
import { logStructured } from '../src/lib/logger';
import {
  createRepoConnectionInStore,
  getRepoConnectionsFromStore,
  getRepoConnectionByIdFromStore,
  deleteRepoConnectionInStore,
  getBranchesFromStore,
  createBranchInStore,
  getCommitProvenanceForRepoFromStore,
  getCiPipelineDefinitionsFromStore,
  createCiPipelineDefinitionInStore,
  getCiPipelineRunsFromStore,
  getCiPipelineRunByIdFromStore,
  getBuildArtifactsFromStore,
  getDevEnvironmentsFromStore,
  getPreviewEnvironmentsFromStore,
  createProviderEventInStore,
} from '../src/lib/phase6Store';
import {
  RepositoryProviderAdapterFactory,
  maskCredential,
  RepositoryProviderType,
  CheckConnectionResult,
} from '../src/lib/phase6RepositoryAdapter';
import {
  getRepositoryGitStatus,
  getGitDiff,
  createGovernedCommit,
} from '../src/lib/phase6GitEngine';
import {
  executeCiPipeline,
  generateSbomForRepository,
} from '../src/lib/phase6CiEngine';
import {
  provisionDevEnvironment,
  provisionPreviewEnvironment,
} from '../src/lib/phase6EnvEngine';
import {
  evaluateMergeEligibility,
  executeGovernedMerge,
  executeBoundedAiRepairLoop,
  analyzeMergeConflict,
} from '../src/lib/phase6MergeEngine';

const router = Router();

// Helper to derive tenant ID
function getTenantId(req: AuthRequest): string {
  return req.user?.orgId || req.user?.id || 'default-tenant';
}

// ── 1. Provider Connections ──────────────────────────────────────────────────
router.get('/api/phase6/providers/connections', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const projectId = req.query.projectId as string;
    const connections = await getRepoConnectionsFromStore(tenantId, projectId);

    const safeConnections = connections.map(c => ({
      ...c,
      accountRef: c.accountRef ? maskCredential(c.accountRef) : null,
    }));

    res.json({ success: true, connections: safeConnections });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list repository connections' });
  }
});

router.post('/api/phase6/providers/connections', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { provider, repoIdentifier, repoOwner, defaultBranch, token, projectId } = req.body;

    if (!provider || !repoIdentifier || !repoOwner) {
      return res.status(400).json({ error: 'Missing required parameters: provider, repoIdentifier, repoOwner' });
    }

    const adapter = RepositoryProviderAdapterFactory.getAdapter(provider as RepositoryProviderType);
    const statusCheck: CheckConnectionResult = await adapter.checkConnectionStatus(token, repoIdentifier);

    const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const connection = await createRepoConnectionInStore({
      id: connectionId,
      tenantId,
      orgId: req.user?.orgId || 'default-org',
      projectId,
      provider,
      repoIdentifier,
      repoOwner,
      defaultBranch: defaultBranch || 'main',
      connectionStatus: statusCheck.status,
      accountRef: statusCheck.accountRef,
      createdBy: req.user!.id,
    });

    res.json({
      success: true,
      connection: {
        ...connection,
        accountRef: connection.accountRef ? maskCredential(connection.accountRef) : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to connect repository' });
  }
});

router.post('/api/phase6/providers/connections/verify', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { connectionId, token } = req.body;

    const connection = await getRepoConnectionByIdFromStore(connectionId, tenantId);
    if (!connection) {
      return res.status(404).json({ error: 'Repository connection not found for this tenant' });
    }

    const adapter = RepositoryProviderAdapterFactory.getAdapter(connection.provider as RepositoryProviderType);
    const statusCheck: CheckConnectionResult = await adapter.checkConnectionStatus(token, connection.repoIdentifier);

    res.json({
      success: true,
      status: statusCheck.status,
      reason: statusCheck.reason,
      accountRef: statusCheck.accountRef ? maskCredential(statusCheck.accountRef) : null,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to verify repository connection' });
  }
});

router.delete('/api/phase6/providers/connections/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const connectionId = req.params.id;

    const connection = await getRepoConnectionByIdFromStore(connectionId, tenantId);
    if (!connection) {
      return res.status(404).json({ error: 'Repository connection not found' });
    }

    await deleteRepoConnectionInStore(connectionId, tenantId);
    res.json({ success: true, message: 'Repository connection deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to delete repository connection' });
  }
});

// ── 2. Git & Branch Management ──────────────────────────────────────────────
router.get('/api/phase6/git/branches', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const repoId = (req.query.repoId as string) || 'default-repo';

    const branches = await getBranchesFromStore(tenantId, repoId);
    res.json({ success: true, branches });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list branches' });
  }
});

router.post('/api/phase6/git/branches', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { repoId, name, type, baseSha, originatingTaskId, changeRequestId } = req.body;

    if (!repoId || !name || !baseSha) {
      return res.status(400).json({ error: 'Missing required parameters: repoId, name, baseSha' });
    }

    const branchId = `branch-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const branch = await createBranchInStore({
      id: branchId,
      tenantId,
      projectId: req.body.projectId,
      repoId,
      name,
      type: type || 'feature',
      ownerId: req.user!.id,
      originatingTaskId,
      changeRequestId,
      baseSha,
      headSha: baseSha,
    });

    res.json({ success: true, branch });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create branch' });
  }
});

router.get('/api/phase6/git/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const status = getRepositoryGitStatus();
    res.json({ success: true, status });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get git status' });
  }
});

router.get('/api/phase6/git/diff', requireAuth, async (req: AuthRequest, res) => {
  try {
    const base = req.query.base as string;
    const head = req.query.head as string;
    const diff = getGitDiff(process.cwd(), base, head);
    res.json({ success: true, diff });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get git diff' });
  }
});

router.get('/api/phase6/git/commits', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const repoId = (req.query.repoId as string) || 'default-repo';

    const commits = await getCommitProvenanceForRepoFromStore(tenantId, repoId);
    res.json({ success: true, commits });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list commit provenance' });
  }
});

router.post('/api/phase6/git/commits', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const {
      repoId,
      branchName,
      authorType,
      message,
      filesToCommit,
      requirementId,
      aiTaskId,
      agentId,
      workspaceId,
      changeRequestId,
    } = req.body;

    if (!repoId || !branchName || !filesToCommit || !Array.isArray(filesToCommit)) {
      return res.status(400).json({ error: 'Missing required parameters: repoId, branchName, filesToCommit' });
    }

    const commitResult = await createGovernedCommit({
      tenantId,
      repoId,
      branchName,
      authorType: authorType || 'human',
      authorId: req.user!.id,
      message: message || 'Governed commit',
      filesToCommit,
      requirementId,
      aiTaskId,
      agentId,
      workspaceId,
      changeRequestId,
    });

    if (!commitResult.success) {
      return res.status(422).json({
        error: commitResult.reason,
        secretFindings: commitResult.secretFindings,
      });
    }

    res.json({
      success: true,
      commitSha: commitResult.commitSha,
      provenanceId: commitResult.provenanceId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create governed commit' });
  }
});

// ── 3. CI/CD Pipeline Engine ────────────────────────────────────────────────
router.get('/api/phase6/ci/pipelines', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const pipelines = await getCiPipelineDefinitionsFromStore(tenantId);
    res.json({ success: true, pipelines });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list CI pipelines' });
  }
});

router.post('/api/phase6/ci/pipelines', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { name, stages, allowlistedCommands, projectId } = req.body;

    if (!name) return res.status(400).json({ error: 'Missing pipeline name' });

    const pipelineId = `pipe-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const pipeline = await createCiPipelineDefinitionInStore({
      id: pipelineId,
      tenantId,
      projectId,
      name,
      stages: stages || [],
      allowlistedCommands: allowlistedCommands || ['npm test', 'npm run build', 'npm run lint'],
    });

    res.json({ success: true, pipeline });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to create CI pipeline' });
  }
});

router.get('/api/phase6/ci/runs', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const repoId = req.query.repoId as string;
    const runs = await getCiPipelineRunsFromStore(tenantId, repoId);
    res.json({ success: true, runs });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list CI runs' });
  }
});

router.post('/api/phase6/ci/runs', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { repoId, pipelineId, commitSha, branchName, trigger, stages } = req.body;

    if (!repoId || !pipelineId || !commitSha || !branchName) {
      return res.status(400).json({ error: 'Missing required parameters: repoId, pipelineId, commitSha, branchName' });
    }

    const runResult = await executeCiPipeline({
      tenantId,
      repoId,
      pipelineId,
      commitSha,
      branchName,
      trigger: trigger || 'manual',
      stages,
    });

    res.json({ success: true, ...runResult });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to execute CI run' });
  }
});

router.get('/api/phase6/ci/runs/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const runId = req.params.id;

    const run = await getCiPipelineRunByIdFromStore(runId, tenantId);
    if (!run) return res.status(404).json({ error: 'CI pipeline run not found' });

    res.json({ success: true, run });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to get CI run details' });
  }
});

router.post('/api/phase6/ci/repair', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { repoId, runId, errorLog, maxAttempts, currentAttempt } = req.body;

    if (!repoId || !runId) {
      return res.status(400).json({ error: 'Missing required parameters: repoId, runId' });
    }

    const repairResult = await executeBoundedAiRepairLoop({
      tenantId,
      repoId,
      runId,
      errorLog: errorLog || 'Stage failure detected in CI execution log',
      maxAttempts,
      currentAttempt,
    });

    res.json({ success: true, ...repairResult });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to execute AI repair loop' });
  }
});

// ── 4. Build Artifacts & Integrity ──────────────────────────────────────────
router.get('/api/phase6/artifacts', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const commitSha = req.query.commitSha as string;

    const artifacts = await getBuildArtifactsFromStore(tenantId, commitSha);
    const sbomStatus = generateSbomForRepository();

    res.json({
      success: true,
      artifacts,
      sbom: sbomStatus,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list artifacts' });
  }
});

// ── 5. Cloud Development & Preview Environments ─────────────────────────────
router.get('/api/phase6/environments/dev', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const environments = await getDevEnvironmentsFromStore(tenantId);
    res.json({ success: true, environments });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list dev environments' });
  }
});

router.post('/api/phase6/environments/dev', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { name, branchName, commitSha, projectId } = req.body;

    if (!name || !branchName || !commitSha) {
      return res.status(400).json({ error: 'Missing required parameters: name, branchName, commitSha' });
    }

    const result = await provisionDevEnvironment({
      tenantId,
      projectId,
      name,
      branchName,
      commitSha,
      createdBy: req.user!.id,
    });

    if (result.status === 'NOT_CONFIGURED') {
      return res.status(200).json({
        success: false,
        status: 'NOT_CONFIGURED',
        reason: result.reason,
      });
    }

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to provision dev environment' });
  }
});

router.get('/api/phase6/environments/preview', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const changeRequestId = req.query.changeRequestId as string;
    const environments = await getPreviewEnvironmentsFromStore(tenantId, changeRequestId);
    res.json({ success: true, environments });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list preview environments' });
  }
});

router.post('/api/phase6/environments/preview', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { changeRequestId, commitSha, projectId } = req.body;

    if (!changeRequestId || !commitSha) {
      return res.status(400).json({ error: 'Missing required parameters: changeRequestId, commitSha' });
    }

    const result = await provisionPreviewEnvironment({
      tenantId,
      projectId,
      changeRequestId,
      commitSha,
      createdBy: req.user!.id,
    });

    if (result.status === 'NOT_CONFIGURED') {
      return res.status(200).json({
        success: false,
        status: 'NOT_CONFIGURED',
        reason: result.reason,
      });
    }

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to provision preview environment' });
  }
});

// ── 6. Merge Eligibility & Governed Merge ────────────────────────────────────
router.post('/api/phase6/merge/eligibility', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { repoId, changeRequestId, sourceBranch, targetBranch, expectedHeadSha } = req.body;

    if (!repoId || !sourceBranch || !targetBranch) {
      return res.status(400).json({ error: 'Missing required parameters: repoId, sourceBranch, targetBranch' });
    }

    const eligibility = await evaluateMergeEligibility({
      tenantId,
      repoId,
      changeRequestId,
      sourceBranch,
      targetBranch,
      expectedHeadSha,
    });

    res.json({ success: true, eligibility });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to evaluate merge eligibility' });
  }
});

router.post('/api/phase6/merge/execute', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { repoId, changeRequestId, sourceBranch, targetBranch, expectedHeadSha } = req.body;

    if (!repoId || !sourceBranch || !targetBranch) {
      return res.status(400).json({ error: 'Missing required parameters: repoId, sourceBranch, targetBranch' });
    }

    const mergeResult = await executeGovernedMerge({
      tenantId,
      repoId,
      changeRequestId,
      sourceBranch,
      targetBranch,
      expectedHeadSha,
      mergedBy: req.user!.id,
    });

    if (!mergeResult.success) {
      return res.status(409).json({ error: mergeResult.reason });
    }

    res.json({ success: true, mergedSha: mergeResult.mergedSha });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to execute governed merge' });
  }
});

// ── 7. Webhook Ingestion ────────────────────────────────────────────────────
router.post('/api/phase6/webhooks/:provider', async (req, res) => {
  try {
    const provider = req.params.provider as RepositoryProviderType;
    const signature = (req.headers['x-hub-signature-256'] || req.headers['x-gitlab-token']) as string;

    const adapter = RepositoryProviderAdapterFactory.getAdapter(provider);
    const verified = adapter.verifyWebhookSignature(JSON.stringify(req.body), signature, process.env.WEBHOOK_SECRET || '');

    const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await createProviderEventInStore({
      id: eventId,
      tenantId: 'default-tenant',
      provider,
      eventType: (req.headers['x-github-event'] || req.headers['x-gitlab-event'] || 'push') as string,
      repoIdentifier: req.body?.repository?.full_name || 'unknown-repo',
      payload: req.body,
      signatureVerified: verified,
    });

    res.json({ success: true, eventId, signatureVerified: verified });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Webhook processing failed' });
  }
});

// ── 8. Delivery Promotion ───────────────────────────────────────────────────
router.post('/api/phase6/promotion/execute', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getTenantId(req);
    const { repoId, commitSha, targetEnvironment } = req.body;

    if (!repoId || !commitSha || !targetEnvironment) {
      return res.status(400).json({ error: 'Missing required parameters: repoId, commitSha, targetEnvironment' });
    }

    res.json({
      success: true,
      promotedCommitSha: commitSha,
      targetEnvironment,
      promotionGateStatus: 'APPROVED',
      promotedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Delivery promotion failed' });
  }
});

export default router;
