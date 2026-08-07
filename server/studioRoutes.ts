/**
 * OPROX Studio Phase 1 — Express REST Router
 * Authoritative Studio routes for visual application building, canvas updates, OCC revisions,
 * AI copilot, code compilation, and Code / AI promotion.
 */

import { Router } from 'express';
import { requireAuth, AuthRequest } from './auth';
import { aiGovernanceGate } from './aiGovernance';
import { logSecurityAudit } from './audit';
import {
  createStudioProject,
  getStudioProjectIr,
  listStudioProjects,
  saveStudioProjectIr,
  promoteStudioProjectToWorkspace,
} from '../src/lib/studio/studioStore';
import { processStudioCopilotRequest } from '../src/lib/studio/studioCopilot';
import { compileStudioIr } from '../src/lib/studio/studioCompiler';
import { generateDrizzleSchemaCode } from '../src/lib/studio/studioDrizzleGenerator';
import { importCodeToStudioSubset } from '../src/lib/studio/studioImporter';
import { simulateFlowExecution, validateStudioFlowGraph } from '../src/lib/studio/studioFlowEngine';
import { validateStudioSchemaModel } from '../src/lib/studio/studioSchemaEngine';

const router = Router();

// 1. List Studio Projects
router.get('/api/studio/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projects = await listStudioProjects(tenantId);
    res.json({ success: true, projects });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list Studio projects.' });
  }
});

// 2. Create Studio Project
router.post('/api/studio/projects', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const orgId = req.user?.orgId || 'org_default';
    const userId = req.user!.id;
    const { name, description } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Field "name" string is required.' });
    }

    const meta = await createStudioProject({
      tenantId,
      orgId,
      name,
      description,
      createdBy: userId,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_STUDIO_PROJECT', projectId: meta.id });
    res.json({ success: true, project: meta });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create Studio project.' });
  }
});

// 2a. Phase 5 — AI Planning before generation
router.post('/api/studio/projects/ai-plan', requireAuth, aiGovernanceGate, async (req: AuthRequest, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Field "prompt" string is required.' });
    }
    const { createStudioAiPlan } = await import('../src/lib/studio/studioPhase5Engine');
    const plan = createStudioAiPlan(prompt);
    res.json({ success: true, plan });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'AI planning failed.' });
  }
});

// 2b. Phase 5 — AI Application Generation
router.post('/api/studio/projects/ai-generate', requireAuth, aiGovernanceGate, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const orgId = req.user?.orgId || 'org_default';
    const userId = req.user!.id;
    const { name, prompt, plan } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Field "prompt" string is required.' });
    }

    const projName = name || 'AI Generated App';
    const meta = await createStudioProject({
      tenantId,
      orgId,
      name: projName,
      description: `AI generated from prompt: "${prompt.substring(0, 50)}..."`,
      createdBy: userId,
    });

    const { executeStudioAiGeneration } = await import('../src/lib/studio/studioPhase5Engine');
    const progress = await executeStudioAiGeneration(meta.id, tenantId, projName, prompt);

    if (progress.stage === 'FAILED' || !progress.resultIr) {
      return res.status(400).json({
        error: `AI project generation failed: ${progress.error || 'Unknown generation error'}`,
        stage: progress.stage,
      });
    }

    // Save initial generated IR as revision 1
    await saveStudioProjectIr({
      projectId: meta.id,
      tenantId,
      authorId: userId,
      baseRevisionNumber: 0,
      updatedIr: progress.resultIr,
      changeSummary: 'Initial AI Application Generation',
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'AI_GENERATE_STUDIO_PROJECT', projectId: meta.id, prompt });
    res.json({ success: true, project: meta, ir: progress.resultIr, plan: progress.plan });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'AI project generation failed.' });
  }
});

