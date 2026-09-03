CREATE TYPE "public"."recurring_series_status" AS ENUM('SUGGESTED', 'CONFIRMED', 'DISMISSED');--> statement-breakpoint
CREATE TABLE "recurring_series" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"merchant_id" uuid,
	"group_key" text NOT NULL,
	"label" text NOT NULL,
	"frequency" "recurring_transaction_frequency" NOT NULL,
	"typical_amount" numeric(20, 6) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"category_id" uuid,
	"occurrence_count" integer NOT NULL,
	"confidence" numeric(4, 3) NOT NULL,
	"last_seen_on" date NOT NULL,
	"next_expected_on" date NOT NULL,
	"status" "recurring_series_status" DEFAULT 'SUGGESTED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_series_confidence_range_check" CHECK ("recurring_series"."confidence" >= 0 and "recurring_series"."confidence" <= 1),
	CONSTRAINT "recurring_series_typical_amount_positive_check" CHECK ("recurring_series"."typical_amount" > 0)
);
--> statement-breakpoint
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_series" ADD CONSTRAINT "recurring_series_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "recurring_series_user_group_currency_unique" ON "recurring_series" USING btree ("user_id","group_key","currency_code");--> statement-breakpoint
CREATE INDEX "recurring_series_user_status_idx" ON "recurring_series" USING btree ("user_id","status");