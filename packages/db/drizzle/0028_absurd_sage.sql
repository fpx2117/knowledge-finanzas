CREATE TYPE "public"."category_map_source" AS ENUM('SEED', 'USER', 'MODEL');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_level" AS ENUM('GROUP', 'CATEGORY', 'SUBCATEGORY');--> statement-breakpoint
CREATE TABLE "category_map" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_category_id" uuid NOT NULL,
	"taxonomy_node_id" uuid NOT NULL,
	"source" "category_map_source" DEFAULT 'MODEL' NOT NULL,
	"confidence" numeric(4, 3) DEFAULT '0.500' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "category_map_confidence_range_check" CHECK ("category_map"."confidence" >= 0 and "category_map"."confidence" <= 1)
);
--> statement-breakpoint
CREATE TABLE "category_taxonomy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"level" "taxonomy_level" NOT NULL,
	"type" "category_type" NOT NULL,
	"slug" text NOT NULL,
	"display_name" text NOT NULL,
	"mcc" varchar(4),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "category_map" ADD CONSTRAINT "category_map_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_map" ADD CONSTRAINT "category_map_user_category_id_categories_id_fk" FOREIGN KEY ("user_category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_map" ADD CONSTRAINT "category_map_taxonomy_node_id_category_taxonomy_id_fk" FOREIGN KEY ("taxonomy_node_id") REFERENCES "public"."category_taxonomy"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_taxonomy" ADD CONSTRAINT "category_taxonomy_parent_id_category_taxonomy_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."category_taxonomy"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_map_user_category_unique" ON "category_map" USING btree ("user_category_id");--> statement-breakpoint
CREATE INDEX "category_map_user_idx" ON "category_map" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "category_map_taxonomy_idx" ON "category_map" USING btree ("taxonomy_node_id");--> statement-breakpoint
CREATE UNIQUE INDEX "category_taxonomy_slug_unique" ON "category_taxonomy" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "category_taxonomy_parent_idx" ON "category_taxonomy" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "category_taxonomy_type_level_idx" ON "category_taxonomy" USING btree ("type","level");