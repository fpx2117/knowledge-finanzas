CREATE TYPE "public"."notification_category" AS ENUM('FINANCIAL', 'BILLING', 'SECURITY', 'ACCOUNT', 'PRODUCT');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('IN_APP', 'REALTIME', 'EMAIL', 'WHATSAPP');--> statement-breakpoint
CREATE TYPE "public"."notification_delivery_status" AS ENUM('PENDING', 'QUEUED', 'SENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."notification_subject_type" AS ENUM('DEBT', 'SCHEDULED_TRANSACTION', 'BUDGET', 'TRANSACTION', 'SUBSCRIPTION', 'NONE');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('DEBT_DUE_SOON', 'DEBT_OVERDUE', 'SCHEDULED_TRANSACTION_DUE', 'BUDGET_NEAR_LIMIT', 'BUDGET_EXCEEDED', 'CASHFLOW_LOW', 'CASHFLOW_NEGATIVE', 'WEEKLY_FINANCIAL_SUMMARY', 'MONTHLY_FINANCIAL_SUMMARY', 'SUBSCRIPTION_ACTIVATED', 'PAYMENT_FAILED', 'GRACE_PERIOD_STARTED', 'SUBSCRIPTION_CANCELLED', 'SUBSCRIPTION_EXPIRED', 'NEW_LOGIN', 'PASSWORD_CHANGED', 'EMAIL_CHANGED', 'SECURITY_SETTING_CHANGED', 'TRIAL_STARTED', 'TRIAL_ENDING', 'TRIAL_EXPIRED', 'ACCOUNT_EXPORT_READY', 'ACCOUNT_DELETION_REQUESTED', 'AI_CREDITS_LOW');--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_delivery_status" DEFAULT 'PENDING' NOT NULL,
	"provider" text,
	"provider_message_id" text,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_error_code" text,
	"queued_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_deliveries_attempt_count_check" CHECK ("notification_deliveries"."attempt_count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" "notification_type",
	"channel" "notification_channel" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"lead_time_minutes" integer,
	"quiet_hours_enabled" boolean DEFAULT false NOT NULL,
	"quiet_hours_start" varchar(5),
	"quiet_hours_end" varchar(5),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preferences_quiet_hours_start_check" CHECK ("notification_preferences"."quiet_hours_start" is null or "notification_preferences"."quiet_hours_start" ~ '^[0-2][0-9]:[0-5][0-9]$'),
	CONSTRAINT "notification_preferences_quiet_hours_end_check" CHECK ("notification_preferences"."quiet_hours_end" is null or "notification_preferences"."quiet_hours_end" ~ '^[0-2][0-9]:[0-5][0-9]$')
);
--> statement-breakpoint
CREATE TABLE "notification_whatsapp_consent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"phone_number" text,
	"opt_in_at" timestamp with time zone,
	"opt_out_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_whatsapp_consent_phone_format_check" CHECK ("notification_whatsapp_consent"."phone_number" is null or "notification_whatsapp_consent"."phone_number" ~ '^+[1-9][0-9]{6,14}$')
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"category" "notification_category" NOT NULL,
	"priority" "notification_priority" DEFAULT 'NORMAL' NOT NULL,
	"title_key" text NOT NULL,
	"body_key" text NOT NULL,
	"subject_type" "notification_subject_type" DEFAULT 'NONE' NOT NULL,
	"subject_id" uuid,
	"metadata" jsonb,
	"dedup_key" text,
	"scheduled_for" timestamp with time zone,
	"read_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_whatsapp_consent" ADD CONSTRAINT "notification_whatsapp_consent_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_deliveries_notification_idx" ON "notification_deliveries" USING btree ("notification_id");--> statement-breakpoint
CREATE INDEX "notification_deliveries_status_idx" ON "notification_deliveries" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_user_global_unique" ON "notification_preferences" USING btree ("user_id","channel") WHERE "notification_preferences"."notification_type" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_user_type_unique" ON "notification_preferences" USING btree ("user_id","notification_type","channel") WHERE "notification_preferences"."notification_type" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_whatsapp_consent_user_unique" ON "notification_whatsapp_consent" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_user_dedup_unique" ON "notifications" USING btree ("user_id","dedup_key") WHERE "notifications"."dedup_key" is not null;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_user_read_idx" ON "notifications" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE INDEX "notifications_user_subject_idx" ON "notifications" USING btree ("user_id","subject_type","subject_id");