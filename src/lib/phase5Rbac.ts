import { db } from '../db';
import { phase5MembershipsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { logStructured } from './logger';

export type DevelopmentPermission =
  | 'PROJECT_VIEW'
  | 'PROJECT_CREATE'
  | 'PROJECT_EDIT'
  | 'PROJECT_DELETE'
  | 'CODE_READ'
  | 'CODE_WRITE'
  | 'CODE_REVIEW'
  | 'CODE_APPROVE'
  | 'AI_TASK_RUN'
  | 'AI_TASK_APPROVE'
  | 'AI_POLICY_MANAGE'
  | 'DEPLOY_PREVIEW'
  | 'DEPLOY_STAGING'
  | 'DEPLOY_PRODUCTION'
  | 'MIGRATION_REVIEW'
  | 'MIGRATION_APPROVE'
  | 'SECRET_STATUS_VIEW'
  | 'ENVIRONMENT_MANAGE'
  | 'ROLLBACK_REQUEST'
  | 'ROLLBACK_APPROVE'
  | 'MEMBER_MANAGE'
  | 'TEAM_MANAGE'
  | 'AUDIT_VIEW'
  | 'POLICY_MANAGE';

export const ALL_DEVELOPMENT_PERMISSIONS: DevelopmentPermission[] = [
  'PROJECT_VIEW',
  'PROJECT_CREATE',
  'PROJECT_EDIT',
  'PROJECT_DELETE',
  'CODE_READ',
  'CODE_WRITE',
  'CODE_REVIEW',
  'CODE_APPROVE',
  'AI_TASK_RUN',
  'AI_TASK_APPROVE',
  'AI_POLICY_MANAGE',
  'DEPLOY_PREVIEW',
  'DEPLOY_STAGING',
  'DEPLOY_PRODUCTION',
  'MIGRATION_REVIEW',
  'MIGRATION_APPROVE',
  'SECRET_STATUS_VIEW',
  'ENVIRONMENT_MANAGE',
  'ROLLBACK_REQUEST',
  'ROLLBACK_APPROVE',
  'MEMBER_MANAGE',
  'TEAM_MANAGE',
  'AUDIT_VIEW',
  'POLICY_MANAGE',
];

export const DEFAULT_ROLE_PERMISSIONS: Record<string, DevelopmentPermission[]> = {
  Owner: ALL_DEVELOPMENT_PERMISSIONS,
  Admin: ALL_DEVELOPMENT_PERMISSIONS,
  'Engineering Manager': [
    'PROJECT_VIEW', 'PROJECT_EDIT', 'CODE_READ', 'CODE_REVIEW', 'CODE_APPROVE',
    'AI_TASK_RUN', 'AI_TASK_APPROVE', 'DEPLOY_PREVIEW', 'DEPLOY_STAGING', 'DEPLOY_PRODUCTION',
    'MIGRATION_REVIEW', 'MIGRATION_APPROVE', 'SECRET_STATUS_VIEW', 'ROLLBACK_REQUEST', 'ROLLBACK_APPROVE',
    'MEMBER_MANAGE', 'TEAM_MANAGE', 'AUDIT_VIEW', 'POLICY_MANAGE'
  ],
  'Tech Lead': [
    'PROJECT_VIEW', 'PROJECT_EDIT', 'CODE_READ', 'CODE_WRITE', 'CODE_REVIEW', 'CODE_APPROVE',
    'AI_TASK_RUN', 'AI_TASK_APPROVE', 'DEPLOY_PREVIEW', 'DEPLOY_STAGING', 'MIGRATION_REVIEW',
    'MIGRATION_APPROVE', 'SECRET_STATUS_VIEW', 'ROLLBACK_REQUEST', 'AUDIT_VIEW'
  ],
  Developer: [
    'PROJECT_VIEW', 'CODE_READ', 'CODE_WRITE', 'CODE_REVIEW', 'AI_TASK_RUN',
    'DEPLOY_PREVIEW', 'DEPLOY_STAGING', 'SECRET_STATUS_VIEW', 'ROLLBACK_REQUEST'
  ],
  Reviewer: [
    'PROJECT_VIEW', 'CODE_READ', 'CODE_REVIEW', 'CODE_APPROVE', 'MIGRATION_REVIEW'
  ],
  QA: [
    'PROJECT_VIEW', 'CODE_READ', 'CODE_REVIEW', 'DEPLOY_PREVIEW', 'DEPLOY_STAGING'
  ],
  Security: [
    'PROJECT_VIEW', 'CODE_READ', 'CODE_REVIEW', 'CODE_APPROVE', 'SECRET_STATUS_VIEW',
    'ENVIRONMENT_MANAGE', 'AUDIT_VIEW', 'POLICY_MANAGE', 'MIGRATION_REVIEW', 'MIGRATION_APPROVE'
  ],
  DevOps: [
    'PROJECT_VIEW', 'CODE_READ', 'DEPLOY_PREVIEW', 'DEPLOY_STAGING', 'DEPLOY_PRODUCTION',
    'MIGRATION_REVIEW', 'MIGRATION_APPROVE', 'SECRET_STATUS_VIEW', 'ENVIRONMENT_MANAGE',
    'ROLLBACK_REQUEST', 'ROLLBACK_APPROVE', 'AUDIT_VIEW'
  ],
  Viewer: [
    'PROJECT_VIEW', 'CODE_READ', 'AUDIT_VIEW'
  ],
};

import { getMembersInStore } from './phase5Store';

export async function checkDevelopmentPermission(
  tenantId: string,
  userId: string,
  userRole: string,
  permission: DevelopmentPermission
): Promise<{ allowed: boolean; reason?: string }> {
  // Check member status FIRST (e.g. suspended members lose all permissions regardless of role)
  try {
    const members = await getMembersInStore(tenantId);
    const member = members.find((m) => m.userId === userId);
    if (member && member.status === 'suspended') {
      return { allowed: false, reason: 'MEMBER_SUSPENDED' };
    }
  } catch (err: any) {
    // Ignore error
  }

  // Superadmin or Owner role has blanket access
  if (userRole === 'superadmin' || userRole === 'owner' || userRole === 'Owner') {
    return { allowed: true };
  }

  // Check role fallback first
  const defaultRolePermissions = DEFAULT_ROLE_PERMISSIONS[userRole];
  if (defaultRolePermissions && defaultRolePermissions.includes(permission)) {
    return { allowed: true };
  }

  // Check DB membership custom grants
  if (db) {
    try {
      const rows = await db
        .select()
        .from(phase5MembershipsTable)
        .where(
          and(
            eq(phase5MembershipsTable.tenantId, tenantId),
            eq(phase5MembershipsTable.userId, userId)
          )
        );

      if (rows.length > 0) {
        const member = rows[0];
        if (member.status === 'suspended') {
          return { allowed: false, reason: 'MEMBER_SUSPENDED' };
        }

        const customPerms = (member.permissions as DevelopmentPermission[]) || [];
        if (customPerms.includes(permission)) {
          return { allowed: true };
        }

        const roles = (member.roles as string[]) || [];
        for (const r of roles) {
          const perms = DEFAULT_ROLE_PERMISSIONS[r];
          if (perms && perms.includes(permission)) {
            return { allowed: true };
          }
        }
      }
    } catch (err: any) {
      logStructured('error', 'PHASE5_RBAC_DB_CHECK_FAILED', { error: err?.message || err, tenantId, userId });
    }
  }

  return {
    allowed: false,
    reason: `User '${userId}' with role '${userRole}' lacks required permission '${permission}'.`,
  };
}
