ALTER TYPE "public"."transaction_source" ADD VALUE 'TRANSFER';--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'TRANSFER_IN';--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'TRANSFER_OUT';--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"from_account_id" uuid NOT NULL,
	"to_account_id" uuid NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"currency_code" varchar(3) NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transfers_amount_positive_check" CHECK ("transfers"."amount" > 0),
	CONSTRAINT "transfers_currency_code_length_check" CHECK (char_length("transfers"."currency_code") = 3),
	CONSTRAINT "transfers_different_accounts_check" CHECK ("transfers"."from_account_id" <> "transfers"."to_account_id")
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "transfer_id" uuid;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_account_id_accounts_id_fk" FOREIGN KEY ("from_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_account_id_accounts_id_fk" FOREIGN KEY ("to_account_id") REFERENCES "public"."accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transfers_user_occurred_idx" ON "transfers" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transfers_from_account_occurred_idx" ON "transfers" USING btree ("from_account_id","occurred_at");--> statement-breakpoint
CREATE INDEX "transfers_to_account_occurred_idx" ON "transfers" USING btree ("to_account_id","occurred_at");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_transfer_id_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."transfers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_transfer_idx" ON "transactions" USING btree ("transfer_id");--> statement-breakpoint
