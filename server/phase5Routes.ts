import { Router } from 'express';
import { AuthRequest, requireAuth } from './auth';
import { logSecurityAudit } from './audit';
import { checkDevelopmentPermission } from '../src/lib/phase5Rbac';
import { classifyChangeRisk, checkAiAutonomyGate } from '../src/lib/phase5AutonomyEngine';
import {
  computeContentHash,
  evaluateApprovalCriteria,
  validateApprovalEligibility,
} from '../src/lib/phase5ApprovalEngine';
import { resolveRequiredCodeOwners } from '../src/lib/phase5CodeOwners';
import { validateGovernancePolicy } from '../src/lib/phase5PolicyAsCode';
import {
  createTeamInStore,
  getTeamsInStore,
  renameTeamInStore,
  archiveTeamInStore,
  addMemberInStore,
  getMembersInStore,
  suspendMemberInStore,
  transferOwnershipInStore,
  createChangeRequestInStore,
  getChangeRequestsInStore,
  getChangeRequestByIdInStore,
  updateChangeRequestInStore,
  addApprovalInStore,
  getApprovalsByCrInStore,
  invalidateApprovalsForCrInStore,
  addCommentInStore,
  getCommentsByCrInStore,
  setCodeOwnersInStore,
  getCodeOwnersInStore,
  getAutonomyConfigInStore,
  updateAutonomyConfigInStore,
  logCollaborationEventInStore,
  getCollaborationEventsInStore,
} from '../src/lib/phase5Store';
import { isKillSwitchActive } from '../src/lib/killSwitch';
import { isCostGuardExceeded } from '../src/lib/costGuard';
import { checkAiWalletBalance } from '../src/lib/aiWallet';

const router = Router();

function getAuthenticatedTenant(req: AuthRequest): string {
  if (!req.user || !req.user.id) {
    throw new Error('UNAUTHENTICATED');
  }
  return req.user.orgId || `org_${req.user.id}`;
}

