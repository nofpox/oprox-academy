import { memoryDb, db } from '../db';
import { productRegistryTable } from '../db/schema';
import { getSubscriptions, getInvoices } from './billing';
import { getAiUsageStats } from './aiWallet';

export async function getProductRegistry() {
  if (db) {
    try {
      const rows = await db.select().from(productRegistryTable);
      if (rows.length > 0) return rows;
    } catch {
      // Fallback
    }
  }
  return Array.from(memoryDb.productRegistry.values());
}

export async function recordProductHeartbeat(productId: string) {
  const current = memoryDb.productRegistry.get(productId);
  if (current) {
    const updated = { ...current, lastHeartbeat: new Date(), updatedAt: new Date() };
    memoryDb.productRegistry.set(productId, updated);
    if (db) {
      try {
        await db.insert(productRegistryTable).values(updated).onConflictDoUpdate({
          target: productRegistryTable.id,
          set: updated,
        });
      } catch {
        // Fallback
      }
    }
    return updated;
  }
  return null;
}

export async function getCentralFinancialOverview() {
  const subs = await getSubscriptions();
  const invoices = await getInvoices();
  const aiStats = await getAiUsageStats();

  const activeSubscriptions = subs.filter((s) => s.status === 'active').length;
  const totalRevenueCents = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);

  const products = Array.from(memoryDb.productRegistry.values());
  const totalRevenueUsd = totalRevenueCents / 100;

  return {
    pricingStatus: 'pricing_not_configured',
    mrrUsd: 0, // Unset until official catalog prices are configured
    arrUsd: 0,
    activeSubscriptionsCount: activeSubscriptions,
    totalRevenueUsd,
    outstandingInvoicesCount: invoices.filter((i) => i.status === 'open').length,
    failedPaymentsCount: invoices.filter((i) => i.status === 'uncollectible').length,
    totalAiProviderCostUsd: aiStats.totalCostUsd,
    netEcosystemMarginUsd: totalRevenueUsd - aiStats.totalCostUsd,
    productsSummary: products.map((p) => ({
      name: p.name,
      slug: p.slug,
      health: p.health,
      activeUsers: p.activeUsersCount,
      activeSubscriptions: p.activeSubscriptionsCount,
      monthlyAiCostUsd: Number(p.monthlyAiCostUsd),
    })),
  };
}
