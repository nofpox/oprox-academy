CREATE TABLE IF NOT EXISTS "re_design_projects" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"project_type" text NOT NULL,
	"property_id" text,
	"unit_id" text,
	"listing_id" text,
	"developer_project_id" text,
	"studio_project_id" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"requirements_json" jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_design_concepts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"design_project_id" text NOT NULL,
	"concept_name" text NOT NULL,
	"concept_type" text NOT NULL,
	"version_number" integer DEFAULT 1 NOT NULL,
	"style" text,
	"space_planning_json" jsonb,
	"interior_details_json" jsonb,
	"exterior_details_json" jsonb,
	"renovation_details_json" jsonb,
	"rationale" text,
	"approval_status" text DEFAULT 'CONCEPTUAL' NOT NULL,
	"is_conceptual_notice" boolean DEFAULT true NOT NULL,
	"ai_generated" boolean DEFAULT true NOT NULL,
	"ai_model_used" text,
	"media_json" jsonb,
	"model3d_status" text DEFAULT 'NOT_CONFIGURED',
	"spatial_meta_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_investment_analyses" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"property_id" text,
	"listing_id" text,
	"purchase_price_sar" numeric NOT NULL,
	"area_sqm" numeric NOT NULL,
	"estimated_annual_rent_sar" numeric NOT NULL,
	"operating_expenses_annual_sar" numeric DEFAULT '0',
	"occupancy_rate_pct" numeric DEFAULT '95',
	"financing_percentage_pct" numeric DEFAULT '0',
	"mortgage_interest_rate_pct" numeric DEFAULT '0',
	"loan_tenure_years" integer DEFAULT 20,
	"calculated_metrics_json" jsonb NOT NULL,
	"comparable_properties_json" jsonb,
	"data_quality_status" text DEFAULT 'ACTUAL_AND_ESTIMATED' NOT NULL,
	"ai_analysis_summary" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
 ALTER TABLE "re_design_projects" ADD CONSTRAINT "re_design_projects_property_id_re_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."re_properties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "re_design_projects" ADD CONSTRAINT "re_design_projects_unit_id_re_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."re_units"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "re_design_projects" ADD CONSTRAINT "re_design_projects_listing_id_re_public_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."re_public_listings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "re_design_projects" ADD CONSTRAINT "re_design_projects_developer_project_id_re_projects_id_fk" FOREIGN KEY ("developer_project_id") REFERENCES "public"."re_projects"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "re_design_concepts" ADD CONSTRAINT "re_design_concepts_design_project_id_re_design_projects_id_fk" FOREIGN KEY ("design_project_id") REFERENCES "public"."re_design_projects"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "re_investment_analyses" ADD CONSTRAINT "re_investment_analyses_property_id_re_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."re_properties"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "re_investment_analyses" ADD CONSTRAINT "re_investment_analyses_listing_id_re_public_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."re_public_listings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "re_dp_tenant_idx" ON "re_design_projects" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_dp_user_idx" ON "re_design_projects" ("user_id");
CREATE INDEX IF NOT EXISTS "re_dp_property_idx" ON "re_design_projects" ("property_id");
CREATE INDEX IF NOT EXISTS "re_dp_type_idx" ON "re_design_projects" ("project_type");

CREATE INDEX IF NOT EXISTS "re_dc_tenant_idx" ON "re_design_concepts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_dc_project_idx" ON "re_design_concepts" ("design_project_id");
CREATE INDEX IF NOT EXISTS "re_dc_type_idx" ON "re_design_concepts" ("concept_type");

CREATE INDEX IF NOT EXISTS "re_inv_tenant_idx" ON "re_investment_analyses" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_inv_user_idx" ON "re_investment_analyses" ("user_id");
CREATE INDEX IF NOT EXISTS "re_inv_property_idx" ON "re_investment_analyses" ("property_id");
