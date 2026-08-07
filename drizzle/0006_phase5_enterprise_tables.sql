-- Phase 5 Enterprise Collaboration, Governed Autonomy & Software Delivery Schema Migration

CREATE TABLE IF NOT EXISTS "phase5_teams" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase5_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text NOT NULL,
	"team_id" text,
	"project_id" text,
	"workspace_id" text,
	"roles" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase5_workspaces" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"org_id" text NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"owner_id" text NOT NULL,
	"environment" text DEFAULT 'development' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase5_change_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"org_id" text NOT NULL,
	"project_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"author_id" text NOT NULL,
	"author_type" text DEFAULT 'user' NOT NULL,
	"source_branch" text DEFAULT 'feature' NOT NULL,
	"target_branch" text DEFAULT 'main' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"files_changed" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"diff_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"risk_classification" text DEFAULT 'LOW' NOT NULL,
	"risk_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"ai_proposal_meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"content_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase5_approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"change_request_id" text NOT NULL,
	"approver_id" text NOT NULL,
	"approver_role" text,
	"decision" text NOT NULL,
	"comment" text,
	"policy_evaluated" text,
	"approved_content_hash" text NOT NULL,
	"status" text DEFAULT 'VALID' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase5_reviews_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"change_request_id" text NOT NULL,
	"author_id" text NOT NULL,
	"type" text DEFAULT 'comment' NOT NULL,
	"file_path" text,
	"line_number" integer,
	"content" text NOT NULL,
	"resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase5_code_owners" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"path_pattern" text NOT NULL,
	"owner_type" text NOT NULL,
	"owner_target" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase5_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"org_id" text NOT NULL,
	"project_id" text,
	"policy_type" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"activated_at" timestamp
);

CREATE TABLE IF NOT EXISTS "phase5_autonomy_config" (
	"tenant_id" text PRIMARY KEY NOT NULL,
	"autonomy_level" integer DEFAULT 2 NOT NULL,
	"allow_self_edit" boolean DEFAULT false NOT NULL,
	"max_ai_cost_per_task_usd" numeric(12, 2) DEFAULT '5.00' NOT NULL,
	"require_approval_for_high_risk" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase5_events" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"org_id" text NOT NULL,
	"project_id" text,
	"actor_id" text NOT NULL,
	"actor_type" text DEFAULT 'user' NOT NULL,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"risk" text DEFAULT 'LOW' NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "phase5_teams_tenant_idx" ON "phase5_teams" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase5_memberships_tenant_idx" ON "phase5_memberships" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase5_memberships_user_idx" ON "phase5_memberships" ("user_id");
CREATE INDEX IF NOT EXISTS "phase5_workspaces_tenant_idx" ON "phase5_workspaces" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase5_cr_tenant_idx" ON "phase5_change_requests" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase5_cr_status_idx" ON "phase5_change_requests" ("status");
CREATE INDEX IF NOT EXISTS "phase5_approvals_tenant_idx" ON "phase5_approvals" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase5_approvals_cr_idx" ON "phase5_approvals" ("change_request_id");
CREATE INDEX IF NOT EXISTS "phase5_comments_tenant_idx" ON "phase5_reviews_comments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase5_comments_cr_idx" ON "phase5_reviews_comments" ("change_request_id");
CREATE INDEX IF NOT EXISTS "phase5_code_owners_tenant_idx" ON "phase5_code_owners" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase5_policies_tenant_idx" ON "phase5_policies" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase5_events_tenant_idx" ON "phase5_events" ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase5_events_action_idx" ON "phase5_events" ("action");
