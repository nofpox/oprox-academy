CREATE TABLE IF NOT EXISTS "re_portfolios" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "name" text NOT NULL,
  "code" text,
  "description" text,
  "status" text DEFAULT 'active' NOT NULL,
  "created_by" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_properties" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "portfolio_id" text REFERENCES "re_portfolios"("id") ON DELETE SET NULL,
  "name" text NOT NULL,
  "type" text NOT NULL,
  "status" text DEFAULT 'DRAFT' NOT NULL,
  "description" text,
  "address_region" text,
  "address_city" text,
  "address_district" text,
  "address_street" text,
  "postal_code" text,
  "building_number" text,
  "additional_number" text,
  "latitude" numeric,
  "longitude" numeric,
  "total_area_sqm" numeric,
  "built_up_area_sqm" numeric,
  "year_built" integer,
  "total_units_count" integer DEFAULT 0 NOT NULL,
  "created_by" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_buildings" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "property_id" text NOT NULL REFERENCES "re_properties"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "code" text,
  "total_floors" integer DEFAULT 1 NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_floors" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "building_id" text NOT NULL REFERENCES "re_buildings"("id") ON DELETE CASCADE,
  "floor_number" integer NOT NULL,
  "name" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_units" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "property_id" text NOT NULL REFERENCES "re_properties"("id") ON DELETE CASCADE,
  "building_id" text REFERENCES "re_buildings"("id") ON DELETE SET NULL,
  "floor_id" text REFERENCES "re_floors"("id") ON DELETE SET NULL,
  "unit_number" text NOT NULL,
  "unit_type" text DEFAULT 'apartment' NOT NULL,
  "status" text DEFAULT 'AVAILABLE' NOT NULL,
  "area_sqm" numeric,
  "bedrooms" integer,
  "bathrooms" integer,
  "rent_price_sar" numeric,
  "sale_price_sar" numeric,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_owners" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "full_name" text NOT NULL,
  "owner_type" text DEFAULT 'INDIVIDUAL' NOT NULL,
  "national_id_or_cr" text,
  "email" text,
  "phone" text,
  "status" text DEFAULT 'active' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_property_owners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" text NOT NULL,
  "property_id" text NOT NULL REFERENCES "re_properties"("id") ON DELETE CASCADE,
  "owner_id" text NOT NULL REFERENCES "re_owners"("id") ON DELETE CASCADE,
  "ownership_percentage" numeric DEFAULT '100' NOT NULL,
  "is_primary_owner" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_amenities" (
  "id" text PRIMARY KEY NOT NULL,
  "tenant_id" text NOT NULL,
  "property_id" text NOT NULL REFERENCES "re_properties"("id") ON DELETE CASCADE,
  "amenity_name" text NOT NULL,
  "amenity_category" text DEFAULT 'general',
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_portfolios_tenant_idx" ON "re_portfolios" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_props_tenant_idx" ON "re_properties" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_props_portfolio_idx" ON "re_properties" ("portfolio_id");
CREATE INDEX IF NOT EXISTS "re_props_type_idx" ON "re_properties" ("type");
CREATE INDEX IF NOT EXISTS "re_props_status_idx" ON "re_properties" ("status");
CREATE INDEX IF NOT EXISTS "re_props_city_idx" ON "re_properties" ("address_city");
CREATE INDEX IF NOT EXISTS "re_bldgs_tenant_idx" ON "re_buildings" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_bldgs_prop_idx" ON "re_buildings" ("property_id");
CREATE INDEX IF NOT EXISTS "re_floors_tenant_idx" ON "re_floors" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_floors_bldg_idx" ON "re_floors" ("building_id");
CREATE INDEX IF NOT EXISTS "re_units_tenant_idx" ON "re_units" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_units_prop_idx" ON "re_units" ("property_id");
CREATE INDEX IF NOT EXISTS "re_units_bldg_idx" ON "re_units" ("building_id");
CREATE INDEX IF NOT EXISTS "re_units_floor_idx" ON "re_units" ("floor_id");
CREATE INDEX IF NOT EXISTS "re_units_status_idx" ON "re_units" ("status");
CREATE INDEX IF NOT EXISTS "re_owners_tenant_idx" ON "re_owners" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_prop_owners_tenant_idx" ON "re_property_owners" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_prop_owners_prop_idx" ON "re_property_owners" ("property_id");
CREATE INDEX IF NOT EXISTS "re_amenities_tenant_idx" ON "re_amenities" ("tenant_id");
