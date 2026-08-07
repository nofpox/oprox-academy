import { db, memoryDb } from "../db";
import { costGuardSettingsTable, systemStateTable } from "../db/schema";
import { setKillSwitch } from "./killSwitch";
import { logSecurityAudit } from "./audit";

export interface CostGuardSettings {
  maxDailyUsd: number;
  maxMonthlyUsd: number;
  autoKillAtUsd: number;
  notifyAtPercentage: number;
  enabled: boolean;
  updatedAt?: string;
}

export function getTodayKey(): string {
  const dateStr = new Date().toISOString().split("T")[0];
  return `costguard:daily_usage:${dateStr}`;
}

export async function getCostGuardSettings(): Promise<CostGuardSettings> {
  if (memoryDb.costGuardSettings) {
    const settings = memoryDb.costGuardSettings;
    return {
      maxDailyUsd: Number(settings.maxDailyUsd),
      maxMonthlyUsd: Number(settings.maxMonthlyUsd),
      autoKillAtUsd: Number(settings.autoKillAtUsd),
      notifyAtPercentage: settings.notifyAtPercentage,
      enabled: settings.enabled,
      updatedAt: new Date(settings.updatedAt).toISOString(),
    };
  }

  if (db) {
    try {
      const rows = await db.select().from(costGuardSettingsTable);
      if (rows.length > 0) {
        const row = rows[0];
        memoryDb.costGuardSettings = row;
        return {
          maxDailyUsd: Number(row.maxDailyUsd),
          maxMonthlyUsd: Number(row.maxMonthlyUsd),
          autoKillAtUsd: Number(row.autoKillAtUsd),
          notifyAtPercentage: row.notifyAtPercentage,
          enabled: row.enabled,
          updatedAt: new Date(row.updatedAt).toISOString(),
        };
      }
    } catch {
      // Fallback
    }
  }

  return {
    maxDailyUsd: 50,
    maxMonthlyUsd: 1000,
    autoKillAtUsd: 1500,
    notifyAtPercentage: 80,
    enabled: true,
    updatedAt: new Date().toISOString(),
  };
}

export async function resetCostGuardState(): Promise<void> {
  const key = getTodayKey();
  memoryDb.systemState.set(key, { key, value: "0.0", updatedAt: new Date() });
  memoryDb.costGuardSettings = {
    id: "default",
    orgId: null,
    maxDailyUsd: "50.00",
    maxMonthlyUsd: "1000.00",
    autoKillAtUsd: "1500.00",
    notifyAtPercentage: 80,
    enabled: true,
    updatedAt: new Date(),
  };

  if (db) {
    try {
      await db
        .insert(systemStateTable)
        .values({ key, value: "0.0", updatedAt: new Date() })
        .onConflictDoUpdate({
          target: systemStateTable.key,
          set: { value: "0.0", updatedAt: new Date() },
        });
      await db
        .insert(costGuardSettingsTable)
        .values(memoryDb.costGuardSettings)
        .onConflictDoUpdate({
          target: costGuardSettingsTable.id,
          set: memoryDb.costGuardSettings,
        });
    } catch {
      // Fallback
    }
  }
}

export async function updateCostGuardSettings(
  partial: Partial<CostGuardSettings>
): Promise<CostGuardSettings> {
  if (process.env.NODE_ENV === 'production' && !db) {
    throw new Error('FATAL SECURITY ERROR: Database connection is required in production for CostGuard state mutation.');
  }

  const current = await getCostGuardSettings();
  const updated: CostGuardSettings = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  const dbValues = {
    id: "default",
    orgId: null,
    maxDailyUsd: String(updated.maxDailyUsd),
    maxMonthlyUsd: String(updated.maxMonthlyUsd),
    autoKillAtUsd: String(updated.autoKillAtUsd),
    notifyAtPercentage: updated.notifyAtPercentage,
    enabled: updated.enabled,
    updatedAt: new Date(),
  };

  if (db) {
    try {
      await db
        .insert(costGuardSettingsTable)
        .values(dbValues)
        .onConflictDoUpdate({
          target: costGuardSettingsTable.id,
          set: {
            maxDailyUsd: dbValues.maxDailyUsd,
            maxMonthlyUsd: dbValues.maxMonthlyUsd,
            autoKillAtUsd: dbValues.autoKillAtUsd,
            notifyAtPercentage: dbValues.notifyAtPercentage,
            enabled: dbValues.enabled,
            updatedAt: dbValues.updatedAt,
          },
        });
      memoryDb.costGuardSettings = dbValues;
    } catch {
      memoryDb.costGuardSettings = dbValues;
    }
  } else {
    memoryDb.costGuardSettings = dbValues;
  }

  return updated;
}

