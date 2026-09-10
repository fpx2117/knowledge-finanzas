CREATE TABLE "kai_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"intent_id" text NOT NULL,
	"resolution_source" text NOT NULL,
	"llm_used" boolean DEFAULT false NOT NULL,
	"ai_cost_usd" numeric(16, 10) DEFAULT '0' NOT NULL,
	"latency_ms" integer NOT NULL,
	"response_type" text NOT NULL,
	"screen_context" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kai_interactions" ADD CONSTRAINT "kai_interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kai_interactions_user_created_idx" ON "kai_interactions" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "kai_interactions_created_idx" ON "kai_interactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "kai_interactions_source_created_idx" ON "kai_interactions" USING btree ("resolution_source","created_at");