// ── 1. Team & Workspace Management ────────────────────────────────────────
router.post('/api/phase5/teams', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Team name is required.' });
    }

    const perm = await checkDevelopmentPermission(tenantId, req.user!.id, req.user!.role, 'TEAM_MANAGE');
    if (!perm.allowed) {
      return res.status(403).json({ error: perm.reason });
    }

    const teamId = `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const team = await createTeamInStore({
      id: teamId,
      tenantId,
      orgId: tenantId,
      name: name.trim(),
      description,
    });

    await logCollaborationEventInStore({
      id: `evt_${Date.now()}`,
      tenantId,
      orgId: tenantId,
      actorId: req.user!.id,
      action: 'TEAM_CREATED',
      resource: 'TEAM',
      resourceId: teamId,
      details: { name: name.trim() },
    });

    res.json({ team });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create team.' });
  }
});

router.get('/api/phase5/teams', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const teams = await getTeamsInStore(tenantId);
    res.json({ teams });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to fetch teams.' });
  }
});

router.put('/api/phase5/teams/:teamId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { teamId } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Updated team name is required.' });
    }

    const perm = await checkDevelopmentPermission(tenantId, req.user!.id, req.user!.role, 'TEAM_MANAGE');
    if (!perm.allowed) {
      return res.status(403).json({ error: perm.reason });
    }

    const updated = await renameTeamInStore(tenantId, teamId, name.trim());
    if (!updated) {
      return res.status(404).json({ error: 'Team not found in tenant.' });
    }

    res.json({ team: updated });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update team.' });
  }
});

router.delete('/api/phase5/teams/:teamId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { teamId } = req.params;

    const perm = await checkDevelopmentPermission(tenantId, req.user!.id, req.user!.role, 'TEAM_MANAGE');
    if (!perm.allowed) {
      return res.status(403).json({ error: perm.reason });
    }

    const archived = await archiveTeamInStore(tenantId, teamId);
    res.json({ success: true, team: archived });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to archive team.' });
  }
});

// ── 2. Member & Ownership Management ─────────────────────────────────────
router.post('/api/phase5/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { userId, roles, permissions, teamId } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required.' });
    }

    const perm = await checkDevelopmentPermission(tenantId, req.user!.id, req.user!.role, 'MEMBER_MANAGE');
    if (!perm.allowed) {
      return res.status(403).json({ error: perm.reason });
    }

    const memberId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const member = await addMemberInStore({
      id: memberId,
      tenantId,
      orgId: tenantId,
      userId,
      teamId,
      roles: roles || ['Developer'],
      permissions: permissions || [],
    });

    res.json({ member });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to add member.' });
  }
});

router.get('/api/phase5/members', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const members = await getMembersInStore(tenantId);
    res.json({ members });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to fetch members.' });
  }
});

router.put('/api/phase5/members/:userId/suspend', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { userId } = req.params;

    const perm = await checkDevelopmentPermission(tenantId, req.user!.id, req.user!.role, 'MEMBER_MANAGE');
    if (!perm.allowed) {
      return res.status(403).json({ error: perm.reason });
    }

    const result = await suspendMemberInStore(tenantId, userId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to suspend member.' });
  }
});

router.post('/api/phase5/members/transfer-ownership', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { newOwnerId } = req.body;

    if (!newOwnerId || typeof newOwnerId !== 'string') {
      return res.status(400).json({ error: 'newOwnerId is required.' });
    }

    // Only current Owner or superadmin can transfer ownership
    const roleStr = req.user!.role as string;
    if (roleStr !== 'superadmin' && roleStr !== 'owner' && roleStr !== 'Owner') {
      return res.status(403).json({ error: 'Only Organization Owners can transfer primary ownership.' });
    }

    const result = await transferOwnershipInStore(tenantId, req.user!.id, newOwnerId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to transfer ownership.' });
  }
});

// ── 3. Change Requests & AI Proposals ─────────────────────────────────────
router.post('/api/phase5/change-requests', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { title, description, filesChanged, authorType, projectId, workspaceId } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Change request title is required.' });
    }

    const files = Array.isArray(filesChanged) ? filesChanged : [];

    // Deterministic Risk Classification
    const riskResult = classifyChangeRisk(files);
    const contentHash = computeContentHash(files);

    // AI Proposal Meta if author is AI agent
    let aiProposalMeta: any = {};
    if (authorType === 'ai_agent') {
      const autonomyConfig = await getAutonomyConfigInStore(tenantId);
      const gate = await checkAiAutonomyGate(
        tenantId,
        req.user!.id,
        autonomyConfig.autonomyLevel,
        riskResult.riskLevel
      );

      if (!gate.allowed) {
        return res.status(429).json({ error: gate.reason, code: gate.denialCode });
      }

      aiProposalMeta = {
        agentId: 'agent_oprox_coder_v5',
        originatingTask: 'Autonomous Patch Generation',
        testsAffected: ['tests/phase5-complete.test.ts'],
        securityImpact: riskResult.riskLevel === 'CRITICAL' ? 'HIGH_ATTENTION_REQUIRED' : 'STANDARD',
        estimatedAiCostUsd: '0.0025',
      };
    }

    const crId = `cr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const cr = await createChangeRequestInStore({
      id: crId,
      tenantId,
      orgId: tenantId,
      projectId: projectId || 'proj_oprox_code',
      workspaceId: workspaceId || 'ws_default',
      authorId: req.user!.id,
      authorType: authorType || 'user',
      sourceBranch: 'feature/patch',
      targetBranch: 'main',
      title: title.trim(),
      description: description || '',
      filesChanged: files,
      diffMetadata: { filesCount: files.length },
      riskClassification: riskResult.riskLevel,
      riskReasons: riskResult.reasons,
      status: 'OPEN',
      aiProposalMeta,
      contentHash,
    });

    await logCollaborationEventInStore({
      id: `evt_${Date.now()}`,
      tenantId,
      orgId: tenantId,
      actorId: req.user!.id,
      actorType: authorType === 'ai_agent' ? 'ai_agent' : 'user',
      action: 'CHANGE_REQUEST_CREATED',
      resource: 'CHANGE_REQUEST',
      resourceId: crId,
      risk: riskResult.riskLevel,
      details: { title: title.trim(), riskLevel: riskResult.riskLevel },
    });

    res.json({ changeRequest: cr });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to create change request.' });
  }
});

