CREATE TABLE "ai_wallet_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"org_id" text,
	"reserved_micros" integer NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_wallet_reservations" ADD CONSTRAINT "ai_wallet_reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_wallet_reservations" ADD CONSTRAINT "ai_wallet_reservations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_wallet_reservations_user_idx" ON "ai_wallet_reservations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_wallet_reservations_status_idx" ON "ai_wallet_reservations" USING btree ("status");