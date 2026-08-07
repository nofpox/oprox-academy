CREATE TABLE "ai_model_pricing_metadata" (
	"model_id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"prompt_tokens_micros_per_1k" integer DEFAULT 150 NOT NULL,
	"completion_tokens_micros_per_1k" integer DEFAULT 600 NOT NULL,
	"customer_markup_multiplier" numeric(5, 2) DEFAULT '1.50' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dual_approval_requests" (
	"id" text PRIMARY KEY NOT NULL,
	"action_type" text NOT NULL,
	"requested_by" text NOT NULL,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"amount_micros" integer,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"first_approved_by" text,
	"first_approved_at" timestamp,
	"second_approved_by" text,
	"second_approved_at" timestamp,
	"executed_at" timestamp,
	"rejection_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_methods_config" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" text DEFAULT 'stripe' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"currency" text DEFAULT 'SAR' NOT NULL,
	"payment_method_type" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans_catalog" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"display_name" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"price_sar_halalas" integer,
	"price_usd_cents" integer,
	"billing_interval" text DEFAULT 'monthly' NOT NULL,
	"included_ai_micros" integer DEFAULT 0 NOT NULL,
	"feature_entitlements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_users" integer DEFAULT 10 NOT NULL,
	"upgrade_rules" jsonb DEFAULT '{"immediate":true}'::jsonb NOT NULL,
	"downgrade_rules" jsonb DEFAULT '{"atPeriodEnd":true}'::jsonb NOT NULL,
	"effective_date" timestamp,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "plans_catalog_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "local_invoices" ALTER COLUMN "currency" SET DEFAULT 'SAR';--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "sequential_number" text DEFAULT 'INV-2026-000001' NOT NULL;--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "invoice_type" text DEFAULT 'B2C_SIMPLIFIED_INVOICE' NOT NULL;--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "subtotal_halalas" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "vat_rate_bps" integer DEFAULT 1500 NOT NULL;--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "vat_amount_halalas" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "total_amount_halalas" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "seller_legal_name" text DEFAULT 'OPROX OS Ecosystem Ltd.';--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "seller_vat_number" text DEFAULT '310000000000003';--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "buyer_legal_name" text;--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "buyer_vat_number" text;--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "qr_code_payload" text;--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "structured_data" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "credit_note_ref" text;--> statement-breakpoint
ALTER TABLE "local_invoices" ADD COLUMN "debit_note_ref" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "legal_name" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "vat_number" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "cr_number" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "tax_identification_number" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "billing_address" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "country" text DEFAULT 'SA' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "scheduled_plan" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "scheduled_plan_effective_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "scheduled_plan_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "scheduled_plan_effective_at" timestamp;--> statement-breakpoint
ALTER TABLE "dual_approval_requests" ADD CONSTRAINT "dual_approval_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dual_approval_requests" ADD CONSTRAINT "dual_approval_requests_first_approved_by_users_id_fk" FOREIGN KEY ("first_approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dual_approval_requests" ADD CONSTRAINT "dual_approval_requests_second_approved_by_users_id_fk" FOREIGN KEY ("second_approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dual_approval_requested_by_idx" ON "dual_approval_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "dual_approval_status_idx" ON "dual_approval_requests" USING btree ("status");