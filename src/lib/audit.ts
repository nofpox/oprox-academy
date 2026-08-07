import { db, memoryDb } from "../db";
import { auditEventsTable, auditLogsTable } from "../db/schema";
import { logSecurityAudit as serverLogSecurityAudit } from "../../server/audit";

export { serverLogSecurityAudit as logSecurityAudit };

export type AuditEventType =
  | "permission_denied"
  | "secret_accessed"
  | "secret_created"
  | "secret_deleted"
  | "deploy_triggered"
  | "deploy_rollback"
  | "session_revoked"
  | "invite_accepted"
  | "invite_rejected"
  | "ai_blocked"
  | "api_key_created"
  | "api_key_rotated"
  | "api_key_deleted"
  | "session_anomaly"
  | "abuse_block"
  | "abuse_unblock"
  | "privileged_action"
  | "security_scan"
  | "admin_action";

export async function logAuditEvent(params: {
  projectId?: string | null;
  orgId?: string | null;
  actorId?: string | null;
  action?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  type?: AuditEventType | string;
  message?: string;
}): Promise<void> {
  const newRow = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    projectId: params.projectId || "proj_main",
    orgId: params.orgId || null,
    actorId: params.actorId || "user_admin",
    type: params.type || params.action || "AUDIT_LOG",
    message: params.message || `${params.action || "Audit Event"} on ${params.targetType || "resource"} ${params.targetId || ""}`.trim(),
    createdAt: new Date(),
  };

  if (db) {
    try {
      await db.insert(auditLogsTable).values(newRow);
      return;
    } catch {
      // Fallback
    }
  }

  memoryDb.auditLogs.unshift(newRow);
}

export async function getAuditLogs() {
  if (db) {
    try {
      return await db.select().from(auditLogsTable);
    } catch {
      return memoryDb.auditLogs;
    }
  }
  return memoryDb.auditLogs;
}

export async function getAuditEvents() {
  if (db) {
    try {
      return await db.select().from(auditEventsTable);
    } catch {
      return memoryDb.auditEvents;
    }
  }
  return memoryDb.auditEvents;
}
