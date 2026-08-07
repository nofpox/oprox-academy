CREATE TABLE IF NOT EXISTS "oprox_studio_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"page_id" text,
	"node_id" text,
	"revision_id" text,
	"author_id" text NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"parent_comment_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_experiments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"ir_snapshot_json" jsonb NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_sync_conflicts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"file_path" text NOT NULL,
	"base_hash" text NOT NULL,
	"studio_hash" text NOT NULL,
	"code_hash" text NOT NULL,
	"classification" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"resolution_strategy" text,
	"resolved_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);

CREATE TABLE IF NOT EXISTS "oprox_studio_reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"revision_id" text NOT NULL,
	"reviewer_id" text NOT NULL,
	"reviewer_name" text NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_promotion_traces" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL,
	"revision_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"git_branch" text NOT NULL,
	"commit_sha" text NOT NULL,
	"change_request_id" text NOT NULL,
	"ci_run_id" text NOT NULL,
	"status" text DEFAULT 'PROMOTED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "studio_cmt_tenant_idx" ON "oprox_studio_comments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_cmt_proj_idx" ON "oprox_studio_comments" ("project_id");
CREATE INDEX IF NOT EXISTS "studio_expm_tenant_idx" ON "oprox_studio_experiments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_expm_proj_idx" ON "oprox_studio_experiments" ("project_id");
CREATE INDEX IF NOT EXISTS "studio_cfl_tenant_idx" ON "oprox_studio_sync_conflicts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_cfl_proj_idx" ON "oprox_studio_sync_conflicts" ("project_id");
CREATE INDEX IF NOT EXISTS "studio_rev_tenant_idx" ON "oprox_studio_reviews" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_rev_proj_idx" ON "oprox_studio_reviews" ("project_id");
CREATE INDEX IF NOT EXISTS "studio_trc_tenant_idx" ON "oprox_studio_promotion_traces" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_trc_proj_idx" ON "oprox_studio_promotion_traces" ("project_id");
