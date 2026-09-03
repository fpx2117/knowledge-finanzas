CREATE TYPE "public"."merchant_alias_match_type" AS ENUM('EXACT', 'PREFIX', 'CONTAINS', 'REGEX');--> statement-breakpoint
CREATE TYPE "public"."merchant_alias_source" AS ENUM('SEED', 'IMPORT', 'USER', 'MODEL');--> statement-breakpoint
CREATE TABLE "merchant_aliases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"pattern" text NOT NULL,
	"match_type" "merchant_alias_match_type" DEFAULT 'EXACT' NOT NULL,
	"source" "merchant_alias_source" DEFAULT 'SEED' NOT NULL,
	"added_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"canonical_name" text NOT NULL,
	"merchant_group_id" uuid,
	"default_taxonomy_node_id" uuid,
	"home_country" varchar(2),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "merchant_id" uuid;--> statement-breakpoint
ALTER TABLE "merchant_aliases" ADD CONSTRAINT "merchant_aliases_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_aliases" ADD CONSTRAINT "merchant_aliases_added_by_user_id_users_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_merchant_group_id_merchants_id_fk" FOREIGN KEY ("merchant_group_id") REFERENCES "public"."merchants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_default_taxonomy_node_id_category_taxonomy_id_fk" FOREIGN KEY ("default_taxonomy_node_id") REFERENCES "public"."category_taxonomy"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_aliases_pattern_type_unique" ON "merchant_aliases" USING btree ("pattern","match_type");--> statement-breakpoint
CREATE INDEX "merchant_aliases_merchant_idx" ON "merchant_aliases" USING btree ("merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "merchants_slug_unique" ON "merchants" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "merchants_group_idx" ON "merchants" USING btree ("merchant_group_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE set null ON UPDATE no action;