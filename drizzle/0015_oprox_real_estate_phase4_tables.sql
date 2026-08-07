-- OPROX Real Estate Phase 4 — PropTech Marketplace & Smart Discovery SQL Schema
CREATE TABLE IF NOT EXISTS "re_developers" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "logo_url" text,
  "cover_image_url" text,
  "description" text,
  "website" text,
  "contact_email" text,
  "contact_phone" text,
  "established_year" integer,
  "headquarters_city" text,
  "verified" boolean DEFAULT false NOT NULL,
  "rating" real DEFAULT 4.8,
  "total_projects" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_devs_tenant_idx" ON "re_developers" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_devs_slug_idx" ON "re_developers" ("slug");
CREATE INDEX IF NOT EXISTS "re_devs_verified_idx" ON "re_developers" ("verified");

CREATE TABLE IF NOT EXISTS "re_projects" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "developer_id" text REFERENCES "re_developers"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "description" text,
  "city" text NOT NULL,
  "district" text NOT NULL,
  "latitude" real,
  "longitude" real,
  "master_plan_url" text,
  "cover_image_url" text,
  "gallery_urls" jsonb DEFAULT '[]'::jsonb,
  "completion_status" text DEFAULT 'UNDER_CONSTRUCTION' NOT NULL,
  "completion_year" integer,
  "starting_price_sar" numeric,
  "total_units" integer DEFAULT 0,
  "available_units" integer DEFAULT 0,
  "amenities" jsonb DEFAULT '[]'::jsonb,
  "construction_progress_pct" integer DEFAULT 0,
  "featured" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_projects_tenant_idx" ON "re_projects" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_projects_dev_idx" ON "re_projects" ("developer_id");
CREATE INDEX IF NOT EXISTS "re_projects_slug_idx" ON "re_projects" ("slug");
CREATE INDEX IF NOT EXISTS "re_projects_city_idx" ON "re_projects" ("city");
CREATE INDEX IF NOT EXISTS "re_projects_status_idx" ON "re_projects" ("completion_status");
CREATE INDEX IF NOT EXISTS "re_projects_featured_idx" ON "re_projects" ("featured");

CREATE TABLE IF NOT EXISTS "re_public_listings" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "property_id" text REFERENCES "re_properties"("id") ON DELETE SET NULL,
  "project_id" text REFERENCES "re_projects"("id") ON DELETE SET NULL,
  "developer_id" text REFERENCES "re_developers"("id") ON DELETE SET NULL,
  "listing_number" text NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "listing_type" text NOT NULL,
  "category" text DEFAULT 'RESIDENTIAL' NOT NULL,
  "property_type" text NOT NULL,
  "price_sar" numeric NOT NULL,
  "rent_frequency" text,
  "city" text NOT NULL,
  "district" text NOT NULL,
  "address" text,
  "latitude" real,
  "longitude" real,
  "bedrooms" integer DEFAULT 0,
  "bathrooms" integer DEFAULT 0,
  "area_sqm" numeric,
  "furnished" text DEFAULT 'UNFURNISHED',
  "amenities" jsonb DEFAULT '[]'::jsonb,
  "cover_image_url" text,
  "gallery_urls" jsonb DEFAULT '[]'::jsonb,
  "video_url" text,
  "floor_plan_url" text,
  "virtual_tour_360_url" text,
  "completion_status" text DEFAULT 'READY',
  "status" text DEFAULT 'PUBLISHED' NOT NULL,
  "featured" boolean DEFAULT false NOT NULL,
  "view_count" integer DEFAULT 0,
  "inquiry_count" integer DEFAULT 0,
  "ai_generated_description" text,
  "meta_title" text,
  "meta_description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_listings_tenant_idx" ON "re_public_listings" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_listings_slug_idx" ON "re_public_listings" ("slug");
CREATE INDEX IF NOT EXISTS "re_listings_type_idx" ON "re_public_listings" ("listing_type");
CREATE INDEX IF NOT EXISTS "re_listings_category_idx" ON "re_public_listings" ("category");
CREATE INDEX IF NOT EXISTS "re_listings_proptype_idx" ON "re_public_listings" ("property_type");
CREATE INDEX IF NOT EXISTS "re_listings_city_idx" ON "re_public_listings" ("city");
CREATE INDEX IF NOT EXISTS "re_listings_status_idx" ON "re_public_listings" ("status");
CREATE INDEX IF NOT EXISTS "re_listings_featured_idx" ON "re_public_listings" ("featured");
CREATE INDEX IF NOT EXISTS "re_listings_proj_idx" ON "re_public_listings" ("project_id");

CREATE TABLE IF NOT EXISTS "re_saved_searches" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "user_id" text NOT NULL,
  "title" text NOT NULL,
  "filters_json" jsonb NOT NULL,
  "notify_email" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_saved_srch_tenant_idx" ON "re_saved_searches" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_saved_srch_user_idx" ON "re_saved_searches" ("user_id");

CREATE TABLE IF NOT EXISTS "re_favorites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL,
  "user_id" text NOT NULL,
  "listing_id" text REFERENCES "re_public_listings"("id") ON DELETE CASCADE NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "re_favorites_user_listing_uniq" UNIQUE ("user_id", "listing_id")
);

CREATE INDEX IF NOT EXISTS "re_favorites_tenant_idx" ON "re_favorites" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_favorites_user_idx" ON "re_favorites" ("user_id");

CREATE TABLE IF NOT EXISTS "re_inquiries" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "listing_id" text REFERENCES "re_public_listings"("id") ON DELETE SET NULL,
  "project_id" text REFERENCES "re_projects"("id") ON DELETE SET NULL,
  "developer_id" text REFERENCES "re_developers"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "message" text,
  "inquiry_type" text DEFAULT 'BUY',
  "preferred_contact_method" text DEFAULT 'PHONE',
  "status" text DEFAULT 'NEW' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_inquiries_tenant_idx" ON "re_inquiries" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_inquiries_listing_idx" ON "re_inquiries" ("listing_id");
CREATE INDEX IF NOT EXISTS "re_inquiries_project_idx" ON "re_inquiries" ("project_id");
CREATE INDEX IF NOT EXISTS "re_inquiries_status_idx" ON "re_inquiries" ("status");

CREATE TABLE IF NOT EXISTS "re_ai_valuations" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "user_id" text NOT NULL,
  "city" text NOT NULL,
  "district" text NOT NULL,
  "property_type" text NOT NULL,
  "area_sqm" numeric NOT NULL,
  "bedrooms" integer,
  "estimated_price_min_sar" numeric NOT NULL,
  "estimated_price_max_sar" numeric NOT NULL,
  "estimated_price_avg_sar" numeric NOT NULL,
  "estimated_price_per_sqm_sar" numeric NOT NULL,
  "confidence_score_pct" integer NOT NULL,
  "comparable_count" integer NOT NULL,
  "market_trend" text,
  "ai_analysis_summary" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_ai_val_tenant_idx" ON "re_ai_valuations" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_ai_val_user_idx" ON "re_ai_valuations" ("user_id");
