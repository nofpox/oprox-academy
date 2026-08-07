import { db } from '../db';
import {
  phase5TeamsTable,
  phase5MembershipsTable,
  phase5WorkspacesTable,
  phase5ChangeRequestsTable,
  phase5ApprovalsTable,
  phase5ReviewsCommentsTable,
  phase5CodeOwnersTable,
  phase5PoliciesTable,
  phase5AutonomyConfigTable,
  phase5EventsTable,
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logStructured } from './logger';
import { DEFAULT_GOVERNANCE_POLICY } from './phase5PolicyAsCode';

// In-Memory Fallback Stores for isolated unit tests / development without Postgres
const memoryTeams: any[] = [];
const memoryMemberships: any[] = [];
const memoryWorkspaces: any[] = [];
const memoryChangeRequests: any[] = [];
const memoryApprovals: any[] = [];
const memoryComments: any[] = [];
const memoryCodeOwners: any[] = [];
const memoryPolicies: any[] = [];
const memoryAutonomyConfig: Map<string, any> = new Map();
const memoryEvents: any[] = [];

export function clearPhase5MemoryStore(): void {
  memoryTeams.length = 0;
  memoryMemberships.length = 0;
  memoryWorkspaces.length = 0;
  memoryChangeRequests.length = 0;
  memoryApprovals.length = 0;
  memoryComments.length = 0;
  memoryCodeOwners.length = 0;
  memoryPolicies.length = 0;
  memoryAutonomyConfig.clear();
  memoryEvents.length = 0;
}

// ── Teams ─────────────────────────────────────────────────────────────────
export async function createTeamInStore(team: {
  id: string;
  tenantId: string;
  orgId: string;
  name: string;
  description?: string;
}) {
  const row = {
    id: team.id,
    tenantId: team.tenantId,
    orgId: team.orgId,
    name: team.name,
    description: team.description || null,
    archived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryTeams.push(row);

  if (db) {
    try {
      await db.insert(phase5TeamsTable).values(row as any);
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_CREATE_TEAM_FAILED', { error: err?.message || err });
    }
  }

  return row;
}

export async function getTeamsInStore(tenantId: string) {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase5TeamsTable)
        .where(eq(phase5TeamsTable.tenantId, tenantId));
      if (rows.length > 0) return rows;
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_GET_TEAMS_FAILED', { error: err?.message || err });
    }
  }

  return memoryTeams.filter((t) => t.tenantId === tenantId && !t.archived);
}

export async function renameTeamInStore(tenantId: string, teamId: string, name: string) {
  const team = memoryTeams.find((t) => t.tenantId === tenantId && t.id === teamId);
  if (team) {
    team.name = name;
    team.updatedAt = new Date();
  }

  if (db) {
    try {
      await db
        .update(phase5TeamsTable)
        .set({ name, updatedAt: new Date() })
        .where(and(eq(phase5TeamsTable.tenantId, tenantId), eq(phase5TeamsTable.id, teamId)));
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_RENAME_TEAM_FAILED', { error: err?.message || err });
    }
  }

  return team || null;
}

export async function archiveTeamInStore(tenantId: string, teamId: string) {
  const team = memoryTeams.find((t) => t.tenantId === tenantId && t.id === teamId);
  if (team) {
    team.archived = true;
    team.updatedAt = new Date();
  }

  if (db) {
    try {
      await db
        .update(phase5TeamsTable)
        .set({ archived: true, updatedAt: new Date() })
        .where(and(eq(phase5TeamsTable.tenantId, tenantId), eq(phase5TeamsTable.id, teamId)));
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_ARCHIVE_TEAM_FAILED', { error: err?.message || err });
    }
  }

  return team || null;
}

// ── Memberships ───────────────────────────────────────────────────────────
export async function addMemberInStore(member: {
  id: string;
  tenantId: string;
  orgId: string;
  userId: string;
  teamId?: string;
  projectId?: string;
  workspaceId?: string;
  roles?: string[];
  permissions?: string[];
  status?: string;
}) {
  const row = {
    id: member.id,
    tenantId: member.tenantId,
    orgId: member.orgId,
    userId: member.userId,
    teamId: member.teamId || null,
    projectId: member.projectId || null,
    workspaceId: member.workspaceId || null,
    roles: member.roles || ['Developer'],
    permissions: member.permissions || [],
    status: member.status || 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryMemberships.push(row);

  if (db) {
    try {
      await db.insert(phase5MembershipsTable).values(row as any);
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_ADD_MEMBER_FAILED', { error: err?.message || err });
    }
  }

  return row;
}

export async function getMembersInStore(tenantId: string) {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase5MembershipsTable)
        .where(eq(phase5MembershipsTable.tenantId, tenantId));
      if (rows.length > 0) return rows;
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_GET_MEMBERS_FAILED', { error: err?.message || err });
    }
  }

  return memoryMemberships.filter((m) => m.tenantId === tenantId);
}

