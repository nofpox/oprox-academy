CREATE TABLE IF NOT EXISTS "oprox_studio_deployments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"revision_id" text NOT NULL,
	"environment" text DEFAULT 'staging' NOT NULL,
	"status" text DEFAULT 'BUILDING' NOT NULL,
	"public_url" text NOT NULL,
	"build_logs_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deployed_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_published_domains" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"deployment_id" text NOT NULL REFERENCES "oprox_studio_deployments"("id") ON DELETE cascade,
	"domain_name" text NOT NULL,
	"ssl_active" boolean DEFAULT true NOT NULL,
	"dns_status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_export_manifests" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"exported_files_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"checksum_hash" text NOT NULL,
	"exported_by" text NOT NULL,
	"exported_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "studio_dep_tenant_idx" ON "oprox_studio_deployments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_dep_proj_idx" ON "oprox_studio_deployments" ("project_id");
CREATE INDEX IF NOT EXISTS "studio_dom_tenant_idx" ON "oprox_studio_published_domains" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_dom_proj_idx" ON "oprox_studio_published_domains" ("project_id");
CREATE UNIQUE INDEX IF NOT EXISTS "studio_dom_name_uniq" ON "oprox_studio_published_domains" ("domain_name");
CREATE INDEX IF NOT EXISTS "studio_exp_tenant_idx" ON "oprox_studio_export_manifests" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_exp_proj_idx" ON "oprox_studio_export_manifests" ("project_id");