router.get('/api/phase5/change-requests', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const crs = await getChangeRequestsInStore(tenantId);
    res.json({ changeRequests: crs });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to fetch change requests.' });
  }
});

router.get('/api/phase5/change-requests/:crId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { crId } = req.params;

    const cr = await getChangeRequestByIdInStore(tenantId, crId);
    if (!cr) {
      return res.status(404).json({ error: 'Change request not found or access denied.' });
    }

    const approvals = await getApprovalsByCrInStore(tenantId, crId);
    const comments = await getCommentsByCrInStore(tenantId, crId);

    const evaluation = await evaluateApprovalCriteria(
      {
        id: cr.id,
        tenantId: cr.tenantId,
        changeRequestId: cr.id,
        authorId: cr.authorId,
        authorType: cr.authorType as 'user' | 'ai_agent',
        riskClassification: cr.riskClassification as any,
        contentHash: cr.contentHash || '',
      },
      approvals
    );

    res.json({ changeRequest: cr, approvals, comments, approvalEvaluation: evaluation });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to fetch change request details.' });
  }
});

router.put('/api/phase5/change-requests/:crId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { crId } = req.params;
    const { filesChanged, title, description, status } = req.body;

    const cr = await getChangeRequestByIdInStore(tenantId, crId);
    if (!cr) {
      return res.status(404).json({ error: 'Change request not found or access denied.' });
    }

    const updates: any = {};
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status) updates.status = status;

    if (filesChanged && Array.isArray(filesChanged)) {
      const newFiles = filesChanged;
      const newHash = computeContentHash(newFiles);

      if (newHash !== cr.contentHash) {
        updates.filesChanged = newFiles;
        updates.contentHash = newHash;

        // Re-classify risk for modified files
        const riskResult = classifyChangeRisk(newFiles);
        updates.riskClassification = riskResult.riskLevel;
        updates.riskReasons = riskResult.reasons;

        // Invalidate previous approvals because diff materially changed
        await invalidateApprovalsForCrInStore(tenantId, crId);

        await logCollaborationEventInStore({
          id: `evt_${Date.now()}`,
          tenantId,
          orgId: tenantId,
          actorId: req.user!.id,
          action: 'APPROVALS_INVALIDATED',
          resource: 'CHANGE_REQUEST',
          resourceId: crId,
          details: { reason: 'Material content change in change request diff.' },
        });
      }
    }

    const updatedCr = await updateChangeRequestInStore(tenantId, crId, updates);
    res.json({ changeRequest: updatedCr });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update change request.' });
  }
});

// ── 4. Approvals & Human-in-the-Loop ──────────────────────────────────────
router.post('/api/phase5/change-requests/:crId/approvals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { crId } = req.params;
    const { decision, comment } = req.body;

    if (!decision || !['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ error: 'Decision must be "APPROVED" or "REJECTED".' });
    }

    const cr = await getChangeRequestByIdInStore(tenantId, crId);
    if (!cr) {
      return res.status(404).json({ error: 'Change request not found or access denied.' });
    }

    // Approver identity MUST strictly originate from req.user.id
    const approverId = req.user!.id;

    // Validate Segregation of Duties & RBAC
    const eligibility = await validateApprovalEligibility(tenantId, approverId, req.user!.role, {
      id: cr.id,
      tenantId: cr.tenantId,
      changeRequestId: cr.id,
      authorId: cr.authorId,
      authorType: cr.authorType as any,
      riskClassification: cr.riskClassification as any,
      contentHash: cr.contentHash || '',
    });

    if (!eligibility.eligible) {
      return res.status(403).json({ error: eligibility.reason });
    }

    const approvalId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const approval = await addApprovalInStore({
      id: approvalId,
      tenantId,
      changeRequestId: crId,
      approverId,
      approverRole: req.user!.role,
      decision,
      comment: comment || '',
      approvedContentHash: cr.contentHash || '',
    });

    await logCollaborationEventInStore({
      id: `evt_${Date.now()}`,
      tenantId,
      orgId: tenantId,
      actorId: approverId,
      action: decision === 'APPROVED' ? 'APPROVAL_GRANTED' : 'APPROVAL_REJECTED',
      resource: 'CHANGE_REQUEST',
      resourceId: crId,
      risk: cr.riskClassification,
      details: { decision, comment },
    });

    // Check if CR can now be marked APPROVED
    const allApprovals = await getApprovalsByCrInStore(tenantId, crId);
    const evaluation = await evaluateApprovalCriteria(
      {
        id: cr.id,
        tenantId: cr.tenantId,
        changeRequestId: cr.id,
        authorId: cr.authorId,
        authorType: cr.authorType as any,
        riskClassification: cr.riskClassification as any,
        contentHash: cr.contentHash || '',
      },
      allApprovals
    );

    if (evaluation.canMergeOrDeploy && cr.status === 'OPEN') {
      await updateChangeRequestInStore(tenantId, crId, { status: 'APPROVED' });
    }

    res.json({ approval, approvalEvaluation: evaluation });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to submit approval.' });
  }
});