export async function suspendMemberInStore(tenantId: string, userId: string) {
  const members = memoryMemberships.filter((m) => m.tenantId === tenantId && m.userId === userId);
  for (const m of members) {
    m.status = 'suspended';
    m.updatedAt = new Date();
  }

  if (db) {
    try {
      await db
        .update(phase5MembershipsTable)
        .set({ status: 'suspended', updatedAt: new Date() })
        .where(and(eq(phase5MembershipsTable.tenantId, tenantId), eq(phase5MembershipsTable.userId, userId)));
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_SUSPEND_MEMBER_FAILED', { error: err?.message || err });
    }
  }

  return { success: true };
}

export async function transferOwnershipInStore(tenantId: string, currentOwnerId: string, newOwnerId: string) {
  const members = await getMembersInStore(tenantId);
  const activeOwners = members.filter(
    (m) => m.status === 'active' && ((m.roles as string[]) || []).some((r) => r.toLowerCase() === 'owner')
  );

  // Safety check: Prevent removing last valid owner
  if (activeOwners.length <= 1 && activeOwners[0]?.userId === currentOwnerId && currentOwnerId !== newOwnerId) {
    // We must promote newOwnerId to owner FIRST before revoking currentOwnerId
    let newOwnerMember = members.find((m) => m.userId === newOwnerId);
    if (!newOwnerMember) {
      newOwnerMember = await addMemberInStore({
        id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tenantId,
        orgId: tenantId,
        userId: newOwnerId,
        roles: ['Owner'],
      });
    } else {
      newOwnerMember.roles = Array.from(new Set([...(newOwnerMember.roles || []), 'Owner']));
    }

    // Now currentOwnerId can safely be demoted or retained as Admin
    const currentMember = members.find((m) => m.userId === currentOwnerId);
    if (currentMember) {
      currentMember.roles = (currentMember.roles || []).filter((r: string) => r.toLowerCase() !== 'owner');
      if (currentMember.roles.length === 0) currentMember.roles.push('Admin');
    }

    return { success: true, newOwnerId, previousOwnerId: currentOwnerId };
  }

  return { success: true, newOwnerId, previousOwnerId: currentOwnerId };
}

// ── Change Requests ───────────────────────────────────────────────────────
export async function createChangeRequestInStore(cr: any) {
  const row = {
    id: cr.id,
    tenantId: cr.tenantId,
    orgId: cr.orgId || cr.tenantId,
    projectId: cr.projectId || 'proj_default',
    workspaceId: cr.workspaceId || 'ws_default',
    authorId: cr.authorId,
    authorType: cr.authorType || 'user',
    sourceBranch: cr.sourceBranch || 'feature',
    targetBranch: cr.targetBranch || 'main',
    title: cr.title,
    description: cr.description || '',
    filesChanged: cr.filesChanged || [],
    diffMetadata: cr.diffMetadata || {},
    riskClassification: cr.riskClassification || 'LOW',
    riskReasons: cr.riskReasons || [],
    status: cr.status || 'OPEN',
    aiProposalMeta: cr.aiProposalMeta || {},
    contentHash: cr.contentHash || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryChangeRequests.push(row);

  if (db) {
    try {
      await db.insert(phase5ChangeRequestsTable).values(row as any);
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_CREATE_CR_FAILED', { error: err?.message || err });
    }
  }

  return row;
}

export async function getChangeRequestsInStore(tenantId: string) {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase5ChangeRequestsTable)
        .where(eq(phase5ChangeRequestsTable.tenantId, tenantId))
        .orderBy(desc(phase5ChangeRequestsTable.createdAt));
      if (rows.length > 0) return rows;
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_GET_CRS_FAILED', { error: err?.message || err });
    }
  }

  return memoryChangeRequests.filter((cr) => cr.tenantId === tenantId);
}

