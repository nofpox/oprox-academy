import { db, memoryDb } from "../db";
import { plansCatalogTable, PlanCatalogRow } from "../db/schema";
import { eq } from "drizzle-orm";

export async function getPlansCatalog(): Promise<PlanCatalogRow[]> {
  if (db) {
    try {
      return await db.select().from(plansCatalogTable);
    } catch {
      // Fallback to memory
    }
  }
  return Array.from(memoryDb.plansCatalog.values());
}

export async function getPlanByCode(code: string): Promise<PlanCatalogRow | null> {
  if (db) {
    try {
      const rows = await db.select().from(plansCatalogTable).where(eq(plansCatalogTable.code, code)).limit(1);
      if (rows.length > 0) return rows[0];
    } catch {
      // Fallback
    }
  }
  return memoryDb.plansCatalog.get(code) || null;
}

export async function upsertPlanCatalog(planData: Partial<PlanCatalogRow> & { code: string; displayName: string }): Promise<PlanCatalogRow> {
  const existing = await getPlanByCode(planData.code);
  const now = new Date();
  
  const record: PlanCatalogRow = {
    id: planData.id || planData.code,
    code: planData.code,
    displayName: planData.displayName,
    active: planData.active ?? (existing ? existing.active : false),
    priceSarHalalas: planData.priceSarHalalas !== undefined ? planData.priceSarHalalas : (existing ? existing.priceSarHalalas : null),
    priceUsdCents: planData.priceUsdCents !== undefined ? planData.priceUsdCents : (existing ? existing.priceUsdCents : null),
    billingInterval: planData.billingInterval || (existing ? existing.billingInterval : "monthly"),
    includedAiMicros: planData.includedAiMicros ?? (existing ? existing.includedAiMicros : 0),
    featureEntitlements: planData.featureEntitlements || (existing ? existing.featureEntitlements : []),
    maxUsers: planData.maxUsers ?? (existing ? existing.maxUsers : 10),
    upgradeRules: planData.upgradeRules || (existing ? existing.upgradeRules : { immediate: true }),
    downgradeRules: planData.downgradeRules || (existing ? existing.downgradeRules : { atPeriodEnd: true }),
    effectiveDate: planData.effectiveDate ? new Date(planData.effectiveDate) : (existing ? existing.effectiveDate : now),
    version: existing ? existing.version + 1 : 1,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };

  if (db) {
    try {
      await db.insert(plansCatalogTable).values(record).onConflictDoUpdate({
        target: plansCatalogTable.code,
        set: record,
      });
    } catch {
      // Fallback
    }
  }

  memoryDb.plansCatalog.set(record.code, record);
  return record;
}

export async function validatePlanPurchasable(code: string, currency: 'SAR' | 'USD' = 'SAR'): Promise<{ purchasable: boolean; reason?: string; plan?: PlanCatalogRow }> {
  const plan = await getPlanByCode(code);
  if (!plan) {
    return { purchasable: false, reason: `Plan '${code}' does not exist in Pricing Catalog.` };
  }

  if (!plan.active) {
    return { purchasable: false, reason: `Plan '${plan.displayName}' is currently inactive/draft and cannot be purchased.` };
  }

  if (currency === 'SAR' && (plan.priceSarHalalas === null || plan.priceSarHalalas === undefined)) {
    return { purchasable: false, reason: `Plan '${plan.displayName}' has no approved active price in SAR and cannot be purchased.` };
  }

  if (currency === 'USD' && (plan.priceUsdCents === null || plan.priceUsdCents === undefined)) {
    return { purchasable: false, reason: `Plan '${plan.displayName}' has no approved active price in USD and cannot be purchased.` };
  }

  return { purchasable: true, plan };
}
