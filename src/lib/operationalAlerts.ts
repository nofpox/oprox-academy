import { db, memoryDb } from "../db";
import { operationalAlertConfigsTable, operationalAlertIncidentsTable } from "../db/schema";
import { collectHealthSnapshot } from "./healthAggregator";

export async function listAlertConfigs() {
  if (db) {
    try {
      return await db.select().from(operationalAlertConfigsTable);
    } catch {
      return Array.from(memoryDb.alertConfigs.values());
    }
  }
  return Array.from(memoryDb.alertConfigs.values());
}

export async function updateAlertConfig(id: string, updates: { enabled?: boolean; thresholdValue?: number }) {
  if (db) {
    try {
      await db
        .update(operationalAlertConfigsTable)
        .set({ ...updates, updatedAt: new Date() })
        .where(db.eq(operationalAlertConfigsTable.id, id));
    } catch {
      const existing = memoryDb.alertConfigs.get(id);
      if (existing) {
        memoryDb.alertConfigs.set(id, { ...existing, ...updates, updatedAt: new Date() });
      }
    }
  } else {
    const existing = memoryDb.alertConfigs.get(id);
    if (existing) {
      memoryDb.alertConfigs.set(id, { ...existing, ...updates, updatedAt: new Date() });
    }
  }
}

export async function listAlertIncidents() {
  if (db) {
    try {
      return await db.select().from(operationalAlertIncidentsTable);
    } catch {
      return memoryDb.alertIncidents;
    }
  }
  return memoryDb.alertIncidents;
}

export async function resolveIncident(id: string) {
  if (db) {
    try {
      await db
        .update(operationalAlertIncidentsTable)
        .set({ status: "resolved", resolvedAt: new Date() })
        .where(db.eq(operationalAlertIncidentsTable.id, id));
    } catch {
      const inc = memoryDb.alertIncidents.find((i) => i.id === id);
      if (inc) {
        inc.status = "resolved";
        inc.resolvedAt = new Date();
      }
    }
  } else {
    const inc = memoryDb.alertIncidents.find((i) => i.id === id);
    if (inc) {
      inc.status = "resolved";
      inc.resolvedAt = new Date();
    }
  }
}

export async function evaluateAlerts() {
  const snapshot = await collectHealthSnapshot();
  const configs = await listAlertConfigs();
  const newIncidents = [];

  for (const config of configs) {
    if (!config.enabled) continue;

    if (config.metric === "db_latency_high" && snapshot.latencyMs > config.thresholdValue) {
      const incident = {
        id: `inc_${Date.now()}`,
        alertConfigId: config.id,
        metric: config.metric,
        currentValue: snapshot.latencyMs,
        thresholdValue: config.thresholdValue,
        status: "open",
        message: `Database latency of ${snapshot.latencyMs}ms exceeded threshold of ${config.thresholdValue}ms`,
        resolvedAt: null,
        createdAt: new Date(),
      };
      newIncidents.push(incident);
      memoryDb.alertIncidents.unshift(incident);
    }
  }

  return { evaluatedAt: new Date().toISOString(), newIncidents };
}
