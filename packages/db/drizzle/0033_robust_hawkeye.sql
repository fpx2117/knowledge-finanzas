CREATE TYPE "public"."merchant_user_default_source" AS ENUM('USER_EXPLICIT', 'MODEL');--> statement-breakpoint
CREATE TABLE "merchant_user_defaults" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"taxonomy_node_id" uuid NOT NULL,
	"source" "merchant_user_default_source" DEFAULT 'USER_EXPLICIT' NOT NULL,
	"confidence" numeric(4, 3) DEFAULT '1.000' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "merchant_user_defaults_confidence_range_check" CHECK ("merchant_user_defaults"."confidence" >= 0 and "merchant_user_defaults"."confidence" <= 1)
);
--> statement-breakpoint
ALTER TABLE "merchant_user_defaults" ADD CONSTRAINT "merchant_user_defaults_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_user_defaults" ADD CONSTRAINT "merchant_user_defaults_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchant_user_defaults" ADD CONSTRAINT "merchant_user_defaults_taxonomy_node_id_category_taxonomy_id_fk" FOREIGN KEY ("taxonomy_node_id") REFERENCES "public"."category_taxonomy"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "merchant_user_defaults_user_merchant_unique" ON "merchant_user_defaults" USING btree ("user_id","merchant_id");--> statement-breakpoint
CREATE INDEX "merchant_user_defaults_merchant_idx" ON "merchant_user_defaults" USING btree ("merchant_id");