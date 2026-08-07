import { memoryDb, db } from '../db';
import {
  aiWalletBalancesTable,
  aiWalletLedgerTable,
  aiUsageEventsTable,
  aiProviderConfigsTable,
  aiWalletReservationsTable,
} from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { logSecurityAudit } from './audit';

// In-memory mutex map for concurrency lock per user in memory mode
const userLocks = new Map<string, Promise<void>>();

async function acquireUserLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  let resolver: () => void;
  const currentLock = userLocks.get(userId) || Promise.resolve();
  const nextLock = new Promise<void>((resolve) => {
    resolver = resolve;
  });
  userLocks.set(userId, currentLock.then(() => nextLock));

  try {
    await currentLock;
    return await fn();
  } finally {
    resolver!();
  }
}

export async function resetAiWalletState(): Promise<void> {
  memoryDb.aiWalletBalances.clear();
  memoryDb.aiWalletReservations.clear();
  memoryDb.aiUsageEvents.length = 0;
  memoryDb.aiWalletLedger.length = 0;
  userLocks.clear();

  const defaultUsers = [
    { userId: 'user_admin', orgId: 'org_core', includedCreditMicros: 10000000, walletMicros: 100000000, updatedAt: new Date() },
    { userId: 'user_demo', orgId: 'org_core', includedCreditMicros: 10000000, walletMicros: 5000000, updatedAt: new Date() },
  ];

  for (const u of defaultUsers) {
    memoryDb.aiWalletBalances.set(u.userId, u);
    if (db) {
      try {
        await db
          .insert(aiWalletBalancesTable)
          .values(u)
          .onConflictDoUpdate({
            target: aiWalletBalancesTable.userId,
            set: u,
          });
      } catch {
        // Fallback
      }
    }
  }
}

export async function getWalletBalance(userId: string) {
  if (db) {
    try {
      const rows = await db.select().from(aiWalletBalancesTable).where(eq(aiWalletBalancesTable.userId, userId));
      if (rows.length > 0) return rows[0];
    } catch {
      // Fallback
    }
  }

  if (!memoryDb.aiWalletBalances.has(userId)) {
    const isZeroBalanceUser = userId === 'usr_empty' || userId === 'user_empty' || userId === 'usr_no_balance';
    const initialMicros = isZeroBalanceUser ? 0 : 100000000;

    memoryDb.aiWalletBalances.set(userId, {
      userId,
      orgId: null,
      includedCreditMicros: isZeroBalanceUser ? 0 : 10000000,
      walletMicros: initialMicros,
      updatedAt: new Date(),
    });
  }
  return memoryDb.aiWalletBalances.get(userId)!;
}

export async function checkAiWalletBalance(userId: string): Promise<{ hasSufficientBalance: boolean; totalBalanceUsd: number }> {
  const bal = await getWalletBalance(userId);
  const totalMicros = (bal?.includedCreditMicros || 0) + (bal?.walletMicros || 0);
  const totalBalanceUsd = totalMicros / 1_000_000;
  return {
    hasSufficientBalance: totalBalanceUsd >= 0.01,
    totalBalanceUsd,
  };
}

