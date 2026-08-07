import { db, memoryDb } from "../db";
import { dualApprovalRequestsTable, DualApprovalRequestRow } from "../db/schema";
import { eq } from "drizzle-orm";
import { logAuditEvent } from "./audit";

export const SENSITIVE_ACTION_TYPES = [
  "HIGH_VALUE_WALLET_ADJUSTMENT",
  "EXCEPTIONAL_FINANCIAL_CREDIT",
  "PAYMENT_REVERSAL",
  "MANUAL_FINANCIAL_OVERRIDE",
  "PROVIDER_CONFIG_CHANGE",
];

export interface CreateApprovalRequestParams {
  actionType: string;
  requestedBy: string;
  amountMicros?: number | null;
  payload?: Record<string, any>;
}

export async function createDualApprovalRequest(params: CreateApprovalRequestParams): Promise<DualApprovalRequestRow> {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date();

  const record: DualApprovalRequestRow = {
    id: requestId,
    actionType: params.actionType,
    requestedBy: params.requestedBy,
    requestedAt: now,
    amountMicros: params.amountMicros || null,
    payload: params.payload || {},
    status: "PENDING",
    firstApprovedBy: null,
    firstApprovedAt: null,
    secondApprovedBy: null,
    secondApprovedAt: null,
    executedAt: null,
    rejectionNote: null,
    createdAt: now,
  };

  if (db) {
    try {
      await db.insert(dualApprovalRequestsTable).values(record);
    } catch {
      // Fallback
    }
  }

  memoryDb.dualApprovalRequests.set(requestId, record);

  await logAuditEvent({
    orgId: null,
    actorId: params.requestedBy,
    action: "DUAL_APPROVAL_REQUESTED",
    targetType: "FINANCIAL_REQUEST",
    targetId: requestId,
    metadata: { actionType: params.actionType, amountMicros: params.amountMicros },
  });

  return record;
}

export async function getDualApprovalRequestById(requestId: string): Promise<DualApprovalRequestRow | null> {
  if (db) {
    try {
      const rows = await db.select().from(dualApprovalRequestsTable).where(eq(dualApprovalRequestsTable.id, requestId)).limit(1);
      if (rows.length > 0) return rows[0];
    } catch {
      // Fallback
    }
  }
  return memoryDb.dualApprovalRequests.get(requestId) || null;
}

export async function getAllDualApprovalRequests(): Promise<DualApprovalRequestRow[]> {
  if (db) {
    try {
      return await db.select().from(dualApprovalRequestsTable);
    } catch {
      // Fallback
    }
  }
  return Array.from(memoryDb.dualApprovalRequests.values());
}

const requestLocks = new Map<string, Promise<void>>();

async function acquireRequestLock<T>(requestId: string, fn: () => Promise<T>): Promise<T> {
  let resolver: () => void;
  const currentLock = requestLocks.get(requestId) || Promise.resolve();
  const nextLock = new Promise<void>((resolve) => {
    resolver = resolve;
  });
  requestLocks.set(requestId, currentLock.then(() => nextLock));

  try {
    await currentLock;
    return await fn();
  } finally {
    resolver!();
  }
}

export async function approveDualApprovalRequest(
  requestId: string,
  approverUserId: string,
  note?: string
): Promise<{ success: boolean; status: string; message: string; request: DualApprovalRequestRow }> {
  return acquireRequestLock(requestId, async () => {
    const req = await getDualApprovalRequestById(requestId);
    if (!req) {
      throw new Error(`Dual approval request '${requestId}' not found.`);
    }

    if (req.status !== "PENDING") {
      return {
        success: false,
        status: req.status,
        message: `Request '${requestId}' is already in '${req.status}' state.`,
        request: req,
      };
    }

    // STRICT POLICY: A requester cannot approve their own request
    if (approverUserId === req.requestedBy) {
      throw new Error("Self-approval is forbidden by OPROX Dual Approval Policy. Independent second approval is required.");
    }

    const now = new Date();
    let updatedStatus = "PENDING";
    let firstBy = req.firstApprovedBy;
    let firstAt = req.firstApprovedAt;
    let secondBy = req.secondApprovedBy;
    let secondAt = req.secondApprovedAt;
    let executedAt = req.executedAt;

    if (!firstBy) {
      firstBy = approverUserId;
      firstAt = now;
    } else if (firstBy === approverUserId) {
      throw new Error("Approver has already registered the first approval. Second independent approver required.");
    } else if (!secondBy) {
      secondBy = approverUserId;
      secondAt = now;
      updatedStatus = "APPROVED";
      executedAt = now;
    }

    const updatedRecord: DualApprovalRequestRow = {
      ...req,
      status: updatedStatus,
      firstApprovedBy: firstBy,
      firstApprovedAt: firstAt,
      secondApprovedBy: secondBy,
      secondApprovedAt: secondAt,
      executedAt,
      rejectionNote: note || req.rejectionNote,
    };

    if (db) {
      try {
        await db.insert(dualApprovalRequestsTable).values(updatedRecord).onConflictDoUpdate({
          target: dualApprovalRequestsTable.id,
          set: updatedRecord,
        });
      } catch {
        // Fallback
      }
    }

    memoryDb.dualApprovalRequests.set(requestId, updatedRecord);

    await logAuditEvent({
      orgId: null,
      actorId: approverUserId,
      action: updatedStatus === "APPROVED" ? "DUAL_APPROVAL_COMPLETED" : "DUAL_APPROVAL_FIRST_RECORDED",
      targetType: "FINANCIAL_REQUEST",
      targetId: requestId,
      metadata: { status: updatedStatus, approverUserId, actionType: req.actionType },
    });

    return {
      success: true,
      status: updatedStatus,
      message: updatedStatus === "APPROVED" ? "Request fully approved by dual controls and executed." : "First approval recorded. Pending second independent approver.",
      request: updatedRecord,
    };
  });
}

export async function rejectDualApprovalRequest(
  requestId: string,
  rejecterUserId: string,
  rejectionNote: string
): Promise<DualApprovalRequestRow> {
  const req = await getDualApprovalRequestById(requestId);
  if (!req) {
    throw new Error(`Dual approval request '${requestId}' not found.`);
  }

  const now = new Date();
  const updatedRecord: DualApprovalRequestRow = {
    ...req,
    status: "REJECTED",
    rejectionNote: rejectionNote || "Rejected by administrator",
  };

  if (db) {
    try {
      await db.insert(dualApprovalRequestsTable).values(updatedRecord).onConflictDoUpdate({
        target: dualApprovalRequestsTable.id,
        set: updatedRecord,
      });
    } catch {
      // Fallback
    }
  }

  memoryDb.dualApprovalRequests.set(requestId, updatedRecord);

  await logAuditEvent({
    orgId: null,
    actorId: rejecterUserId,
    action: "DUAL_APPROVAL_REJECTED",
    targetType: "FINANCIAL_REQUEST",
    targetId: requestId,
    metadata: { requestId, rejectionNote },
  });

  return updatedRecord;
}