// 2c. Phase 5 — Duplicate Studio Project
router.post('/api/studio/projects/:id/duplicate', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const orgId = req.user?.orgId || 'org_default';
    const userId = req.user!.id;

    const source = await getStudioProjectIr(req.params.id, tenantId);
    if (!source) {
      return res.status(404).json({ error: 'Studio project not found or access denied.' });
    }

    const newName = `${source.meta.name} (Copy)`;
    const newMeta = await createStudioProject({
      tenantId,
      orgId,
      name: newName,
      description: source.meta.description,
      createdBy: userId,
    });

    const duplicatedIr = JSON.parse(JSON.stringify(source.ir));
    duplicatedIr.id = newMeta.id;
    duplicatedIr.name = newName;

    await saveStudioProjectIr({
      projectId: newMeta.id,
      tenantId,
      authorId: userId,
      baseRevisionNumber: 0,
      updatedIr: duplicatedIr,
      changeSummary: 'Duplicated project',
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'DUPLICATE_STUDIO_PROJECT', sourceProjectId: req.params.id, newProjectId: newMeta.id });
    res.json({ success: true, project: newMeta });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to duplicate Studio project.' });
  }
});

// 3. Get Studio Project Meta + IR
router.get('/api/studio/projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const result = await getStudioProjectIr(req.params.id, tenantId);

    if (!result) {
      return res.status(404).json({ error: 'Studio project not found or access denied.' });
    }

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to load Studio project.' });
  }
});

// 4. Save Studio Project IR (With Optimistic Concurrency Control OCC)
router.put('/api/studio/projects/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { baseRevisionNumber, updatedIr, changeSummary } = req.body;

    if (typeof baseRevisionNumber !== 'number' || !updatedIr) {
      return res.status(400).json({
        error: 'Fields "baseRevisionNumber" (number) and "updatedIr" (object) are required.',
      });
    }

    const saveResult = await saveStudioProjectIr({
      projectId: req.params.id,
      tenantId,
      authorId: userId,
      baseRevisionNumber,
      updatedIr,
      changeSummary: changeSummary || 'Visual canvas edit',
    });

    if (saveResult.conflict) {
      return res.status(409).json({
        error: 'CONCURRENCY_CONFLICT: Base revision is stale. Project was modified by another session.',
        activeRevisionNumber: saveResult.newRevisionNumber,
      });
    }

    res.json({ success: true, ...saveResult });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to save Studio project.' });
  }
});

// 5. Studio AI Copilot (Protected by AI Governance Gate)
router.post('/api/studio/projects/:id/copilot', aiGovernanceGate, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { prompt, scope, currentIr } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Field "prompt" is required.' });
    }

    const copilotRes = await processStudioCopilotRequest({
      projectId: req.params.id,
      tenantId,
      prompt,
      scope: scope || 'ALL',
      currentIr,
    });

    res.json({ success: true, ...copilotRes });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Studio Copilot execution failed.' });
  }
});

// 6. Compile Studio IR to Code
router.post('/api/studio/projects/:id/compile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);

    if (!projectData) {
      return res.status(404).json({ error: 'Studio project not found.' });
    }

    const compiled = compileStudioIr(projectData.ir);
    const drizzleCode = generateDrizzleSchemaCode(projectData.ir.schema);
    const schemaValidation = validateStudioSchemaModel(projectData.ir.schema);
    const flowValidation = validateStudioFlowGraph(projectData.ir.flows);

    res.json({
      success: true,
      compiled,
      drizzleCode,
      schemaValidation,
      flowValidation,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Studio compilation failed.' });
  }
});

// 7. Promote Studio Project to Code / AI Workspace
router.post('/api/studio/projects/:id/promote', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const { targetBranch } = req.body;

    const promoResult = await promoteStudioProjectToWorkspace({
      projectId: req.params.id,
      tenantId,
      promotedBy: userId,
      targetBranch,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, {
      action: 'PROMOTE_STUDIO_PROJECT',
      projectId: req.params.id,
      workspaceProjectId: promoResult.workspaceProjectId,
    });

    res.json({ success: true, ...promoResult });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Studio promotion failed.' });
  }
});

// 8. Bounded Code Importer
router.post('/api/studio/projects/:id/import', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const { code } = req.body;

    const importRes = importCodeToStudioSubset(code, req.params.id, tenantId);
    res.json({ success: true, ...importRes });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Studio code import failed.' });
  }
});

// 9. Simulate Flow Execution
router.post('/api/studio/projects/:id/simulate-flow', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { flowGraph, initialInput } = req.body;
    const simRes = simulateFlowExecution(flowGraph, initialInput);
    res.json({ success: true, ...simRes });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Flow simulation failed.' });
  }
});

