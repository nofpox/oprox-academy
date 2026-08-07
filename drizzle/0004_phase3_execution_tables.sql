-- Phase 3 Execution Tables Migration
CREATE TABLE IF NOT EXISTS "phase3_project_configs" (
	"tenant_id" text PRIMARY KEY NOT NULL,
	"project_name" text NOT NULL,
	"description" text,
	"template" text NOT NULL,
	"architecture" text NOT NULL,
	"tech_stack" text NOT NULL,
	"database" text NOT NULL,
	"auth" text NOT NULL,
	"deployment_target" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase3_generated_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"path" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase3_shared_context" (
	"tenant_id" text PRIMARY KEY NOT NULL,
	"architecture_doc" text NOT NULL,
	"db_schema_state" text NOT NULL,
	"active_endpoints" text NOT NULL,
	"frontend_views" text NOT NULL,
	"qa_pass_rate" text NOT NULL,
	"security_audit" text NOT NULL,
	"container_state" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase3_agent_handoffs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"from_agent" text NOT NULL,
	"to_agent" text NOT NULL,
	"task_title" text NOT NULL,
	"output_summary" text NOT NULL,
	"full_output" text,
	"timestamp" text NOT NULL,
	"status" text DEFAULT 'passed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase3_pipeline_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"assigned_agent" text NOT NULL,
	"execution_type" text DEFAULT 'GENERIC' NOT NULL,
	"dependencies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"input" text,
	"output" text,
	"error" text,
	"completed_at" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase3_releases" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"version" text NOT NULL,
	"semver_type" text DEFAULT 'minor' NOT NULL,
	"release_notes" text NOT NULL,
	"readiness_score" integer DEFAULT 0 NOT NULL,
	"go_no_go" text DEFAULT 'NO-GO' NOT NULL,
	"checklist" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'approved' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "phase3_lifecycle" (
	"tenant_id" text PRIMARY KEY NOT NULL,
	"current_stage" text DEFAULT 'idea' NOT NULL,
	"stage_outputs" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "phase3_generated_files_tenant_idx" ON "phase3_generated_files" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase3_agent_handoffs_tenant_idx" ON "phase3_agent_handoffs" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase3_pipeline_tasks_tenant_idx" ON "phase3_pipeline_tasks" USING btree ("tenant_id");
CREATE INDEX IF NOT EXISTS "phase3_releases_tenant_idx" ON "phase3_releases" USING btree ("tenant_id");
