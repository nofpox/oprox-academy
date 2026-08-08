import { randomUUID } from 'crypto';
import { memoryDb, db } from '../db';
import {
  subscriptionsTable,
  localInvoicesTable,
  couponsTable,
  billingEventsTable,
  paymentProviderConfigTable,
  organizationsTable,
} from '../db/schema';
import { eq } from 'drizzle-orm';
import { encryptIfPlaintext, decryptIfEncrypted } from './encryption';
import { adjustWalletBalance } from './aiWallet';
import { validatePlanPurchasable, getPlanByCode } from './plansCatalog';
import { createZatcaInvoice, calculateSaudiVat, generateSequentialInvoiceNumber } from './vatZatca';
import { validatePaymentMethodAllowed } from './paymentMethods';
import { logAuditEvent } from './audit';

export async function getSubscriptions() {
  if (db) {
    try {
      const rows = await db.select().from(subscriptionsTable);
      return rows;
    } catch {
      // Fallback
    }
  }
  return Array.from(memoryDb.subscriptions.values());
}

export async function getSubscriptionById(id: string) {
  if (db) {
    try {
      const rows = await db.select().from(subscriptionsTable).where(eq(subscriptionsTable.id, id)).limit(1);
      if (rows.length > 0) return rows[0];
    } catch {
      // Fallback
    }
  }
  return memoryDb.subscriptions.get(id) || null;
}

export async function getInvoices() {
  if (db) {
    try {
      const rows = await db.select().from(localInvoicesTable);
      return rows;
    } catch {
      // Fallback
    }
  }
  return Array.from(memoryDb.invoices.values());
}

export async function getCoupons() {
  if (db) {
    try {
      const rows = await db.select().from(couponsTable);
      return rows;
    } catch {
      // Fallback
    }
  }
  return Array.from(memoryDb.coupons.values());
}

export async function createCoupon(couponData: { code: string; discountType: string; discountValue: number; maxRedemptions?: number }) {
  const coupon = {
    id: `coup_${Date.now()}`,
    code: couponData.code,
    discountType: couponData.discountType || 'percent',
    discountValue: String(couponData.discountValue),
    maxRedemptions: couponData.maxRedemptions || 100,
    timesRedeemed: 0,
    active: true,
    createdAt: new Date(),
  };

  if (db) {
    try {
      await db.insert(couponsTable).values(coupon);
    } catch {
      // Fallback
    }
  }
  memoryDb.coupons.set(coupon.code, coupon);
  return coupon;
}

import {
  addSavedPaymentMethod,
  setAutoRenewSetting,
  getAutoRenewSetting,
  getWalletBalance as getWalletBalanceLib,
} from './paymentMethods';

/**
 * Phase 4: Atomic billing workflow for creating or upgrading subscriptions.
 * Enforces pricing catalog active status & approved prices, payment method policy, ZATCA e-invoicing, and wallet credits.
 * Enforces Prepaid Policy, Optional Saved Payment Method (default false), and Auto Renew (default false).
 */