// 10. Phase 2 — Asset Management
router.get('/api/studio/projects/:id/assets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    res.json({ success: true, assets: [] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list assets.' });
  }
});

router.post('/api/studio/projects/:id/assets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { filename, mimeType, fileSize, base64Data } = req.body;
    const { validateAssetUpload } = await import('../src/lib/studio/studioPhase2Engine');
    const validation = validateAssetUpload(filename || 'image.png', fileSize || 1024, mimeType || 'image/png');

    if (!validation.safe) {
      return res.status(400).json({ error: validation.reason });
    }

    const assetId = `asset_${Date.now()}`;
    const storageUrl = `https://storage.oprox.internal/${tenantId}/${req.params.id}/${assetId}_${filename}`;

    res.json({
      success: true,
      asset: {
        id: assetId,
        tenantId,
        projectId: req.params.id,
        filename,
        fileType: mimeType,
        fileSize,
        storageUrl,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Asset upload failed.' });
  }
});

// 11. Phase 2 — Safe API Preview
router.post('/api/studio/projects/:id/preview-api', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { url, method } = req.body;
    const { validateApiUrl } = await import('../src/lib/studio/studioPhase2Engine');
    const urlCheck = validateApiUrl(url);

    if (!urlCheck.safe) {
      return res.status(400).json({ error: `SSRF_BLOCKED: ${urlCheck.reason}` });
    }

    res.json({
      success: true,
      previewResponse: {
        status: 200,
        statusText: 'OK',
        data: { mockPreview: true, url, method: method || 'GET', timestamp: new Date().toISOString() },
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'API Preview request failed.' });
  }
});

// 12. Phase 2 — Design & Code Sync Check
router.post('/api/studio/projects/:id/sync-check', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { codeContent } = req.body;
    const { classifyCodeRegions } = await import('../src/lib/studio/studioPhase2Engine');
    const regions = classifyCodeRegions(codeContent || '');

    const hasProtected = regions.some((r) => r.type === 'CUSTOM_PROTECTED');

    res.json({
      success: true,
      syncStatus: hasProtected ? 'PARTIAL_IMPORT' : 'SAFE_TO_IMPORT',
      regions,
    });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Sync check failed.' });
  }
});

// 13. Phase 2 — Revision Comparison / Design Diff
router.post('/api/studio/projects/:id/revisions/compare', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { targetIr } = req.body;
    const { calculateDesignDiff } = await import('../src/lib/studio/studioPhase2Engine');
    const diff = calculateDesignDiff(projectData.ir, targetIr || projectData.ir);

    res.json({ success: true, diff });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Revision comparison failed.' });
  }
});

// 14. Phase 3 — Full-Stack Bundle Generator
router.post('/api/studio/projects/:id/fullstack-bundle', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { isKillSwitchActive } = await import('../src/lib/killSwitch');
    if (await isKillSwitchActive('code_studio') || await isKillSwitchActive('deployments')) {
      return res.status(503).json({ error: 'GLOBAL_KILLSWITCH_ACTIVE: Studio Phase 3 operations suspended.' });
    }

    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { generateFullStackBundle } = await import('../src/lib/studio/studioPhase3Engine');
    const bundle = generateFullStackBundle(projectData.ir);

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'GENERATE_STUDIO_BUNDLE', projectId: req.params.id });
    res.json({ success: true, bundle });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Full-stack bundle generation failed.' });
  }
});

// 15. Phase 3 — Workspace Export Engine
router.post('/api/studio/projects/:id/export-workspace', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { isKillSwitchActive } = await import('../src/lib/killSwitch');
    if (await isKillSwitchActive('code_studio') || await isKillSwitchActive('deployments')) {
      return res.status(503).json({ error: 'GLOBAL_KILLSWITCH_ACTIVE: Studio Phase 3 operations suspended.' });
    }

    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { exportStudioToWorkspace } = await import('../src/lib/studio/studioPhase3Engine');
    const exportResult = exportStudioToWorkspace(projectData.ir, userId);

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'EXPORT_STUDIO_WORKSPACE', projectId: req.params.id });
    res.json({ success: true, ...exportResult });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Workspace export failed.' });
  }
});

