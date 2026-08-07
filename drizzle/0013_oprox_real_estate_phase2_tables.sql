CREATE TABLE IF NOT EXISTS "re_contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"type" text DEFAULT 'INDIVIDUAL' NOT NULL,
	"full_name" text NOT NULL,
	"arabic_name" text,
	"mobile" text,
	"email" text,
	"national_id_or_iqama" text,
	"nationality" text,
	"preferred_language" text DEFAULT 'ar',
	"company_name" text,
	"cr_number" text,
	"vat_number" text,
	"authorized_rep" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_tenants" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"contact_id" text NOT NULL REFERENCES "re_contacts"("id") ON DELETE cascade,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"credit_rating" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_leases" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lease_number" text NOT NULL,
	"property_id" text NOT NULL REFERENCES "re_properties"("id") ON DELETE cascade,
	"re_tenant_id" text NOT NULL REFERENCES "re_tenants"("id") ON DELETE cascade,
	"lease_type" text DEFAULT 'RESIDENTIAL' NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"contract_value_sar" numeric NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"payment_frequency" text DEFAULT 'QUARTERLY' NOT NULL,
	"security_deposit_sar" numeric DEFAULT '0',
	"grace_period_days" integer DEFAULT 0,
	"renewal_option" boolean DEFAULT false,
	"notice_period_days" integer DEFAULT 30,
	"ejar_contract_number" text,
	"ejar_status" text DEFAULT 'NOT_CONFIGURED',
	"terms" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"created_by" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"activated_at" timestamp,
	"terminated_at" timestamp,
	"termination_reason" text,
	"parent_lease_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_lease_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"lease_id" text NOT NULL REFERENCES "re_leases"("id") ON DELETE cascade,
	"unit_id" text NOT NULL REFERENCES "re_units"("id") ON DELETE cascade,
	"allocated_rent_sar" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_lease_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lease_id" text NOT NULL REFERENCES "re_leases"("id") ON DELETE cascade,
	"installment_number" integer NOT NULL,
	"due_date" text NOT NULL,
	"amount_sar" numeric NOT NULL,
	"paid_amount_sar" numeric DEFAULT '0' NOT NULL,
	"outstanding_amount_sar" numeric NOT NULL,
	"status" text DEFAULT 'UPCOMING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_lease_charges" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lease_id" text NOT NULL REFERENCES "re_leases"("id") ON DELETE cascade,
	"schedule_id" text REFERENCES "re_lease_schedules"("id") ON DELETE set null,
	"charge_type" text NOT NULL,
	"description" text NOT NULL,
	"amount_sar" numeric NOT NULL,
	"paid_amount_sar" numeric DEFAULT '0' NOT NULL,
	"outstanding_amount_sar" numeric NOT NULL,
	"status" text DEFAULT 'DUE' NOT NULL,
	"invoice_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lease_id" text REFERENCES "re_leases"("id") ON DELETE set null,
	"re_tenant_id" text REFERENCES "re_tenants"("id") ON DELETE set null,
	"payment_number" text NOT NULL,
	"payment_date" text NOT NULL,
	"amount_sar" numeric NOT NULL,
	"unallocated_amount_sar" numeric NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"payment_method" text DEFAULT 'BANK_TRANSFER' NOT NULL,
	"provider_reference" text,
	"payment_status" text DEFAULT 'CONFIRMED' NOT NULL,
	"notes" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"payment_id" text NOT NULL REFERENCES "re_payments"("id") ON DELETE cascade,
	"charge_id" text REFERENCES "re_lease_charges"("id") ON DELETE set null,
	"schedule_id" text REFERENCES "re_lease_schedules"("id") ON DELETE set null,
	"allocated_amount_sar" numeric NOT NULL,
	"allocated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_security_deposits" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lease_id" text NOT NULL REFERENCES "re_leases"("id") ON DELETE cascade,
	"re_tenant_id" text NOT NULL REFERENCES "re_tenants"("id") ON DELETE cascade,
	"amount_sar" numeric NOT NULL,
	"held_amount_sar" numeric NOT NULL,
	"deductions_amount_sar" numeric DEFAULT '0',
	"refunded_amount_sar" numeric DEFAULT '0',
	"status" text DEFAULT 'REQUIRED' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_lease_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" text NOT NULL,
	"lease_id" text NOT NULL REFERENCES "re_leases"("id") ON DELETE cascade,
	"event_type" text NOT NULL,
	"actor_id" text NOT NULL,
	"notes" text,
	"event_data_json" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "re_lease_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"tenant_id" text NOT NULL,
	"lease_id" text NOT NULL REFERENCES "re_leases"("id") ON DELETE cascade,
	"document_type" text NOT NULL,
	"title" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "re_contacts_tenant_idx" ON "re_contacts" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_contacts_type_idx" ON "re_contacts" ("type");
