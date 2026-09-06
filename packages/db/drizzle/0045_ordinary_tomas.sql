CREATE TYPE "public"."preference_capture_mode" AS ENUM('QUICK', 'FULL');--> statement-breakpoint
CREATE TYPE "public"."preference_report_period" AS ENUM('THIS_MONTH', 'LAST_MONTH', 'LAST_30_DAYS');--> statement-breakpoint
CREATE TYPE "public"."preference_theme" AS ENUM('SYSTEM', 'LIGHT', 'DARK');--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"theme" "preference_theme" DEFAULT 'SYSTEM' NOT NULL,
	"default_report_period" "preference_report_period" DEFAULT 'THIS_MONTH' NOT NULL,
	"week_starts_on" integer DEFAULT 1 NOT NULL,
	"show_cents" boolean DEFAULT true NOT NULL,
	"compact_large_numbers" boolean DEFAULT true NOT NULL,
	"remember_last_account" boolean DEFAULT true NOT NULL,
	"remember_last_category" boolean DEFAULT true NOT NULL,
	"capture_mode" "preference_capture_mode" DEFAULT 'QUICK' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_week_starts_on_check" CHECK ("user_preferences"."week_starts_on" in (0, 1))
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;