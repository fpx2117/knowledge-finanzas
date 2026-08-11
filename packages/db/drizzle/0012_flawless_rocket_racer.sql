CREATE TYPE "public"."ai_credit_entry_type" AS ENUM('TRIAL_GRANT', 'PLAN_GRANT', 'PURCHASE_GRANT', 'CONSUMPTION', 'REFUND', 'EXPIRATION', 'PROMOTIONAL_GRANT');--> statement-breakpoint
CREATE TYPE "public"."ai_credit_pool" AS ENUM('TRIAL_ALLOWANCE', 'PLAN_ALLOWANCE', 'PURCHASED');--> statement-breakpoint
CREATE TYPE "public"."ai_credit_reservation_status" AS ENUM('PENDING', 'COMMITTED', 'RELEASED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "ai_credit_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "ai_credit_entry_type" NOT NULL,
	"pool" "ai_credit_pool" NOT NULL,
	"amount" integer NOT NULL,
	"capability" text,
	"reference_id" text,
	"period_key" text,
	"expires_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_credit_entries_amount_positive_check" CHECK ("ai_credit_entries"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "ai_credit_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"capability" text NOT NULL,
	"pool" "ai_credit_pool" NOT NULL,
	"credits" integer NOT NULL,
	"operation_id" text NOT NULL,
	"status" "ai_credit_reservation_status" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"credit_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_credit_reservations_credits_positive_check" CHECK ("ai_credit_reservations"."credits" > 0)
);
--> statement-breakpoint
ALTER TABLE "ai_credit_entries" ADD CONSTRAINT "ai_credit_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_credit_reservations" ADD CONSTRAINT "ai_credit_reservations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_credit_reservations" ADD CONSTRAINT "ai_credit_reservations_credit_entry_id_ai_credit_entries_id_fk" FOREIGN KEY ("credit_entry_id") REFERENCES "public"."ai_credit_entries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_credit_entries_user_pool_idx" ON "ai_credit_entries" USING btree ("user_id","pool");--> statement-breakpoint
CREATE INDEX "ai_credit_entries_user_type_idx" ON "ai_credit_entries" USING btree ("user_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_credit_entries_trial_grant_unique" ON "ai_credit_entries" USING btree ("user_id") WHERE "ai_credit_entries"."type" = 'TRIAL_GRANT';--> statement-breakpoint
CREATE UNIQUE INDEX "ai_credit_entries_plan_grant_unique" ON "ai_credit_entries" USING btree ("user_id","reference_id") WHERE "ai_credit_entries"."type" = 'PLAN_GRANT';--> statement-breakpoint
CREATE UNIQUE INDEX "ai_credit_reservations_operation_unique" ON "ai_credit_reservations" USING btree ("operation_id");--> statement-breakpoint
CREATE INDEX "ai_credit_reservations_user_status_idx" ON "ai_credit_reservations" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "ai_credit_reservations_status_expires_idx" ON "ai_credit_reservations" USING btree ("status","expires_at");