CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'WALLET', 'OTHER');--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "taxonomy_node_id" uuid;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "payment_method" "payment_method";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "classification" jsonb;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_taxonomy_node_id_category_taxonomy_id_fk" FOREIGN KEY ("taxonomy_node_id") REFERENCES "public"."category_taxonomy"("id") ON DELETE set null ON UPDATE no action;