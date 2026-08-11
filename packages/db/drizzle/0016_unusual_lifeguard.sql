CREATE TYPE "public"."billing_dispute_status" AS ENUM('OPEN', 'WON', 'LOST', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."billing_refund_reason" AS ENUM('DUPLICATE_CHARGE', 'SERVICE_FAILURE', 'FULL_SUBSCRIPTION_REVERSAL');--> statement-breakpoint
CREATE TYPE "public"."billing_refund_status" AS ENUM('PENDING', 'APPROVED', 'FAILED');--> statement-breakpoint
CREATE TABLE "billing_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"provider_dispute_id" text,
	"type" text NOT NULL,
	"status" "billing_dispute_status" DEFAULT 'OPEN' NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_disputes_amount_positive_check" CHECK ("billing_disputes"."amount" > 0),
	CONSTRAINT "billing_disputes_currency_code_length_check" CHECK (char_length("billing_disputes"."currency_code") = 3)
);
--> statement-breakpoint
CREATE TABLE "billing_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"provider_refund_id" text,
	"amount" numeric(20, 6) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"reason" "billing_refund_reason" NOT NULL,
	"status" "billing_refund_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by" uuid NOT NULL,
	"request_idempotency_key" text NOT NULL,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "billing_refunds_amount_positive_check" CHECK ("billing_refunds"."amount" > 0),
	CONSTRAINT "billing_refunds_currency_code_length_check" CHECK (char_length("billing_refunds"."currency_code") = 3)
);
--> statement-breakpoint
ALTER TABLE "billing_disputes" ADD CONSTRAINT "billing_disputes_payment_id_billing_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."billing_payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_refunds" ADD CONSTRAINT "billing_refunds_payment_id_billing_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."billing_payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_refunds" ADD CONSTRAINT "billing_refunds_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "billing_disputes_payment_idx" ON "billing_disputes" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "billing_disputes_status_idx" ON "billing_disputes" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_disputes_provider_dispute_unique" ON "billing_disputes" USING btree ("provider_dispute_id") WHERE "billing_disputes"."provider_dispute_id" is not null;--> statement-breakpoint
CREATE INDEX "billing_refunds_payment_idx" ON "billing_refunds" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "billing_refunds_status_idx" ON "billing_refunds" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_refunds_idempotency_key_unique" ON "billing_refunds" USING btree ("request_idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "billing_refunds_provider_refund_unique" ON "billing_refunds" USING btree ("provider_refund_id") WHERE "billing_refunds"."provider_refund_id" is not null;