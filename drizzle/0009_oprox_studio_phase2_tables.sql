CREATE TABLE IF NOT EXISTS "oprox_studio_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"filename" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"storage_url" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_data_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"name" text NOT NULL,
	"method" text DEFAULT 'GET' NOT NULL,
	"url" text NOT NULL,
	"headers_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"params_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"req_schema_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"res_schema_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oprox_studio_sync_provenance" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"project_id" text NOT NULL REFERENCES "oprox_studio_projects"("id") ON DELETE cascade,
	"file_path" text NOT NULL,
	"region_id" text NOT NULL,
	"region_type" text DEFAULT 'STUDIO_MANAGED' NOT NULL,
	"code_hash" text NOT NULL,
	"ir_hash" text NOT NULL,
	"last_synced_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "studio_assets_tenant_idx" ON "oprox_studio_assets" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_assets_proj_idx" ON "oprox_studio_assets" ("project_id");
CREATE INDEX IF NOT EXISTS "studio_ds_tenant_idx" ON "oprox_studio_data_sources" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_ds_proj_idx" ON "oprox_studio_data_sources" ("project_id");
CREATE INDEX IF NOT EXISTS "studio_sync_tenant_idx" ON "oprox_studio_sync_provenance" ("tenant_id");
CREATE INDEX IF NOT EXISTS "studio_sync_proj_idx" ON "oprox_studio_sync_provenance" ("project_id");
CREATE UNIQUE INDEX IF NOT EXISTS "studio_sync_file_region_uniq" ON "oprox_studio_sync_provenance" ("project_id", "file_path", "region_id");