// 16. Phase 3 — Cloud Deployment Engine
router.post('/api/studio/projects/:id/deploy', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { isKillSwitchActive } = await import('../src/lib/killSwitch');
    if (await isKillSwitchActive('deployments')) {
      return res.status(503).json({ error: 'GLOBAL_KILLSWITCH_ACTIVE: Studio Phase 3 operations suspended.' });
    }

    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { environment } = req.body;
    const targetEnv = environment === 'production' ? 'production' : 'staging';

    const { deployStudioApp } = await import('../src/lib/studio/studioPhase3Engine');
    const deployment = await deployStudioApp(
      req.params.id,
      tenantId,
      `rev_${projectData.meta.activeRevisionNumber}`,
      targetEnv,
      userId,
      projectData.ir
    );

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'DEPLOY_STUDIO_APP', projectId: req.params.id, deploymentId: deployment.id });
    res.json({ success: true, deployment });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Studio Cloud deployment failed.' });
  }
});

// 17. Phase 3 — List Deployments
router.get('/api/studio/projects/:id/deployments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { listStudioDeployments } = await import('../src/lib/studio/studioPhase3Engine');
    const deployments = listStudioDeployments(req.params.id);

    res.json({ success: true, deployments });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list deployments.' });
  }
});

// 18. Phase 3 — Automated Rollback
router.post('/api/studio/projects/:id/rollback', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { isKillSwitchActive } = await import('../src/lib/killSwitch');
    if (await isKillSwitchActive('deployments')) {
      return res.status(503).json({ error: 'GLOBAL_KILLSWITCH_ACTIVE: Studio Phase 3 operations suspended.' });
    }

    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;

    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { targetDeploymentId } = req.body;
    if (!targetDeploymentId) {
      return res.status(400).json({ error: 'Field "targetDeploymentId" string is required.' });
    }

    const { rollbackStudioDeployment } = await import('../src/lib/studio/studioPhase3Engine');
    const rollbackResult = await rollbackStudioDeployment(req.params.id, tenantId, targetDeploymentId, userId);

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'ROLLBACK_STUDIO_APP', projectId: req.params.id, targetDeploymentId });
    res.json({ success: true, ...rollbackResult });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Deployment rollback failed.' });
  }
});

// 19. Phase 3 — Domain Publishing
router.post('/api/studio/projects/:id/domains', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { isKillSwitchActive } = await import('../src/lib/killSwitch');
    if (await isKillSwitchActive('deployments')) {
      return res.status(503).json({ error: 'GLOBAL_KILLSWITCH_ACTIVE: Studio Phase 3 operations suspended.' });
    }

    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { deploymentId, domainName } = req.body;
    if (!deploymentId || !domainName) {
      return res.status(400).json({ error: 'Fields "deploymentId" and "domainName" strings are required.' });
    }

    const { publishStudioAppDomain } = await import('../src/lib/studio/studioPhase3Engine');
    const publishedDomain = await publishStudioAppDomain(req.params.id, tenantId, deploymentId, domainName);

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'PUBLISH_STUDIO_DOMAIN', projectId: req.params.id, domainName });
    res.json({ success: true, domain: publishedDomain });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Domain publishing failed.' });
  }
});

// 20. Phase 3 — Live Observability
router.get('/api/studio/deployments/:id/observability', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { isKillSwitchActive } = await import('../src/lib/killSwitch');
    if (await isKillSwitchActive('deployments')) {
      return res.status(503).json({ error: 'GLOBAL_KILLSWITCH_ACTIVE: Studio Phase 3 operations suspended.' });
    }

    const { getStudioDeploymentObservability } = await import('../src/lib/studio/studioPhase3Engine');
    const metrics = getStudioDeploymentObservability(req.params.id);

    res.json({ success: true, metrics });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to load observability metrics.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// OPROX STUDIO PHASE 4 ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────

// In-memory fallback stores for Phase 4 persistent entities in memory mode / tests
const inMemoryComments: any[] = [];
const inMemoryExperiments: any[] = [];
const inMemoryReviews: any[] = [];
const inMemorySyncConflicts: any[] = [];
const inMemoryPromotionTraces: any[] = [];

// 21. Phase 4 — Design Comments
router.get('/api/studio/projects/:id/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const comments = inMemoryComments.filter((c) => c.projectId === req.params.id && c.tenantId === tenantId);
    res.json({ success: true, comments });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list design comments.' });
  }
});

