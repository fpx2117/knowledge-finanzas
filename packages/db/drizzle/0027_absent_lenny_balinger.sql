CREATE TYPE "public"."goal_category" AS ENUM('EMERGENCY_FUND', 'TRAVEL', 'VEHICLE', 'HOME', 'EDUCATION', 'PURCHASE', 'INVESTMENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"category" "goal_category" DEFAULT 'OTHER' NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"target_amount" numeric(20, 6) NOT NULL,
	"current_amount" numeric(20, 6) DEFAULT '0' NOT NULL,
	"target_date" date,
	"status" "goal_status" DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"completed_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goals_target_amount_positive_check" CHECK ("goals"."target_amount" > 0),
	CONSTRAINT "goals_current_amount_nonneg_check" CHECK ("goals"."current_amount" >= 0),
	CONSTRAINT "goals_currency_code_length_check" CHECK (char_length("goals"."currency_code") = 3)
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "goals_user_status_idx" ON "goals" USING btree ("user_id","status");