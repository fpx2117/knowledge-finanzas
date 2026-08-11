CREATE TABLE "analytics_cohort_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"period" text NOT NULL,
	"region_bucket" text NOT NULL,
	"age_bucket" text NOT NULL,
	"income_bucket" text NOT NULL,
	"employment_bucket" text NOT NULL,
	"metric_code" text NOT NULL,
	"cohort_size_bucket" text NOT NULL,
	"suppressed" boolean NOT NULL,
	"median_value" numeric(20, 6),
	"p25_value" numeric(20, 6),
	"p75_value" numeric(20, 6),
	"privacy_version" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_consent_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"action" text NOT NULL,
	"policy_version" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analytics_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"status" text NOT NULL,
	"policy_version" text NOT NULL,
	"granted_at" timestamp with time zone,
	"withdrawn_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_statistical_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"age_range" text,
	"employment_status" text,
	"income_range" text,
	"household_size_range" text,
	"region_code" text,
	"prompt_dismissed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_consent_history" ADD CONSTRAINT "analytics_consent_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_consents" ADD CONSTRAINT "analytics_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_statistical_profiles" ADD CONSTRAINT "user_statistical_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_cohort_metrics_cohort_metric_unique" ON "analytics_cohort_metrics" USING btree ("period","region_bucket","age_bucket","income_bucket","employment_bucket","metric_code");--> statement-breakpoint
CREATE INDEX "analytics_cohort_metrics_period_idx" ON "analytics_cohort_metrics" USING btree ("period");--> statement-breakpoint
CREATE INDEX "analytics_consent_history_user_purpose_idx" ON "analytics_consent_history" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_consents_user_purpose_unique" ON "analytics_consents" USING btree ("user_id","purpose");