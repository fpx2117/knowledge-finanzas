ALTER TYPE "public"."transaction_type" ADD VALUE 'REFUND';--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'ADJUSTMENT_IN';--> statement-breakpoint
ALTER TYPE "public"."transaction_type" ADD VALUE 'ADJUSTMENT_OUT';--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "original_transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "related_transaction_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_original_transaction_id_transactions_id_fk" FOREIGN KEY ("original_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_related_transaction_id_transactions_id_fk" FOREIGN KEY ("related_transaction_id") REFERENCES "public"."transactions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transactions_original_transaction_idx" ON "transactions" USING btree ("original_transaction_id");--> statement-breakpoint
CREATE INDEX "transactions_related_transaction_idx" ON "transactions" USING btree ("related_transaction_id");