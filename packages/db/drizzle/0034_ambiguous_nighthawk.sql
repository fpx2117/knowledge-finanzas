CREATE TYPE "public"."classification_rule_matcher" AS ENUM('MERCHANT', 'DESCRIPTION');--> statement-breakpoint
CREATE TYPE "public"."classification_rule_mode" AS ENUM('CONTAINS', 'EQUALS', 'STARTS_WITH');--> statement-breakpoint
CREATE TABLE "user_classification_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"matcher" "classification_rule_matcher" NOT NULL,
	"mode" "classification_rule_mode" DEFAULT 'CONTAINS' NOT NULL,
	"pattern" text NOT NULL,
	"category_id" uuid NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_classification_rules" ADD CONSTRAINT "user_classification_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_classification_rules" ADD CONSTRAINT "user_classification_rules_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_classification_rules_user_priority_idx" ON "user_classification_rules" USING btree ("user_id","priority");--> statement-breakpoint
CREATE UNIQUE INDEX "user_classification_rules_user_matcher_pattern_unique" ON "user_classification_rules" USING btree ("user_id","matcher","mode","pattern");