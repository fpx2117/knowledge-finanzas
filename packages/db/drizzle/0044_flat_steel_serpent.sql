CREATE TYPE "public"."insight_confidence" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."insight_family" AS ENUM('INS-SPEND-DELTA', 'INS-SPEND-PACE', 'INS-BUDGET-LIMIT', 'INS-CASH-RISK', 'INS-OBL-DUE', 'INS-REC-AMOUNT', 'INS-REC-DETECT', 'INS-ANOMALY-AMOUNT', 'INS-GOAL-PACE', 'INS-DATA-QUALITY');--> statement-breakpoint
CREATE TYPE "public"."insight_feedback" AS ENUM('USEFUL', 'NOT_USEFUL', 'NOT_APPLICABLE', 'ALREADY_KNEW', 'WRONG_DATA');--> statement-breakpoint
CREATE TYPE "public"."insight_status" AS ENUM('DETECTED', 'ACTIVE', 'SEEN', 'DISMISSED', 'RESOLVED', 'EXPIRED', 'SUPERSEDED', 'INVALIDATED');--> statement-breakpoint
CREATE TABLE "insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"family" "insight_family" NOT NULL,
	"dedupe_key" text NOT NULL,
	"status" "insight_status" DEFAULT 'ACTIVE' NOT NULL,
	"confidence" "insight_confidence" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"impact_amount" numeric(20, 6),
	"impact_currency" varchar(3),
	"cta_label" text,
	"cta_href" text,
	"evidence" jsonb NOT NULL,
	"calculation_version" text NOT NULL,
	"feedback" "insight_feedback",
	"superseded_by_id" uuid,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	"seen_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "insights_impact_currency_pairing_check" CHECK (("insights"."impact_amount" is null) = ("insights"."impact_currency" is null))
);
--> statement-breakpoint
ALTER TABLE "insights" ADD CONSTRAINT "insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "insights_user_dedupe_unique" ON "insights" USING btree ("user_id","dedupe_key");--> statement-breakpoint
CREATE INDEX "insights_user_status_idx" ON "insights" USING btree ("user_id","status");