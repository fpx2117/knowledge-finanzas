CREATE TYPE "public"."referral_attribution_status" AS ENUM('ATTRIBUTED', 'CONVERTED', 'INVALIDATED');--> statement-breakpoint
CREATE TYPE "public"."referral_code_status" AS ENUM('ACTIVE', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."referral_qualification_event" AS ENUM('FIRST_PAID_PRO_ACTIVATION');--> statement-breakpoint
CREATE TYPE "public"."referral_reward_status" AS ENUM('PENDING', 'GRANTED', 'FAILED', 'INVALIDATED');--> statement-breakpoint
CREATE TYPE "public"."referral_reward_type" AS ENUM('PROMOTIONAL_PRO_DAYS', 'AI_CREDITS');--> statement-breakpoint
ALTER TYPE "public"."ai_credit_entry_type" ADD VALUE 'REFERRAL_REWARD_GRANT';--> statement-breakpoint
ALTER TYPE "public"."promotional_access_grant_source" ADD VALUE 'REFERRAL_REWARD';--> statement-breakpoint
CREATE TABLE "referral_attributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_code_id" uuid NOT NULL,
	"referrer_user_id" uuid NOT NULL,
	"referred_user_id" uuid NOT NULL,
	"status" "referral_attribution_status" DEFAULT 'ATTRIBUTED' NOT NULL,
	"attributed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"converted_at" timestamp with time zone,
	"invalidated_at" timestamp with time zone,
	"invalidated_by" uuid,
	"invalidation_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "referral_attributions_no_self_referral_check" CHECK ("referral_attributions"."referrer_user_id" <> "referral_attributions"."referred_user_id")
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"code" text NOT NULL,
	"status" "referral_code_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_attribution_id" uuid NOT NULL,
	"beneficiary_user_id" uuid NOT NULL,
	"qualification_event" "referral_qualification_event" DEFAULT 'FIRST_PAID_PRO_ACTIVATION' NOT NULL,
	"type" "referral_reward_type" NOT NULL,
	"value" integer NOT NULL,
	"status" "referral_reward_status" DEFAULT 'PENDING' NOT NULL,
	"reward_policy_version" text NOT NULL,
	"grant_reference_id" text,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"granted_at" timestamp with time zone,
	CONSTRAINT "referral_rewards_value_positive_check" CHECK ("referral_rewards"."value" > 0)
);
--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_referral_code_id_referral_codes_id_fk" FOREIGN KEY ("referral_code_id") REFERENCES "public"."referral_codes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_referrer_user_id_users_id_fk" FOREIGN KEY ("referrer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_referred_user_id_users_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_attributions" ADD CONSTRAINT "referral_attributions_invalidated_by_users_id_fk" FOREIGN KEY ("invalidated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_referral_attribution_id_referral_attributions_id_fk" FOREIGN KEY ("referral_attribution_id") REFERENCES "public"."referral_attributions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_rewards" ADD CONSTRAINT "referral_rewards_beneficiary_user_id_users_id_fk" FOREIGN KEY ("beneficiary_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "referral_attributions_referred_user_unique" ON "referral_attributions" USING btree ("referred_user_id");--> statement-breakpoint
CREATE INDEX "referral_attributions_referrer_idx" ON "referral_attributions" USING btree ("referrer_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_codes_owner_unique" ON "referral_codes" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_codes_code_unique" ON "referral_codes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "referral_rewards_attribution_event_beneficiary_unique" ON "referral_rewards" USING btree ("referral_attribution_id","qualification_event","beneficiary_user_id");--> statement-breakpoint
CREATE INDEX "referral_rewards_beneficiary_idx" ON "referral_rewards" USING btree ("beneficiary_user_id");