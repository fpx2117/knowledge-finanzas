CREATE TYPE "public"."scheduled_transaction_source" AS ENUM('MANUAL', 'RECURRING');--> statement-breakpoint
CREATE TYPE "public"."scheduled_transaction_status" AS ENUM('SCHEDULED', 'POSTED', 'SKIPPED', 'CANCELLED');--> statement-breakpoint
ALTER TYPE "public"."transaction_source" ADD VALUE 'SCHEDULED';--> statement-breakpoint
CREATE TABLE "scheduled_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"type" "transaction_type" NOT NULL,
	"expected_amount" numeric(20, 6) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"description" text NOT NULL,
	"category_id" uuid,
	"scheduled_date" date NOT NULL,
	"status" "scheduled_transaction_status" DEFAULT 'SCHEDULED' NOT NULL,
	"source" "scheduled_transaction_source" DEFAULT 'MANUAL' NOT NULL,
	"actual_amount" numeric(20, 6),
	"actual_occurred_at" timestamp with time zone,
	"posted_transaction_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scheduled_transactions_posted_transaction_id_unique" UNIQUE("posted_transaction_id"),
	CONSTRAINT "scheduled_transactions_expected_amount_positive_check" CHECK ("scheduled_transactions"."expected_amount" > 0),
	CONSTRAINT "scheduled_transactions_currency_code_length_check" CHECK (char_length("scheduled_transactions"."currency_code") = 3),
	CONSTRAINT "scheduled_transactions_type_check" CHECK ("scheduled_transactions"."type" in ('INCOME', 'EXPENSE'))
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "scheduled_transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD CONSTRAINT "scheduled_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD CONSTRAINT "scheduled_transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD CONSTRAINT "scheduled_transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_transactions" ADD CONSTRAINT "scheduled_transactions_posted_transaction_id_transactions_id_fk" FOREIGN KEY ("posted_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scheduled_transactions_user_date_status_idx" ON "scheduled_transactions" USING btree ("user_id","scheduled_date","status");--> statement-breakpoint
CREATE INDEX "scheduled_transactions_account_date_idx" ON "scheduled_transactions" USING btree ("account_id","scheduled_date");--> statement-breakpoint
CREATE UNIQUE INDEX "transactions_scheduled_transaction_unique" ON "transactions" USING btree ("scheduled_transaction_id");