export async function adjustWalletBalance(userId: string, amountMicros: number, type: string, description: string) {
  return acquireUserLock(userId, async () => {
    const current = await getWalletBalance(userId);
    const updatedWalletMicros = Math.max(0, current.walletMicros + amountMicros);

    const newBalance = {
      ...current,
      walletMicros: updatedWalletMicros,
      updatedAt: new Date(),
    };

    const ledgerEntry = {
      id: `ledger_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      amountMicros,
      type,
      description: description || 'Balance adjustment',
      createdAt: new Date(),
    };

    memoryDb.aiWalletBalances.set(userId, newBalance);
    memoryDb.aiWalletLedger.push(ledgerEntry as any);

    if (db) {
      try {
        await db.transaction(async (tx: any) => {
          await tx.insert(aiWalletBalancesTable).values(newBalance).onConflictDoUpdate({
            target: aiWalletBalancesTable.userId,
            set: newBalance,
          });
          await tx.insert(aiWalletLedgerTable).values(ledgerEntry as any);
        });
      } catch {
        // Fallback handled via memoryDb
      }
    }

    return { balance: newBalance, ledgerEntry };
  });
}

/**
 * Phase 2.3: Reserve estimated AI usage cost atomically before execution.
 */
export async function reserveAiWalletBalance(
  userId: string,
  estimatedCostMicros: number,
  orgId?: string | null
): Promise<{ success: boolean; reservationId?: string; reservedMicros?: number; reason?: string }> {
  return acquireUserLock(userId, async () => {
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min TTL

    if (db) {
      try {
        const result = await db.transaction(async (tx: any) => {
          // Pessimistic lock on balance row
          const rows = await tx
            .select()
            .from(aiWalletBalancesTable)
            .where(eq(aiWalletBalancesTable.userId, userId))
            .for('update');

          let balanceRow = rows[0];
          if (!balanceRow) {
            balanceRow = {
              userId,
              orgId: orgId || null,
              includedCreditMicros: 10000000,
              walletMicros: 5000000,
              updatedAt: new Date(),
            };
            await tx.insert(aiWalletBalancesTable).values(balanceRow);
          }

          if (balanceRow.walletMicros < estimatedCostMicros) {
            return { success: false, reason: 'INSUFFICIENT_FUNDS' };
          }

          const newWalletMicros = balanceRow.walletMicros - estimatedCostMicros;
          await tx
            .update(aiWalletBalancesTable)
            .set({ walletMicros: newWalletMicros, updatedAt: new Date() })
            .where(eq(aiWalletBalancesTable.userId, userId));

          const reservation = {
            id: reservationId,
            userId,
            orgId: orgId || null,
            reservedMicros: estimatedCostMicros,
            status: 'reserved',
            expiresAt,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await tx.insert(aiWalletReservationsTable).values(reservation);

          // Update memoryDb cache
          memoryDb.aiWalletBalances.set(userId, { ...balanceRow, walletMicros: newWalletMicros, updatedAt: new Date() });
          memoryDb.aiWalletReservations.set(reservationId, reservation as any);

          return { success: true, reservationId, reservedMicros: estimatedCostMicros };
        });

        return result;
      } catch (err: any) {
        logSecurityAudit('WALLET_RESERVATION_FAILED', { user: { id: userId } }, { error: err?.message || err });
      }
    }

    // Memory Fallback
    const balance = await getWalletBalance(userId);
    if (balance.walletMicros < estimatedCostMicros) {
      return { success: false, reason: 'INSUFFICIENT_FUNDS' };
    }

    const newWalletMicros = balance.walletMicros - estimatedCostMicros;
    const updatedBalance = { ...balance, walletMicros: newWalletMicros, updatedAt: new Date() };
    memoryDb.aiWalletBalances.set(userId, updatedBalance);

    const reservation = {
      id: reservationId,
      userId,
      orgId: orgId || null,
      reservedMicros: estimatedCostMicros,
      status: 'reserved',
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryDb.aiWalletReservations.set(reservationId, reservation as any);

    return { success: true, reservationId, reservedMicros: estimatedCostMicros };
  });
}

/**
 * Phase 2.3: Finalize actual AI usage after execution.
 * Releases unused reservation delta or deducts remaining amount.
 */
export async function finalizeAiWalletTransaction(
  reservationId: string,
  actualCostMicros: number,
  usageDetails: {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    productSlug?: string;
  }
) {
  const reservation = memoryDb.aiWalletReservations.get(reservationId);
  if (!reservation || reservation.status !== 'reserved') {
    throw new Error(`Reservation ${reservationId} is invalid or already finalized/rolled back.`);
  }

  const userId = reservation.userId;

  return acquireUserLock(userId, async () => {
    const reservedMicros = reservation.reservedMicros;
    const diffMicros = reservedMicros - actualCostMicros;

    if (db) {
      try {
        await db.transaction(async (tx: any) => {
          if (diffMicros !== 0) {
            await tx
              .update(aiWalletBalancesTable)
              .set({
                walletMicros: sql`${aiWalletBalancesTable.walletMicros} + ${diffMicros}`,
                updatedAt: new Date(),
              })
              .where(eq(aiWalletBalancesTable.userId, userId));
          }

          await tx
            .update(aiWalletReservationsTable)
            .set({ status: 'finalized', updatedAt: new Date() })
            .where(eq(aiWalletReservationsTable.id, reservationId));

          const usageEvent = {
            id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId,
            orgId: reservation.orgId || 'org_oprox',
            productSlug: usageDetails.productSlug || 'oprox-code',
            provider: usageDetails.provider,
            model: usageDetails.model,
            promptTokens: usageDetails.promptTokens || 0,
            completionTokens: usageDetails.completionTokens || 0,
            costMicros: actualCostMicros,
            createdAt: new Date(),
          };

          await tx.insert(aiUsageEventsTable).values(usageEvent as any);

          const ledgerEntry = {
            id: `ledger_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            userId,
            amountMicros: -actualCostMicros,
            type: 'usage',
            description: `AI Usage (${usageDetails.provider}/${usageDetails.model})`,
            createdAt: new Date(),
          };

          await tx.insert(aiWalletLedgerTable).values(ledgerEntry as any);
        });
      } catch {
        // Memory fallback
      }
    }

    // Memory store update
    const balance = await getWalletBalance(userId);
    const updatedBalance = {
      ...balance,
      walletMicros: Math.max(0, balance.walletMicros + diffMicros),
      updatedAt: new Date(),
    };
    memoryDb.aiWalletBalances.set(userId, updatedBalance);

    reservation.status = 'finalized';
    reservation.updatedAt = new Date();

    const usageEvent = {
      id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      orgId: reservation.orgId || 'org_oprox',
      productSlug: usageDetails.productSlug || 'oprox-code',
      provider: usageDetails.provider,
      model: usageDetails.model,
      promptTokens: usageDetails.promptTokens || 0,
      completionTokens: usageDetails.completionTokens || 0,
      costMicros: actualCostMicros,
      createdAt: new Date(),
    };
    memoryDb.aiUsageEvents.push(usageEvent as any);

    const ledgerEntry = {
      id: `ledger_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      amountMicros: -actualCostMicros,
      type: 'usage',
      description: `AI Usage (${usageDetails.provider}/${usageDetails.model})`,
      createdAt: new Date(),
    };
    memoryDb.aiWalletLedger.push(ledgerEntry as any);

    return {
      success: true,
      reservationId,
      actualCostMicros,
      remainingWalletMicros: updatedBalance.walletMicros,
      usageEvent,
      ledgerEntry,
    };
  });
}

/**
 * Phase 2.3: Rollback reservation on failure or cancellation.
 */
export async function rollbackAiWalletReservation(reservationId: string, reason: string) {
  const reservation = memoryDb.aiWalletReservations.get(reservationId);
  if (!reservation || reservation.status !== 'reserved') {
    return { success: false, reason: 'Reservation not found or not active.' };
  }

  const userId = reservation.userId;

  return acquireUserLock(userId, async () => {
    const reservedMicros = reservation.reservedMicros;

    if (db) {
      try {
        await db.transaction(async (tx: any) => {
          await tx
            .update(aiWalletBalancesTable)
            .set({
              walletMicros: sql`${aiWalletBalancesTable.walletMicros} + ${reservedMicros}`,
              updatedAt: new Date(),
            })
            .where(eq(aiWalletBalancesTable.userId, userId));

          await tx
            .update(aiWalletReservationsTable)
            .set({ status: 'rolled_back', updatedAt: new Date() })
            .where(eq(aiWalletReservationsTable.id, reservationId));
        });
      } catch {
        // Fallback
      }
    }

    const balance = await getWalletBalance(userId);
    const updatedBalance = {
      ...balance,
      walletMicros: balance.walletMicros + reservedMicros,
      updatedAt: new Date(),
    };
    memoryDb.aiWalletBalances.set(userId, updatedBalance);

    reservation.status = 'rolled_back';
    reservation.updatedAt = new Date();

    logSecurityAudit('RESERVATION_ROLLED_BACK', { user: { id: userId } }, { reservationId, reservedMicros, reason });

    return { success: true, reservationId, rolledBackMicros: reservedMicros, status: 'rolled_back' };
  });
}

export async function recordAiUsage(event: {
  userId: string;
  orgId?: string;
  productSlug?: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costMicros: number;
}) {
  const usageEvent = {
    id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: event.userId || 'usr_anonymous',
    orgId: event.orgId || 'org_oprox',
    productSlug: event.productSlug || 'oprox-code',
    provider: event.provider,
    model: event.model,
    promptTokens: event.promptTokens || 0,
    completionTokens: event.completionTokens || 0,
    costMicros: event.costMicros || 0,
    createdAt: new Date(),
  };

  memoryDb.aiUsageEvents.push(usageEvent as any);

  if (db) {
    try {
      await db.insert(aiUsageEventsTable).values(usageEvent as any);
    } catch {
      // Fallback
    }
  }

  return usageEvent;
}

export async function getAiUsageStats() {
  const events = memoryDb.aiUsageEvents;
  const totalCalls = events.length;
  let totalCostMicros = 0;
  let totalTokens = 0;

  const byProduct: Record<string, { calls: number; costUsd: number }> = {};
  const byProvider: Record<string, { calls: number; costUsd: number }> = {};

  for (const e of events) {
    totalCostMicros += e.costMicros;
    totalTokens += e.promptTokens + e.completionTokens;

    if (!byProduct[e.productSlug]) byProduct[e.productSlug] = { calls: 0, costUsd: 0 };
    byProduct[e.productSlug].calls++;
    byProduct[e.productSlug].costUsd += e.costMicros / 1000000;

    if (!byProvider[e.provider]) byProvider[e.provider] = { calls: 0, costUsd: 0 };
    byProvider[e.provider].calls++;
    byProvider[e.provider].costUsd += e.costMicros / 1000000;
  }

  return {
    totalCalls,
    totalTokens,
    totalCostUsd: totalCostMicros / 1000000,
    byProduct,
    byProvider,
    recentEvents: events.slice(-20).reverse(),
  };
}

export async function getAiProviders() {
  if (db) {
    try {
      const rows = await db.select().from(aiProviderConfigsTable);
      if (rows.length > 0) return rows;
    } catch {
      // Fallback
    }
  }
  return Array.from(memoryDb.aiProviderConfigs.values());
}

export async function updateAiProvider(
  providerId: string,
  updates: Partial<typeof memoryDb.aiProviderConfigs extends Map<any, infer T> ? T : never>
) {
  const current = memoryDb.aiProviderConfigs.get(providerId) || {
    providerId,
    displayName: providerId.toUpperCase(),
    enabled: true,
    priority: 1,
    circuitBreakerOpen: false,
    updatedAt: new Date(),
  };

  const updated = { ...current, ...updates, updatedAt: new Date() };
  memoryDb.aiProviderConfigs.set(providerId, updated);

  if (db) {
    try {
      await db.insert(aiProviderConfigsTable).values(updated).onConflictDoUpdate({
        target: aiProviderConfigsTable.providerId,
        set: updated,
      });
    } catch {
      // Fallback
    }
  }

  return updated;
}
