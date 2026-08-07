-- Phase 4 Production Delivery, Deployment & Operations Schema Migration

CREATE TABLE IF NOT EXISTS "phase4_deployment_configs" (
	"tenant_id" text PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'cloudrun' NOT NULL,
	"environment" text DEFAULT 'production' NOT NULL,
	"deployment_target" text DEFAULT 'cloudrun' NOT NULL,
	"build_settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase4_deployments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"environment" text DEFAULT 'production' NOT NULL,
	"release_version" text NOT NULL,
	"git_sha" text NOT NULL,
	"provider" text NOT NULL,
	"status" text DEFAULT 'NOT_CONFIGURED' NOT NULL,
	"logs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"initiated_by" text NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"failure_reason" text
);

CREATE TABLE IF NOT EXISTS "phase4_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"environment" text DEFAULT 'production' NOT NULL,
	"revision_id" text NOT NULL,
	"git_sha" text NOT NULL,
	"image_tag" text,
	"status" text DEFAULT 'active' NOT NULL,
	"is_known_good" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase4_release_gates" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"environment" text DEFAULT 'production' NOT NULL,
	"git_sha" text NOT NULL,
	"decision" text DEFAULT 'NO_GO' NOT NULL,
	"blocking_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"checks" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"evaluated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase4_health_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"environment" text DEFAULT 'production' NOT NULL,
	"endpoint" text NOT NULL,
	"status" text DEFAULT 'NOT_MEASURED' NOT NULL,
	"http_code" integer,
	"latency_ms" integer,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase4_migration_history" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"environment" text DEFAULT 'production' NOT NULL,
	"migration_name" text NOT NULL,
	"is_destructive" boolean DEFAULT false NOT NULL,
	"actor_id" text NOT NULL,
	"confirmed_by" text,
	"status" text DEFAULT 'APPLIED' NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase4_incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"environment" text DEFAULT 'production' NOT NULL,
	"failure_category" text NOT NULL,
	"summary" text NOT NULL,
	"evidence" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"remediation" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);

CREATE TABLE IF NOT EXISTS "phase4_rollbacks" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"environment" text DEFAULT 'production' NOT NULL,
	"target_revision_id" text NOT NULL,
	"from_revision_id" text NOT NULL,
	"reason" text NOT NULL,
	"initiated_by" text NOT NULL,
	"status" text DEFAULT 'EXECUTED' NOT NULL,
	"verification_result" text DEFAULT 'NOT_VERIFIED' NOT NULL,
	"executed_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase4_env_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"environment" text DEFAULT 'production' NOT NULL,
	"var_key" text NOT NULL,
	"status" text DEFAULT 'CONFIGURED' NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Tenant-scoped Indexes
CREATE INDEX IF NOT EXISTS "phase4_deployments_tenant_idx" ON "phase4_deployments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase4_deployments_status_idx" ON "phase4_deployments" ("status");
CREATE INDEX IF NOT EXISTS "phase4_revisions_tenant_idx" ON "phase4_revisions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase4_release_gates_tenant_idx" ON "phase4_release_gates" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase4_health_checks_tenant_idx" ON "phase4_health_checks" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase4_migration_history_tenant_idx" ON "phase4_migration_history" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase4_incidents_tenant_idx" ON "phase4_incidents" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase4_rollbacks_tenant_idx" ON "phase4_rollbacks" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "phase4_env_tenant_env_key_uniq" ON "phase4_env_configs" ("tenant_id", "environment", "var_key");
CREATE INDEX IF NOT EXISTS "phase4_env_tenant_idx" ON "phase4_env_configs" ("tenant_id");