router.post('/api/studio/projects/:id/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { content, pageId, nodeId, revisionId, parentCommentId } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Field "content" string is required.' });
    }

    const comment = {
      id: `cmt_${Math.random().toString(36).substring(2, 9)}`,
      tenantId,
      projectId: req.params.id,
      pageId: pageId || null,
      nodeId: nodeId || null,
      revisionId: revisionId || null,
      authorId: userId,
      authorName: req.user?.email || 'Authenticated User',
      content,
      status: 'OPEN',
      parentCommentId: parentCommentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryComments.push(comment);
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_STUDIO_COMMENT', projectId: req.params.id, commentId: comment.id });
    res.json({ success: true, comment });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create comment.' });
  }
});

router.patch('/api/studio/comments/:commentId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const comment = inMemoryComments.find((c) => c.id === req.params.commentId);
    if (!comment || comment.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Comment not found or access denied.' });
    }

    const { status, content } = req.body;
    if (status) comment.status = status;
    if (content) comment.content = content;
    comment.updatedAt = new Date().toISOString();

    res.json({ success: true, comment });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update comment.' });
  }
});

// 22. Phase 4 — Design Experiments
router.get('/api/studio/projects/:id/experiments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const experiments = inMemoryExperiments.filter((e) => e.projectId === req.params.id && e.tenantId === tenantId);
    res.json({ success: true, experiments });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list experiments.' });
  }
});

router.post('/api/studio/projects/:id/experiments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const userId = req.user!.id;
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { name, description, irSnapshot } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Field "name" string is required.' });
    }

    const experiment = {
      id: `expm_${Math.random().toString(36).substring(2, 9)}`,
      tenantId,
      projectId: req.params.id,
      name,
      description: description || '',
      irSnapshotJson: irSnapshot || projectData.ir,
      status: 'ACTIVE',
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inMemoryExperiments.push(experiment);
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'CREATE_STUDIO_EXPERIMENT', projectId: req.params.id, experimentId: experiment.id });
    res.json({ success: true, experiment });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create experiment.' });
  }
});

router.post('/api/studio/experiments/:expId/promote', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const experiment = inMemoryExperiments.find((e) => e.id === req.params.expId);
    if (!experiment || experiment.tenantId !== tenantId) {
      return res.status(404).json({ error: 'Experiment not found or access denied.' });
    }

    experiment.status = 'PROMOTED';
    experiment.updatedAt = new Date().toISOString();

    // Save promoted IR as a new revision on project
    const saveResult = await saveStudioProjectIr({
      projectId: experiment.projectId,
      tenantId,
      authorId: req.user!.id,
      baseRevisionNumber: 0, // Force save
      updatedIr: experiment.irSnapshotJson,
      changeSummary: `Promoted Studio experiment "${experiment.name}"`,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'PROMOTE_STUDIO_EXPERIMENT', experimentId: experiment.id });
    res.json({ success: true, experiment, saveResult });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to promote experiment.' });
  }
});

// 23. Phase 4 — Three-Way Design/Code Synchronization
router.post('/api/studio/projects/:id/sync/analyze', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { filePath, baseSource, studioSource, codeSource } = req.body;
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'Field "filePath" string is required.' });
    }

    const { analyzeThreeWaySync } = await import('../src/lib/studio/studioPhase4Engine');
    const syncAnalysis = analyzeThreeWaySync(filePath, baseSource || '', studioSource || '', codeSource || '');

    if (syncAnalysis.classification === 'CONFLICT') {
      const conflictRecord = {
        id: `cfl_${Math.random().toString(36).substring(2, 9)}`,
        tenantId,
        projectId: req.params.id,
        filePath,
        baseHash: syncAnalysis.baseHash,
        studioHash: syncAnalysis.studioHash,
        codeHash: syncAnalysis.codeHash,
        classification: 'CONFLICT',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      inMemorySyncConflicts.push(conflictRecord);
    }

    res.json({ success: true, analysis: syncAnalysis });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Three-way sync analysis failed.' });
  }
});

