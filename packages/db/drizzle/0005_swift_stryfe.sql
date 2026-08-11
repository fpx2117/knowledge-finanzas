CREATE TYPE "public"."debt_payment_status" AS ENUM('POSTED', 'REVERSED');--> statement-breakpoint
CREATE TYPE "public"."debt_status" AS ENUM('ACTIVE', 'PAID', 'OVERDUE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."debt_type" AS ENUM('PERSONAL_LOAN', 'PURCHASE_INSTALLMENTS', 'MONEY_OWED_TO_PERSON', 'SERVICE_DEBT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."installment_status" AS ENUM('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."interest_type" AS ENUM('NO_INTEREST', 'FIXED_INSTALLMENTS', 'MANUAL_INSTALLMENTS');--> statement-breakpoint
ALTER TYPE "public"."transaction_source" ADD VALUE 'DEBT_PAYMENT';--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'LIABILITY_PAYMENT';--> statement-breakpoint
CREATE TABLE "debt_installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"debt_id" uuid NOT NULL,
	"installment_number" integer NOT NULL,
	"due_date" date NOT NULL,
	"principal_amount" numeric(20, 6) DEFAULT '0' NOT NULL,
	"interest_amount" numeric(20, 6) DEFAULT '0' NOT NULL,
	"fee_amount" numeric(20, 6) DEFAULT '0' NOT NULL,
	"total_amount" numeric(20, 6) NOT NULL,
	"status" "installment_status" DEFAULT 'PENDING' NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "debt_installments_number_positive_check" CHECK ("debt_installments"."installment_number" > 0),
	CONSTRAINT "debt_installments_principal_non_negative_check" CHECK ("debt_installments"."principal_amount" >= 0),
	CONSTRAINT "debt_installments_interest_non_negative_check" CHECK ("debt_installments"."interest_amount" >= 0),
	CONSTRAINT "debt_installments_fee_non_negative_check" CHECK ("debt_installments"."fee_amount" >= 0),
	CONSTRAINT "debt_installments_total_positive_check" CHECK ("debt_installments"."total_amount" > 0),
	CONSTRAINT "debt_installments_components_sum_check" CHECK ("debt_installments"."principal_amount" + "debt_installments"."interest_amount" + "debt_installments"."fee_amount" = "debt_installments"."total_amount")
);
--> statement-breakpoint
CREATE TABLE "debt_payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"installment_id" uuid NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "debt_payment_allocations_amount_positive_check" CHECK ("debt_payment_allocations"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "debt_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"debt_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"transaction_id" uuid NOT NULL,
	"status" "debt_payment_status" DEFAULT 'POSTED' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "debt_payments_transaction_id_unique" UNIQUE("transaction_id"),
	CONSTRAINT "debt_payments_amount_positive_check" CHECK ("debt_payments"."amount" > 0),
	CONSTRAINT "debt_payments_currency_code_length_check" CHECK (char_length("debt_payments"."currency_code") = 3)
);
--> statement-breakpoint
CREATE TABLE "debts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"creditor" text,
	"type" "debt_type" NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"original_amount" numeric(20, 6) NOT NULL,
	"start_date" date NOT NULL,
	"status" "debt_status" DEFAULT 'ACTIVE' NOT NULL,
	"interest_type" "interest_type" DEFAULT 'NO_INTEREST' NOT NULL,
	"interest_rate" numeric(12, 8),
	"notes" text,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "debts_original_amount_positive_check" CHECK ("debts"."original_amount" > 0),
	CONSTRAINT "debts_currency_code_length_check" CHECK (char_length("debts"."currency_code") = 3),
	CONSTRAINT "debts_interest_rate_non_negative_check" CHECK ("debts"."interest_rate" is null or "debts"."interest_rate" >= 0)
);
--> statement-breakpoint
ALTER TABLE "debt_installments" ADD CONSTRAINT "debt_installments_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payment_allocations" ADD CONSTRAINT "debt_payment_allocations_payment_id_debt_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."debt_payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payment_allocations" ADD CONSTRAINT "debt_payment_allocations_installment_id_debt_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."debt_installments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_debt_id_debts_id_fk" FOREIGN KEY ("debt_id") REFERENCES "public"."debts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debt_payments" ADD CONSTRAINT "debt_payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "debts" ADD CONSTRAINT "debts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "debt_installments_debt_number_unique" ON "debt_installments" USING btree ("debt_id","installment_number");--> statement-breakpoint
CREATE INDEX "debt_installments_debt_due_idx" ON "debt_installments" USING btree ("debt_id","due_date","installment_number");--> statement-breakpoint
CREATE INDEX "debt_installments_debt_status_due_idx" ON "debt_installments" USING btree ("debt_id","status","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "debt_payment_allocations_payment_installment_unique" ON "debt_payment_allocations" USING btree ("payment_id","installment_id");--> statement-breakpoint
CREATE INDEX "debt_payment_allocations_installment_idx" ON "debt_payment_allocations" USING btree ("installment_id");--> statement-breakpoint
CREATE INDEX "debt_payments_debt_paid_idx" ON "debt_payments" USING btree ("debt_id","paid_at");--> statement-breakpoint
CREATE INDEX "debts_user_status_idx" ON "debts" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "debts_user_start_date_idx" ON "debts" USING btree ("user_id","start_date");