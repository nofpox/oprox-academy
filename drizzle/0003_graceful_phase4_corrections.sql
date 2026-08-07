-- Correction 2 & 3: Invoice Sequences Table & Unique Invoice Sequential Numbering
CREATE TABLE IF NOT EXISTS "invoice_sequences" (
	"year" integer PRIMARY KEY NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL
);

-- Backfill unique sequential numbers for existing rows if needed before enforcing UNIQUE constraint
DO $$
BEGIN
  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
    FROM local_invoices
    WHERE sequential_number = 'INV-2026-000001'
  )
  UPDATE local_invoices
  SET sequential_number = 'INV-2026-' || LPAD(numbered.rn::text, 6, '0')
  FROM numbered
  WHERE local_invoices.id = numbered.id AND numbered.rn > 1;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'local_invoices_sequential_number_unique'
  ) THEN
    ALTER TABLE "local_invoices" ADD CONSTRAINT "local_invoices_sequential_number_unique" UNIQUE ("sequential_number");
  END IF;
END $$;

-- Correction 4: Billing Webhook Idempotency Unique Constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'billing_events_stripe_event_id_unique'
  ) THEN
    ALTER TABLE "billing_events" ADD CONSTRAINT "billing_events_stripe_event_id_unique" UNIQUE ("stripe_event_id");
  END IF;
END $$;