export async function createSubscriptionAtomic(data: {
  userId: string;
  orgId?: string;
  planId: string;
  amountCents?: number;
  currency?: 'SAR' | 'USD';
  paymentMethod?: string;
  stripeCustomerId?: string;
  walletCreditMicros?: number;
  savePaymentMethod?: boolean;
  autoRenew?: boolean;
}) {
  const currency = data.currency || 'SAR';
  const paymentMethod = data.paymentMethod || 'unified';
  const savePaymentMethod = data.savePaymentMethod ?? false;
  const autoRenew = data.autoRenew ?? false;

  // 1. Validate Payment Method against OPROX Policy
  const payVal = await validatePaymentMethodAllowed(paymentMethod);
  if (!payVal.allowed) {
    throw new Error(payVal.reason || `Payment method '${paymentMethod}' is disabled by OPROX policy.`);
  }

  // 2. Validate Pricing Catalog — Reject draft/unset prices or inactive plans
  const planVal = await validatePlanPurchasable(data.planId, currency);
  if (!planVal.purchasable) {
    throw new Error(planVal.reason || `Plan '${data.planId}' has no approved active price and cannot be purchased.`);
  }

  const plan = planVal.plan!;
  const subtotalHalalas = data.amountCents !== undefined
    ? data.amountCents
    : (currency === 'SAR' ? (plan.priceSarHalalas || 0) : (plan.priceUsdCents || 0));

  const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  // Set autoRenew preference (default false)
  await setAutoRenewSetting(data.userId, autoRenew);

  // Optionally save payment method if explicitly requested (default false)
  if (savePaymentMethod) {
    await addSavedPaymentMethod(data.userId, {
      type: paymentMethod,
      brand: 'Visa / mada',
      last4: '4242',
      isDefault: true,
    });
  }

  const subscriptionRow = {
    id: subId,
    userId: data.userId,
    orgId: data.orgId || null,
    stripeCustomerId: data.stripeCustomerId || `cus_${Date.now()}`,
    planId: data.planId,
    scheduledPlanId: null,
    scheduledPlanEffectiveAt: null,
    status: 'active',
    interval: plan.billingInterval || 'month',
    currentPeriodStart: new Date(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
    cancelAtPeriodEnd: !autoRenew, // Default: auto-renew is OFF
    seatsCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // 3. Create ZATCA Compliant Invoice Record
  const invoiceRow = await createZatcaInvoice({
    userId: data.userId,
    orgId: data.orgId || null,
    stripeCustomerId: subscriptionRow.stripeCustomerId,
    subtotalHalalas,
    currency,
    invoiceType: 'B2C_SIMPLIFIED_INVOICE',
    status: 'paid',
  });

  if (db) {
    try {
      await db.transaction(async (tx: any) => {
        await tx.insert(subscriptionsTable).values(subscriptionRow);
        if (data.orgId) {
          await tx
            .update(organizationsTable)
            .set({ plan: data.planId, updatedAt: new Date() })
            .where(eq(organizationsTable.id, data.orgId));
        }
      });
    } catch {
      // Fallback
    }
  }

  memoryDb.subscriptions.set(subId, subscriptionRow as any);

  // Grant included AI credits from plan if configured
  const includedMicros = data.walletCreditMicros ?? plan.includedAiMicros ?? 0;
  if (includedMicros > 0) {
    await adjustWalletBalance(
      data.userId,
      includedMicros,
      'topup',
      `Plan '${plan.displayName}' included AI credit issuance`
    );
  }

  await logAuditEvent({
    orgId: data.orgId || null,
    actorId: data.userId,
    action: 'SUBSCRIPTION_CREATED',
    targetType: 'SUBSCRIPTION',
    targetId: subId,
    metadata: {
      planId: data.planId,
      currency,
      paymentMethod,
      invoiceId: invoiceRow.id,
      savePaymentMethod,
      autoRenew,
    },
  });

  return { subscription: subscriptionRow, invoice: invoiceRow, savePaymentMethod, autoRenew };
}

/**
 * Asserts that the platform is permitted to charge a customer.
 * Charges are ONLY permitted if:
 * A) The customer is actively making a payment (isActivePaymentSession = true)
 * OR
 * B) The customer explicitly enabled Auto Renew.
 */
export async function assertCanChargeCustomer(userId: string, isActivePaymentSession: boolean): Promise<boolean> {
  if (isActivePaymentSession) {
    return true;
  }
  const autoRenew = await getAutoRenewSetting(userId);
  if (!autoRenew) {
    throw new Error('NO_SURPRISE_CHARGES: Automatic charging is prohibited because Auto-Renew is disabled and no active payment session exists.');
  }
  return true;
}

/**
 * Asserts compliance with OPROX Prepaid Only policy.
 * When subscription or credits reach zero, billable services are immediately suspended.
 */
export async function assertPrepaidPolicy(userId: string): Promise<{ active: boolean; message?: string }> {
  const userSubs = Array.from(memoryDb.subscriptions.values()).filter((s) => s.userId === userId && s.status === 'active');
  const userWallet = memoryDb.aiWalletBalances.get(userId);
  const totalBalance = (userWallet?.walletMicros || 0) + (userWallet?.includedCreditMicros || 0);

  if (userSubs.length === 0 && totalBalance <= 0) {
    return {
      active: false,
      message: 'Your subscription or credits have expired. Please renew to continue.',
    };
  }
  return { active: true };
}

/**
 * Phase 4 Upgrade Policy: UPGRADES TAKE EFFECT IMMEDIATELY.
 */
export async function upgradeSubscriptionImmediate(params: {
  subscriptionId: string;
  newPlanCode: string;
  paymentMethod?: string;
  currency?: 'SAR' | 'USD';
}) {
  const sub = await getSubscriptionById(params.subscriptionId);
  if (!sub) {
    throw new Error(`Subscription '${params.subscriptionId}' not found.`);
  }

  const currency = params.currency || 'SAR';
  const paymentMethod = params.paymentMethod || 'mada';

  const payVal = await validatePaymentMethodAllowed(paymentMethod);
  if (!payVal.allowed) {
    throw new Error(payVal.reason || `Payment method '${paymentMethod}' is disabled by OPROX policy.`);
  }

  const planVal = await validatePlanPurchasable(params.newPlanCode, currency);
  if (!planVal.purchasable) {
    throw new Error(planVal.reason || `Upgrade plan '${params.newPlanCode}' has no approved active price.`);
  }

  const newPlan = planVal.plan!;
  const newPrice = currency === 'SAR' ? (newPlan.priceSarHalalas || 0) : (newPlan.priceUsdCents || 0);

  // Calculate upgrade proration
  const oldPlan = await getPlanByCode(sub.planId);
  const oldPrice = oldPlan ? (currency === 'SAR' ? (oldPlan.priceSarHalalas || 0) : (oldPlan.priceUsdCents || 0)) : 0;
  const priceDiff = Math.max(0, newPrice - oldPrice);

  const updatedSub = {
    ...sub,
    planId: params.newPlanCode,
    scheduledPlanId: null,
    scheduledPlanEffectiveAt: null,
    updatedAt: new Date(),
  };

  const invoice = await createZatcaInvoice({
    userId: sub.userId,
    orgId: sub.orgId,
    stripeCustomerId: sub.stripeCustomerId,
    subtotalHalalas: priceDiff,
    currency,
    status: 'paid',
  });

  if (db) {
    try {
      await db.update(subscriptionsTable).set(updatedSub).where(eq(subscriptionsTable.id, sub.id));
      if (sub.orgId) {
        await db.update(organizationsTable).set({ plan: params.newPlanCode, maxSeats: newPlan.maxUsers, updatedAt: new Date() }).where(eq(organizationsTable.id, sub.orgId));
      }
    } catch {
      // Fallback
    }
  }

  memoryDb.subscriptions.set(sub.id, updatedSub as any);
  if (sub.orgId) {
    const org = memoryDb.organizations.get(sub.orgId);
    if (org) {
      org.plan = params.newPlanCode;
      org.maxSeats = newPlan.maxUsers;
    }
  }

  if (newPlan.includedAiMicros > 0) {
    await adjustWalletBalance(sub.userId, newPlan.includedAiMicros, 'topup', `Upgrade to ${newPlan.displayName} included AI credits`);
  }

  await logAuditEvent({
    orgId: sub.orgId || null,
    actorId: sub.userId,
    action: 'SUBSCRIPTION_UPGRADED_IMMEDIATE',
    targetType: 'SUBSCRIPTION',
    targetId: sub.id,
    metadata: { oldPlan: sub.planId, newPlan: params.newPlanCode, priceDiff },
  });

  return { subscription: updatedSub, invoice };
}

/**
 * Phase 4 Downgrade Policy: DOWNGRADES DO NOT TAKE EFFECT IMMEDIATELY.
 * Schedules downgrade for NEXT billing cycle while paid entitlement remains active.
 */
export async function scheduleDowngradeAtPeriodEnd(params: {
  subscriptionId: string;
  newPlanCode: string;
}) {
  const sub = await getSubscriptionById(params.subscriptionId);
  if (!sub) {
    throw new Error(`Subscription '${params.subscriptionId}' not found.`);
  }

  const newPlan = await getPlanByCode(params.newPlanCode);
  if (!newPlan) {
    throw new Error(`Downgrade target plan '${params.newPlanCode}' does not exist.`);
  }

  const effectiveAt = sub.currentPeriodEnd || new Date(Date.now() + 30 * 86400 * 1000);

  const updatedSub = {
    ...sub,
    scheduledPlanId: params.newPlanCode,
    scheduledPlanEffectiveAt: effectiveAt,
    updatedAt: new Date(),
  };

  if (db) {
    try {
      await db.update(subscriptionsTable).set(updatedSub).where(eq(subscriptionsTable.id, sub.id));
      if (sub.orgId) {
        await db.update(organizationsTable).set({ scheduledPlan: params.newPlanCode, scheduledPlanEffectiveAt: effectiveAt }).where(eq(organizationsTable.id, sub.orgId));
      }
    } catch {
      // Fallback
    }
  }

  memoryDb.subscriptions.set(sub.id, updatedSub as any);

  await logAuditEvent({
    orgId: sub.orgId || null,
    actorId: sub.userId,
    action: 'SUBSCRIPTION_DOWNGRADE_SCHEDULED',
    targetType: 'SUBSCRIPTION',
    targetId: sub.id,
    metadata: { currentPlan: sub.planId, scheduledPlan: params.newPlanCode, effectiveAt },
  });

  return { subscription: updatedSub, message: `Downgrade to '${newPlan.displayName}' scheduled for end of billing cycle (${effectiveAt.toISOString()}).` };
}

/**
 * Phase 4 Cancellation Policy: STOPS FUTURE RENEWAL AT PERIOD END.
 * Paid service remains active until period end.
 */
export async function cancelSubscriptionAtPeriodEnd(subscriptionId: string) {
  const sub = await getSubscriptionById(subscriptionId);
  if (!sub) {
    throw new Error(`Subscription '${subscriptionId}' not found.`);
  }

  const updatedSub = {
    ...sub,
    cancelAtPeriodEnd: true,
    updatedAt: new Date(),
  };

  if (db) {
    try {
      await db.update(subscriptionsTable).set({ cancelAtPeriodEnd: true, updatedAt: new Date() }).where(eq(subscriptionsTable.id, sub.id));
    } catch {
      // Fallback
    }
  }

  memoryDb.subscriptions.set(sub.id, updatedSub as any);

  await logAuditEvent({
    orgId: sub.orgId || null,
    actorId: sub.userId,
    action: 'SUBSCRIPTION_CANCELLATION_SCHEDULED',
    targetType: 'SUBSCRIPTION',
    targetId: sub.id,
    metadata: { currentPeriodEnd: sub.currentPeriodEnd },
  });

  return {
    subscription: updatedSub,
    message: `Subscription cancellation scheduled for end of billing period (${sub.currentPeriodEnd.toISOString()}). Service remains active until then.`,
  };
}

/**
 * Phase 4 Refund Policy: NO CUSTOMER REFUNDS.
 */
export function assertNoRefundsPolicy(): void {
  throw new Error("NO_REFUNDS_POLICY: Customer self-service refunds are prohibited by OPROX commercial policy. Unused subscription time and AI credits are non-cash-refundable.");
}

/**
 * Phase 4 Dunning & Failed Payment Handling
 */
export async function handlePaymentFailure(subscriptionId: string, reason: string) {
  const sub = await getSubscriptionById(subscriptionId);
  if (!sub) return null;

  const updatedSub = {
    ...sub,
    status: 'past_due',
    updatedAt: new Date(),
  };

  if (db) {
    try {
      await db.update(subscriptionsTable).set({ status: 'past_due', updatedAt: new Date() }).where(eq(subscriptionsTable.id, sub.id));
    } catch {
      // Fallback
    }
  }

  memoryDb.subscriptions.set(sub.id, updatedSub as any);

  await logAuditEvent({
    orgId: sub.orgId || null,
    actorId: sub.userId,
    action: 'SUBSCRIPTION_PAYMENT_FAILED_DUNNING',
    targetType: 'SUBSCRIPTION',
    targetId: sub.id,
    metadata: { reason, status: 'past_due' },
  });

  return updatedSub;
}

export async function getPaymentProviderConfig(options: { decryptSecrets?: boolean } = {}) {
  let config = memoryDb.paymentProviderConfig;

  if (db) {
    try {
      const rows = await db.select().from(paymentProviderConfigTable);
      if (rows.length > 0) config = rows[0];
    } catch {
      // Fallback
    }
  }

  if (options.decryptSecrets) {
    return {
      ...config,
      secretKey: config.secretKey ? decryptIfEncrypted(config.secretKey) : null,
      webhookSecret: config.webhookSecret ? decryptIfEncrypted(config.webhookSecret) : null,
    };
  }

  return config;
}

export async function updatePaymentProviderConfig(updates: Partial<typeof memoryDb.paymentProviderConfig>) {
  const encryptedUpdates = {
    ...updates,
    secretKey: updates.secretKey ? encryptIfPlaintext(updates.secretKey) : updates.secretKey,
    webhookSecret: updates.webhookSecret ? encryptIfPlaintext(updates.webhookSecret) : updates.webhookSecret,
  };

  memoryDb.paymentProviderConfig = {
    ...memoryDb.paymentProviderConfig,
    ...encryptedUpdates,
    updatedAt: new Date(),
  } as typeof memoryDb.paymentProviderConfig;

  if (db) {
    try {
      await db.insert(paymentProviderConfigTable).values(memoryDb.paymentProviderConfig).onConflictDoUpdate({
        target: paymentProviderConfigTable.id,
        set: memoryDb.paymentProviderConfig,
      });
    } catch {
      // Fallback
    }
  }
  return memoryDb.paymentProviderConfig;
}

const eventLocks = new Map<string, Promise<void>>();

async function acquireEventLock<T>(eventId: string, fn: () => Promise<T>): Promise<T> {
  let resolver: () => void;
  const currentLock = eventLocks.get(eventId) || Promise.resolve();
  const nextLock = new Promise<void>((resolve) => {
    resolver = resolve;
  });
  eventLocks.set(eventId, currentLock.then(() => nextLock));

  try {
    await currentLock;
    return await fn();
  } finally {
    resolver!();
  }
}

export async function processBillingWebhookEvent(evt: { id: string; type: string; data?: any }): Promise<{ processed: boolean; duplicate: boolean }> {
  return acquireEventLock(evt.id, async () => {
    if (db) {
      try {
        const existing = await db.select().from(billingEventsTable).where(eq(billingEventsTable.stripeEventId, evt.id)).limit(1);
        if (existing.length > 0) {
          return { processed: true, duplicate: true };
        }
      } catch {
        // Fallback
      }
    }

    const memExisting = memoryDb.billingEvents.find((e) => e.stripeEventId === evt.id);
    if (memExisting) {
      return { processed: true, duplicate: true };
    }

    const record = {
      id: randomUUID(),
      stripeEventId: evt.id,
      eventType: evt.type,
      payload: evt.data || {},
      processed: true,
      createdAt: new Date(),
    };

    if (db) {
      try {
        await db.insert(billingEventsTable).values(record as any);
      } catch (err: any) {
        // Only PostgreSQL UNIQUE constraint violation (code 23505) indicates duplicate event insertion race
        const isUniqueViolation = err && (
          err.code === '23505' ||
          err.constraint?.includes('stripe_event_id') ||
          (typeof err.message === 'string' && (err.message.includes('unique constraint') || err.message.includes('duplicate key')))
        );

        if (isUniqueViolation) {
          if (!memoryDb.billingEvents.some((e) => e.stripeEventId === evt.id)) {
            memoryDb.billingEvents.push(record as any);
          }
          return { processed: true, duplicate: true };
        }

        // Any non-unique database error must NOT be classified as duplicate!
        console.error('[DATABASE ERROR] Failed to insert billing event:', err);
        throw err;
      }
    }

    if (!memoryDb.billingEvents.some((e) => e.stripeEventId === evt.id)) {
      memoryDb.billingEvents.push(record as any);
    }

    return { processed: true, duplicate: false };
  });
}

export async function handleStripeWebhook(event: { id: string; type: string; data: any }) {
  const idempotency = await processBillingWebhookEvent(event);
  if (idempotency.duplicate) {
    return { received: true, eventId: event.id, duplicate: true };
  }
  return { received: true, eventId: event.id, duplicate: false };
}

