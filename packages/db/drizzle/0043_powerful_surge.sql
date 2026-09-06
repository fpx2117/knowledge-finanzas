CREATE TYPE "public"."goal_allocation_kind" AS ENUM('INITIAL', 'CONTRIBUTION', 'WITHDRAWAL');--> statement-breakpoint
CREATE TABLE "goal_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"kind" "goal_allocation_kind" NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"occurred_on" date NOT NULL,
	"note" text,
	"account_id" uuid,
	"related_transaction_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goal_allocations_amount_positive_check" CHECK ("goal_allocations"."amount" > 0),
	CONSTRAINT "goal_allocations_currency_code_length_check" CHECK (char_length("goal_allocations"."currency_code") = 3)
);
--> statement-breakpoint
ALTER TABLE "goal_allocations" ADD CONSTRAINT "goal_allocations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_allocations" ADD CONSTRAINT "goal_allocations_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_allocations" ADD CONSTRAINT "goal_allocations_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_allocations" ADD CONSTRAINT "goal_allocations_related_transaction_id_transactions_id_fk" FOREIGN KEY ("related_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goal_allocations_goal_idx" ON "goal_allocations" USING btree ("goal_id","occurred_on");--> statement-breakpoint
CREATE INDEX "goal_allocations_user_idx" ON "goal_allocations" USING btree ("user_id");--> statement-breakpoint
-- WP-GOALS-ALLOC backfill: every goal with existing progress gets one INITIAL allocation so
-- `goals.current_amount` equals Σ allocations from now on (checkGoalAllocationConsistency).
INSERT INTO "goal_allocations" ("user_id", "goal_id", "kind", "amount", "currency_code", "occurred_on", "note")
SELECT "user_id", "id", 'INITIAL', "current_amount", "currency_code", ("created_at")::date, 'Progreso inicial (migración)'
FROM "goals"
WHERE "current_amount" > 0;
