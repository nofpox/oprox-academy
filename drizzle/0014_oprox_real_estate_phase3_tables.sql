-- OPROX Real Estate Phase 3 — CRM, Leads, Viewings, Offers & Reservations
CREATE TABLE IF NOT EXISTS "re_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"contact_id" text REFERENCES "re_contacts"("id") ON DELETE set null,
	"lead_number" text NOT NULL,
	"title" text NOT NULL,
	"source" text DEFAULT 'WEBSITE' NOT NULL,
	"status" text DEFAULT 'NEW' NOT NULL,
	"priority" text DEFAULT 'MEDIUM' NOT NULL,
	"budget_sar" numeric,
	"preferred_property_type" text,
	"preferred_city" text,
	"preferred_district" text,
	"notes" text,
	"assigned_agent_id" text,
	"lost_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_leads_tenant_idx" ON "re_leads" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_leads_contact_idx" ON "re_leads" ("contact_id");
CREATE INDEX IF NOT EXISTS "re_leads_status_idx" ON "re_leads" ("status");
CREATE INDEX IF NOT EXISTS "re_leads_source_idx" ON "re_leads" ("source");

CREATE TABLE IF NOT EXISTS "re_lead_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lead_id" text NOT NULL REFERENCES "re_leads"("id") ON DELETE cascade,
	"activity_type" text NOT NULL,
	"summary" text NOT NULL,
	"details" text,
	"actor_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_lead_act_tenant_idx" ON "re_lead_activities" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_lead_act_lead_idx" ON "re_lead_activities" ("lead_id");
CREATE INDEX IF NOT EXISTS "re_lead_act_type_idx" ON "re_lead_activities" ("activity_type");

CREATE TABLE IF NOT EXISTS "re_lead_property" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lead_id" text NOT NULL REFERENCES "re_leads"("id") ON DELETE cascade,
	"property_id" text REFERENCES "re_properties"("id") ON DELETE cascade,
	"unit_id" text REFERENCES "re_units"("id") ON DELETE cascade,
	"match_score" integer DEFAULT 100,
	"status" text DEFAULT 'SHORTLISTED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_lead_prop_tenant_idx" ON "re_lead_property" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_lead_prop_lead_idx" ON "re_lead_property" ("lead_id");
CREATE INDEX IF NOT EXISTS "re_lead_prop_unit_idx" ON "re_lead_property" ("unit_id");

CREATE TABLE IF NOT EXISTS "re_viewings" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lead_id" text NOT NULL REFERENCES "re_leads"("id") ON DELETE cascade,
	"property_id" text REFERENCES "re_properties"("id") ON DELETE cascade,
	"unit_id" text REFERENCES "re_units"("id") ON DELETE cascade,
	"scheduled_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"status" text DEFAULT 'SCHEDULED' NOT NULL,
	"feedback" text,
	"agent_rating" integer,
	"client_interest_level" text,
	"assigned_agent_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_viewings_tenant_idx" ON "re_viewings" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_viewings_lead_idx" ON "re_viewings" ("lead_id");
CREATE INDEX IF NOT EXISTS "re_viewings_status_idx" ON "re_viewings" ("status");

CREATE TABLE IF NOT EXISTS "re_offers" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lead_id" text NOT NULL REFERENCES "re_leads"("id") ON DELETE cascade,
	"property_id" text REFERENCES "re_properties"("id") ON DELETE cascade,
	"unit_id" text REFERENCES "re_units"("id") ON DELETE cascade,
	"offer_number" text NOT NULL,
	"offered_amount_sar" numeric NOT NULL,
	"deposit_amount_sar" numeric DEFAULT '0',
	"payment_frequency" text DEFAULT 'ANNUAL',
	"proposed_start_date" text,
	"proposed_end_date" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"counter_amount_sar" numeric,
	"special_terms" text,
	"valid_until" timestamp,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_offers_tenant_idx" ON "re_offers" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_offers_lead_idx" ON "re_offers" ("lead_id");
CREATE INDEX IF NOT EXISTS "re_offers_status_idx" ON "re_offers" ("status");

CREATE TABLE IF NOT EXISTS "re_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lead_id" text REFERENCES "re_leads"("id") ON DELETE set null,
	"offer_id" text REFERENCES "re_offers"("id") ON DELETE set null,
	"property_id" text REFERENCES "re_properties"("id") ON DELETE cascade,
	"unit_id" text NOT NULL REFERENCES "re_units"("id") ON DELETE cascade,
	"re_tenant_id" text REFERENCES "re_tenants"("id") ON DELETE set null,
	"reservation_number" text NOT NULL,
	"reservation_fee_sar" numeric NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"reserved_until" timestamp NOT NULL,
	"converted_lease_id" text REFERENCES "re_leases"("id") ON DELETE set null,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_reservations_tenant_idx" ON "re_reservations" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_reservations_unit_idx" ON "re_reservations" ("unit_id");
CREATE INDEX IF NOT EXISTS "re_reservations_status_idx" ON "re_reservations" ("status");