export async function getChangeRequestByIdInStore(tenantId: string, crId: string) {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase5ChangeRequestsTable)
        .where(
          and(
            eq(phase5ChangeRequestsTable.tenantId, tenantId),
            eq(phase5ChangeRequestsTable.id, crId)
          )
        );
      if (rows.length > 0) return rows[0];
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_GET_CR_BY_ID_FAILED', { error: err?.message || err });
    }
  }

  return memoryChangeRequests.find((cr) => cr.tenantId === tenantId && cr.id === crId) || null;
}

export async function updateChangeRequestInStore(
  tenantId: string,
  crId: string,
  updates: Partial<any>
) {
  const cr = memoryChangeRequests.find((c) => c.tenantId === tenantId && c.id === crId);
  if (cr) {
    Object.assign(cr, updates, { updatedAt: new Date() });
  }

  if (db) {
    try {
      await db
        .update(phase5ChangeRequestsTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(
          and(
            eq(phase5ChangeRequestsTable.tenantId, tenantId),
            eq(phase5ChangeRequestsTable.id, crId)
          )
        );
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_UPDATE_CR_FAILED', { error: err?.message || err });
    }
  }

  return cr || null;
}

// ── Approvals & Invalidation ──────────────────────────────────────────────
export async function addApprovalInStore(approval: {
  id: string;
  tenantId: string;
  changeRequestId: string;
  approverId: string;
  approverRole?: string;
  decision: 'APPROVED' | 'REJECTED';
  comment?: string;
  approvedContentHash: string;
}) {
  const row = {
    id: approval.id,
    tenantId: approval.tenantId,
    changeRequestId: approval.changeRequestId,
    approverId: approval.approverId,
    approverRole: approval.approverRole || 'Developer',
    decision: approval.decision,
    comment: approval.comment || '',
    policyEvaluated: 'STANDARD_DEVELOPMENT_GOVERNANCE',
    approvedContentHash: approval.approvedContentHash,
    status: 'VALID',
    createdAt: new Date(),
  };

  memoryApprovals.push(row);

  if (db) {
    try {
      await db.insert(phase5ApprovalsTable).values(row as any);
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_ADD_APPROVAL_FAILED', { error: err?.message || err });
    }
  }

  return row;
}

export async function getApprovalsByCrInStore(tenantId: string, crId: string) {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase5ApprovalsTable)
        .where(
          and(
            eq(phase5ApprovalsTable.tenantId, tenantId),
            eq(phase5ApprovalsTable.changeRequestId, crId)
          )
        );
      if (rows.length > 0) return rows;
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_GET_APPROVALS_FAILED', { error: err?.message || err });
    }
  }

  return memoryApprovals.filter((a) => a.tenantId === tenantId && a.changeRequestId === crId);
}

export async function invalidateApprovalsForCrInStore(tenantId: string, crId: string) {
  for (const a of memoryApprovals) {
    if (a.tenantId === tenantId && a.changeRequestId === crId) {
      a.status = 'INVALIDATED';
    }
  }

  if (db) {
    try {
      await db
        .update(phase5ApprovalsTable)
        .set({ status: 'INVALIDATED' })
        .where(
          and(
            eq(phase5ApprovalsTable.tenantId, tenantId),
            eq(phase5ApprovalsTable.changeRequestId, crId)
          )
        );
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_INVALIDATE_APPROVALS_FAILED', { error: err?.message || err });
    }
  }
}

// ── Comments & Reviews ────────────────────────────────────────────────────
export async function addCommentInStore(comment: {
  id: string;
  tenantId: string;
  changeRequestId: string;
  authorId: string;
  type?: string;
  filePath?: string;
  lineNumber?: number;
  content: string;
}) {
  const row = {
    id: comment.id,
    tenantId: comment.tenantId,
    changeRequestId: comment.changeRequestId,
    authorId: comment.authorId,
    type: comment.type || 'comment',
    filePath: comment.filePath || null,
    lineNumber: comment.lineNumber || null,
    content: comment.content,
    resolved: false,
    resolvedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  memoryComments.push(row);

  if (db) {
    try {
      await db.insert(phase5ReviewsCommentsTable).values(row as any);
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_ADD_COMMENT_FAILED', { error: err?.message || err });
    }
  }

  return row;
}

export async function getCommentsByCrInStore(tenantId: string, crId: string) {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase5ReviewsCommentsTable)
        .where(
          and(
            eq(phase5ReviewsCommentsTable.tenantId, tenantId),
            eq(phase5ReviewsCommentsTable.changeRequestId, crId)
          )
        );
      if (rows.length > 0) return rows;
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_GET_COMMENTS_FAILED', { error: err?.message || err });
    }
  }

  return memoryComments.filter((c) => c.tenantId === tenantId && c.changeRequestId === crId);
}

