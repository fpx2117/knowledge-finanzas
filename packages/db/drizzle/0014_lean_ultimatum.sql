ALTER TABLE "billing_subscriptions" ADD COLUMN "cancellation_reason_code" text;--> statement-breakpoint
ALTER TABLE "billing_subscriptions" ADD COLUMN "cancellation_reason_comment" text;