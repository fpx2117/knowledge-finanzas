CREATE TYPE "public"."promotion_access_period_status" AS ENUM('ACTIVE', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."promotion_code_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."promotion_duration_unit" AS ENUM('DAYS');--> statement-breakpoint
CREATE TYPE "public"."promotion_redemption_status" AS ENUM('REDEEMED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."promotion_stacking_policy" AS ENUM('NOT_STACKABLE');--> statement-breakpoint
CREATE TYPE "public"."promotional_access_grant_source" AS ENUM('CODE_REDEMPTION', 'ADMIN_OVERRIDE', 'MANUAL_PROMOTION');--> statement-breakpoint
CREATE TYPE "public"."promotional_access_grant_status" AS ENUM('ACTIVE', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TABLE "promotion_access_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grant_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"sequence" integer NOT NULL,
	"status" "promotion_access_period_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotion_access_periods_range_check" CHECK ("promotion_access_periods"."ends_at" > "promotion_access_periods"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "promotion_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"normalized_code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"status" "promotion_code_status" DEFAULT 'DRAFT' NOT NULL,
	"access_level" text DEFAULT 'PRO' NOT NULL,
	"duration_value" integer NOT NULL,
	"duration_unit" "promotion_duration_unit" DEFAULT 'DAYS' NOT NULL,
	"redemption_starts_at" timestamp with time zone,
	"redemption_ends_at" timestamp with time zone,
	"max_redemptions" integer,
	"max_redemptions_per_user" integer DEFAULT 1 NOT NULL,
	"stacking_policy" "promotion_stacking_policy" DEFAULT 'NOT_STACKABLE' NOT NULL,
	"ai_credits_per_period" integer DEFAULT 0 NOT NULL,
	"whatsapp_messages_per_period" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotion_codes_duration_value_positive_check" CHECK ("promotion_codes"."duration_value" > 0),
	CONSTRAINT "promotion_codes_max_redemptions_positive_check" CHECK ("promotion_codes"."max_redemptions" is null or "promotion_codes"."max_redemptions" > 0),
	CONSTRAINT "promotion_codes_max_redemptions_per_user_positive_check" CHECK ("promotion_codes"."max_redemptions_per_user" > 0),
	CONSTRAINT "promotion_codes_redemption_window_check" CHECK ("promotion_codes"."redemption_starts_at" is null or "promotion_codes"."redemption_ends_at" is null or "promotion_codes"."redemption_ends_at" > "promotion_codes"."redemption_starts_at")
);
--> statement-breakpoint
CREATE TABLE "promotion_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"promotion_code_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "promotion_redemption_status" DEFAULT 'REDEEMED' NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"grant_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotional_access_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"promotion_code_id" uuid,
	"redemption_id" uuid,
	"access_level" text DEFAULT 'PRO' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "promotional_access_grant_status" DEFAULT 'ACTIVE' NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_by" uuid,
	"revocation_reason" text,
	"source" "promotional_access_grant_source" NOT NULL,
	"ai_credits_per_period" integer DEFAULT 0 NOT NULL,
	"whatsapp_messages_per_period" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promotional_access_grants_period_check" CHECK ("promotional_access_grants"."ends_at" > "promotional_access_grants"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "promotion_access_periods" ADD CONSTRAINT "promotion_access_periods_grant_id_promotional_access_grants_id_fk" FOREIGN KEY ("grant_id") REFERENCES "public"."promotional_access_grants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_codes" ADD CONSTRAINT "promotion_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_promotion_code_id_promotion_codes_id_fk" FOREIGN KEY ("promotion_code_id") REFERENCES "public"."promotion_codes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_redemptions" ADD CONSTRAINT "promotion_redemptions_grant_id_promotional_access_grants_id_fk" FOREIGN KEY ("grant_id") REFERENCES "public"."promotional_access_grants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotional_access_grants" ADD CONSTRAINT "promotional_access_grants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotional_access_grants" ADD CONSTRAINT "promotional_access_grants_promotion_code_id_promotion_codes_id_fk" FOREIGN KEY ("promotion_code_id") REFERENCES "public"."promotion_codes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotional_access_grants" ADD CONSTRAINT "promotional_access_grants_redemption_id_promotion_redemptions_id_fk" FOREIGN KEY ("redemption_id") REFERENCES "public"."promotion_redemptions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotional_access_grants" ADD CONSTRAINT "promotional_access_grants_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "promotion_access_periods_grant_idx" ON "promotion_access_periods" USING btree ("grant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "promotion_access_periods_grant_sequence_unique" ON "promotion_access_periods" USING btree ("grant_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "promotion_codes_normalized_code_unique" ON "promotion_codes" USING btree ("normalized_code");--> statement-breakpoint
CREATE INDEX "promotion_codes_status_idx" ON "promotion_codes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "promotion_redemptions_promotion_code_idx" ON "promotion_redemptions" USING btree ("promotion_code_id");--> statement-breakpoint
CREATE INDEX "promotion_redemptions_user_idx" ON "promotion_redemptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "promotional_access_grants_user_idx" ON "promotional_access_grants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "promotional_access_grants_ends_at_idx" ON "promotional_access_grants" USING btree ("ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "promotional_access_grants_user_active_unique" ON "promotional_access_grants" USING btree ("user_id") WHERE "promotional_access_grants"."status" = 'ACTIVE';