CREATE TYPE "public"."budget_period" AS ENUM('MONTHLY');--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text,
	"currency_code" varchar(3) NOT NULL,
	"period" "budget_period" DEFAULT 'MONTHLY' NOT NULL,
	"limit_amount" numeric(20, 6) NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"rollover" boolean DEFAULT false NOT NULL,
	"status" "entity_status" DEFAULT 'ACTIVE' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "budgets_limit_amount_positive_check" CHECK ("budgets"."limit_amount" > 0),
	CONSTRAINT "budgets_currency_code_length_check" CHECK (char_length("budgets"."currency_code") = 3),
	CONSTRAINT "budgets_end_date_check" CHECK ("budgets"."end_date" is null or "budgets"."end_date" >= "budgets"."start_date")
);
--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budgets_user_status_idx" ON "budgets" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "budgets_user_category_status_idx" ON "budgets" USING btree ("user_id","category_id","status");--> statement-breakpoint
CREATE INDEX "budgets_user_currency_status_idx" ON "budgets" USING btree ("user_id","currency_code","status");--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_user_category_currency_period_active_unique" ON "budgets" USING btree ("user_id","category_id","currency_code","period") WHERE "budgets"."status" = 'ACTIVE';