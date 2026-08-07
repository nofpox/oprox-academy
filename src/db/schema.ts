import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ── Application Users ───────────────────────────────────────────────────────
export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").unique(),
    role: text("role").notNull().default("user"), // "user" | "admin" | "superadmin"
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("users_role_idx").on(t.role)]
);

export type UserRow = typeof usersTable.$inferSelect;

// ── Organizations ────────────────────────────────────────────────────────────
export const organizationsTable = pgTable(
  "organizations",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    ownerId: text("owner_id").notNull().references(() => usersTable.id, { onDelete: "restrict" }),
    plan: text("plan").notNull().default("business"),
    maxSeats: integer("max_seats").notNull().default(10),
    status: text("status").notNull().default("active"),
    // Saudi Billing Identity & Organization Details
    legalName: text("legal_name"),
    vatNumber: text("vat_number"),
    crNumber: text("cr_number"),
    taxIdentificationNumber: text("tax_identification_number"),
    billingAddress: text("billing_address"),
    country: text("country").notNull().default("SA"),
    scheduledPlan: text("scheduled_plan"),
    scheduledPlanEffectiveAt: timestamp("scheduled_plan_effective_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("organizations_owner_idx").on(t.ownerId)]
);

export type OrganizationRow = typeof organizationsTable.$inferSelect;

export const organizationMembersTable = pgTable(
  "organization_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").notNull().references(() => organizationsTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"), // owner | admin | member
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("org_members_user_org_uniq").on(t.orgId, t.userId),
    index("org_members_org_idx").on(t.orgId),
    index("org_members_user_idx").on(t.userId),
  ]
);

export type OrganizationMemberRow = typeof organizationMembersTable.$inferSelect;

// ── Emergency Actions Audit Log (KillSwitch) ───────────────────────────────
export const emergencyActionsLogTable = pgTable(
  "emergency_actions_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminUserId: text("admin_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    adminEmail: text("admin_email"),
    actionType: text("action_type").notNull(), // "activated" | "deactivated"
    direction: text("direction").notNull(),
    stateKey: text("state_key").notNull(),
    targetLabel: text("target_label").notNull(),
    previousValue: text("previous_value"),
    newValue: text("new_value").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("emergency_actions_log_admin_idx").on(t.adminUserId),
    index("emergency_actions_log_created_at_idx").on(t.createdAt),
  ]
);

export type EmergencyActionLog = typeof emergencyActionsLogTable.$inferSelect;

// ── System State KV Store (KillSwitches, Maintenance Mode, Configs) ─────────
export const systemStateTable = pgTable("system_state", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type SystemState = typeof systemStateTable.$inferSelect;

// ── Platform Health Snapshots (Monitoring) ───────────────────────────────
export const platformHealthSnapshotsTable = pgTable(
  "platform_health_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    overallStatus: text("overall_status").notNull(), // "healthy" | "degraded" | "unhealthy"
    latencyMs: integer("latency_ms").notNull().default(0),
    checks: jsonb("checks").notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("platform_health_snapshots_created_at_idx").on(t.createdAt)]
);

export type PlatformHealthSnapshot = typeof platformHealthSnapshotsTable.$inferSelect;

