ALTER TYPE "public"."notification_type" ADD VALUE 'REFERRAL_SIGNUP';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'REFERRAL_REWARD_GRANTED';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "signup_referral_code" text;