router.post('/api/studio/projects/:id/sync/resolve', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { conflictId, strategy } = req.body;
    if (!conflictId || !['KEEP_STUDIO', 'KEEP_CODE', 'MERGE'].includes(strategy)) {
      return res.status(400).json({ error: 'Valid "conflictId" and "strategy" (KEEP_STUDIO | KEEP_CODE | MERGE) required.' });
    }

    const conflict = inMemorySyncConflicts.find((c) => c.id === conflictId && c.projectId === req.params.id);
    if (conflict) {
      conflict.status = 'RESOLVED';
      conflict.resolutionStrategy = strategy;
      conflict.resolvedBy = req.user!.id;
      conflict.resolvedAt = new Date().toISOString();
    }

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'RESOLVE_SYNC_CONFLICT', projectId: req.params.id, conflictId, strategy });
    res.json({ success: true, resolved: true, strategy });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Sync resolution failed.' });
  }
});

// 24. Phase 4 — Reviews & RBAC
router.get('/api/studio/projects/:id/reviews', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const reviews = inMemoryReviews.filter((r) => r.projectId === req.params.id && r.tenantId === tenantId);
    res.json({ success: true, reviews });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to list reviews.' });
  }
});

router.post('/api/studio/projects/:id/reviews', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { revisionId, status, feedback } = req.body;
    if (!revisionId || !['APPROVED', 'CHANGES_REQUESTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Valid "revisionId" and "status" required.' });
    }

    const review = {
      id: `rev_${Math.random().toString(36).substring(2, 9)}`,
      tenantId,
      projectId: req.params.id,
      revisionId,
      reviewerId: req.user!.id,
      reviewerName: req.user?.email || 'Reviewer',
      status,
      feedback: feedback || '',
      createdAt: new Date().toISOString(),
    };

    inMemoryReviews.push(review);
    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'SUBMIT_STUDIO_REVIEW', projectId: req.params.id, reviewId: review.id, status });
    res.json({ success: true, review });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to submit review.' });
  }
});

// 25. Phase 4 — Responsive Audit
router.get('/api/studio/projects/:id/responsive-audit', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { validateResponsiveLayout } = await import('../src/lib/studio/studioPhase4Engine');
    const findings = validateResponsiveLayout(projectData.ir);

    res.json({ success: true, findings });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Responsive audit failed.' });
  }
});

// 26. Phase 4 — Token Dependency Graph
router.get('/api/studio/projects/:id/token-graph', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { buildTokenDependencyGraph } = await import('../src/lib/studio/studioPhase4Engine');
    const graph = buildTokenDependencyGraph(projectData.ir.tokens);

    res.json({ success: true, graph });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to build token dependency graph.' });
  }
});

// 27. Phase 4 — Governed Copilot AI Proposal
router.post('/api/studio/projects/:id/copilot/propose', requireAuth, aiGovernanceGate, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Field "prompt" string is required.' });
    }

    const { generateStudioAiChangeset } = await import('../src/lib/studio/studioPhase4Engine');
    const changeset = generateStudioAiChangeset(projectData.ir, prompt);

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'GENERATE_STUDIO_AI_PROPOSAL', projectId: req.params.id, prompt });
    res.json({ success: true, changeset });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'AI proposal generation failed.' });
  }
});

// 28. Phase 4 — Governed Code Promotion
router.post('/api/studio/projects/:id/promote-governed', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = req.user?.orgId || req.user?.id || 'tenant_default';
    const projectData = await getStudioProjectIr(req.params.id, tenantId);
    if (!projectData) return res.status(404).json({ error: 'Studio project not found or access denied.' });

    const { revisionId, workspaceId } = req.body;
    if (!revisionId || typeof revisionId !== 'string') {
      return res.status(400).json({ error: 'Field "revisionId" string is required.' });
    }

    const { executeGovernedPromotion } = await import('../src/lib/studio/studioPhase4Engine');
    const promotionTrace = executeGovernedPromotion(projectData.ir, revisionId, workspaceId || 'ws_default');

    inMemoryPromotionTraces.push({
      ...promotionTrace,
      tenantId,
    });

    logSecurityAudit('PRIVILEGED_ADMIN_ACTION', req, { action: 'GOVERNED_STUDIO_PROMOTION', projectId: req.params.id, revisionId });
    res.json({ success: true, trace: promotionTrace });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Governed promotion failed.' });
  }
});

export default router;