// ── Operational Alert Configs ───────────────────────────────────────────────
export const operationalAlertConfigsTable = pgTable("operational_alert_configs", {
  id: text("id").primaryKey(),
  metric: text("metric").notNull(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  thresholdValue: real("threshold_value").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  notifyInApp: boolean("notify_in_app").notNull().default(true),
  cooldownMinutes: integer("cooldown_minutes").notNull().default(15),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type OperationalAlertConfig = typeof operationalAlertConfigsTable.$inferSelect;

// ── Operational Alert Incidents ─────────────────────────────────────────────
export const operationalAlertIncidentsTable = pgTable(
  "operational_alert_incidents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alertConfigId: text("alert_config_id").notNull().references(() => operationalAlertConfigsTable.id, { onDelete: "cascade" }),
    metric: text("metric").notNull(),
    currentValue: real("current_value").notNull(),
    thresholdValue: real("threshold_value").notNull(),
    status: text("status").notNull().default("open"), // "open" | "resolved"
    message: text("message").notNull(),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("operational_alert_incidents_config_idx").on(t.alertConfigId),
    index("operational_alert_incidents_status_idx").on(t.status),
    index("operational_alert_incidents_created_at_idx").on(t.createdAt),
  ]
);

export type OperationalAlertIncident = typeof operationalAlertIncidentsTable.$inferSelect;

// ── Audit Logs (Project / General Audit) ────────────────────────────────────
export const auditLogsTable = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: text("project_id"),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_org_idx").on(t.orgId),
    index("audit_logs_actor_idx").on(t.actorId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

export type AuditLogRow = typeof auditLogsTable.$inferSelect;

// ── Audit Events (Org / Enterprise Scope) ──────────────────────────────────
export const auditEventsTable = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => usersTable.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadata: jsonb("metadata").default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_events_org_idx").on(t.orgId),
    index("audit_events_actor_idx").on(t.actorId),
    index("audit_events_created_at_idx").on(t.createdAt),
  ]
);

export type AuditEventRow = typeof auditEventsTable.$inferSelect;

// ── Cost Guard Settings ─────────────────────────────────────────────────────
export const costGuardSettingsTable = pgTable("cost_guard_settings", {
  id: text("id").primaryKey().default("default"),
  orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
  maxDailyUsd: numeric("max_daily_usd", { precision: 12, scale: 2 }).notNull().default("50.00"),
  maxMonthlyUsd: numeric("max_monthly_usd", { precision: 12, scale: 2 }).notNull().default("1000.00"),
  autoKillAtUsd: numeric("auto_kill_at_usd", { precision: 12, scale: 2 }).notNull().default("1500.00"),
  notifyAtPercentage: integer("notify_at_percentage").notNull().default(80),
  enabled: boolean("enabled").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type CostGuardSettingsRow = typeof costGuardSettingsTable.$inferSelect;

// ── Phase 2: Billing, Payments, Subscriptions ─────────────────────────────
export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(), // Stripe sub_xxx or internal sub_id
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id"),
    planId: text("plan_id").notNull().default("economy"),
    scheduledPlanId: text("scheduled_plan_id"),
    scheduledPlanEffectiveAt: timestamp("scheduled_plan_effective_at"),
    status: text("status").notNull().default("active"), // trialing | active | past_due | canceled | paused
    interval: text("interval").notNull().default("month"), // month | year
    currentPeriodStart: timestamp("current_period_start").notNull().defaultNow(),
    currentPeriodEnd: timestamp("current_period_end").notNull().defaultNow(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    seatsCount: integer("seats_count").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("subscriptions_user_idx").on(t.userId),
    index("subscriptions_org_idx").on(t.orgId),
    index("subscriptions_stripe_customer_idx").on(t.stripeCustomerId),
  ]
);

export type SubscriptionRow = typeof subscriptionsTable.$inferSelect;

export const localInvoicesTable = pgTable(
  "local_invoices",
  {
    id: text("id").primaryKey(), // Stripe in_xxx or inv_xxx
    sequentialNumber: text("sequential_number").notNull().unique(),
    invoiceType: text("invoice_type").notNull().default("B2C_SIMPLIFIED_INVOICE"), // "B2B_TAX_INVOICE" | "B2C_SIMPLIFIED_INVOICE"
    stripeCustomerId: text("stripe_customer_id"),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    amountDue: integer("amount_due").notNull().default(0), // minor units
    amountPaid: integer("amount_paid").notNull().default(0), // minor units
    subtotalHalalas: integer("subtotal_halalas").notNull().default(0),
    vatRateBps: integer("vat_rate_bps").notNull().default(1500), // 15.00%
    vatAmountHalalas: integer("vat_amount_halalas").notNull().default(0),
    totalAmountHalalas: integer("total_amount_halalas").notNull().default(0),
    currency: text("currency").notNull().default("SAR"), // SAR | USD
    status: text("status").notNull().default("paid"), // draft | open | paid | uncollectible | void
    sellerLegalName: text("seller_legal_name").default("OPROX OS Ecosystem Ltd."),
    sellerVatNumber: text("seller_vat_number").default("310000000000003"),
    buyerLegalName: text("buyer_legal_name"),
    buyerVatNumber: text("buyer_vat_number"),
    qrCodePayload: text("qr_code_payload"),
    structuredData: jsonb("structured_data").default({}),
    creditNoteRef: text("credit_note_ref"),
    debitNoteRef: text("debit_note_ref"),
    invoicePdfUrl: text("invoice_pdf_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("invoices_user_idx").on(t.userId),
    index("invoices_org_idx").on(t.orgId),
    index("invoices_stripe_customer_idx").on(t.stripeCustomerId),
  ]
);

export type LocalInvoiceRow = typeof localInvoicesTable.$inferSelect;

// ── Phase 4: Pricing Catalog & Business Policy ─────────────────────────────
export const plansCatalogTable = pgTable("plans_catalog", {
  id: text("id").primaryKey(), // plan code (e.g., "starter", "pro", "enterprise")
  code: text("code").notNull().unique(),
  displayName: text("display_name").notNull(),
  active: boolean("active").notNull().default(false),
  priceSarHalalas: integer("price_sar_halalas"), // null if unset/draft
  priceUsdCents: integer("price_usd_cents"), // null if unset/draft
  billingInterval: text("billing_interval").notNull().default("monthly"), // "monthly" | "annual"
  includedAiMicros: integer("included_ai_micros").notNull().default(0),
  featureEntitlements: jsonb("feature_entitlements").notNull().default([]),
  maxUsers: integer("max_users").notNull().default(10),
  upgradeRules: jsonb("upgrade_rules").notNull().default({ immediate: true }),
  downgradeRules: jsonb("downgrade_rules").notNull().default({ atPeriodEnd: true }),
  effectiveDate: timestamp("effective_date"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PlanCatalogRow = typeof plansCatalogTable.$inferSelect;

export const paymentMethodsConfigTable = pgTable("payment_methods_config", {
  id: text("id").primaryKey(), // mada | stc_pay | barq_pay | bank_transfer | credit_card
  name: text("name").notNull(),
  provider: text("provider").notNull().default("stripe"),
  enabled: boolean("enabled").notNull().default(false),
  currency: text("currency").notNull().default("SAR"),
  paymentMethodType: text("payment_method_type").notNull(),
  status: text("status").notNull().default("active"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PaymentMethodConfigRow = typeof paymentMethodsConfigTable.$inferSelect;

export const dualApprovalRequestsTable = pgTable(
  "dual_approval_requests",
  {
    id: text("id").primaryKey(), // req_xxx
    actionType: text("action_type").notNull(),
    requestedBy: text("requested_by").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    requestedAt: timestamp("requested_at").notNull().defaultNow(),
    amountMicros: integer("amount_micros"),
    payload: jsonb("payload").notNull().default({}),
    status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED | EXPIRED
    firstApprovedBy: text("first_approved_by").references(() => usersTable.id, { onDelete: "set null" }),
    firstApprovedAt: timestamp("first_approved_at"),
    secondApprovedBy: text("second_approved_by").references(() => usersTable.id, { onDelete: "set null" }),
    secondApprovedAt: timestamp("second_approved_at"),
    executedAt: timestamp("executed_at"),
    rejectionNote: text("rejection_note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("dual_approval_requested_by_idx").on(t.requestedBy),
    index("dual_approval_status_idx").on(t.status),
  ]
);

export type DualApprovalRequestRow = typeof dualApprovalRequestsTable.$inferSelect;

export const aiModelPricingMetadataTable = pgTable("ai_model_pricing_metadata", {
  modelId: text("model_id").primaryKey(), // gemini-1.5-pro | gemini-1.5-flash | gpt-4o | claude-3-5-sonnet
  provider: text("provider").notNull(), // gemini | openai | anthropic
  promptTokensMicrosPer1k: integer("prompt_tokens_micros_per_1k").notNull().default(150),
  completionTokensMicrosPer1k: integer("completion_tokens_micros_per_1k").notNull().default(600),
  customerMarkupMultiplier: numeric("customer_markup_multiplier", { precision: 5, scale: 2 }).notNull().default("1.50"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AiModelPricingMetadataRow = typeof aiModelPricingMetadataTable.$inferSelect;

export const couponsTable = pgTable("coupons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull().default("percent"), // percent | fixed
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }).notNull(),
  maxRedemptions: integer("max_redemptions"),
  timesRedeemed: integer("times_redeemed").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CouponRow = typeof couponsTable.$inferSelect;

export const invoiceSequencesTable = pgTable("invoice_sequences", {
  year: integer("year").primaryKey(),
  lastValue: integer("last_value").notNull().default(0),
});

export type InvoiceSequenceRow = typeof invoiceSequencesTable.$inferSelect;

export const billingEventsTable = pgTable(
  "billing_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stripeEventId: text("stripe_event_id").unique(),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").default({}),
    processed: boolean("processed").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("billing_events_type_idx").on(t.eventType)]
);

export type BillingEventRow = typeof billingEventsTable.$inferSelect;

export const paymentProviderConfigTable = pgTable("payment_provider_config", {
  id: text("id").primaryKey().default("stripe"),
  enabled: boolean("enabled").notNull().default(true),
  mode: text("mode").notNull().default("test"), // test | live
  publishableKey: text("publishable_key"),
  secretKey: text("secret_key"),
  webhookSecret: text("webhook_secret"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PaymentProviderConfigRow = typeof paymentProviderConfigTable.$inferSelect;

// ── Phase 3: AI Wallet & Usage ─────────────────────────────────────────────
export const aiWalletBalancesTable = pgTable(
  "ai_wallet_balances",
  {
    userId: text("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    includedCreditMicros: integer("included_credit_micros").notNull().default(10000000), // $10.00 initial
    walletMicros: integer("wallet_micros").notNull().default(5000000), // $5.00 initial
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("ai_wallet_balances_org_idx").on(t.orgId)]
);

export type AiWalletBalanceRow = typeof aiWalletBalancesTable.$inferSelect;

export const aiWalletLedgerTable = pgTable(
  "ai_wallet_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    amountMicros: integer("amount_micros").notNull(), // positive = credit, negative = debit
    type: text("type").notNull(), // "topup" | "usage" | "admin_adjustment" | "monthly_reset"
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ai_wallet_ledger_user_idx").on(t.userId),
    index("ai_wallet_ledger_org_idx").on(t.orgId),
    index("ai_wallet_ledger_created_idx").on(t.createdAt),
  ]
);

export type AiWalletLedgerRow = typeof aiWalletLedgerTable.$inferSelect;

export const aiUsageEventsTable = pgTable(
  "ai_usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    productSlug: text("product_slug").notNull().default("oprox-code"),
    provider: text("provider").notNull(), // gemini | openai | anthropic
    model: text("model").notNull(),
    promptTokens: integer("prompt_tokens").notNull().default(0),
    completionTokens: integer("completion_tokens").notNull().default(0),
    costMicros: integer("cost_micros").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("ai_usage_user_idx").on(t.userId),
    index("ai_usage_org_idx").on(t.orgId),
    index("ai_usage_product_idx").on(t.productSlug),
    index("ai_usage_created_idx").on(t.createdAt),
  ]
);

export type AiUsageEventRow = typeof aiUsageEventsTable.$inferSelect;

export const aiWalletReservationsTable = pgTable(
  "ai_wallet_reservations",
  {
    id: text("id").primaryKey(), // res_xxx
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    orgId: text("org_id").references(() => organizationsTable.id, { onDelete: "cascade" }),
    reservedMicros: integer("reserved_micros").notNull(),
    status: text("status").notNull().default("reserved"), // reserved | finalized | rolled_back
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("ai_wallet_reservations_user_idx").on(t.userId),
    index("ai_wallet_reservations_status_idx").on(t.status),
  ]
);

export type AiWalletReservationRow = typeof aiWalletReservationsTable.$inferSelect;

export const aiProviderConfigsTable = pgTable("ai_provider_configs", {
  providerId: text("provider_id").primaryKey(), // gemini | openai | anthropic
  displayName: text("display_name").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  priority: integer("priority").notNull().default(1),
  circuitBreakerOpen: boolean("circuit_breaker_open").notNull().default(false),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AiProviderConfigRow = typeof aiProviderConfigsTable.$inferSelect;

// ── Phase 5: Central Operations (Queues, Background Jobs) ──────────────────
export const jobQueueAuditTable = pgTable(
  "job_queue_audit",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    queueName: text("queue_name").notNull(),
    jobName: text("job_name").notNull(),
    status: text("status").notNull().default("completed"), // waiting | active | completed | failed | dlq
    attempts: integer("attempts").notNull().default(1),
    payload: jsonb("payload").default({}),
    errorMsg: text("error_msg"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("job_queue_created_idx").on(t.createdAt),
    index("job_queue_status_idx").on(t.status),
  ]
);

export type JobQueueAuditRow = typeof jobQueueAuditTable.$inferSelect;

// ── Phase 6: Product Registry (Central Ecosystem Control) ──────────────────
export const productRegistryTable = pgTable("product_registry", {
  id: text("id").primaryKey(), // oprox-website | oprox-code | oprox-studio | oprox-properties | oprox-pms
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").notNull().default("operational"), // operational | degraded | maintenance | offline
  environment: text("environment").notNull().default("production"),
  apiIdentifier: text("api_identifier").notNull(),
  health: text("health").notNull().default("healthy"),
  activeUsersCount: integer("active_users_count").notNull().default(0),
  activeSubscriptionsCount: integer("active_subscriptions_count").notNull().default(0),
  monthlyAiCostUsd: numeric("monthly_ai_cost_usd", { precision: 12, scale: 2 }).notNull().default("0.00"),
  lastHeartbeat: timestamp("last_heartbeat").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ProductRegistryRow = typeof productRegistryTable.$inferSelect;

// ── Phase 3: Execution State Persistence ────────────────────────────────────
export const phase3ProjectConfigsTable = pgTable("phase3_project_configs", {
  tenantId: text("tenant_id").primaryKey(),
  projectName: text("project_name").notNull(),
  description: text("description"),
  template: text("template").notNull(),
  architecture: text("architecture").notNull(),
  techStack: text("tech_stack").notNull(),
  database: text("database").notNull(),
  auth: text("auth").notNull(),
  deploymentTarget: text("deployment_target").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Phase3ProjectConfigRow = typeof phase3ProjectConfigsTable.$inferSelect;

export const phase3GeneratedFilesTable = pgTable(
  "phase3_generated_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    path: text("path").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("phase3_generated_files_tenant_idx").on(t.tenantId)]
);

export type Phase3GeneratedFileRow = typeof phase3GeneratedFilesTable.$inferSelect;

export const phase3SharedContextTable = pgTable("phase3_shared_context", {
  tenantId: text("tenant_id").primaryKey(),
  architectureDoc: text("architecture_doc").notNull(),
  dbSchemaState: text("db_schema_state").notNull(),
  activeEndpoints: text("active_endpoints").notNull(),
  frontendViews: text("frontend_views").notNull(),
  qaPassRate: text("qa_pass_rate").notNull(),
  securityAudit: text("security_audit").notNull(),
  containerState: text("container_state").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Phase3SharedContextRow = typeof phase3SharedContextTable.$inferSelect;

export const phase3AgentHandoffsTable = pgTable(
  "phase3_agent_handoffs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    fromAgent: text("from_agent").notNull(),
    toAgent: text("to_agent").notNull(),
    taskTitle: text("task_title").notNull(),
    outputSummary: text("output_summary").notNull(),
    fullOutput: text("full_output"),
    timestamp: text("timestamp").notNull(),
    status: text("status").notNull().default("passed"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("phase3_agent_handoffs_tenant_idx").on(t.tenantId)]
);

export type Phase3AgentHandoffRow = typeof phase3AgentHandoffsTable.$inferSelect;

export const phase3PipelineTasksTable = pgTable(
  "phase3_pipeline_tasks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    title: text("title").notNull(),
    assignedAgent: text("assigned_agent").notNull(),
    executionType: text("execution_type").notNull().default("GENERIC"),
    dependencies: jsonb("dependencies").notNull().default([]),
    status: text("status").notNull().default("pending"),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetries: integer("max_retries").notNull().default(3),
    input: text("input"),
    output: text("output"),
    error: text("error"),
    completedAt: text("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("phase3_pipeline_tasks_tenant_idx").on(t.tenantId)]
);

export type Phase3PipelineTaskRow = typeof phase3PipelineTasksTable.$inferSelect;

export const phase3ReleasesTable = pgTable(
  "phase3_releases",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    version: text("version").notNull(),
    semverType: text("semver_type").notNull().default("minor"),
    releaseNotes: text("release_notes").notNull(),
    readinessScore: integer("readiness_score").notNull().default(0),
    goNoGo: text("go_no_go").notNull().default("NO-GO"),
    checklist: jsonb("checklist").notNull().default([]),
    status: text("status").notNull().default("approved"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("phase3_releases_tenant_idx").on(t.tenantId)]
);

export type Phase3ReleaseRow = typeof phase3ReleasesTable.$inferSelect;

export const phase3LifecycleTable = pgTable("phase3_lifecycle", {
  tenantId: text("tenant_id").primaryKey(),
  currentStage: text("current_stage").notNull().default("idea"),
  stageOutputs: jsonb("stage_outputs").notNull().default({}),
  history: jsonb("history").notNull().default([]),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Phase3LifecycleRow = typeof phase3LifecycleTable.$inferSelect;

// ── Phase 4: Production Delivery, Deployment & Governance ─────────────────
export const phase4DeploymentConfigsTable = pgTable("phase4_deployment_configs", {
  tenantId: text("tenant_id").primaryKey(),
  provider: text("provider").notNull().default("cloudrun"), // cloudrun | vercel | docker | custom
  environment: text("environment").notNull().default("production"), // development | preview | staging | production
  deploymentTarget: text("deployment_target").notNull().default("cloudrun"),
  buildSettings: jsonb("build_settings").notNull().default({}),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Phase4DeploymentConfigRow = typeof phase4DeploymentConfigsTable.$inferSelect;

export const phase4DeploymentsTable = pgTable(
  "phase4_deployments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    releaseVersion: text("release_version").notNull(),
    gitSha: text("git_sha").notNull(),
    provider: text("provider").notNull(),
    status: text("status").notNull().default("NOT_CONFIGURED"), // NOT_CONFIGURED | DEPLOYING | VERIFYING | HEALTHY | DEGRADED | FAILED | CANCELLED
    logs: jsonb("logs").notNull().default([]),
    initiatedBy: text("initiated_by").notNull(),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    failureReason: text("failure_reason"),
  },
  (t) => [
    index("phase4_deployments_tenant_idx").on(t.tenantId),
    index("phase4_deployments_status_idx").on(t.status),
  ]
);

export type Phase4DeploymentRow = typeof phase4DeploymentsTable.$inferSelect;

export const phase4RevisionsTable = pgTable(
  "phase4_revisions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    revisionId: text("revision_id").notNull(),
    gitSha: text("git_sha").notNull(),
    imageTag: text("image_tag"),
    status: text("status").notNull().default("active"),
    isKnownGood: boolean("is_known_good").notNull().default(false),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("phase4_revisions_tenant_idx").on(t.tenantId)]
);

export type Phase4RevisionRow = typeof phase4RevisionsTable.$inferSelect;

export const phase4ReleaseGatesTable = pgTable(
  "phase4_release_gates",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    gitSha: text("git_sha").notNull(),
    decision: text("decision").notNull().default("NO_GO"), // GO | NO_GO | NOT_CONFIGURED
    blockingReasons: jsonb("blocking_reasons").notNull().default([]),
    checks: jsonb("checks").notNull().default({}),
    evaluatedAt: timestamp("evaluated_at").notNull().defaultNow(),
  },
  (t) => [index("phase4_release_gates_tenant_idx").on(t.tenantId)]
);

export type Phase4ReleaseGateRow = typeof phase4ReleaseGatesTable.$inferSelect;

export const phase4HealthChecksTable = pgTable(
  "phase4_health_checks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    endpoint: text("endpoint").notNull(),
    status: text("status").notNull().default("NOT_MEASURED"), // HEALTHY | DEGRADED | FAILED | NOT_MEASURED | NOT_CONFIGURED
    httpCode: integer("http_code"),
    latencyMs: integer("latency_ms"),
    details: jsonb("details").notNull().default({}),
    checkedAt: timestamp("checked_at").notNull().defaultNow(),
  },
  (t) => [index("phase4_health_checks_tenant_idx").on(t.tenantId)]
);

export type Phase4HealthCheckRow = typeof phase4HealthChecksTable.$inferSelect;

export const phase4MigrationHistoryTable = pgTable(
  "phase4_migration_history",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    environment: text("environment").notNull().default("production"),
    migrationName: text("migration_name").notNull(),
    isDestructive: boolean("is_destructive").notNull().default(false),
    actorId: text("actor_id").notNull(),
    confirmedBy: text("confirmed_by"),
    status: text("status").notNull().default("APPLIED"), // APPLIED | BLOCKED | REVERTED | FAILED
    executedAt: timestamp("executed_at").notNull().defaultNow(),
  },
  (t) => [index("phase4_migration_history_tenant_idx").on(t.tenantId)]
);

export type Phase4MigrationHistoryRow = typeof phase4MigrationHistoryTable.$inferSelect;

export const phase4IncidentsTable = pgTable(
  "phase4_incidents",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    failureCategory: text("failure_category").notNull(), // BUILD_FAILURE | TEST_FAILURE | SECURITY_GATE_FAILURE | MIGRATION_FAILURE | DEPLOYMENT_FAILURE | HEALTH_CHECK_FAILURE | SMOKE_TEST_FAILURE | PROVIDER_FAILURE | CONFIGURATION_FAILURE
    summary: text("summary").notNull(),
    evidence: jsonb("evidence").notNull().default({}),
    status: text("status").notNull().default("OPEN"), // OPEN | INVESTIGATING | RESOLVED | MITIGATED
    remediation: text("remediation"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (t) => [index("phase4_incidents_tenant_idx").on(t.tenantId)]
);

export type Phase4IncidentRow = typeof phase4IncidentsTable.$inferSelect;

export const phase4RollbacksTable = pgTable(
  "phase4_rollbacks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    environment: text("environment").notNull().default("production"),
    targetRevisionId: text("target_revision_id").notNull(),
    fromRevisionId: text("from_revision_id").notNull(),
    reason: text("reason").notNull(),
    initiatedBy: text("initiated_by").notNull(),
    status: text("status").notNull().default("EXECUTED"), // EXECUTED | FAILED | REJECTED
    verificationResult: text("verification_result").notNull().default("NOT_VERIFIED"), // HEALTHY | DEGRADED | FAILED | NOT_VERIFIED
    executedAt: timestamp("executed_at").notNull().defaultNow(),
  },
  (t) => [index("phase4_rollbacks_tenant_idx").on(t.tenantId)]
);

export type Phase4RollbackRow = typeof phase4RollbacksTable.$inferSelect;

export const phase4EnvConfigsTable = pgTable(
  "phase4_env_configs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    environment: text("environment").notNull().default("production"), // development | preview | staging | production
    varKey: text("var_key").notNull(),
    status: text("status").notNull().default("CONFIGURED"), // CONFIGURED | MISSING | INVALID_REFERENCE
    isRequired: boolean("is_required").notNull().default(true),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("phase4_env_tenant_env_key_uniq").on(t.tenantId, t.environment, t.varKey),
    index("phase4_env_tenant_idx").on(t.tenantId),
  ]
);

export type Phase4EnvConfigRow = typeof phase4EnvConfigsTable.$inferSelect;

// ── Phase 5: Enterprise Collaboration, Governed Autonomy & Software Delivery ─

export const phase5TeamsTable = pgTable(
  "phase5_teams",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    archived: boolean("archived").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("phase5_teams_tenant_idx").on(t.tenantId)]
);

export type Phase5TeamRow = typeof phase5TeamsTable.$inferSelect;

export const phase5MembershipsTable = pgTable(
  "phase5_memberships",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    userId: text("user_id").notNull(),
    teamId: text("team_id"),
    projectId: text("project_id"),
    workspaceId: text("workspace_id"),
    roles: jsonb("roles").notNull().default([]),
    permissions: jsonb("permissions").notNull().default([]),
    status: text("status").notNull().default("active"), // active | suspended
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("phase5_memberships_tenant_idx").on(t.tenantId),
    index("phase5_memberships_user_idx").on(t.userId),
  ]
);

export type Phase5MembershipRow = typeof phase5MembershipsTable.$inferSelect;

export const phase5WorkspacesTable = pgTable(
  "phase5_workspaces",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    name: text("name").notNull(),
    ownerId: text("owner_id").notNull(),
    environment: text("environment").notNull().default("development"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("phase5_workspaces_tenant_idx").on(t.tenantId)]
);

export type Phase5WorkspaceRow = typeof phase5WorkspacesTable.$inferSelect;

export const phase5ChangeRequestsTable = pgTable(
  "phase5_change_requests",
  {
    id: text("id").primaryKey(), // cr_xxx
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    authorId: text("author_id").notNull(),
    authorType: text("author_type").notNull().default("user"), // user | ai_agent
    sourceBranch: text("source_branch").notNull().default("feature"),
    targetBranch: text("target_branch").notNull().default("main"),
    title: text("title").notNull(),
    description: text("description"),
    filesChanged: jsonb("files_changed").notNull().default([]),
    diffMetadata: jsonb("diff_metadata").notNull().default({}),
    riskClassification: text("risk_classification").notNull().default("LOW"), // LOW | MEDIUM | HIGH | CRITICAL
    riskReasons: jsonb("risk_reasons").notNull().default([]),
    status: text("status").notNull().default("OPEN"), // DRAFT | OPEN | IN_REVIEW | CHANGES_REQUESTED | APPROVED | REJECTED | MERGED | CANCELLED | BLOCKED
    aiProposalMeta: jsonb("ai_proposal_meta").notNull().default({}),
    contentHash: text("content_hash"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("phase5_cr_tenant_idx").on(t.tenantId),
    index("phase5_cr_status_idx").on(t.status),
  ]
);

export type Phase5ChangeRequestRow = typeof phase5ChangeRequestsTable.$inferSelect;

export const phase5ApprovalsTable = pgTable(
  "phase5_approvals",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    changeRequestId: text("change_request_id").notNull(),
    approverId: text("approver_id").notNull(),
    approverRole: text("approver_role"),
    decision: text("decision").notNull(), // APPROVED | REJECTED
    comment: text("comment"),
    policyEvaluated: text("policy_evaluated"),
    approvedContentHash: text("approved_content_hash").notNull(),
    status: text("status").notNull().default("VALID"), // VALID | INVALIDATED
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("phase5_approvals_tenant_idx").on(t.tenantId),
    index("phase5_approvals_cr_idx").on(t.changeRequestId),
  ]
);

export type Phase5ApprovalRow = typeof phase5ApprovalsTable.$inferSelect;

export const phase5ReviewsCommentsTable = pgTable(
  "phase5_reviews_comments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    changeRequestId: text("change_request_id").notNull(),
    authorId: text("author_id").notNull(),
    type: text("type").notNull().default("comment"), // comment | review_summary | line_comment
    filePath: text("file_path"),
    lineNumber: integer("line_number"),
    content: text("content").notNull(),
    resolved: boolean("resolved").notNull().default(false),
    resolvedBy: text("resolved_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("phase5_comments_tenant_idx").on(t.tenantId),
    index("phase5_comments_cr_idx").on(t.changeRequestId),
  ]
);

export type Phase5ReviewCommentRow = typeof phase5ReviewsCommentsTable.$inferSelect;

export const phase5CodeOwnersTable = pgTable(
  "phase5_code_owners",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull(),
    pathPattern: text("path_pattern").notNull(),
    ownerType: text("owner_type").notNull(), // team | role | member
    ownerTarget: text("owner_target").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("phase5_code_owners_tenant_idx").on(t.tenantId)]
);

export type Phase5CodeOwnerRow = typeof phase5CodeOwnersTable.$inferSelect;

export const phase5PoliciesTable = pgTable(
  "phase5_policies",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id"),
    policyType: text("policy_type").notNull(), // DEVELOPMENT_GOVERNANCE | PROTECTED_ENVIRONMENT | AUTONOMY
    version: integer("version").notNull().default(1),
    active: boolean("active").notNull().default(true),
    config: jsonb("config").notNull().default({}),
    authorId: text("author_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    activatedAt: timestamp("activated_at"),
  },
  (t) => [index("phase5_policies_tenant_idx").on(t.tenantId)]
);

export type Phase5PolicyRow = typeof phase5PoliciesTable.$inferSelect;

export const phase5AutonomyConfigTable = pgTable("phase5_autonomy_config", {
  tenantId: text("tenant_id").primaryKey(),
  autonomyLevel: integer("autonomy_level").notNull().default(2), // 0 to 4
  allowSelfEdit: boolean("allow_self_edit").notNull().default(false),
  maxAiCostPerTaskUsd: numeric("max_ai_cost_per_task_usd", { precision: 12, scale: 2 }).notNull().default("5.00"),
  requireApprovalForHighRisk: boolean("require_approval_for_high_risk").notNull().default(true),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Phase5AutonomyConfigRow = typeof phase5AutonomyConfigTable.$inferSelect;

export const phase5EventsTable = pgTable(
  "phase5_events",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id"),
    actorId: text("actor_id").notNull(),
    actorType: text("actor_type").notNull().default("user"), // user | ai_agent | system
    action: text("action").notNull(),
    resource: text("resource").notNull(),
    resourceId: text("resource_id"),
    risk: text("risk").notNull().default("LOW"),
    details: jsonb("details").notNull().default({}),
    timestamp: timestamp("timestamp").notNull().defaultNow(),
  },
  (t) => [
    index("phase5_events_tenant_idx").on(t.tenantId),
    index("phase5_events_action_idx").on(t.action),
  ]
);

export type Phase5EventRow = typeof phase5EventsTable.$inferSelect;

// ── Phase 6 Production Repository, CI/CD & Delivery Tables ──────────

export const phase6RepositoryConnectionsTable = pgTable(
  "phase6_repository_connections",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    projectId: text("project_id"),
    provider: text("provider").notNull(), // github | gitlab | bitbucket | git
    repoIdentifier: text("repo_identifier").notNull(), // owner/repo or path
    repoOwner: text("repo_owner").notNull(),
    defaultBranch: text("default_branch").notNull().default("main"),
    connectionStatus: text("connection_status").notNull().default("CONFIGURED"), // CONFIGURED | NOT_CONFIGURED | UNSUPPORTED | FAILED
    accountRef: text("account_ref"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    lastVerifiedAt: timestamp("last_verified_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_repo_conn_tenant_idx").on(t.tenantId),
    index("p6_repo_conn_provider_idx").on(t.provider),
  ]
);

export type Phase6RepositoryConnectionRow = typeof phase6RepositoryConnectionsTable.$inferSelect;

export const phase6RepositoryBranchesTable = pgTable(
  "phase6_repository_branches",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    repoId: text("repo_id").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull().default("feature"), // feature | ai_task | repair | release | hotfix
    ownerId: text("owner_id").notNull(),
    originatingTaskId: text("originating_task_id"),
    changeRequestId: text("change_request_id"),
    baseSha: text("base_sha").notNull(),
    headSha: text("head_sha").notNull(),
    status: text("status").notNull().default("active"), // active | merged | closed
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_repo_branch_tenant_idx").on(t.tenantId),
    index("p6_repo_branch_repo_idx").on(t.repoId),
  ]
);

export type Phase6RepositoryBranchRow = typeof phase6RepositoryBranchesTable.$inferSelect;

export const phase6CommitProvenanceTable = pgTable(
  "phase6_commit_provenance",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    repoId: text("repo_id").notNull(),
    commitSha: text("commit_sha").notNull(),
    authorType: text("author_type").notNull().default("human"), // human | ai_generated | ai_assisted
    authorId: text("author_id").notNull(),
    requirementId: text("requirement_id"),
    aiTaskId: text("ai_task_id"),
    agentId: text("agent_id"),
    workspaceId: text("workspace_id"),
    branchName: text("branch_name").notNull(),
    changeRequestId: text("change_request_id"),
    riskLevel: text("risk_level").notNull().default("LOW"),
    testStatus: text("test_status").notNull().default("NOT_RUN"),
    securityReviewStatus: text("security_review_status").notNull().default("PASSED"),
    approvalStatus: text("approval_status").notNull().default("APPROVED"),
    aiCostUsd: numeric("ai_cost_usd", { precision: 12, scale: 4 }).notNull().default("0.0000"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_commit_prov_tenant_idx").on(t.tenantId),
    index("p6_commit_prov_sha_idx").on(t.commitSha),
  ]
);

export type Phase6CommitProvenanceRow = typeof phase6CommitProvenanceTable.$inferSelect;

export const phase6CiPipelineDefinitionsTable = pgTable(
  "phase6_ci_pipeline_definitions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    name: text("name").notNull(),
    stages: jsonb("stages").notNull().default([]),
    allowlistedCommands: jsonb("allowlisted_commands").notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_ci_def_tenant_idx").on(t.tenantId),
  ]
);

export type Phase6CiPipelineDefinitionRow = typeof phase6CiPipelineDefinitionsTable.$inferSelect;

export const phase6CiPipelineRunsTable = pgTable(
  "phase6_ci_pipeline_runs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    repoId: text("repo_id").notNull(),
    pipelineId: text("pipeline_id").notNull(),
    commitSha: text("commit_sha").notNull(),
    branchName: text("branch_name").notNull(),
    trigger: text("trigger").notNull().default("manual"), // manual | push | change_request | ai_repair
    status: text("status").notNull().default("PENDING"), // PENDING | RUNNING | PASSED | FAILED | CANCELLED
    stageResults: jsonb("stage_results").notNull().default([]),
    durationMs: integer("duration_ms").notNull().default(0),
    artifacts: jsonb("artifacts").notNull().default([]),
    failureEvidence: jsonb("failure_evidence").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    finishedAt: timestamp("finished_at"),
  },
  (t) => [
    index("p6_ci_run_tenant_idx").on(t.tenantId),
    index("p6_ci_run_repo_idx").on(t.repoId),
  ]
);

export type Phase6CiPipelineRunRow = typeof phase6CiPipelineRunsTable.$inferSelect;

export const phase6BuildArtifactsTable = pgTable(
  "phase6_build_artifacts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    repoId: text("repo_id").notNull(),
    pipelineRunId: text("pipeline_run_id").notNull(),
    commitSha: text("commit_sha").notNull(),
    artifactType: text("artifact_type").notNull(), // frontend_bundle | server_bundle | container_image | test_report
    name: text("name").notNull(),
    checksumSha256: text("checksum_sha256").notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    storageRef: text("storage_ref").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_artifact_tenant_idx").on(t.tenantId),
    index("p6_artifact_sha_idx").on(t.commitSha),
  ]
);

export type Phase6BuildArtifactRow = typeof phase6BuildArtifactsTable.$inferSelect;

export const phase6DevEnvironmentsTable = pgTable(
  "phase6_dev_environments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    name: text("name").notNull(),
    branchName: text("branch_name").notNull(),
    commitSha: text("commit_sha").notNull(),
    provider: text("provider").notNull().default("local_runner"),
    status: text("status").notNull().default("REQUESTED"), // REQUESTED | PROVISIONING | READY | BUSY | STOPPING | STOPPED | FAILED | EXPIRED
    resourceRef: text("resource_ref"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (t) => [
    index("p6_dev_env_tenant_idx").on(t.tenantId),
  ]
);

export type Phase6DevEnvironmentRow = typeof phase6DevEnvironmentsTable.$inferSelect;

export const phase6PreviewEnvironmentsTable = pgTable(
  "phase6_preview_environments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id"),
    changeRequestId: text("change_request_id").notNull(),
    commitSha: text("commit_sha").notNull(),
    previewUrl: text("preview_url"),
    status: text("status").notNull().default("REQUESTED"), // REQUESTED | PROVISIONING | READY | FAILED | EXPIRED
    healthStatus: text("health_status").notNull().default("UNKNOWN"), // UNKNOWN | HEALTHY | UNHEALTHY
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
  },
  (t) => [
    index("p6_preview_env_tenant_idx").on(t.tenantId),
    index("p6_preview_env_cr_idx").on(t.changeRequestId),
  ]
);

export type Phase6PreviewEnvironmentRow = typeof phase6PreviewEnvironmentsTable.$inferSelect;

export const phase6ProviderEventsTable = pgTable(
  "phase6_provider_events",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    provider: text("provider").notNull(),
    eventType: text("event_type").notNull(),
    repoIdentifier: text("repo_identifier").notNull(),
    payload: jsonb("payload").notNull().default({}),
    signatureVerified: boolean("signature_verified").notNull().default(false),
    processed: boolean("processed").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("p6_prov_evt_tenant_idx").on(t.tenantId),
  ]
);

export type Phase6ProviderEventRow = typeof phase6ProviderEventsTable.$inferSelect;

export const phase6OperationLocksTable = pgTable(
  "phase6_operation_locks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    lockKey: text("lock_key").notNull(),
    lockedBy: text("locked_by").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
  },
  (t) => [
    uniqueIndex("p6_lock_tenant_key_idx").on(t.tenantId, t.lockKey),
  ]
);

export type Phase6OperationLockRow = typeof phase6OperationLocksTable.$inferSelect;

// ── OPROX Studio Phase 1: Visual Builder & Low-Code Engine Tables ───────────

export const oproxStudioProjectsTable = pgTable(
  "oprox_studio_projects",
  {
    id: text("id").primaryKey(), // proj_xxx
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    framework: text("framework").notNull().default("react_tailwind"),
    theme: text("theme").notNull().default("dark_modern"),
    defaultPageId: text("default_page_id").notNull().default("page_main"),
    activeRevisionNumber: integer("active_revision_number").notNull().default(1),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_proj_tenant_idx").on(t.tenantId),
    index("studio_proj_org_idx").on(t.orgId),
  ]
);

export type OproxStudioProjectRow = typeof oproxStudioProjectsTable.$inferSelect;

export const oproxStudioCanvasesTable = pgTable(
  "oprox_studio_canvases",
  {
    id: text("id").primaryKey(), // canvas_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    pageId: text("page_id").notNull(),
    pageName: text("page_name").notNull(),
    pagePath: text("page_path").notNull(),
    ir: jsonb("ir").notNull().default({}),
    revisionNumber: integer("revision_number").notNull().default(1),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_canvas_tenant_idx").on(t.tenantId),
    index("studio_canvas_proj_idx").on(t.projectId),
    uniqueIndex("studio_canvas_proj_page_uniq").on(t.projectId, t.pageId),
  ]
);

export type OproxStudioCanvasRow = typeof oproxStudioCanvasesTable.$inferSelect;

export const oproxStudioDesignTokensTable = pgTable(
  "oprox_studio_design_tokens",
  {
    id: text("id").primaryKey(), // dt_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    tokens: jsonb("tokens").notNull().default({}),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_tokens_tenant_idx").on(t.tenantId),
    uniqueIndex("studio_tokens_proj_uniq").on(t.projectId),
  ]
);

export type OproxStudioDesignTokenRow = typeof oproxStudioDesignTokensTable.$inferSelect;

export const oproxStudioComponentsTable = pgTable(
  "oprox_studio_components",
  {
    id: text("id").primaryKey(), // comp_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").notNull().default("CUSTOM"),
    irNode: jsonb("ir_node").notNull().default({}),
    isGlobal: boolean("is_global").notNull().default(false),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_comp_tenant_idx").on(t.tenantId),
    index("studio_comp_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioComponentRow = typeof oproxStudioComponentsTable.$inferSelect;

export const oproxStudioSchemasTable = pgTable(
  "oprox_studio_schemas",
  {
    id: text("id").primaryKey(), // schema_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    schemaModel: jsonb("schema_model").notNull().default({ tables: [] }),
    generatedDrizzleCode: text("generated_drizzle_code"),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_schema_tenant_idx").on(t.tenantId),
    uniqueIndex("studio_schema_proj_uniq").on(t.projectId),
  ]
);

export type OproxStudioSchemaRow = typeof oproxStudioSchemasTable.$inferSelect;

export const oproxStudioFlowsTable = pgTable(
  "oprox_studio_flows",
  {
    id: text("id").primaryKey(), // flow_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    flowGraph: jsonb("flow_graph").notNull().default({ nodes: [], edges: [] }),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_flow_tenant_idx").on(t.tenantId),
    uniqueIndex("studio_flow_proj_uniq").on(t.projectId),
  ]
);

export type OproxStudioFlowRow = typeof oproxStudioFlowsTable.$inferSelect;

export const oproxStudioRevisionsTable = pgTable(
  "oprox_studio_revisions",
  {
    id: text("id").primaryKey(), // rev_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    authorId: text("author_id").notNull(),
    irSnapshot: jsonb("ir_snapshot").notNull().default({}),
    changeSummary: text("change_summary").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_rev_tenant_idx").on(t.tenantId),
    index("studio_rev_proj_idx").on(t.projectId),
    uniqueIndex("studio_rev_proj_num_uniq").on(t.projectId, t.revisionNumber),
  ]
);

export type OproxStudioRevisionRow = typeof oproxStudioRevisionsTable.$inferSelect;

export const oproxStudioPromotionsTable = pgTable(
  "oprox_studio_promotions",
  {
    id: text("id").primaryKey(), // promo_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    targetBranch: text("target_branch").notNull().default("feature/studio-build"),
    changeRequestId: text("change_request_id"),
    commitSha: text("commit_sha"),
    status: text("status").notNull().default("PROMOTED"), // PROMOTED | PENDING_APPROVAL | FAILED
    promotedBy: text("promoted_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_promo_tenant_idx").on(t.tenantId),
    index("studio_promo_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioPromotionRow = typeof oproxStudioPromotionsTable.$inferSelect;

export const oproxStudioAssetsTable = pgTable(
  "oprox_studio_assets",
  {
    id: text("id").primaryKey(), // asset_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    storageUrl: text("storage_url").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_assets_tenant_idx").on(t.tenantId),
    index("studio_assets_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioAssetRow = typeof oproxStudioAssetsTable.$inferSelect;

export const oproxStudioDataSourcesTable = pgTable(
  "oprox_studio_data_sources",
  {
    id: text("id").primaryKey(), // ds_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    method: text("method").notNull().default("GET"),
    url: text("url").notNull(),
    headersJson: jsonb("headers_json").notNull().default({}),
    paramsJson: jsonb("params_json").notNull().default({}),
    reqSchemaJson: jsonb("req_schema_json").notNull().default({}),
    resSchemaJson: jsonb("res_schema_json").notNull().default({}),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_ds_tenant_idx").on(t.tenantId),
    index("studio_ds_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioDataSourceRow = typeof oproxStudioDataSourcesTable.$inferSelect;

export const oproxStudioSyncProvenanceTable = pgTable(
  "oprox_studio_sync_provenance",
  {
    id: text("id").primaryKey(), // sync_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    regionId: text("region_id").notNull(),
    regionType: text("region_type").notNull().default("STUDIO_MANAGED"), // STUDIO_MANAGED | CUSTOM_PROTECTED | UNSUPPORTED
    codeHash: text("code_hash").notNull(),
    irHash: text("ir_hash").notNull(),
    lastSyncedAt: timestamp("last_synced_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_sync_tenant_idx").on(t.tenantId),
    index("studio_sync_proj_idx").on(t.projectId),
    uniqueIndex("studio_sync_file_region_uniq").on(t.projectId, t.filePath, t.regionId),
  ]
);

export type OproxStudioSyncProvenanceRow = typeof oproxStudioSyncProvenanceTable.$inferSelect;

export const oproxStudioDeploymentsTable = pgTable(
  "oprox_studio_deployments",
  {
    id: text("id").primaryKey(), // dep_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    revisionId: text("revision_id").notNull(),
    environment: text("environment").notNull().default("staging"), // staging | production
    status: text("status").notNull().default("BUILDING"), // BUILDING | SUCCESS | FAILED | ROLLED_BACK
    publicUrl: text("public_url").notNull(),
    buildLogsJson: jsonb("build_logs_json").notNull().default([]),
    deployedBy: text("deployed_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_dep_tenant_idx").on(t.tenantId),
    index("studio_dep_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioDeploymentRow = typeof oproxStudioDeploymentsTable.$inferSelect;

export const oproxStudioPublishedDomainsTable = pgTable(
  "oprox_studio_published_domains",
  {
    id: text("id").primaryKey(), // dom_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    deploymentId: text("deployment_id").notNull().references(() => oproxStudioDeploymentsTable.id, { onDelete: "cascade" }),
    domainName: text("domain_name").notNull(),
    sslActive: boolean("ssl_active").notNull().default(true),
    dnsStatus: text("dns_status").notNull().default("ACTIVE"), // ACTIVE | PENDING
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_dom_tenant_idx").on(t.tenantId),
    index("studio_dom_proj_idx").on(t.projectId),
    uniqueIndex("studio_dom_name_uniq").on(t.domainName),
  ]
);

export type OproxStudioPublishedDomainRow = typeof oproxStudioPublishedDomainsTable.$inferSelect;

export const oproxStudioExportManifestsTable = pgTable(
  "oprox_studio_export_manifests",
  {
    id: text("id").primaryKey(), // exp_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    exportedFilesJson: jsonb("exported_files_json").notNull().default([]),
    checksumHash: text("checksum_hash").notNull(),
    exportedBy: text("exported_by").notNull(),
    exportedAt: timestamp("exported_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_exp_tenant_idx").on(t.tenantId),
    index("studio_exp_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioExportManifestRow = typeof oproxStudioExportManifestsTable.$inferSelect;

// ── OPROX Studio Phase 4 Tables ───────────────────────────────────────────

export const oproxStudioCommentsTable = pgTable(
  "oprox_studio_comments",
  {
    id: text("id").primaryKey(), // cmt_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    pageId: text("page_id"),
    nodeId: text("node_id"),
    revisionId: text("revision_id"),
    authorId: text("author_id").notNull(),
    authorName: text("author_name").notNull(),
    content: text("content").notNull(),
    status: text("status").notNull().default("OPEN"), // OPEN | RESOLVED | REOPENED
    parentCommentId: text("parent_comment_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_cmt_tenant_idx").on(t.tenantId),
    index("studio_cmt_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioCommentRow = typeof oproxStudioCommentsTable.$inferSelect;

export const oproxStudioExperimentsTable = pgTable(
  "oprox_studio_experiments",
  {
    id: text("id").primaryKey(), // expm_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    irSnapshotJson: jsonb("ir_snapshot_json").notNull(),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | DISCARDED | PROMOTED
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_expm_tenant_idx").on(t.tenantId),
    index("studio_expm_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioExperimentRow = typeof oproxStudioExperimentsTable.$inferSelect;

export const oproxStudioSyncConflictsTable = pgTable(
  "oprox_studio_sync_conflicts",
  {
    id: text("id").primaryKey(), // cfl_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    filePath: text("file_path").notNull(),
    baseHash: text("base_hash").notNull(),
    studioHash: text("studio_hash").notNull(),
    codeHash: text("code_hash").notNull(),
    classification: text("classification").notNull(), // CONFLICT | STUDIO_ONLY_CHANGE | CODE_ONLY_CHANGE | NO_CHANGE
    status: text("status").notNull().default("PENDING"), // PENDING | RESOLVED
    resolutionStrategy: text("resolution_strategy"), // KEEP_STUDIO | KEEP_CODE | MERGE
    resolvedBy: text("resolved_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at"),
  },
  (t) => [
    index("studio_cfl_tenant_idx").on(t.tenantId),
    index("studio_cfl_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioSyncConflictRow = typeof oproxStudioSyncConflictsTable.$inferSelect;

export const oproxStudioReviewsTable = pgTable(
  "oprox_studio_reviews",
  {
    id: text("id").primaryKey(), // rev_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    revisionId: text("revision_id").notNull(),
    reviewerId: text("reviewer_id").notNull(),
    reviewerName: text("reviewer_name").notNull(),
    status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | CHANGES_REQUESTED
    feedback: text("feedback"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_rev_tenant_idx").on(t.tenantId),
    index("studio_rev_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioReviewRow = typeof oproxStudioReviewsTable.$inferSelect;

export const oproxStudioPromotionTracesTable = pgTable(
  "oprox_studio_promotion_traces",
  {
    id: text("id").primaryKey(), // trc_xxx
    tenantId: text("tenant_id").notNull(),
    projectId: text("project_id").notNull().references(() => oproxStudioProjectsTable.id, { onDelete: "cascade" }),
    revisionId: text("revision_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    gitBranch: text("git_branch").notNull(),
    commitSha: text("commit_sha").notNull(),
    changeRequestId: text("change_request_id").notNull(),
    ciRunId: text("ci_run_id").notNull(),
    status: text("status").notNull().default("PROMOTED"), // PROMOTED | FAILED
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("studio_trc_tenant_idx").on(t.tenantId),
    index("studio_trc_proj_idx").on(t.projectId),
  ]
);

export type OproxStudioPromotionTraceRow = typeof oproxStudioPromotionTracesTable.$inferSelect;

// ── OPROX Real Estate Phase 1 Tables ───────────────────────────────────────

export const realEstatePortfoliosTable = pgTable(
  "re_portfolios",
  {
    id: text("id").primaryKey(), // fol_xxx
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    code: text("code"),
    description: text("description"),
    status: text("status").notNull().default("active"), // "active" | "archived"
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_portfolios_tenant_idx").on(t.tenantId),
    index("re_portfolios_status_idx").on(t.status),
  ]
);

export type RealEstatePortfolioRow = typeof realEstatePortfoliosTable.$inferSelect;

export const realEstatePropertiesTable = pgTable(
  "re_properties",
  {
    id: text("id").primaryKey(), // prop_xxx
    tenantId: text("tenant_id").notNull(),
    portfolioId: text("portfolio_id").references(() => realEstatePortfoliosTable.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    type: text("type").notNull(), // standalone_villa | land_plot | apartment_building | residential_compound | commercial_tower | office | retail | warehouse | furnished_apartment | mixed_use | industrial_logistics
    status: text("status").notNull().default("DRAFT"), // DRAFT | ACTIVE | AVAILABLE | RESERVED | LEASED | SOLD | INACTIVE | ARCHIVED
    description: text("description"),
    // Saudi Address fields
    addressRegion: text("address_region"),
    addressCity: text("address_city"),
    addressDistrict: text("address_district"),
    addressStreet: text("address_street"),
    postalCode: text("postal_code"),
    buildingNumber: text("building_number"),
    additionalNumber: text("additional_number"),
    latitude: numeric("latitude"),
    longitude: numeric("longitude"),
    // Property Specs
    totalAreaSqm: numeric("total_area_sqm"),
    builtUpAreaSqm: numeric("built_up_area_sqm"),
    yearBuilt: integer("year_built"),
    totalUnitsCount: integer("total_units_count").notNull().default(0),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_props_tenant_idx").on(t.tenantId),
    index("re_props_portfolio_idx").on(t.portfolioId),
    index("re_props_type_idx").on(t.type),
    index("re_props_status_idx").on(t.status),
    index("re_props_city_idx").on(t.addressCity),
  ]
);

export type RealEstatePropertyRow = typeof realEstatePropertiesTable.$inferSelect;

export const realEstateBuildingsTable = pgTable(
  "re_buildings",
  {
    id: text("id").primaryKey(), // bldg_xxx
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code"),
    totalFloors: integer("total_floors").notNull().default(1),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_bldgs_tenant_idx").on(t.tenantId),
    index("re_bldgs_prop_idx").on(t.propertyId),
  ]
);

export type RealEstateBuildingRow = typeof realEstateBuildingsTable.$inferSelect;

export const realEstateFloorsTable = pgTable(
  "re_floors",
  {
    id: text("id").primaryKey(), // flr_xxx
    tenantId: text("tenant_id").notNull(),
    buildingId: text("building_id").notNull().references(() => realEstateBuildingsTable.id, { onDelete: "cascade" }),
    floorNumber: integer("floor_number").notNull(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_floors_tenant_idx").on(t.tenantId),
    index("re_floors_bldg_idx").on(t.buildingId),
  ]
);

export type RealEstateFloorRow = typeof realEstateFloorsTable.$inferSelect;

export const realEstateUnitsTable = pgTable(
  "re_units",
  {
    id: text("id").primaryKey(), // unit_xxx
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    buildingId: text("building_id").references(() => realEstateBuildingsTable.id, { onDelete: "set null" }),
    floorId: text("floor_id").references(() => realEstateFloorsTable.id, { onDelete: "set null" }),
    unitNumber: text("unit_number").notNull(),
    unitType: text("unit_type").notNull().default("apartment"), // apartment | villa | office | retail | warehouse | land_parcel
    status: text("status").notNull().default("AVAILABLE"), // AVAILABLE | RESERVED | LEASED | SOLD | UNDER_MAINTENANCE | INACTIVE
    areaSqm: numeric("area_sqm"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    rentPriceSar: numeric("rent_price_sar"),
    salePriceSar: numeric("sale_price_sar"),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_units_tenant_idx").on(t.tenantId),
    index("re_units_prop_idx").on(t.propertyId),
    index("re_units_bldg_idx").on(t.buildingId),
    index("re_units_floor_idx").on(t.floorId),
    index("re_units_status_idx").on(t.status),
  ]
);

export type RealEstateUnitRow = typeof realEstateUnitsTable.$inferSelect;

export const realEstateOwnersTable = pgTable(
  "re_owners",
  {
    id: text("id").primaryKey(), // own_xxx
    tenantId: text("tenant_id").notNull(),
    fullName: text("full_name").notNull(),
    ownerType: text("owner_type").notNull().default("INDIVIDUAL"), // INDIVIDUAL | CORPORATE | GOVERNMENT
    nationalIdOrCr: text("national_id_or_cr"),
    email: text("email"),
    phone: text("phone"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_owners_tenant_idx").on(t.tenantId),
    index("re_owners_status_idx").on(t.status),
  ]
);

export type RealEstateOwnerRow = typeof realEstateOwnersTable.$inferSelect;

export const realEstatePropertyOwnersTable = pgTable(
  "re_property_owners",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull().references(() => realEstateOwnersTable.id, { onDelete: "cascade" }),
    ownershipPercentage: numeric("ownership_percentage").notNull().default("100"),
    isPrimaryOwner: boolean("is_primary_owner").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_prop_owners_tenant_idx").on(t.tenantId),
    index("re_prop_owners_prop_idx").on(t.propertyId),
    index("re_prop_owners_owner_idx").on(t.ownerId),
  ]
);

export type RealEstatePropertyOwnerRow = typeof realEstatePropertyOwnersTable.$inferSelect;

export const realEstateAmenitiesTable = pgTable(
  "re_amenities",
  {
    id: text("id").primaryKey(), // amen_xxx
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    amenityName: text("amenity_name").notNull(),
    amenityCategory: text("amenity_category").default("general"), // general | security | leisure | parking
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_amenities_tenant_idx").on(t.tenantId),
    index("re_amenities_prop_idx").on(t.propertyId),
  ]
);

export type RealEstateAmenityRow = typeof realEstateAmenitiesTable.$inferSelect;

// ── OPROX Real Estate Phase 2 Tables ───────────────────────────────────────

export const realEstateContactsTable = pgTable(
  "re_contacts",
  {
    id: text("id").primaryKey(), // cont_xxx
    tenantId: text("tenant_id").notNull(),
    type: text("type").notNull().default("INDIVIDUAL"), // INDIVIDUAL | COMPANY
    fullName: text("full_name").notNull(),
    arabicName: text("arabic_name"),
    mobile: text("mobile"),
    email: text("email"),
    nationalIdOrIqama: text("national_id_or_iqama"),
    nationality: text("nationality"),
    preferredLanguage: text("preferred_language").default("ar"),
    companyName: text("company_name"),
    crNumber: text("cr_number"),
    vatNumber: text("vat_number"),
    authorizedRep: text("authorized_rep"),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | INACTIVE
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_contacts_tenant_idx").on(t.tenantId),
    index("re_contacts_type_idx").on(t.type),
    index("re_contacts_nat_id_idx").on(t.nationalIdOrIqama),
    index("re_contacts_cr_idx").on(t.crNumber),
    index("re_contacts_status_idx").on(t.status),
  ]
);

export type RealEstateContactRow = typeof realEstateContactsTable.$inferSelect;

export const realEstateTenantsTable = pgTable(
  "re_tenants",
  {
    id: text("id").primaryKey(), // ret_xxx
    tenantId: text("tenant_id").notNull(),
    contactId: text("contact_id").notNull().references(() => realEstateContactsTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | BLACKLISTED | INACTIVE
    creditRating: text("credit_rating"), // EXCELLENT | GOOD | FAIR | POOR
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_tenants_tenant_idx").on(t.tenantId),
    index("re_tenants_contact_idx").on(t.contactId),
    index("re_tenants_status_idx").on(t.status),
  ]
);

export type RealEstateTenantRow = typeof realEstateTenantsTable.$inferSelect;

export const realEstateLeasesTable = pgTable(
  "re_leases",
  {
    id: text("id").primaryKey(), // lse_xxx
    tenantId: text("tenant_id").notNull(),
    leaseNumber: text("lease_number").notNull(),
    propertyId: text("property_id").notNull().references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    reTenantId: text("re_tenant_id").notNull().references(() => realEstateTenantsTable.id, { onDelete: "cascade" }),
    leaseType: text("lease_type").notNull().default("RESIDENTIAL"), // RESIDENTIAL | COMMERCIAL | INDUSTRIAL | RETAIL
    startDate: text("start_date").notNull(), // YYYY-MM-DD
    endDate: text("end_date").notNull(), // YYYY-MM-DD
    contractValueSar: numeric("contract_value_sar").notNull(),
    currency: text("currency").notNull().default("SAR"),
    paymentFrequency: text("payment_frequency").notNull().default("QUARTERLY"), // MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL | CUSTOM
    securityDepositSar: numeric("security_deposit_sar").default("0"),
    gracePeriodDays: integer("grace_period_days").default(0),
    renewalOption: boolean("renewal_option").default(false),
    noticePeriodDays: integer("notice_period_days").default(30),
    ejarContractNumber: text("ejar_contract_number"),
    ejarStatus: text("ejar_status").default("NOT_CONFIGURED"),
    terms: text("terms"),
    status: text("status").notNull().default("DRAFT"), // DRAFT | PENDING_APPROVAL | APPROVED | ACTIVE | EXPIRING | RENEWAL_PENDING | TERMINATION_PENDING | TERMINATED | EXPIRED | CANCELLED
    createdBy: text("created_by").notNull(),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at"),
    activatedAt: timestamp("activated_at"),
    terminatedAt: timestamp("terminated_at"),
    terminationReason: text("termination_reason"),
    parentLeaseId: text("parent_lease_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_leases_tenant_idx").on(t.tenantId),
    index("re_leases_num_idx").on(t.leaseNumber),
    index("re_leases_prop_idx").on(t.propertyId),
    index("re_leases_ret_idx").on(t.reTenantId),
    index("re_leases_status_idx").on(t.status),
  ]
);

export type RealEstateLeaseRow = typeof realEstateLeasesTable.$inferSelect;

export const realEstateLeaseUnitsTable = pgTable(
  "re_lease_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    unitId: text("unit_id").notNull().references(() => realEstateUnitsTable.id, { onDelete: "cascade" }),
    allocatedRentSar: numeric("allocated_rent_sar"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lease_units_tenant_idx").on(t.tenantId),
    index("re_lease_units_lease_idx").on(t.leaseId),
    index("re_lease_units_unit_idx").on(t.unitId),
  ]
);

export type RealEstateLeaseUnitRow = typeof realEstateLeaseUnitsTable.$inferSelect;

export const realEstateLeaseSchedulesTable = pgTable(
  "re_lease_schedules",
  {
    id: text("id").primaryKey(), // sch_xxx
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    installmentNumber: integer("installment_number").notNull(),
    dueDate: text("due_date").notNull(), // YYYY-MM-DD
    amountSar: numeric("amount_sar").notNull(),
    paidAmountSar: numeric("paid_amount_sar").notNull().default("0"),
    outstandingAmountSar: numeric("outstanding_amount_sar").notNull(),
    status: text("status").notNull().default("UPCOMING"), // UPCOMING | DUE | PARTIALLY_PAID | PAID | OVERDUE | WAIVED | CANCELLED
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lease_sched_tenant_idx").on(t.tenantId),
    index("re_lease_sched_lease_idx").on(t.leaseId),
    index("re_lease_sched_due_idx").on(t.dueDate),
    index("re_lease_sched_status_idx").on(t.status),
  ]
);

export type RealEstateLeaseScheduleRow = typeof realEstateLeaseSchedulesTable.$inferSelect;

export const realEstateLeaseChargesTable = pgTable(
  "re_lease_charges",
  {
    id: text("id").primaryKey(), // chg_xxx
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    scheduleId: text("schedule_id").references(() => realEstateLeaseSchedulesTable.id, { onDelete: "set null" }),
    chargeType: text("charge_type").notNull(), // RENT | SECURITY_DEPOSIT | SERVICE_CHARGE | ADMIN_FEE | UTILITY | MAINTENANCE | OTHER
    description: text("description").notNull(),
    amountSar: numeric("amount_sar").notNull(),
    paidAmountSar: numeric("paid_amount_sar").notNull().default("0"),
    outstandingAmountSar: numeric("outstanding_amount_sar").notNull(),
    status: text("status").notNull().default("DUE"), // DUE | PARTIALLY_PAID | PAID | WAIVED | CANCELLED
    invoiceId: text("invoice_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lease_charges_tenant_idx").on(t.tenantId),
    index("re_lease_charges_lease_idx").on(t.leaseId),
    index("re_lease_charges_type_idx").on(t.chargeType),
    index("re_lease_charges_status_idx").on(t.status),
  ]
);

export type RealEstateLeaseChargeRow = typeof realEstateLeaseChargesTable.$inferSelect;

export const realEstatePaymentsTable = pgTable(
  "re_payments",
  {
    id: text("id").primaryKey(), // pay_xxx
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").references(() => realEstateLeasesTable.id, { onDelete: "set null" }),
    reTenantId: text("re_tenant_id").references(() => realEstateTenantsTable.id, { onDelete: "set null" }),
    paymentNumber: text("payment_number").notNull(),
    paymentDate: text("payment_date").notNull(), // YYYY-MM-DD
    amountSar: numeric("amount_sar").notNull(),
    unallocatedAmountSar: numeric("unallocated_amount_sar").notNull(),
    currency: text("currency").notNull().default("SAR"),
    paymentMethod: text("payment_method").notNull().default("BANK_TRANSFER"), // BANK_TRANSFER | CARD | CASH | SADAD | OTHER
    providerReference: text("provider_reference"),
    paymentStatus: text("payment_status").notNull().default("CONFIRMED"), // PENDING | CONFIRMED | FAILED | REFUNDED | PARTIALLY_REFUNDED | CANCELLED
    notes: text("notes"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_payments_tenant_idx").on(t.tenantId),
    index("re_payments_lease_idx").on(t.leaseId),
    index("re_payments_ret_idx").on(t.reTenantId),
    index("re_payments_num_idx").on(t.paymentNumber),
    index("re_payments_status_idx").on(t.paymentStatus),
  ]
);

export type RealEstatePaymentRow = typeof realEstatePaymentsTable.$inferSelect;

export const realEstatePaymentAllocationsTable = pgTable(
  "re_payment_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    paymentId: text("payment_id").notNull().references(() => realEstatePaymentsTable.id, { onDelete: "cascade" }),
    chargeId: text("charge_id").references(() => realEstateLeaseChargesTable.id, { onDelete: "set null" }),
    scheduleId: text("schedule_id").references(() => realEstateLeaseSchedulesTable.id, { onDelete: "set null" }),
    allocatedAmountSar: numeric("allocated_amount_sar").notNull(),
    allocatedAt: timestamp("allocated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_pay_alloc_tenant_idx").on(t.tenantId),
    index("re_pay_alloc_payment_idx").on(t.paymentId),
    index("re_pay_alloc_charge_idx").on(t.chargeId),
    index("re_pay_alloc_sched_idx").on(t.scheduleId),
  ]
);

export type RealEstatePaymentAllocationRow = typeof realEstatePaymentAllocationsTable.$inferSelect;

export const realEstateSecurityDepositsTable = pgTable(
  "re_security_deposits",
  {
    id: text("id").primaryKey(), // dep_xxx
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    reTenantId: text("re_tenant_id").notNull().references(() => realEstateTenantsTable.id, { onDelete: "cascade" }),
    amountSar: numeric("amount_sar").notNull(),
    heldAmountSar: numeric("held_amount_sar").notNull(),
    deductionsAmountSar: numeric("deductions_amount_sar").default("0"),
    refundedAmountSar: numeric("refunded_amount_sar").default("0"),
    status: text("status").notNull().default("REQUIRED"), // REQUIRED | INVOICED | RECEIVED | HELD | PARTIALLY_APPLIED | APPLIED | REFUND_PENDING | REFUNDED | FORFEITED
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_sec_dep_tenant_idx").on(t.tenantId),
    index("re_sec_dep_lease_idx").on(t.leaseId),
    index("re_sec_dep_ret_idx").on(t.reTenantId),
    index("re_sec_dep_status_idx").on(t.status),
  ]
);

export type RealEstateSecurityDepositRow = typeof realEstateSecurityDepositsTable.$inferSelect;

export const realEstateLeaseEventsTable = pgTable(
  "re_lease_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(), // CREATED | APPROVED | ACTIVATED | RENEWED | TERMINATED | MOVE_IN | MOVE_OUT | PAYMENT_RECEIVED | DEPOSIT_HELD | CANCELLED
    actorId: text("actor_id").notNull(),
    notes: text("notes"),
    eventDataJson: text("event_data_json"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lease_events_tenant_idx").on(t.tenantId),
    index("re_lease_events_lease_idx").on(t.leaseId),
    index("re_lease_events_type_idx").on(t.eventType),
  ]
);

export type RealEstateLeaseEventRow = typeof realEstateLeaseEventsTable.$inferSelect;

export const realEstateLeaseDocumentsTable = pgTable(
  "re_lease_documents",
  {
    id: text("id").primaryKey(), // doc_xxx
    tenantId: text("tenant_id").notNull(),
    leaseId: text("lease_id").notNull().references(() => realEstateLeasesTable.id, { onDelete: "cascade" }),
    documentType: text("document_type").notNull(), // SIGNED_LEASE | TENANT_ID | CR_CERTIFICATE | PAYMENT_PROOF | TERMINATION_NOTICE | RENEWAL_DOC | OTHER
    title: text("title").notNull(),
    fileUrl: text("file_url").notNull(),
    fileSize: integer("file_size"),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lease_docs_tenant_idx").on(t.tenantId),
    index("re_lease_docs_lease_idx").on(t.leaseId),
    index("re_lease_docs_type_idx").on(t.documentType),
  ]
);

export type RealEstateLeaseDocumentRow = typeof realEstateLeaseDocumentsTable.$inferSelect;

// ── OPROX REAL ESTATE PHASE 3 TABLES ──────────────────────────────────────

export const realEstateLeadsTable = pgTable(
  "re_leads",
  {
    id: text("id").primaryKey(), // lead_xxx
    tenantId: text("tenant_id").notNull(),
    contactId: text("contact_id").references(() => realEstateContactsTable.id, { onDelete: "set null" }),
    leadNumber: text("lead_number").notNull(), // LEAD-2026-00001
    title: text("title").notNull(),
    source: text("source").notNull().default("WEBSITE"), // WEBSITE | PORTAL | DIRECT | REFERRAL | AGENT | PHONE | SOCIAL
    status: text("status").notNull().default("NEW"), // NEW | QUALIFIED | PROPERTY_MATCHED | VIEWING_SCHEDULED | OFFER_MADE | NEGOTIATING | RESERVED | HANDOVER | WON | LOST
    priority: text("priority").notNull().default("MEDIUM"), // LOW | MEDIUM | HIGH | URGENT
    budgetSar: numeric("budget_sar"),
    preferredPropertyType: text("preferred_property_type"),
    preferredCity: text("preferred_city"),
    preferredDistrict: text("preferred_district"),
    notes: text("notes"),
    assignedAgentId: text("assigned_agent_id"),
    lostReason: text("lost_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_leads_tenant_idx").on(t.tenantId),
    index("re_leads_contact_idx").on(t.contactId),
    index("re_leads_status_idx").on(t.status),
    index("re_leads_source_idx").on(t.source),
  ]
);

export type RealEstateLeadRow = typeof realEstateLeadsTable.$inferSelect;

export const realEstateLeadActivitiesTable = pgTable(
  "re_lead_activities",
  {
    id: text("id").primaryKey(), // act_xxx
    tenantId: text("tenant_id").notNull(),
    leadId: text("lead_id").notNull().references(() => realEstateLeadsTable.id, { onDelete: "cascade" }),
    activityType: text("activity_type").notNull(), // INQUIRY | NOTE | CALL | EMAIL | MEETING | STAGE_CHANGE | VIEWING_RECORDED | OFFER_RECORDED
    summary: text("summary").notNull(),
    details: text("details"),
    actorId: text("actor_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lead_act_tenant_idx").on(t.tenantId),
    index("re_lead_act_lead_idx").on(t.leadId),
    index("re_lead_act_type_idx").on(t.activityType),
  ]
);

export type RealEstateLeadActivityRow = typeof realEstateLeadActivitiesTable.$inferSelect;

export const realEstateLeadPropertyMatchesTable = pgTable(
  "re_lead_property",
  {
    id: text("id").primaryKey(), // lpm_xxx
    tenantId: text("tenant_id").notNull(),
    leadId: text("lead_id").notNull().references(() => realEstateLeadsTable.id, { onDelete: "cascade" }),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    unitId: text("unit_id").references(() => realEstateUnitsTable.id, { onDelete: "cascade" }),
    matchScore: integer("match_score").default(100),
    status: text("status").notNull().default("SHORTLISTED"), // SHORTLISTED | VIEWED | OFFERED | RESERVED | REJECTED
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_lead_prop_tenant_idx").on(t.tenantId),
    index("re_lead_prop_lead_idx").on(t.leadId),
    index("re_lead_prop_unit_idx").on(t.unitId),
  ]
);

export type RealEstateLeadPropertyMatchRow = typeof realEstateLeadPropertyMatchesTable.$inferSelect;

export const realEstateViewingsTable = pgTable(
  "re_viewings",
  {
    id: text("id").primaryKey(), // vw_xxx
    tenantId: text("tenant_id").notNull(),
    leadId: text("lead_id").notNull().references(() => realEstateLeadsTable.id, { onDelete: "cascade" }),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    unitId: text("unit_id").references(() => realEstateUnitsTable.id, { onDelete: "cascade" }),
    scheduledAt: timestamp("scheduled_at").notNull(),
    completedAt: timestamp("completed_at"),
    status: text("status").notNull().default("SCHEDULED"), // SCHEDULED | COMPLETED | CANCELLED | NO_SHOW
    feedback: text("feedback"),
    agentRating: integer("agent_rating"),
    clientInterestLevel: text("client_interest_level"), // HIGH | MEDIUM | LOW
    assignedAgentId: text("assigned_agent_id").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_viewings_tenant_idx").on(t.tenantId),
    index("re_viewings_lead_idx").on(t.leadId),
    index("re_viewings_status_idx").on(t.status),
  ]
);

export type RealEstateViewingRow = typeof realEstateViewingsTable.$inferSelect;

export const realEstateOffersTable = pgTable(
  "re_offers",
  {
    id: text("id").primaryKey(), // ofr_xxx
    tenantId: text("tenant_id").notNull(),
    leadId: text("lead_id").notNull().references(() => realEstateLeadsTable.id, { onDelete: "cascade" }),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    unitId: text("unit_id").references(() => realEstateUnitsTable.id, { onDelete: "cascade" }),
    offerNumber: text("offer_number").notNull(), // OFR-2026-00001
    offeredAmountSar: numeric("offered_amount_sar").notNull(),
    depositAmountSar: numeric("deposit_amount_sar").default("0"),
    paymentFrequency: text("payment_frequency").default("ANNUAL"), // MONTHLY | QUARTERLY | SEMI_ANNUAL | ANNUAL | CUSTOM
    proposedStartDate: text("proposed_start_date"),
    proposedEndDate: text("proposed_end_date"),
    status: text("status").notNull().default("DRAFT"), // DRAFT | SUBMITTED | COUNTERED | ACCEPTED | REJECTED | EXPIRED | WITHDRAWN
    counterAmountSar: numeric("counter_amount_sar"),
    specialTerms: text("special_terms"),
    validUntil: timestamp("valid_until"),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_offers_tenant_idx").on(t.tenantId),
    index("re_offers_lead_idx").on(t.leadId),
    index("re_offers_status_idx").on(t.status),
  ]
);

export type RealEstateOfferRow = typeof realEstateOffersTable.$inferSelect;

export const realEstateReservationsTable = pgTable(
  "re_reservations",
  {
    id: text("id").primaryKey(), // res_xxx
    tenantId: text("tenant_id").notNull(),
    leadId: text("lead_id").references(() => realEstateLeadsTable.id, { onDelete: "set null" }),
    offerId: text("offer_id").references(() => realEstateOffersTable.id, { onDelete: "set null" }),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "cascade" }),
    unitId: text("unit_id").notNull().references(() => realEstateUnitsTable.id, { onDelete: "cascade" }),
    reTenantId: text("re_tenant_id").references(() => realEstateTenantsTable.id, { onDelete: "set null" }),
    reservationNumber: text("reservation_number").notNull(), // RES-2026-00001
    reservationFeeSar: numeric("reservation_fee_sar").notNull(),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | CONVERTED_TO_LEASE | EXPIRED | CANCELLED | FORFEITED
    reservedUntil: timestamp("reserved_until").notNull(),
    convertedLeaseId: text("converted_lease_id").references(() => realEstateLeasesTable.id, { onDelete: "set null" }),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_reservations_tenant_idx").on(t.tenantId),
    index("re_reservations_unit_idx").on(t.unitId),
    index("re_reservations_status_idx").on(t.status),
  ]
);

export type RealEstateReservationRow = typeof realEstateReservationsTable.$inferSelect;

// ── OPROX REAL ESTATE PHASE 4 TABLES (PROPTECH MARKETPLACE) ───────────────

export const realEstateDevelopersTable = pgTable(
  "re_developers",
  {
    id: text("id").primaryKey(), // dev_xxx
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    coverImageUrl: text("cover_image_url"),
    description: text("description"),
    website: text("website"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    establishedYear: integer("established_year"),
    headquartersCity: text("headquarters_city"),
    verified: boolean("verified").notNull().default(false),
    rating: real("rating").default(4.8),
    totalProjects: integer("total_projects").default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_devs_tenant_idx").on(t.tenantId),
    index("re_devs_slug_idx").on(t.slug),
    index("re_devs_verified_idx").on(t.verified),
  ]
);

export type RealEstateDeveloperRow = typeof realEstateDevelopersTable.$inferSelect;

export const realEstateProjectsTable = pgTable(
  "re_projects",
  {
    id: text("id").primaryKey(), // prj_xxx
    tenantId: text("tenant_id").notNull(),
    developerId: text("developer_id").references(() => realEstateDevelopersTable.id, { onDelete: "set null" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    city: text("city").notNull(),
    district: text("district").notNull(),
    latitude: real("latitude"),
    longitude: real("longitude"),
    masterPlanUrl: text("master_plan_url"),
    coverImageUrl: text("cover_image_url"),
    galleryUrls: jsonb("gallery_urls").default([]),
    completionStatus: text("completion_status").notNull().default("UNDER_CONSTRUCTION"), // OFF_PLAN | UNDER_CONSTRUCTION | COMPLETED | READY
    completionYear: integer("completion_year"),
    startingPriceSar: numeric("starting_price_sar"),
    totalUnits: integer("total_units").default(0),
    availableUnits: integer("available_units").default(0),
    amenities: jsonb("amenities").default([]),
    constructionProgressPct: integer("construction_progress_pct").default(0),
    featured: boolean("featured").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_projects_tenant_idx").on(t.tenantId),
    index("re_projects_dev_idx").on(t.developerId),
    index("re_projects_slug_idx").on(t.slug),
    index("re_projects_city_idx").on(t.city),
    index("re_projects_status_idx").on(t.completionStatus),
    index("re_projects_featured_idx").on(t.featured),
  ]
);

export type RealEstateProjectRow = typeof realEstateProjectsTable.$inferSelect;

export const realEstatePublicListingsTable = pgTable(
  "re_public_listings",
  {
    id: text("id").primaryKey(), // lst_xxx
    tenantId: text("tenant_id").notNull(),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => realEstateProjectsTable.id, { onDelete: "set null" }),
    developerId: text("developer_id").references(() => realEstateDevelopersTable.id, { onDelete: "set null" }),
    listingNumber: text("listing_number").notNull(), // LST-2026-00001
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    listingType: text("listing_type").notNull(), // SALE | RENT | SHORT_TERM
    category: text("category").notNull().default("RESIDENTIAL"), // RESIDENTIAL | COMMERCIAL | LAND | INDUSTRIAL | LUXURY
    propertyType: text("property_type").notNull(), // APARTMENT | VILLA | DUPLEX | PENTHOUSE | OFFICE | RETAIL | LAND | WAREHOUSE
    priceSar: numeric("price_sar").notNull(),
    rentFrequency: text("rent_frequency"), // ANNUAL | MONTHLY | WEEKLY | DAILY
    city: text("city").notNull(),
    district: text("district").notNull(),
    address: text("address"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    bedrooms: integer("bedrooms").default(0),
    bathrooms: integer("bathrooms").default(0),
    areaSqm: numeric("area_sqm"),
    furnished: text("furnished").default("UNFURNISHED"), // UNFURNISHED | SEMI_FURNISHED | FULLY_FURNISHED
    amenities: jsonb("amenities").default([]),
    coverImageUrl: text("cover_image_url"),
    galleryUrls: jsonb("gallery_urls").default([]),
    videoUrl: text("video_url"),
    floorPlanUrl: text("floor_plan_url"),
    virtualTour360Url: text("virtual_tour_360_url"),
    completionStatus: text("completion_status").default("READY"), // READY | OFF_PLAN | UNDER_CONSTRUCTION
    status: text("status").notNull().default("PUBLISHED"), // DRAFT | PENDING_MODERATION | PUBLISHED | RESERVED | SOLD | RENTED | ARCHIVED
    featured: boolean("featured").notNull().default(false),
    viewCount: integer("view_count").default(0),
    inquiryCount: integer("inquiry_count").default(0),
    aiGeneratedDescription: text("ai_generated_description"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_listings_tenant_idx").on(t.tenantId),
    index("re_listings_slug_idx").on(t.slug),
    index("re_listings_type_idx").on(t.listingType),
    index("re_listings_category_idx").on(t.category),
    index("re_listings_proptype_idx").on(t.propertyType),
    index("re_listings_city_idx").on(t.city),
    index("re_listings_status_idx").on(t.status),
    index("re_listings_featured_idx").on(t.featured),
    index("re_listings_proj_idx").on(t.projectId),
  ]
);

export type RealEstatePublicListingRow = typeof realEstatePublicListingsTable.$inferSelect;

export const realEstateSavedSearchesTable = pgTable(
  "re_saved_searches",
  {
    id: text("id").primaryKey(), // srch_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    filtersJson: jsonb("filters_json").notNull(),
    notifyEmail: boolean("notify_email").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_saved_srch_tenant_idx").on(t.tenantId),
    index("re_saved_srch_user_idx").on(t.userId),
  ]
);

export type RealEstateSavedSearchRow = typeof realEstateSavedSearchesTable.$inferSelect;

export const realEstateFavoritesTable = pgTable(
  "re_favorites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    listingId: text("listing_id").notNull().references(() => realEstatePublicListingsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("re_favorites_user_listing_uniq").on(t.userId, t.listingId),
    index("re_favorites_tenant_idx").on(t.tenantId),
    index("re_favorites_user_idx").on(t.userId),
  ]
);

export type RealEstateFavoriteRow = typeof realEstateFavoritesTable.$inferSelect;

export const realEstateInquiriesTable = pgTable(
  "re_inquiries",
  {
    id: text("id").primaryKey(), // inq_xxx
    tenantId: text("tenant_id").notNull(),
    listingId: text("listing_id").references(() => realEstatePublicListingsTable.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => realEstateProjectsTable.id, { onDelete: "set null" }),
    developerId: text("developer_id").references(() => realEstateDevelopersTable.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    message: text("message"),
    inquiryType: text("inquiry_type").default("BUY"), // BUY | RENT | VISIT | GENERAL
    preferredContactMethod: text("preferred_contact_method").default("PHONE"), // PHONE | EMAIL | WHATSAPP
    status: text("status").notNull().default("NEW"), // NEW | CONTACTED | QUALIFIED | CLOSED
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_inquiries_tenant_idx").on(t.tenantId),
    index("re_inquiries_listing_idx").on(t.listingId),
    index("re_inquiries_project_idx").on(t.projectId),
    index("re_inquiries_status_idx").on(t.status),
  ]
);

export type RealEstateInquiryRow = typeof realEstateInquiriesTable.$inferSelect;

export const realEstateAiValuationsTable = pgTable(
  "re_ai_valuations",
  {
    id: text("id").primaryKey(), // val_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    city: text("city").notNull(),
    district: text("district").notNull(),
    propertyType: text("property_type").notNull(),
    areaSqm: numeric("area_sqm").notNull(),
    bedrooms: integer("bedrooms"),
    estimatedPriceMinSar: numeric("estimated_price_min_sar").notNull(),
    estimatedPriceMaxSar: numeric("estimated_price_max_sar").notNull(),
    estimatedPriceAvgSar: numeric("estimated_price_avg_sar").notNull(),
    estimatedPricePerSqmSar: numeric("estimated_price_per_sqm_sar").notNull(),
    confidenceScorePct: integer("confidence_score_pct").notNull(),
    comparableCount: integer("comparable_count").notNull(),
    marketTrend: text("market_trend"), // UPWARD | STABLE | DOWNWARD
    aiAnalysisSummary: text("ai_analysis_summary"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_ai_val_tenant_idx").on(t.tenantId),
    index("re_ai_val_user_idx").on(t.userId),
  ]
);

export type RealEstateAiValuationRow = typeof realEstateAiValuationsTable.$inferSelect;

// ── OPROX REAL ESTATE PHASE 5 TABLES ──────────────────────────────────────

export const realEstateDesignProjectsTable = pgTable(
  "re_design_projects",
  {
    id: text("id").primaryKey(), // dp_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    projectType: text("project_type").notNull(), // ARCHITECTURAL | INTERIOR | EXTERIOR | RENOVATION | MULTI_DISCIPLINARY
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "set null" }),
    unitId: text("unit_id").references(() => realEstateUnitsTable.id, { onDelete: "set null" }),
    listingId: text("listing_id").references(() => realEstatePublicListingsTable.id, { onDelete: "set null" }),
    developerProjectId: text("developer_project_id").references(() => realEstateProjectsTable.id, { onDelete: "set null" }),
    studioProjectId: text("studio_project_id"), // Link to OPROX Studio project if exported
    status: text("status").notNull().default("ACTIVE"), // DRAFT | ACTIVE | APPROVED | REJECTED | ARCHIVED
    requirementsJson: jsonb("requirements_json"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_dp_tenant_idx").on(t.tenantId),
    index("re_dp_user_idx").on(t.userId),
    index("re_dp_property_idx").on(t.propertyId),
    index("re_dp_type_idx").on(t.projectType),
  ]
);

export type RealEstateDesignProjectRow = typeof realEstateDesignProjectsTable.$inferSelect;

export const realEstateDesignConceptsTable = pgTable(
  "re_design_concepts",
  {
    id: text("id").primaryKey(), // dc_xxx
    tenantId: text("tenant_id").notNull(),
    designProjectId: text("design_project_id").notNull().references(() => realEstateDesignProjectsTable.id, { onDelete: "cascade" }),
    conceptName: text("concept_name").notNull(),
    conceptType: text("concept_type").notNull(), // ARCHITECTURAL | INTERIOR | EXTERIOR | LANDSCAPE | RENOVATION
    versionNumber: integer("version_number").notNull().default(1),
    style: text("style"), // Modern | Contemporary | Minimal | Luxury | Classic | Saudi-inspired | Islamic-inspired | Industrial
    spacePlanningJson: jsonb("space_planning_json"),
    interiorDetailsJson: jsonb("interior_details_json"),
    exteriorDetailsJson: jsonb("exterior_details_json"),
    renovationDetailsJson: jsonb("renovation_details_json"),
    rationale: text("rationale"),
    approvalStatus: text("approval_status").notNull().default("CONCEPTUAL"), // CONCEPTUAL | REVIEWED | APPROVED | REJECTED
    isConceptualNotice: boolean("is_conceptual_notice").notNull().default(true),
    aiGenerated: boolean("ai_generated").notNull().default(true),
    aiModelUsed: text("ai_model_used"),
    mediaJson: jsonb("media_json"),
    model3dStatus: text("model3d_status").default("NOT_CONFIGURED"), // NOT_CONFIGURED | PENDING | READY
    spatialMetaJson: jsonb("spatial_meta_json"), // Phase 6 readiness
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_dc_tenant_idx").on(t.tenantId),
    index("re_dc_project_idx").on(t.designProjectId),
    index("re_dc_type_idx").on(t.conceptType),
  ]
);

export type RealEstateDesignConceptRow = typeof realEstateDesignConceptsTable.$inferSelect;

export const realEstateInvestmentAnalysesTable = pgTable(
  "re_investment_analyses",
  {
    id: text("id").primaryKey(), // inv_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    propertyId: text("property_id").references(() => realEstatePropertiesTable.id, { onDelete: "set null" }),
    listingId: text("listing_id").references(() => realEstatePublicListingsTable.id, { onDelete: "set null" }),
    purchasePriceSar: numeric("purchase_price_sar").notNull(),
    areaSqm: numeric("area_sqm").notNull(),
    estimatedAnnualRentSar: numeric("estimated_annual_rent_sar").notNull(),
    operatingExpensesAnnualSar: numeric("operating_expenses_annual_sar").default("0"),
    occupancyRatePct: numeric("occupancy_rate_pct").default("95"),
    financingPercentagePct: numeric("financing_percentage_pct").default("0"),
    mortgageInterestRatePct: numeric("mortgage_interest_rate_pct").default("0"),
    loanTenureYears: integer("loan_tenure_years").default(20),
    calculatedMetricsJson: jsonb("calculated_metrics_json").notNull(),
    comparablePropertiesJson: jsonb("comparable_properties_json"),
    dataQualityStatus: text("data_quality_status").notNull().default("ACTUAL_AND_ESTIMATED"), // ACTUAL | ESTIMATED | NOT_MEASURED | DATA_UNAVAILABLE
    aiAnalysisSummary: text("ai_analysis_summary"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_inv_tenant_idx").on(t.tenantId),
    index("re_inv_user_idx").on(t.userId),
    index("re_inv_property_idx").on(t.propertyId),
  ]
);

export type RealEstateInvestmentAnalysisRow = typeof realEstateInvestmentAnalysesTable.$inferSelect;

export const realEstateImmersiveAssetsTable = pgTable(
  "re_immersive_assets",
  {
    id: text("id").primaryKey(), // asset_xxx
    tenantId: text("tenant_id").notNull(),
    linkedEntityType: text("linked_entity_type").notNull(), // PROPERTY | UNIT | DEVELOPER_PROJECT | DESIGN_PROJECT | LISTING
    linkedEntityId: text("linked_entity_id").notNull(),
    assetType: text("asset_type").notNull(), // GLB | GLTF | PANORAMA_360 | VR | AR | DIGITAL_TWIN
    title: text("title").notNull(),
    storageReference: text("storage_reference").notNull(),
    mimeType: text("mime_type"),
    fileSizeBytes: integer("file_size_bytes"),
    version: integer("version").notNull().default(1),
    processingState: text("processing_state").notNull().default("READY"), // PENDING | READY | FAILED | NOT_CONFIGURED
    isPublicAvailable: boolean("is_public_available").notNull().default(true),
    metadataJson: jsonb("metadata_json"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_ia_tenant_idx").on(t.tenantId),
    index("re_ia_linked_idx").on(t.linkedEntityType, t.linkedEntityId),
    index("re_ia_asset_type_idx").on(t.assetType),
  ]
);

export type RealEstateImmersiveAssetRow = typeof realEstateImmersiveAssetsTable.$inferSelect;

export const realEstateDigitalTwinsTable = pgTable(
  "re_digital_twins",
  {
    id: text("id").primaryKey(), // dt_xxx
    tenantId: text("tenant_id").notNull(),
    title: text("title").notNull(),
    linkedEntityType: text("linked_entity_type").notNull(), // PROPERTY | UNIT | DEVELOPER_PROJECT | DESIGN_PROJECT
    linkedEntityId: text("linked_entity_id").notNull(),
    versionNumber: integer("version_number").notNull().default(1),
    isCurrentVersion: boolean("is_current_version").notNull().default(true),
    primaryModelAssetId: text("primary_model_asset_id").references(() => realEstateImmersiveAssetsTable.id, { onDelete: "set null" }),
    floorsCount: integer("floors_count").notNull().default(1),
    spatialMetadataJson: jsonb("spatial_metadata_json").notNull(), // floors, rooms, zones, dimensions, orientation, area, hotspots, material metadata, design references
    designProjectId: text("design_project_id").references(() => realEstateDesignProjectsTable.id, { onDelete: "set null" }),
    designConceptId: text("design_concept_id").references(() => realEstateDesignConceptsTable.id, { onDelete: "set null" }),
    status: text("status").notNull().default("ACTIVE"), // DRAFT | ACTIVE | ARCHIVED
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_dt_tenant_idx").on(t.tenantId),
    index("re_dt_linked_idx").on(t.linkedEntityType, t.linkedEntityId),
    index("re_dt_primary_asset_idx").on(t.primaryModelAssetId),
  ]
);

export type RealEstateDigitalTwinRow = typeof realEstateDigitalTwinsTable.$inferSelect;

export const realEstateVRARLogsTable = pgTable(
  "re_vrar_logs",
  {
    id: text("id").primaryKey(), // vrar_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    sessionType: text("session_type").notNull(), // 3D_ORBIT | WALKTHROUGH | VR | AR | DIGITAL_TWIN
    capabilityState: text("capability_state").notNull(), // SUPPORTED | UNSUPPORTED | NOT_CONFIGURED
    deviceUserAgent: text("device_user_agent"),
    entityId: text("entity_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("re_vrar_tenant_idx").on(t.tenantId),
    index("re_vrar_user_idx").on(t.userId),
    index("re_vrar_session_idx").on(t.sessionType),
  ]
);

export type RealEstateVRARLogRow = typeof realEstateVRARLogsTable.$inferSelect;

// ── OPROX Academy Phase 1 Tables ───────────────────────────────────────────

export const academyProfilesTable = pgTable(
  "acad_profiles",
  {
    id: text("id").primaryKey(), // acad_prof_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    headline: text("headline"),
    bio: text("bio"),
    avatarUrl: text("avatar_url"),
    preferLanguage: text("prefer_language").notNull().default("en"), // "en" | "ar"
    metadataJson: jsonb("metadata_json").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_prof_tenant_idx").on(t.tenantId),
    index("acad_prof_user_idx").on(t.userId),
    uniqueIndex("acad_prof_tenant_user_uniq").on(t.tenantId, t.userId),
  ]
);

export type AcademyProfileRow = typeof academyProfilesTable.$inferSelect;

export const instructorProfilesTable = pgTable(
  "acad_instructor_profiles",
  {
    id: text("id").primaryKey(), // inst_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    bio: text("bio"),
    expertiseAreasJson: jsonb("expertise_areas_json").notNull().default([]),
    socialLinksJson: jsonb("social_links_json").notNull().default({}),
    rating: numeric("rating").default("5.0"),
    totalStudents: integer("total_students").default(0),
    totalCourses: integer("total_courses").default(0),
    verificationStatus: text("verification_status").notNull().default("VERIFIED"), // PENDING | VERIFIED | REJECTED
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_inst_tenant_idx").on(t.tenantId),
    index("acad_inst_user_idx").on(t.userId),
  ]
);

export type InstructorProfileRow = typeof instructorProfilesTable.$inferSelect;

export const academyCategoriesTable = pgTable(
  "acad_categories",
  {
    id: text("id").primaryKey(), // acad_cat_xxx
    tenantId: text("tenant_id").notNull(),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    slug: text("slug").notNull(),
    descriptionEn: text("description_en"),
    descriptionAr: text("description_ar"),
    icon: text("icon").default("BookOpen"),
    displayOrder: integer("display_order").default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_cat_tenant_idx").on(t.tenantId),
    uniqueIndex("acad_cat_tenant_slug_uniq").on(t.tenantId, t.slug),
  ]
);

export type AcademyCategoryRow = typeof academyCategoriesTable.$inferSelect;

export const academyLearningPathsTable = pgTable(
  "acad_learning_paths",
  {
    id: text("id").primaryKey(), // acad_path_xxx
    tenantId: text("tenant_id").notNull(),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    slug: text("slug").notNull(),
    descriptionEn: text("description_en"),
    descriptionAr: text("description_ar"),
    level: text("level").notNull().default("ALL_LEVELS"), // BEGINNER | INTERMEDIATE | ADVANCED | ALL_LEVELS
    estimatedHours: integer("estimated_hours").default(10),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_path_tenant_idx").on(t.tenantId),
    uniqueIndex("acad_path_tenant_slug_uniq").on(t.tenantId, t.slug),
  ]
);

export type AcademyLearningPathRow = typeof academyLearningPathsTable.$inferSelect;

export const academyCoursesTable = pgTable(
  "acad_courses",
  {
    id: text("id").primaryKey(), // acad_crs_xxx
    tenantId: text("tenant_id").notNull(),
    categoryId: text("category_id").references(() => academyCategoriesTable.id, { onDelete: "set null" }),
    learningPathId: text("learning_path_id").references(() => academyLearningPathsTable.id, { onDelete: "set null" }),
    instructorId: text("instructor_id").references(() => instructorProfilesTable.id, { onDelete: "set null" }),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    slug: text("slug").notNull(),
    summaryEn: text("summary_en"),
    summaryAr: text("summary_ar"),
    descriptionEn: text("description_en"),
    descriptionAr: text("description_ar"),
    language: text("language").notNull().default("both"), // en | ar | both
    level: text("level").notNull().default("ALL_LEVELS"), // BEGINNER | INTERMEDIATE | ADVANCED | ALL_LEVELS
    status: text("status").notNull().default("PUBLISHED"), // DRAFT | PUBLISHED | ARCHIVED
    estimatedDurationMinutes: integer("estimated_duration_minutes").default(120),
    thumbnailUrl: text("thumbnail_url"),
    priceSar: numeric("price_sar").default("0"),
    currency: text("currency").default("SAR"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_crs_tenant_idx").on(t.tenantId),
    index("acad_crs_cat_idx").on(t.categoryId),
    index("acad_crs_path_idx").on(t.learningPathId),
    index("acad_crs_inst_idx").on(t.instructorId),
    uniqueIndex("acad_crs_tenant_slug_uniq").on(t.tenantId, t.slug),
  ]
);

export type AcademyCourseRow = typeof academyCoursesTable.$inferSelect;

export const academyCourseModulesTable = pgTable(
  "acad_modules",
  {
    id: text("id").primaryKey(), // acad_mod_xxx
    tenantId: text("tenant_id").notNull(),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    descriptionEn: text("description_en"),
    descriptionAr: text("description_ar"),
    displayOrder: integer("display_order").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_mod_tenant_idx").on(t.tenantId),
    index("acad_mod_course_idx").on(t.courseId),
  ]
);

export type AcademyCourseModuleRow = typeof academyCourseModulesTable.$inferSelect;

export const academyLessonsTable = pgTable(
  "acad_lessons",
  {
    id: text("id").primaryKey(), // acad_lsn_xxx
    tenantId: text("tenant_id").notNull(),
    moduleId: text("module_id").notNull().references(() => academyCourseModulesTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    summaryEn: text("summary_en"),
    summaryAr: text("summary_ar"),
    lessonType: text("lesson_type").notNull().default("TEXT"), // TEXT | VIDEO | QUIZ | CODING_LAB | STUDIO_LAB
    contentEn: text("content_en"),
    contentAr: text("content_ar"),
    durationMinutes: integer("duration_minutes").default(15),
    videoUrl: text("video_url"),
    displayOrder: integer("display_order").notNull().default(1),
    isPreview: boolean("is_preview").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_lsn_tenant_idx").on(t.tenantId),
    index("acad_lsn_mod_idx").on(t.moduleId),
    index("acad_lsn_crs_idx").on(t.courseId),
  ]
);

export type AcademyLessonRow = typeof academyLessonsTable.$inferSelect;

export const academyLessonResourcesTable = pgTable(
  "acad_resources",
  {
    id: text("id").primaryKey(), // acad_res_xxx
    tenantId: text("tenant_id").notNull(),
    lessonId: text("lesson_id").notNull().references(() => academyLessonsTable.id, { onDelete: "cascade" }),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    resourceType: text("resource_type").notNull().default("LINK"), // LINK | FILE | CODE_SNIPPET | DOCUMENT
    resourceUrl: text("resource_url").notNull(),
    fileSizeBytes: integer("file_size_bytes"),
    displayOrder: integer("display_order").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_res_tenant_idx").on(t.tenantId),
    index("acad_res_lsn_idx").on(t.lessonId),
  ]
);

export type AcademyLessonResourceRow = typeof academyLessonResourcesTable.$inferSelect;

export const academyEnrollmentsTable = pgTable(
  "acad_enrollments",
  {
    id: text("id").primaryKey(), // acad_enr_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("ACTIVE"), // ACTIVE | COMPLETED | CANCELLED | EXPIRED
    progressPercent: integer("progress_percent").notNull().default(0),
    enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_enr_tenant_idx").on(t.tenantId),
    index("acad_enr_user_idx").on(t.userId),
    index("acad_enr_crs_idx").on(t.courseId),
    uniqueIndex("acad_enr_tenant_user_crs_uniq").on(t.tenantId, t.userId, t.courseId),
  ]
);

export type AcademyEnrollmentRow = typeof academyEnrollmentsTable.$inferSelect;

// ── OPROX Academy Phase 2 Tables ───────────────────────────────────────────

export const academyLessonProgressTable = pgTable(
  "acad_lesson_progress",
  {
    id: text("id").primaryKey(), // acad_lprog_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    enrollmentId: text("enrollment_id").notNull().references(() => academyEnrollmentsTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => academyLessonsTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("IN_PROGRESS"), // NOT_STARTED | IN_PROGRESS | COMPLETED
    completedAt: timestamp("completed_at"),
    lastPositionSeconds: integer("last_position_seconds").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_lprog_tenant_idx").on(t.tenantId),
    index("acad_lprog_user_idx").on(t.userId),
    index("acad_lprog_enr_idx").on(t.enrollmentId),
    index("acad_lprog_crs_idx").on(t.courseId),
    index("acad_lprog_lsn_idx").on(t.lessonId),
    uniqueIndex("acad_lprog_tenant_user_lsn_uniq").on(t.tenantId, t.userId, t.lessonId),
  ]
);

export type AcademyLessonProgressRow = typeof academyLessonProgressTable.$inferSelect;

export const academyCourseProgressTable = pgTable(
  "acad_course_progress",
  {
    id: text("id").primaryKey(), // acad_cprog_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    enrollmentId: text("enrollment_id").notNull().references(() => academyEnrollmentsTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    completedLessonsCount: integer("completed_lessons_count").notNull().default(0),
    totalLessonsCount: integer("total_lessons_count").notNull().default(0),
    progressPercent: integer("progress_percent").notNull().default(0),
    lastLessonId: text("last_lesson_id").references(() => academyLessonsTable.id, { onDelete: "set null" }),
    status: text("status").notNull().default("IN_PROGRESS"), // IN_PROGRESS | COMPLETED
    startedAt: timestamp("started_at").notNull().defaultNow(),
    lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_cprog_tenant_idx").on(t.tenantId),
    index("acad_cprog_user_idx").on(t.userId),
    index("acad_cprog_enr_idx").on(t.enrollmentId),
    index("acad_cprog_crs_idx").on(t.courseId),
    uniqueIndex("acad_cprog_tenant_user_crs_uniq").on(t.tenantId, t.userId, t.courseId),
  ]
);

export type AcademyCourseProgressRow = typeof academyCourseProgressTable.$inferSelect;

export const academyLearningSessionsTable = pgTable(
  "acad_learning_sessions",
  {
    id: text("id").primaryKey(), // acad_sess_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").references(() => academyLessonsTable.id, { onDelete: "set null" }),
    durationMinutes: integer("duration_minutes").notNull().default(0),
    activityType: text("activity_type").notNull().default("LESSON_VIEW"), // LESSON_VIEW | LESSON_COMPLETE | RESOURCE_DOWNLOAD
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_sess_tenant_idx").on(t.tenantId),
    index("acad_sess_user_idx").on(t.userId),
    index("acad_sess_crs_idx").on(t.courseId),
  ]
);

export type AcademyLearningSessionRow = typeof academyLearningSessionsTable.$inferSelect;

export const academyBookmarksTable = pgTable(
  "acad_bookmarks",
  {
    id: text("id").primaryKey(), // acad_bm_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull().references(() => academyLessonsTable.id, { onDelete: "cascade" }),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_bm_tenant_idx").on(t.tenantId),
    index("acad_bm_user_idx").on(t.userId),
    uniqueIndex("acad_bm_tenant_user_lsn_uniq").on(t.tenantId, t.userId, t.lessonId),
  ]
);

export type AcademyBookmarkRow = typeof academyBookmarksTable.$inferSelect;

// ── OPROX Academy Phase 3 Tables ─────────────────────────────────────────────

export const academyAssessmentsTable = pgTable(
  "acad_assessments",
  {
    id: text("id").primaryKey(), // acad_asmt_xxx
    tenantId: text("tenant_id").notNull(),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    moduleId: text("module_id").references(() => academyCourseModulesTable.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").references(() => academyLessonsTable.id, { onDelete: "cascade" }),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    descriptionEn: text("description_en"),
    descriptionAr: text("description_ar"),
    passingScorePercent: integer("passing_score_percent").notNull().default(70),
    maxAttempts: integer("max_attempts").default(3),
    timeLimitMinutes: integer("time_limit_minutes").default(0),
    shuffleQuestions: boolean("shuffle_questions").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_asmt_tenant_idx").on(t.tenantId),
    index("acad_asmt_crs_idx").on(t.courseId),
  ]
);

export type AcademyAssessmentRow = typeof academyAssessmentsTable.$inferSelect;

export const academyAssessmentQuestionsTable = pgTable(
  "acad_assessment_questions",
  {
    id: text("id").primaryKey(), // acad_quest_xxx
    tenantId: text("tenant_id").notNull(),
    assessmentId: text("assessment_id").notNull().references(() => academyAssessmentsTable.id, { onDelete: "cascade" }),
    questionTextEn: text("question_text_en").notNull(),
    questionTextAr: text("question_text_ar").notNull(),
    questionType: text("question_type").notNull().default("SINGLE_CHOICE"), // SINGLE_CHOICE | MULTIPLE_CHOICE | TRUE_FALSE | SHORT_ANSWER
    points: integer("points").notNull().default(1),
    displayOrder: integer("display_order").notNull().default(1),
    explanationEn: text("explanation_en"),
    explanationAr: text("explanation_ar"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_quest_tenant_idx").on(t.tenantId),
    index("acad_quest_asmt_idx").on(t.assessmentId),
  ]
);

export type AcademyAssessmentQuestionRow = typeof academyAssessmentQuestionsTable.$inferSelect;

export const academyAssessmentChoicesTable = pgTable(
  "acad_assessment_choices",
  {
    id: text("id").primaryKey(), // acad_choice_xxx
    tenantId: text("tenant_id").notNull(),
    questionId: text("question_id").notNull().references(() => academyAssessmentQuestionsTable.id, { onDelete: "cascade" }),
    choiceTextEn: text("choice_text_en").notNull(),
    choiceTextAr: text("choice_text_ar").notNull(),
    isCorrect: boolean("is_correct").notNull().default(false),
    displayOrder: integer("display_order").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_choice_tenant_idx").on(t.tenantId),
    index("acad_choice_quest_idx").on(t.questionId),
  ]
);

export type AcademyAssessmentChoiceRow = typeof academyAssessmentChoicesTable.$inferSelect;

export const academyAssessmentAttemptsTable = pgTable(
  "acad_assessment_attempts",
  {
    id: text("id").primaryKey(), // acad_att_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    assessmentId: text("assessment_id").notNull().references(() => academyAssessmentsTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull().default(1),
    status: text("status").notNull().default("IN_PROGRESS"), // IN_PROGRESS | SUBMITTED | EVALUATED
    scorePoints: integer("score_points").default(0),
    maxPoints: integer("max_points").default(0),
    scorePercent: integer("score_percent").default(0),
    passed: boolean("passed").default(false),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    submittedAt: timestamp("submitted_at"),
  },
  (t) => [
    index("acad_att_tenant_idx").on(t.tenantId),
    index("acad_att_user_idx").on(t.userId),
    index("acad_att_asmt_idx").on(t.assessmentId),
  ]
);

export type AcademyAssessmentAttemptRow = typeof academyAssessmentAttemptsTable.$inferSelect;

export const academyLearnerAnswersTable = pgTable(
  "acad_learner_answers",
  {
    id: text("id").primaryKey(), // acad_ans_xxx
    tenantId: text("tenant_id").notNull(),
    attemptId: text("attempt_id").notNull().references(() => academyAssessmentAttemptsTable.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull().references(() => academyAssessmentQuestionsTable.id, { onDelete: "cascade" }),
    selectedChoiceIds: text("selected_choice_ids"),
    shortAnswerText: text("short_answer_text"),
    isCorrect: boolean("is_correct").default(false),
    pointsEarned: integer("points_earned").default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_ans_tenant_idx").on(t.tenantId),
    index("acad_ans_att_idx").on(t.attemptId),
  ]
);

export type AcademyLearnerAnswerRow = typeof academyLearnerAnswersTable.$inferSelect;

export const academyAssignmentsTable = pgTable(
  "acad_assignments",
  {
    id: text("id").primaryKey(), // acad_asgn_xxx
    tenantId: text("tenant_id").notNull(),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    moduleId: text("module_id").references(() => academyCourseModulesTable.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").references(() => academyLessonsTable.id, { onDelete: "cascade" }),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    instructionsEn: text("instructions_en"),
    instructionsAr: text("instructions_ar"),
    maxScore: integer("max_score").notNull().default(100),
    passingScore: integer("passing_score").notNull().default(60),
    allowResubmission: boolean("allow_resubmission").notNull().default(true),
    dueDate: timestamp("due_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_asgn_tenant_idx").on(t.tenantId),
    index("acad_asgn_crs_idx").on(t.courseId),
  ]
);

export type AcademyAssignmentRow = typeof academyAssignmentsTable.$inferSelect;

export const academyAssignmentSubmissionsTable = pgTable(
  "acad_assignment_submissions",
  {
    id: text("id").primaryKey(), // acad_sub_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    assignmentId: text("assignment_id").notNull().references(() => academyAssignmentsTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    submissionText: text("submission_text"),
    resourceUrls: text("resource_urls"),
    status: text("status").notNull().default("SUBMITTED"), // SUBMITTED | GRADED | RESUBMISSION_REQUESTED
    score: integer("score"),
    instructorFeedbackEn: text("instructor_feedback_en"),
    instructorFeedbackAr: text("instructor_feedback_ar"),
    gradedByUserId: text("graded_by_user_id").references(() => usersTable.id, { onDelete: "set null" }),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    gradedAt: timestamp("graded_at"),
  },
  (t) => [
    index("acad_sub_tenant_idx").on(t.tenantId),
    index("acad_sub_user_idx").on(t.userId),
    index("acad_sub_asgn_idx").on(t.assignmentId),
  ]
);

export type AcademyAssignmentSubmissionRow = typeof academyAssignmentSubmissionsTable.$inferSelect;

export const academyCertificatesTable = pgTable(
  "acad_certificates",
  {
    id: text("id").primaryKey(), // acad_cert_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    certificateNumber: text("certificate_number").notNull(),
    verificationCode: text("verification_code").notNull(),
    completionScorePercent: integer("completion_score_percent").notNull().default(100),
    issueDate: timestamp("issue_date").notNull().defaultNow(),
    status: text("status").notNull().default("ISSUED"), // ISSUED | REVOKED
    metadata: text("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_cert_tenant_idx").on(t.tenantId),
    index("acad_cert_user_idx").on(t.userId),
    index("acad_cert_crs_idx").on(t.courseId),
    uniqueIndex("acad_cert_num_uniq").on(t.certificateNumber),
    uniqueIndex("acad_cert_vcode_uniq").on(t.verificationCode),
    uniqueIndex("acad_cert_tenant_user_crs_uniq").on(t.tenantId, t.userId, t.courseId),
  ]
);

export type AcademyCertificateRow = typeof academyCertificatesTable.$inferSelect;

// --- Phase 4: Instructor Studio, Organization Learning & Administration Tables ---

export const academyOrgProgramsTable = pgTable(
  "acad_org_programs",
  {
    id: text("id").primaryKey(), // acad_prog_xxx
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    descriptionEn: text("description_en"),
    descriptionAr: text("description_ar"),
    targetAudience: text("target_audience"),
    isPublished: boolean("is_published").notNull().default(true),
    createdById: text("created_by_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_prog_tenant_idx").on(t.tenantId),
    index("acad_prog_org_idx").on(t.orgId),
  ]
);

export type AcademyOrgProgramRow = typeof academyOrgProgramsTable.$inferSelect;

export const academyOrgProgramCoursesTable = pgTable(
  "acad_org_program_courses",
  {
    id: text("id").primaryKey(), // acad_prog_crs_xxx
    tenantId: text("tenant_id").notNull(),
    programId: text("program_id").notNull().references(() => academyOrgProgramsTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    orderIndex: integer("order_index").notNull().default(0),
    isRequired: boolean("is_required").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_prog_crs_tenant_idx").on(t.tenantId),
    index("acad_prog_crs_prog_idx").on(t.programId),
  ]
);

export type AcademyOrgProgramCourseRow = typeof academyOrgProgramCoursesTable.$inferSelect;

export const academyCohortsTable = pgTable(
  "acad_cohorts",
  {
    id: text("id").primaryKey(), // acad_chrt_xxx
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    nameEn: text("name_en").notNull(),
    nameAr: text("name_ar").notNull(),
    descriptionEn: text("description_en"),
    descriptionAr: text("description_ar"),
    createdById: text("created_by_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_chrt_tenant_idx").on(t.tenantId),
    index("acad_chrt_org_idx").on(t.orgId),
  ]
);

export type AcademyCohortRow = typeof academyCohortsTable.$inferSelect;

export const academyCohortMembersTable = pgTable(
  "acad_cohort_members",
  {
    id: text("id").primaryKey(), // acad_chrt_mem_xxx
    tenantId: text("tenant_id").notNull(),
    cohortId: text("cohort_id").notNull().references(() => academyCohortsTable.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_chrt_mem_tenant_idx").on(t.tenantId),
    index("acad_chrt_mem_chrt_idx").on(t.cohortId),
    index("acad_chrt_mem_user_idx").on(t.userId),
    uniqueIndex("acad_chrt_mem_uniq").on(t.tenantId, t.cohortId, t.userId),
  ]
);

export type AcademyCohortMemberRow = typeof academyCohortMembersTable.$inferSelect;

export const academyOrgAssignmentsTable = pgTable(
  "acad_org_assignments",
  {
    id: text("id").primaryKey(), // acad_org_asgn_xxx
    tenantId: text("tenant_id").notNull(),
    orgId: text("org_id").notNull(),
    targetType: text("target_type").notNull().default("ORGANIZATION"), // ORGANIZATION | COHORT | USER
    targetId: text("target_id"), // cohortId or userId or null
    assignmentType: text("assignment_type").notNull().default("COURSE"), // COURSE | PROGRAM
    itemCourseId: text("item_course_id").references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    itemProgramId: text("item_program_id").references(() => academyOrgProgramsTable.id, { onDelete: "cascade" }),
    dueDate: timestamp("due_date"),
    assignedById: text("assigned_by_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_org_asgn_tenant_idx").on(t.tenantId),
    index("acad_org_asgn_org_idx").on(t.orgId),
  ]
);

export type AcademyOrgAssignmentRow = typeof academyOrgAssignmentsTable.$inferSelect;

export const academyInstructorCoursesTable = pgTable(
  "acad_instructor_courses",
  {
    id: text("id").primaryKey(), // acad_inst_crs_xxx
    tenantId: text("tenant_id").notNull(),
    instructorUserId: text("instructor_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("PRIMARY"), // PRIMARY | CO_INSTRUCTOR | TA
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_inst_crs_tenant_idx").on(t.tenantId),
    index("acad_inst_crs_inst_idx").on(t.instructorUserId),
    index("acad_inst_crs_course_idx").on(t.courseId),
    uniqueIndex("acad_inst_crs_uniq").on(t.tenantId, t.instructorUserId, t.courseId),
  ]
);

export type AcademyInstructorCourseRow = typeof academyInstructorCoursesTable.$inferSelect;

export const academyAdminLogsTable = pgTable(
  "acad_admin_logs",
  {
    id: text("id").primaryKey(), // acad_adm_log_xxx
    tenantId: text("tenant_id").notNull(),
    adminUserId: text("admin_user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    action: text("action").notNull(), // COURSE_APPROVED | COURSE_UNPUBLISHED | INSTRUCTOR_VERIFIED | ETC
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_adm_log_tenant_idx").on(t.tenantId),
    index("acad_adm_log_admin_idx").on(t.adminUserId),
  ]
);

export type AcademyAdminLogRow = typeof academyAdminLogsTable.$inferSelect;

export const academyTutorSessionsTable = pgTable(
  "acad_tutor_sessions",
  {
    id: text("id").primaryKey(), // acad_tut_sess_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id"),
    title: text("title").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_tut_sess_tenant_idx").on(t.tenantId),
    index("acad_tut_sess_user_idx").on(t.userId),
    index("acad_tut_sess_course_idx").on(t.courseId),
  ]
);

export type AcademyTutorSessionRow = typeof academyTutorSessionsTable.$inferSelect;

export const academyTutorMessagesTable = pgTable(
  "acad_tutor_messages",
  {
    id: text("id").primaryKey(), // acad_tut_msg_xxx
    tenantId: text("tenant_id").notNull(),
    sessionId: text("session_id").notNull().references(() => academyTutorSessionsTable.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // user | assistant | system
    content: text("content").notNull(),
    language: text("language").notNull().default("en"),
    groundingContext: text("grounding_context"),
    tokensUsed: integer("tokens_used").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_tut_msg_tenant_idx").on(t.tenantId),
    index("acad_tut_msg_session_idx").on(t.sessionId),
  ]
);

export type AcademyTutorMessageRow = typeof academyTutorMessagesTable.$inferSelect;

export const academyLearnerMasteryTable = pgTable(
  "acad_learner_mastery",
  {
    id: text("id").primaryKey(), // acad_mstr_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    conceptKey: text("concept_key").notNull(),
    masteryScore: integer("mastery_score").notNull().default(0), // 0 - 100
    totalAttempts: integer("total_attempts").notNull().default(0),
    correctAttempts: integer("correct_attempts").notNull().default(0),
    lastEvaluatedAt: timestamp("last_evaluated_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_mstr_tenant_idx").on(t.tenantId),
    index("acad_mstr_user_idx").on(t.userId),
    index("acad_mstr_course_idx").on(t.courseId),
    uniqueIndex("acad_mstr_uniq").on(t.tenantId, t.userId, t.courseId, t.conceptKey),
  ]
);

export type AcademyLearnerMasteryRow = typeof academyLearnerMasteryTable.$inferSelect;

export const academyAdaptiveRecommendationsTable = pgTable(
  "acad_adaptive_recommendations",
  {
    id: text("id").primaryKey(), // acad_rec_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    recommendationType: text("recommendation_type").notNull(), // REVIEW_LESSON | NEXT_LESSON | WEAK_CONCEPT | PRACTICE | NEXT_COURSE
    titleEn: text("title_en").notNull(),
    titleAr: text("title_ar").notNull(),
    descriptionEn: text("description_en"),
    descriptionAr: text("description_ar"),
    lessonId: text("lesson_id"),
    targetConcept: text("target_concept"),
    priority: integer("priority").notNull().default(1),
    isDismissed: boolean("is_dismissed").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_rec_tenant_idx").on(t.tenantId),
    index("acad_rec_user_idx").on(t.userId),
    index("acad_rec_course_idx").on(t.courseId),
  ]
);

export type AcademyAdaptiveRecommendationRow = typeof academyAdaptiveRecommendationsTable.$inferSelect;

export const academyLabSessionsTable = pgTable(
  "acad_lab_sessions",
  {
    id: text("id").primaryKey(), // acad_lab_sess_xxx
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    courseId: text("course_id").notNull().references(() => academyCoursesTable.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id").notNull(),
    labType: text("lab_type").notNull(), // CODING_LAB | STUDIO_LAB
    codeProjectId: text("code_project_id"),
    studioProjectId: text("studio_project_id"),
    status: text("status").notNull().default("IN_PROGRESS"), // IN_PROGRESS | COMPLETED | SUBMITTED | FAILED
    checkpointsJson: text("checkpoints_json").notNull().default("[]"),
    score: integer("score").notNull().default(0),
    feedback: text("feedback"),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("acad_lab_sess_tenant_idx").on(t.tenantId),
    index("acad_lab_sess_user_idx").on(t.userId),
    index("acad_lab_sess_course_idx").on(t.courseId),
    index("acad_lab_sess_lesson_idx").on(t.lessonId),
  ]
);

export type AcademyLabSessionRow = typeof academyLabSessionsTable.$inferSelect;
