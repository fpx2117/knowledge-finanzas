CREATE TYPE "public"."recurring_transaction_frequency" AS ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY');--> statement-breakpoint
CREATE TYPE "public"."recurring_transaction_status" AS ENUM('ACTIVE', 'PAUSED', 'ENDED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "recurring_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"description" text NOT NULL,
	"category_id" uuid,
	"frequency" "recurring_transaction_frequency" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"occurrence_count" integer,
	"anchor_day" integer,
	"next_occurrence" date,
	"status" "recurring_transaction_status" DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "recurring_transactions_amount_positive_check" CHECK ("recurring_transactions"."amount" > 0),
	CONSTRAINT "recurring_transactions_currency_code_length_check" CHECK (char_length("recurring_transactions"."currency_code") = 3),
	CONSTRAINT "recurring_transactions_occurrence_count_check" CHECK ("recurring_transactions"."occurrence_count" is null or "recurring_transactions"."occurrence_count" > 0),
	CONSTRAINT "recurring_transactions_anchor_day_check" CHECK ("recurring_transactions"."anchor_day" is null or ("recurring_transactions"."anchor_day" >= 1 and "recurring_transactions"."anchor_day" <= 31)),
	CONSTRAINT "recurring_transactions_end_date_check" CHECK ("recurring_transactions"."end_date" is null or "recurring_transactions"."end_date" >= "recurring_transactions"."start_date"),
	CONSTRAINT "recurring_transactions_type_check" CHECK ("recurring_transactions"."type" in ('INCOME', 'EXPENSE'))
);
--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD COLUMN "recurring_transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD COLUMN "occurrence_number" integer;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_transactions_user_status_idx" ON "recurring_transactions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "recurring_transactions_user_next_idx" ON "recurring_transactions" USING btree ("user_id","next_occurrence");--> statement-breakpoint
CREATE UNIQUE INDEX "scheduled_transactions_recurring_date_unique" ON "scheduled_transactions" USING btree ("recurring_transaction_id","scheduled_date");