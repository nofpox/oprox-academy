import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

let dbInstance: any = null;
let pgPoolInstance: any = null;

if (process.env.DATABASE_URL) {
  try {
    pgPoolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: (process.env.NODE_ENV === "test" || process.env.VITEST) ? 1 : 10,
    });
    dbInstance = drizzle(pgPoolInstance, { schema });
  } catch (err) {
    console.warn("PostgreSQL connection error, falling back to memory store:", err);
  }
}

export async function closeDbConnections(): Promise<void> {
  if (pgPoolInstance) {
    try {
      await pgPoolInstance.end();
      dbInstance = null;
    } catch {
      // Ignore cleanup error
    }
  }
}

// In-Memory Fallback DB Store for development/preview without direct PG connection
class MemoryDbStore {
  systemState = new Map<string, { key: string; value: string; updatedAt: Date }>();
  emergencyLogs: schema.EmergencyActionLog[] = [];
  healthSnapshots: schema.PlatformHealthSnapshot[] = [];
  alertConfigs = new Map<string, schema.OperationalAlertConfig>();
  alertIncidents: schema.OperationalAlertIncident[] = [];
  auditLogs: schema.AuditLogRow[] = [];
  auditEvents: schema.AuditEventRow[] = [];
  costGuardSettings: schema.CostGuardSettingsRow = {
    id: "default",
    orgId: null,
    maxDailyUsd: "50.00",
    maxMonthlyUsd: "1000.00",
    autoKillAtUsd: "1500.00",
    notifyAtPercentage: 80,
    enabled: true,
    updatedAt: new Date(),
  };

  // Phase 2: Billing & Subscriptions
  subscriptions = new Map<string, schema.SubscriptionRow>();
  invoices = new Map<string, schema.LocalInvoiceRow>();
  invoiceSequences = new Map<number, number>();
  coupons = new Map<string, schema.CouponRow>();
  billingEvents: schema.BillingEventRow[] = [];
  paymentProviderConfig: schema.PaymentProviderConfigRow = {
    id: "stripe",
    enabled: true,
    mode: "test",
    publishableKey: "pk_test_oprox_sample_key_12345",
    secretKey: "sk_test_oprox_sample_secret_67890",
    webhookSecret: "whsec_oprox_test_secret",
    updatedAt: new Date(),
  };

  // Phase 3: AI Wallet & Usage
  aiWalletBalances = new Map<string, schema.AiWalletBalanceRow>();
  aiWalletReservations = new Map<string, schema.AiWalletReservationRow>();
  aiWalletLedger: schema.AiWalletLedgerRow[] = [];
  aiUsageEvents: schema.AiUsageEventRow[] = [];
  aiProviderConfigs = new Map<string, schema.AiProviderConfigRow>();

  // Phase 4: Business & Financial Policy
  plansCatalog = new Map<string, schema.PlanCatalogRow>();
  paymentMethodsConfig = new Map<string, schema.PaymentMethodConfigRow>();
  dualApprovalRequests = new Map<string, schema.DualApprovalRequestRow>();
  aiModelPricingMetadata = new Map<string, schema.AiModelPricingMetadataRow>();

  // Phase 4: Users & Organizations
  organizations = new Map<string, schema.OrganizationRow>();
  organizationMembers: schema.OrganizationMemberRow[] = [];

  // Phase 5: Central Operations (Queues & Background Jobs)
  jobQueueAudit: schema.JobQueueAuditRow[] = [];

  // Phase 6: Product Registry
  productRegistry = new Map<string, schema.ProductRegistryRow>();

  // Phase 3: State Persistence
  phase3ProjectConfigs = new Map<string, schema.Phase3ProjectConfigRow>();
  phase3GeneratedFiles: schema.Phase3GeneratedFileRow[] = [];
  phase3SharedContext = new Map<string, schema.Phase3SharedContextRow>();
  phase3AgentHandoffs: schema.Phase3AgentHandoffRow[] = [];
  phase3PipelineTasks: schema.Phase3PipelineTaskRow[] = [];
  phase3Releases: schema.Phase3ReleaseRow[] = [];
  phase3Lifecycle = new Map<string, schema.Phase3LifecycleRow>();