CREATE INDEX IF NOT EXISTS "re_contacts_nat_id_idx" ON "re_contacts" ("national_id_or_iqama");
CREATE INDEX IF NOT EXISTS "re_contacts_cr_idx" ON "re_contacts" ("cr_number");
CREATE INDEX IF NOT EXISTS "re_contacts_status_idx" ON "re_contacts" ("status");

CREATE INDEX IF NOT EXISTS "re_tenants_tenant_idx" ON "re_tenants" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_tenants_contact_idx" ON "re_tenants" ("contact_id");
CREATE INDEX IF NOT EXISTS "re_tenants_status_idx" ON "re_tenants" ("status");

CREATE INDEX IF NOT EXISTS "re_leases_tenant_idx" ON "re_leases" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_leases_num_idx" ON "re_leases" ("lease_number");
CREATE INDEX IF NOT EXISTS "re_leases_prop_idx" ON "re_leases" ("property_id");
CREATE INDEX IF NOT EXISTS "re_leases_ret_idx" ON "re_leases" ("re_tenant_id");
CREATE INDEX IF NOT EXISTS "re_leases_status_idx" ON "re_leases" ("status");

CREATE INDEX IF NOT EXISTS "re_lease_units_tenant_idx" ON "re_lease_units" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_lease_units_lease_idx" ON "re_lease_units" ("lease_id");
CREATE INDEX IF NOT EXISTS "re_lease_units_unit_idx" ON "re_lease_units" ("unit_id");

CREATE INDEX IF NOT EXISTS "re_lease_sched_tenant_idx" ON "re_lease_schedules" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_lease_sched_lease_idx" ON "re_lease_schedules" ("lease_id");
CREATE INDEX IF NOT EXISTS "re_lease_sched_due_idx" ON "re_lease_schedules" ("due_date");
CREATE INDEX IF NOT EXISTS "re_lease_sched_status_idx" ON "re_lease_schedules" ("status");

CREATE INDEX IF NOT EXISTS "re_lease_charges_tenant_idx" ON "re_lease_charges" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_lease_charges_lease_idx" ON "re_lease_charges" ("lease_id");
CREATE INDEX IF NOT EXISTS "re_lease_charges_type_idx" ON "re_lease_charges" ("charge_type");
CREATE INDEX IF NOT EXISTS "re_lease_charges_status_idx" ON "re_lease_charges" ("status");

CREATE INDEX IF NOT EXISTS "re_payments_tenant_idx" ON "re_payments" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_payments_lease_idx" ON "re_payments" ("lease_id");
CREATE INDEX IF NOT EXISTS "re_payments_ret_idx" ON "re_payments" ("re_tenant_id");
CREATE INDEX IF NOT EXISTS "re_payments_num_idx" ON "re_payments" ("payment_number");
CREATE INDEX IF NOT EXISTS "re_payments_status_idx" ON "re_payments" ("payment_status");

CREATE INDEX IF NOT EXISTS "re_pay_alloc_tenant_idx" ON "re_payment_allocations" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_pay_alloc_payment_idx" ON "re_payment_allocations" ("payment_id");
CREATE INDEX IF NOT EXISTS "re_pay_alloc_charge_idx" ON "re_payment_allocations" ("charge_id");
CREATE INDEX IF NOT EXISTS "re_pay_alloc_sched_idx" ON "re_payment_allocations" ("schedule_id");

CREATE INDEX IF NOT EXISTS "re_sec_dep_tenant_idx" ON "re_security_deposits" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_sec_dep_lease_idx" ON "re_security_deposits" ("lease_id");
CREATE INDEX IF NOT EXISTS "re_sec_dep_ret_idx" ON "re_security_deposits" ("re_tenant_id");
CREATE INDEX IF NOT EXISTS "re_sec_dep_status_idx" ON "re_security_deposits" ("status");

CREATE INDEX IF NOT EXISTS "re_lease_events_tenant_idx" ON "re_lease_events" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_lease_events_lease_idx" ON "re_lease_events" ("lease_id");
CREATE INDEX IF NOT EXISTS "re_lease_events_type_idx" ON "re_lease_events" ("event_type");

CREATE INDEX IF NOT EXISTS "re_lease_docs_tenant_idx" ON "re_lease_documents" ("tenant_id");
CREATE INDEX IF NOT EXISTS "re_lease_docs_lease_idx" ON "re_lease_documents" ("lease_id");
CREATE INDEX IF NOT EXISTS "re_lease_docs_type_idx" ON "re_lease_documents" ("document_type");