// ── 5. Comments & Reviews ────────────────────────────────────────────────
router.post('/api/phase5/change-requests/:crId/comments', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { crId } = req.params;
    const { content, filePath, lineNumber, type } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Comment content is required.' });
    }

    const commentId = `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const comment = await addCommentInStore({
      id: commentId,
      tenantId,
      changeRequestId: crId,
      authorId: req.user!.id,
      type: type || 'comment',
      filePath,
      lineNumber: lineNumber ? parseInt(lineNumber, 10) : undefined,
      content: content.trim(),
    });

    res.json({ comment });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to add comment.' });
  }
});

// ── 6. Code Ownership & Path Rules ────────────────────────────────────────
router.post('/api/phase5/code-owners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { projectId, pathPattern, ownerType, ownerTarget } = req.body;

    if (!pathPattern || !ownerType || !ownerTarget) {
      return res.status(400).json({ error: 'pathPattern, ownerType, and ownerTarget are required.' });
    }

    const ruleId = `co_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const rules = await setCodeOwnersInStore([
      {
        id: ruleId,
        tenantId,
        projectId: projectId || 'proj_oprox_code',
        pathPattern,
        ownerType,
        ownerTarget,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    res.json({ codeOwners: rules });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to set code owners.' });
  }
});

router.get('/api/phase5/code-owners', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const owners = await getCodeOwnersInStore(tenantId);
    res.json({ codeOwners: owners });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to fetch code owners.' });
  }
});

// ── 7. Autonomy Policy & Governance ───────────────────────────────────────
router.get('/api/phase5/autonomy', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const config = await getAutonomyConfigInStore(tenantId);
    res.json({ autonomyConfig: config });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to fetch autonomy configuration.' });
  }
});

router.put('/api/phase5/autonomy', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const { autonomyLevel, allowSelfEdit, maxAiCostPerTaskUsd } = req.body;

    const perm = await checkDevelopmentPermission(tenantId, req.user!.id, req.user!.role, 'AI_POLICY_MANAGE');
    if (!perm.allowed) {
      return res.status(403).json({ error: perm.reason });
    }

    if (autonomyLevel !== undefined && (autonomyLevel < 0 || autonomyLevel > 4)) {
      return res.status(400).json({ error: 'Autonomy level must be an integer between 0 and 4.' });
    }

    const updated = await updateAutonomyConfigInStore(tenantId, {
      autonomyLevel,
      allowSelfEdit,
      maxAiCostPerTaskUsd,
    });

    res.json({ autonomyConfig: updated });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to update autonomy configuration.' });
  }
});

// ── 8. Activity Timeline & Enterprise Audit Explorer ───────────────────────
router.get('/api/phase5/events', requireAuth, async (req: AuthRequest, res) => {
  try {
    const tenantId = getAuthenticatedTenant(req);
    const events = await getCollaborationEventsInStore(tenantId);
    res.json({ events });
  } catch (err: any) {
    res.status(400).json({ error: err?.message || 'Failed to fetch collaboration events.' });
  }
});

export default router;
