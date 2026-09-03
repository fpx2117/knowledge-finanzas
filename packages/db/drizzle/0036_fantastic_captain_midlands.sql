CREATE TYPE "public"."subscription_status" AS ENUM('ACTIVE', 'INACTIVE', 'DISMISSED');--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"label" text NOT NULL,
	"frequency" "recurring_transaction_frequency" NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"current_amount" numeric(20, 6) NOT NULL,
	"price_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"category_id" uuid,
	"first_charged_on" date NOT NULL,
	"last_charged_on" date NOT NULL,
	"next_expected_on" date NOT NULL,
	"charge_count" integer NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"status" "subscription_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_current_amount_positive_check" CHECK ("subscriptions"."current_amount" > 0),
	CONSTRAINT "subscriptions_confidence_range_check" CHECK ("subscriptions"."confidence" >= 0 and "subscriptions"."confidence" <= 1)
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_user_merchant_currency_unique" ON "subscriptions" USING btree ("user_id","merchant_id","currency_code");--> statement-breakpoint
CREATE INDEX "subscriptions_user_status_idx" ON "subscriptions" USING btree ("user_id","status");