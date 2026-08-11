CREATE TYPE "public"."billing_interval" AS ENUM('MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."billing_payment_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."billing_period_status" AS ENUM('PENDING', 'ACTIVE', 'CLOSED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."billing_provider" AS ENUM('MERCADO_PAGO');--> statement-breakpoint
CREATE TYPE "public"."billing_subscription_status" AS ENUM('PENDING', 'ACTIVE', 'PAST_DUE', 'PAUSED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."billing_webhook_event_status" AS ENUM('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED');--> statement-breakpoint
CREATE TABLE "billing_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid NOT NULL,
	"billing_period_id" uuid,
	"provider_payment_id" text,
	"status" "billing_payment_status" DEFAULT 'PENDING' NOT NULL,
	"gross_amount" numeric(20, 6) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"provider_fee" numeric(20, 6),
	"net_amount" numeric(20, 6),
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_payments_gross_amount_positive_check" CHECK ("billing_payments"."gross_amount" > 0),
	CONSTRAINT "billing_payments_currency_code_length_check" CHECK (char_length("billing_payments"."currency_code") = 3)
);
--> statement-breakpoint
CREATE TABLE "billing_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" "billing_period_status" DEFAULT 'PENDING' NOT NULL,
	"provider_reference" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_periods_range_check" CHECK ("billing_periods"."ends_at" > "billing_periods"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "billing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"price" numeric(20, 6) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"billing_interval" "billing_interval" DEFAULT 'MONTHLY' NOT NULL,
	"provider" "billing_provider" DEFAULT 'MERCADO_PAGO' NOT NULL,
	"provider_plan_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_plans_price_positive_check" CHECK ("billing_plans"."price" > 0),
	CONSTRAINT "billing_plans_currency_code_length_check" CHECK (char_length("billing_plans"."currency_code") = 3)
);
--> statement-breakpoint
CREATE TABLE "billing_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"provider" "billing_provider" DEFAULT 'MERCADO_PAGO' NOT NULL,
	"provider_subscription_id" text,
	"provider_payload_version" text,
	"status" "billing_subscription_status" DEFAULT 'PENDING' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_subscriptions_period_check" CHECK ("billing_subscriptions"."current_period_end" is null or "billing_subscriptions"."current_period_start" is null or "billing_subscriptions"."current_period_end" > "billing_subscriptions"."current_period_start")
);
--> statement-breakpoint
CREATE TABLE "billing_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "billing_provider" DEFAULT 'MERCADO_PAGO' NOT NULL,
	"provider_event_id" text,
	"event_type" text NOT NULL,
	"external_resource_id" text,
	"payload_hash" text NOT NULL,
	"status" "billing_webhook_event_status" DEFAULT 'RECEIVED' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"error_code" text
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trial_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trial_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_payments" ADD CONSTRAINT "billing_payments_billing_period_id_billing_periods_id_fk" FOREIGN KEY ("billing_period_id") REFERENCES "public"."billing_periods"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_periods" ADD CONSTRAINT "billing_periods_subscription_id_billing_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."billing_subscriptions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_plan_id_billing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."billing_plans"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_payments_user_idx" ON "billing_payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "billing_payments_subscription_idx" ON "billing_payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_payments_provider_payment_unique" ON "billing_payments" USING btree ("provider_payment_id") WHERE "billing_payments"."provider_payment_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_periods_subscription_range_unique" ON "billing_periods" USING btree ("subscription_id","starts_at","ends_at");--> statement-breakpoint
CREATE INDEX "billing_periods_subscription_idx" ON "billing_periods" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "billing_periods_range_idx" ON "billing_periods" USING btree ("starts_at","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_plans_code_unique" ON "billing_plans" USING btree ("code");--> statement-breakpoint
CREATE INDEX "billing_plans_active_idx" ON "billing_plans" USING btree ("active");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_user_idx" ON "billing_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "billing_subscriptions_status_idx" ON "billing_subscriptions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscriptions_provider_subscription_unique" ON "billing_subscriptions" USING btree ("provider_subscription_id") WHERE "billing_subscriptions"."provider_subscription_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "billing_subscriptions_user_effective_unique" ON "billing_subscriptions" USING btree ("user_id") WHERE "billing_subscriptions"."status" in ('PENDING', 'ACTIVE', 'PAST_DUE');--> statement-breakpoint
CREATE UNIQUE INDEX "billing_webhook_events_provider_event_unique" ON "billing_webhook_events" USING btree ("provider","provider_event_id") WHERE "billing_webhook_events"."provider_event_id" is not null;--> statement-breakpoint
CREATE INDEX "billing_webhook_events_provider_hash_idx" ON "billing_webhook_events" USING btree ("provider","payload_hash");--> statement-breakpoint
CREATE INDEX "billing_webhook_events_status_idx" ON "billing_webhook_events" USING btree ("status");