// ── Code Owners ───────────────────────────────────────────────────────────
export async function setCodeOwnersInStore(rules: any[]) {
  for (const r of rules) {
    memoryCodeOwners.push(r);
    if (db) {
      try {
        await db.insert(phase5CodeOwnersTable).values(r as any);
      } catch (err: any) {
        logStructured('error', 'PHASE5_DB_SET_CODE_OWNER_FAILED', { error: err?.message || err });
      }
    }
  }
  return rules;
}

export async function getCodeOwnersInStore(tenantId: string) {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase5CodeOwnersTable)
        .where(eq(phase5CodeOwnersTable.tenantId, tenantId));
      if (rows.length > 0) return rows;
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_GET_CODE_OWNERS_FAILED', { error: err?.message || err });
    }
  }

  return memoryCodeOwners.filter((r) => r.tenantId === tenantId);
}

// ── Policies & Autonomy Config ────────────────────────────────────────────
export async function getAutonomyConfigInStore(tenantId: string) {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase5AutonomyConfigTable)
        .where(eq(phase5AutonomyConfigTable.tenantId, tenantId));
      if (rows.length > 0) return rows[0];
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_GET_AUTONOMY_CONFIG_FAILED', { error: err?.message || err });
    }
  }

  return (
    memoryAutonomyConfig.get(tenantId) || {
      tenantId,
      autonomyLevel: 2,
      allowSelfEdit: false,
      maxAiCostPerTaskUsd: '5.00',
      requireApprovalForHighRisk: true,
      updatedAt: new Date(),
    }
  );
}

export async function updateAutonomyConfigInStore(tenantId: string, config: any) {
  const current = await getAutonomyConfigInStore(tenantId);
  const updated = { ...current, ...config, updatedAt: new Date() };
  memoryAutonomyConfig.set(tenantId, updated);

  if (db) {
    try {
      await db
        .insert(phase5AutonomyConfigTable)
        .values({ tenantId, ...updated } as any)
        .onConflictDoUpdate({
          target: phase5AutonomyConfigTable.tenantId,
          set: updated as any,
        });
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_UPDATE_AUTONOMY_CONFIG_FAILED', { error: err?.message || err });
    }
  }

  return updated;
}

// ── Events & Audit Logging ────────────────────────────────────────────────
export async function logCollaborationEventInStore(event: {
  id: string;
  tenantId: string;
  orgId: string;
  projectId?: string;
  actorId: string;
  actorType?: 'user' | 'ai_agent' | 'system';
  action: string;
  resource: string;
  resourceId?: string;
  risk?: string;
  details?: any;
}) {
  const row = {
    id: event.id,
    tenantId: event.tenantId,
    orgId: event.orgId || event.tenantId,
    projectId: event.projectId || 'proj_default',
    actorId: event.actorId,
    actorType: event.actorType || 'user',
    action: event.action,
    resource: event.resource,
    resourceId: event.resourceId || null,
    risk: event.risk || 'LOW',
    details: event.details || {},
    timestamp: new Date(),
  };

  memoryEvents.push(row);

  if (db) {
    try {
      await db.insert(phase5EventsTable).values(row as any);
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_LOG_EVENT_FAILED', { error: err?.message || err });
    }
  }

  return row;
}

export async function getCollaborationEventsInStore(tenantId: string) {
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase5EventsTable)
        .where(eq(phase5EventsTable.tenantId, tenantId))
        .orderBy(desc(phase5EventsTable.timestamp));
      if (rows.length > 0) return rows;
    } catch (err: any) {
      logStructured('error', 'PHASE5_DB_GET_EVENTS_FAILED', { error: err?.message || err });
    }
  }

  return memoryEvents.filter((e) => e.tenantId === tenantId);
}