/**
 * Phase 2.4 & 2.5: Get accumulated daily spend from PostgreSQL / system_state
 */
export async function getCostGuardDailyUsage(): Promise<number> {
  const key = getTodayKey();

  const cached = memoryDb.systemState.get(key);
  if (cached !== undefined) {
    return Number(cached.value) || 0;
  }

  if (db) {
    try {
      const rows = await db.select().from(systemStateTable);
      const match = rows.find((r: any) => r.key === key);
      if (match) {
        memoryDb.systemState.set(key, { key, value: match.value, updatedAt: match.updatedAt || new Date() });
        return Number(match.value) || 0;
      }
    } catch {
      // Fallback
    }
  }

  return 0;
}

/**
 * Record usage atomically to persistent system_state. Auto-triggers KillSwitch if budget threshold breached.
 */
export async function recordCostGuardUsage(additionalUsd: number): Promise<number> {
  const key = getTodayKey();
  const current = await getCostGuardDailyUsage();
  const newTotal = Number((current + additionalUsd).toFixed(6));
  const newTotalStr = String(newTotal);

  if (db) {
    try {
      await db
        .insert(systemStateTable)
        .values({ key, value: newTotalStr, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: systemStateTable.key,
          set: { value: newTotalStr, updatedAt: new Date() },
        });
      memoryDb.systemState.set(key, { key, value: newTotalStr, updatedAt: new Date() });
    } catch {
      memoryDb.systemState.set(key, { key, value: newTotalStr, updatedAt: new Date() });
    }
  } else {
    memoryDb.systemState.set(key, { key, value: newTotalStr, updatedAt: new Date() });
  }

  // Auto-killswitch check
  const settings = await getCostGuardSettings();
  if (settings.enabled && newTotal >= settings.autoKillAtUsd) {
    await setKillSwitch('all_ai', true, 'costguard_system', 'system@oprox.io', `Auto-killswitch triggered: Daily usage $${newTotal} exceeded budget threshold $${settings.autoKillAtUsd}`);
    logSecurityAudit('COSTGUARD_AUTO_KILLSWITCH', { path: 'src/lib/costGuard.ts' }, { usageUsd: newTotal, limitUsd: settings.autoKillAtUsd });
  }

  return newTotal;
}

export function estimateCostUsd(model: string, estimatedTokens: number = 1000): number {
  const modelRates: Record<string, number> = {
    "gemini-2.5-flash": 0.00015 / 1000,
    "gemini-2.5-pro": 0.00125 / 1000,
    "gpt-4o": 0.0025 / 1000,
    "claude-3-5-sonnet": 0.003 / 1000,
  };

  const rate = modelRates[model] || 0.0005 / 1000;
  return Number((estimatedTokens * rate).toFixed(6));
}

export async function isCostGuardExceeded(tenantId?: string): Promise<boolean> {
  const usage = await getCostGuardDailyUsage();
  const settings = await getCostGuardSettings();
  return settings.enabled && usage >= settings.maxDailyUsd;
}

export async function setCostGuardCurrentDaily(amountUsd: number): Promise<void> {
  const key = getTodayKey();
  const valStr = String(amountUsd);
  memoryDb.systemState.set(key, { key, value: valStr, updatedAt: new Date() });
  if (db) {
    try {
      await db
        .insert(systemStateTable)
        .values({ key, value: valStr, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: systemStateTable.key,
          set: { value: valStr, updatedAt: new Date() },
        });
    } catch {
      // Fallback
    }
  }
}
