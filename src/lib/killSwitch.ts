import { db, memoryDb } from "../db";
import { emergencyActionsLogTable, systemStateTable } from "../db/schema";

export type KillSwitchKey =
  | "all_ai"
  | "code_studio"
  | "mockup_sandbox"
  | "payments"
  | "deployments"
  | "maintenance_mode";

export const KILL_SWITCH_LABELS: Record<KillSwitchKey, string> = {
  all_ai: "All AI Provider Inferences",
  code_studio: "OPROX Code Studio Engine",
  mockup_sandbox: "Mockup Sandbox Renderer",
  payments: "Stripe Payment Processing",
  deployments: "Cloud Run Container Deployments",
  maintenance_mode: "Global Maintenance Mode",
};

export interface KillSwitchStateItem {
  key: KillSwitchKey;
  label: string;
  active: boolean;
  lastToggledAt?: string;
}

export async function getAllKillSwitchStates(): Promise<KillSwitchStateItem[]> {
  const keys: KillSwitchKey[] = [
    "all_ai",
    "code_studio",
    "mockup_sandbox",
    "payments",
    "deployments",
    "maintenance_mode",
  ];

  const results: KillSwitchStateItem[] = [];

  for (const key of keys) {
    const dbKey = key === "maintenance_mode" ? "platform:maintenance_mode" : `platform:kill:${key}`;
    let active = false;
    let updatedAtStr: string | undefined;

    if (db) {
      try {
        const rows = await db.select().from(systemStateTable);
        const match = rows.find((r: any) => r.key === dbKey);
        if (match) {
          active = match.value === "true";
          updatedAtStr = match.updatedAt?.toISOString();
        }
      } catch (err) {
        // Fallback to memoryDb
        const match = memoryDb.systemState.get(dbKey);
        if (match) {
          active = match.value === "true";
          updatedAtStr = match.updatedAt.toISOString();
        }
      }
    } else {
      const match = memoryDb.systemState.get(dbKey);
      if (match) {
        active = match.value === "true";
        updatedAtStr = match.updatedAt.toISOString();
      }
    }

    results.push({
      key,
      label: KILL_SWITCH_LABELS[key],
      active,
      lastToggledAt: updatedAtStr,
    });
  }

  return results;
}

export async function isKillSwitchActive(key: KillSwitchKey): Promise<boolean> {
  const dbKey = key === "maintenance_mode" ? "platform:maintenance_mode" : `platform:kill:${key}`;

  const cached = memoryDb.systemState.get(dbKey);
  if (cached !== undefined) {
    return cached.value === "true";
  }

  if (db) {
    try {
      const rows = await db.select().from(systemStateTable);
      const match = rows.find((r: any) => r.key === dbKey);
      if (match) {
        memoryDb.systemState.set(dbKey, { key: dbKey, value: match.value, updatedAt: match.updatedAt || new Date() });
        return match.value === "true";
      }
    } catch {
      // Fallback
    }
  }

  return false;
}

export async function resetKillSwitchState(): Promise<void> {
  const keys: KillSwitchKey[] = [
    "all_ai",
    "code_studio",
    "mockup_sandbox",
    "payments",
    "deployments",
    "maintenance_mode",
  ];

  for (const key of keys) {
    const dbKey = key === "maintenance_mode" ? "platform:maintenance_mode" : `platform:kill:${key}`;
    memoryDb.systemState.set(dbKey, { key: dbKey, value: "false", updatedAt: new Date() });
    if (db) {
      try {
        await db
          .insert(systemStateTable)
          .values({ key: dbKey, value: "false", updatedAt: new Date() })
          .onConflictDoUpdate({
            target: systemStateTable.key,
            set: { value: "false", updatedAt: new Date() },
          });
      } catch {
        // Fallback
      }
    }
  }
}

export async function setKillSwitch(
  key: KillSwitchKey,
  value: boolean,
  adminUserId: string = "admin_super",
  adminEmail: string = "admin@oprox.io",
  note?: string
): Promise<{ key: KillSwitchKey; active: boolean }> {
  if (process.env.NODE_ENV === 'production' && !db) {
    throw new Error('FATAL SECURITY ERROR: Database connection is required in production for KillSwitch state mutation.');
  }

  const dbKey = key === "maintenance_mode" ? "platform:maintenance_mode" : `platform:kill:${key}`;
  const valueStr = value ? "true" : "false";
  const targetLabel = KILL_SWITCH_LABELS[key] || key;

  // Update State
  if (db) {
    try {
      await db
        .insert(systemStateTable)
        .values({ key: dbKey, value: valueStr, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: systemStateTable.key,
          set: { value: valueStr, updatedAt: new Date() },
        });

      await db.insert(emergencyActionsLogTable).values({
        adminUserId,
        adminEmail,
        actionType: value ? "activated" : "deactivated",
        direction: value ? "KILL_SWITCH_ENABLED" : "KILL_SWITCH_DISABLED",
        stateKey: dbKey,
        targetLabel,
        previousValue: (!value).toString(),
        newValue: valueStr,
        note: note || null,
        createdAt: new Date(),
      });

      memoryDb.systemState.set(dbKey, { key: dbKey, value: valueStr, updatedAt: new Date() });
    } catch (err) {
      memoryDb.systemState.set(dbKey, { key: dbKey, value: valueStr, updatedAt: new Date() });
      memoryDb.emergencyLogs.unshift({
        id: `log_${Date.now()}`,
        adminUserId,
        adminEmail,
        actionType: value ? "activated" : "deactivated",
        direction: value ? "KILL_SWITCH_ENABLED" : "KILL_SWITCH_DISABLED",
        stateKey: dbKey,
        targetLabel,
        previousValue: (!value).toString(),
        newValue: valueStr,
        note: note || null,
        createdAt: new Date(),
      });
    }
  } else {
    memoryDb.systemState.set(dbKey, { key: dbKey, value: valueStr, updatedAt: new Date() });
    memoryDb.emergencyLogs.unshift({
      id: `log_${Date.now()}`,
      adminUserId,
      adminEmail,
      actionType: value ? "activated" : "deactivated",
      direction: value ? "KILL_SWITCH_ENABLED" : "KILL_SWITCH_DISABLED",
      stateKey: dbKey,
      targetLabel,
      previousValue: (!value).toString(),
      newValue: valueStr,
      note: note || null,
      createdAt: new Date(),
    });
  }

  return { key, active: value };
}

export async function getKillSwitchAuditLog() {
  if (db) {
    try {
      const rows = await db.select().from(emergencyActionsLogTable);
      return rows;
    } catch {
      return memoryDb.emergencyLogs;
    }
  }
  return memoryDb.emergencyLogs;
}
