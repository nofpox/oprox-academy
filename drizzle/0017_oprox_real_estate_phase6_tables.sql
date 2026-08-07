CREATE TABLE IF NOT EXISTS "re_immersive_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"linked_entity_type" text NOT NULL,
	"linked_entity_id" text NOT NULL,
	"asset_type" text NOT NULL,
	"title" text NOT NULL,
	"storage_reference" text NOT NULL,
	"mime_type" text,
	"file_size_bytes" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"processing_state" text DEFAULT 'READY' NOT NULL,
	"is_public_available" boolean DEFAULT true NOT NULL,
	"metadata_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_digital_twins" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"title" text NOT NULL,
	"linked_entity_type" text NOT NULL,
	"linked_entity_id" text NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"is_current_version" boolean DEFAULT true NOT NULL,
	"primary_model_asset_id" text,
	"floors_count" integer DEFAULT 1 NOT NULL,
	"spatial_metadata_json" jsonb NOT NULL,
	"design_project_id" text,
	"design_concept_id" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_vrar_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"session_type" text NOT NULL,
	"capability_state" text NOT NULL,
	"device_user_agent" text,
	"entity_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_ia_tenant_idx" ON "re_immersive_assets" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_ia_linked_idx" ON "re_immersive_assets" ("linked_entity_type", "linked_entity_id");
CREATE INDEX IF NOT EXISTS "re_ia_asset_type_idx" ON "re_immersive_assets" ("asset_type");

CREATE INDEX IF NOT EXISTS "re_dt_tenant_idx" ON "re_digital_twins" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_dt_linked_idx" ON "re_digital_twins" ("linked_entity_type", "linked_entity_id");
CREATE INDEX IF NOT EXISTS "re_dt_primary_asset_idx" ON "re_digital_twins" ("primary_model_asset_id");

CREATE INDEX IF NOT EXISTS "re_vrar_tenant_idx" ON "re_vrar_logs" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_vrar_user_idx" ON "re_vrar_logs" ("user_id");
CREATE INDEX IF NOT EXISTS "re_vrar_session_idx" ON "re_vrar_logs" ("session_type");

DO $$ BEGIN
 ALTER TABLE "re_digital_twins" ADD CONSTRAINT "re_digital_twins_primary_model_asset_id_re_immersive_assets_id_fk" FOREIGN KEY ("primary_model_asset_id") REFERENCES "re_immersive_assets"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "re_digital_twins" ADD CONSTRAINT "re_digital_twins_design_project_id_re_design_projects_id_fk" FOREIGN KEY ("design_project_id") REFERENCES "re_design_projects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "re_digital_twins" ADD CONSTRAINT "re_digital_twins_design_concept_id_re_design_concepts_id_fk" FOREIGN KEY ("design_concept_id") REFERENCES "re_design_concepts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