  constructor() {
    // Seed default system state
    this.systemState.set("platform:maintenance_mode", {
      key: "platform:maintenance_mode",
      value: "false",
      updatedAt: new Date(),
    });
    this.systemState.set("platform:kill:all_ai", {
      key: "platform:kill:all_ai",
      value: "false",
      updatedAt: new Date(),
    });
    this.systemState.set("platform:kill:code_studio", {
      key: "platform:kill:code_studio",
      value: "false",
      updatedAt: new Date(),
    });
    this.systemState.set("platform:kill:mockup_sandbox", {
      key: "platform:kill:mockup_sandbox",
      value: "false",
      updatedAt: new Date(),
    });
    this.systemState.set("platform:kill:payments", {
      key: "platform:kill:payments",
      value: "false",
      updatedAt: new Date(),
    });

    // Seed default alert configs
    const defaults = [
      {
        id: "ai_provider_failure",
        metric: "ai_provider_failure",
        displayName: "AI Provider Failure",
        description: "Fires when AI provider error rate spikes.",
        thresholdValue: 1,
        enabled: true,
        notifyInApp: true,
        cooldownMinutes: 15,
        updatedAt: new Date(),
      },
      {
        id: "db_latency_high",
        metric: "db_latency_high",
        displayName: "Database Latency High",
        description: "Fires when DB query latency exceeds threshold.",
        thresholdValue: 500,
        enabled: true,
        notifyInApp: true,
        cooldownMinutes: 10,
        updatedAt: new Date(),
      },
      {
        id: "high_error_rate_5xx",
        metric: "high_error_rate_5xx",
        displayName: "5XX Error Spike",
        description: "Fires when 5xx HTTP response rate exceeds threshold.",
        thresholdValue: 5,
        enabled: true,
        notifyInApp: true,
        cooldownMinutes: 5,
        updatedAt: new Date(),
      },
    ];
    for (const item of defaults) {
      this.alertConfigs.set(item.id, item);
    }

    // Seed initial audit log
    this.auditLogs.push({
      id: "a1b2c3d4-0000-0000-0000-000000000001",
      projectId: "proj_main",
      orgId: null,
      actorId: "superadmin_01",
      type: "SYSTEM_BOOT",
      message: "OPROX OS Core Control Subsystem initialized",
      createdAt: new Date(),
    });

    // Seed Subscriptions & Invoices
    this.subscriptions.set("sub_001", {
      id: "sub_001",
      userId: "usr_admin01",
      orgId: "org_oprox",
      stripeCustomerId: "cus_oprox_001",
      planId: "enterprise",
      status: "active",
      interval: "month",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400 * 1000),
      cancelAtPeriodEnd: false,
      seatsCount: 15,
      scheduledPlanId: null,
      scheduledPlanEffectiveAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.invoices.set("inv_001", {
      id: "inv_001",
      stripeCustomerId: "cus_oprox_001",
      userId: "usr_admin01",
      orgId: "org_oprox",
      amountDue: 29900,
      amountPaid: 29900,
      currency: "SAR",
      status: "paid",
      sequentialNumber: "INV-2026-000001",
      invoiceType: "B2C_SIMPLIFIED_INVOICE",
      subtotalHalalas: 26000,
      vatRateBps: 1500,
      vatAmountHalalas: 3900,
      totalAmountHalalas: 29900,
      sellerLegalName: "OPROX OS Ecosystem Ltd.",
      sellerVatNumber: "310000000000003",
      buyerLegalName: null,
      buyerVatNumber: null,
      qrCodePayload: null,
      structuredData: {},
      creditNoteRef: null,
      debitNoteRef: null,
      invoicePdfUrl: "https://stripe.com/invoice/pdf/inv_001",
      createdAt: new Date(),
    });

    this.coupons.set("PROMO2026", {
      id: "coup_001",
      code: "PROMO2026",
      discountType: "percent",
      discountValue: "20.00",
      maxRedemptions: 100,
      timesRedeemed: 12,
      active: true,
      createdAt: new Date(),
    });

    // Seed AI Wallet & Providers
    this.aiWalletBalances.set("usr_admin01", {
      userId: "usr_admin01",
      orgId: null,
      includedCreditMicros: 25000000, // $25.00
      walletMicros: 10000000, // $10.00
      updatedAt: new Date(),
    });

    this.aiProviderConfigs.set("gemini", {
      providerId: "gemini",
      displayName: "Google Gemini 2.5 Flash / Pro",
      enabled: true,
      priority: 1,
      circuitBreakerOpen: false,
      updatedAt: new Date(),
    });
    this.aiProviderConfigs.set("openai", {
      providerId: "openai",
      displayName: "OpenAI GPT-4o",
      enabled: true,
      priority: 2,
      circuitBreakerOpen: false,
      updatedAt: new Date(),
    });

    // Seed Organizations
    this.organizations.set("org_oprox", {
      id: "org_oprox",
      name: "OPROX Central Ecosystem Org",
      slug: "oprox-central",
      ownerId: "usr_admin01",
      plan: "enterprise",
      maxSeats: 50,
      status: "active",
      legalName: "OPROX Central Trading LLC",
      vatNumber: "310000000000003",
      crNumber: "1010000000",
      taxIdentificationNumber: "310000000000003",
      billingAddress: "King Fahd Road, Olaya District, Riyadh, Saudi Arabia",
      country: "SA",
      scheduledPlan: null,
      scheduledPlanEffectiveAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed Phase 4: Pricing Catalog (Active default plans with approved prices)
    this.plansCatalog.set("starter", {
      id: "starter",
      code: "starter",
      displayName: "Starter Plan",
      active: true,
      priceSarHalalas: 3750,
      priceUsdCents: 1000,
      billingInterval: "monthly",
      includedAiMicros: 10000000,
      featureEntitlements: ["basic_access", "standard_support"],
      maxUsers: 5,
      upgradeRules: { immediate: true },
      downgradeRules: { atPeriodEnd: true },
      effectiveDate: new Date(),
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.plansCatalog.set("pro", {
      id: "pro",
      code: "pro",
      displayName: "Professional Plan",
      active: true,
      priceSarHalalas: 18750,
      priceUsdCents: 5000,
      billingInterval: "monthly",
      includedAiMicros: 50000000,
      featureEntitlements: ["pro_access", "priority_support", "team_collaboration"],
      maxUsers: 15,
      upgradeRules: { immediate: true },
      downgradeRules: { atPeriodEnd: true },
      effectiveDate: new Date(),
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.plansCatalog.set("enterprise", {
      id: "enterprise",
      code: "enterprise",
      displayName: "Enterprise Plan",
      active: true,
      priceSarHalalas: 112500,
      priceUsdCents: 30000,
      billingInterval: "monthly",
      includedAiMicros: 200000000,
      featureEntitlements: ["all_access", "dedicated_support", "unlimited_teams", "sso"],
      maxUsers: 50,
      upgradeRules: { immediate: true },
      downgradeRules: { atPeriodEnd: true },
      effectiveDate: new Date(),
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Seed Phase 4: Payment Methods Config (Credit card disabled by OPROX policy)
    this.paymentMethodsConfig.set("mada", {
      id: "mada",
      name: "mada Debit Card",
      provider: "stripe",
      enabled: true,
      currency: "SAR",
      paymentMethodType: "mada",
      status: "active",
      updatedAt: new Date(),
    });

    this.paymentMethodsConfig.set("stc_pay", {
      id: "stc_pay",
      name: "STC Pay Wallet",
      provider: "stripe",
      enabled: true,
      currency: "SAR",
      paymentMethodType: "stc_pay",
      status: "active",
      updatedAt: new Date(),
    });

    this.paymentMethodsConfig.set("barq_pay", {
      id: "barq_pay",
      name: "barq Pay",
      provider: "stripe",
      enabled: true,
      currency: "SAR",
      paymentMethodType: "barq_pay",
      status: "active",
      updatedAt: new Date(),
    });

    this.paymentMethodsConfig.set("bank_transfer", {
      id: "bank_transfer",
      name: "Local Bank Wire",
      provider: "manual",
      enabled: true,
      currency: "SAR",
      paymentMethodType: "bank_transfer",
      status: "active",
      updatedAt: new Date(),
    });

    this.paymentMethodsConfig.set("credit_card", {
      id: "credit_card",
      name: "Credit Card",
      provider: "stripe",
      enabled: false, // Disabled by OPROX commercial policy
      currency: "USD",
      paymentMethodType: "credit_card",
      status: "restricted",
      updatedAt: new Date(),
    });

    // Seed Phase 4: AI Model Pricing Metadata
    this.aiModelPricingMetadata.set("gemini-1.5-flash", {
      modelId: "gemini-1.5-flash",
      provider: "gemini",
      promptTokensMicrosPer1k: 75,
      completionTokensMicrosPer1k: 300,
      customerMarkupMultiplier: "1.50",
      updatedAt: new Date(),
    });

    this.aiModelPricingMetadata.set("gemini-1.5-pro", {
      modelId: "gemini-1.5-pro",
      provider: "gemini",
      promptTokensMicrosPer1k: 1250,
      completionTokensMicrosPer1k: 5000,
      customerMarkupMultiplier: "1.50",
      updatedAt: new Date(),
    });

    this.aiModelPricingMetadata.set("gpt-4o", {
      modelId: "gpt-4o",
      provider: "openai",
      promptTokensMicrosPer1k: 2500,
      completionTokensMicrosPer1k: 10000,
      customerMarkupMultiplier: "1.50",
      updatedAt: new Date(),
    });

    // Seed Queues Audit
    this.jobQueueAudit.push({
      id: "job_001",
      queueName: "email_notifications",
      jobName: "send_welcome_email",
      status: "completed",
      attempts: 1,
      payload: { to: "user@oprox.io" },
      errorMsg: null,
      createdAt: new Date(),
    });

    // Seed Product Registry (OPROX Central Control Room)
    const products: schema.ProductRegistryRow[] = [
      {
        id: "oprox-website",
        name: "OPROX Website",
        slug: "oprox-website",
        status: "operational",
        environment: "production",
        apiIdentifier: "web.oprox.io",
        health: "healthy",
        activeUsersCount: 1250,
        activeSubscriptionsCount: 0,
        monthlyAiCostUsd: "4.50",
        lastHeartbeat: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "oprox-code",
        name: "OPROX Code",
        slug: "oprox-code",
        status: "operational",
        environment: "production",
        apiIdentifier: "code.oprox.io",
        health: "healthy",
        activeUsersCount: 3400,
        activeSubscriptionsCount: 420,
        monthlyAiCostUsd: "184.20",
        lastHeartbeat: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "oprox-studio",
        name: "OPROX Studio",
        slug: "oprox-studio",
        status: "operational",
        environment: "production",
        apiIdentifier: "studio.oprox.io",
        health: "healthy",
        activeUsersCount: 890,
        activeSubscriptionsCount: 110,
        monthlyAiCostUsd: "62.80",
        lastHeartbeat: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "oprox-properties",
        name: "OPROX Properties",
        slug: "oprox-properties",
        status: "operational",
        environment: "production",
        apiIdentifier: "properties.oprox.io",
        health: "healthy",
        activeUsersCount: 410,
        activeSubscriptionsCount: 45,
        monthlyAiCostUsd: "12.00",
        lastHeartbeat: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "oprox-pms",
        name: "OPROX PMS",
        slug: "oprox-pms",
        status: "operational",
        environment: "production",
        apiIdentifier: "pms.oprox.io",
        health: "healthy",
        activeUsersCount: 220,
        activeSubscriptionsCount: 30,
        monthlyAiCostUsd: "8.50",
        lastHeartbeat: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const p of products) {
      this.productRegistry.set(p.id, p);
    }
  }
}

export const memoryDb = new MemoryDbStore();

export const db = dbInstance;
