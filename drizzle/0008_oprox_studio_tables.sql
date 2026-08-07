CREATE TABLE IF NOT EXISTS "oprox_studio_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"org_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"framework" text DEFAULT 'react_tailwind' NOT NULL,
	"theme" text DEFAULT 'dark_modern' NOT NULL,
	"default_page_id" text DEFAULT 'page_main' NOT NULL,
	"active_revision_number" integer DEFAULT 1 NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_canvases" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"page_id" text NOT NULL,
	"page_name" text NOT NULL,
	"page_path" text NOT NULL,
	"ir" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"revision_number" integer DEFAULT 1 NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_design_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"tokens" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_components" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"name" text NOT NULL,
	"category" text DEFAULT 'CUSTOM' NOT NULL,
	"ir_node" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_global" boolean DEFAULT false NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_schemas" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"schema_model" jsonb DEFAULT '{"tables":[]}'::jsonb NOT NULL,
	"generated_drizzle_code" text,
	"updated_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_flows" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"flow_graph" jsonb DEFAULT '{"nodes":[],"edges":[]}'::jsonb NOT NULL,
	"updated_by" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"revision_number" integer NOT NULL,
	"author_id" text NOT NULL,
	"ir_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"change_summary" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_promotions" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"revision_number" integer NOT NULL,
	"target_branch" text DEFAULT 'feature/studio-build' NOT NULL,
	"change_request_id" text,
	"commit_sha" text,
	"status" text DEFAULT 'PROMOTED' NOT NULL,
	"promoted_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "studio_proj_tenant_idx" ON "oprox_studio_projects" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_proj_org_idx" ON "oprox_studio_projects" ("org_id");
CREATE INDEX IF NOT EXISTS "studio_canvas_tenant_idx" ON "oprox_studio_canvases" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_canvas_proj_idx" ON "oprox_studio_canvases" ("project_id");
CREATE UNIQUE INDEX IF NOT EXISTS "studio_canvas_proj_page_uniq" ON "oprox_studio_canvases" ("project_id", "page_id");
CREATE INDEX IF NOT EXISTS "studio_tokens_tenant_idx" ON "oprox_studio_design_tokens" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "studio_tokens_proj_uniq" ON "oprox_studio_design_tokens" ("project_id");
CREATE INDEX IF NOT EXISTS "studio_comp_tenant_idx" ON "oprox_studio_components" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_comp_proj_idx" ON "oprox_studio_components" ("project_id");
CREATE INDEX IF NOT EXISTS "studio_schema_tenant_idx" ON "oprox_studio_schemas" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "studio_schema_proj_uniq" ON "oprox_studio_schemas" ("project_id");
CREATE INDEX IF NOT EXISTS "studio_flow_tenant_idx" ON "oprox_studio_flows" ("tenant_id");
CREATE UNIQUE INDEX IF NOT EXISTS "studio_flow_proj_uniq" ON "oprox_studio_flows" ("project_id");
CREATE INDEX IF NOT EXISTS "studio_rev_tenant_idx" ON "oprox_studio_revisions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_rev_proj_idx" ON "oprox_studio_revisions" ("project_id");
CREATE UNIQUE INDEX IF NOT EXISTS "studio_rev_proj_num_uniq" ON "oprox_studio_revisions" ("project_id", "revision_number");
CREATE INDEX IF NOT EXISTS "studio_promo_tenant_idx" ON "oprox_studio_promotions" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_promo_proj_idx" ON "oprox_studio_promotions" ("project_id");
