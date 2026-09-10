CREATE TABLE "ai_generation_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"capability" text NOT NULL,
	"model_role" text NOT NULL,
	"resolved_model" text,
	"provider" text DEFAULT 'openrouter' NOT NULL,
	"generation_id" text,
	"operation_id" text,
	"status" text NOT NULL,
	"error_code" text,
	"input_tokens" integer,
	"output_tokens" integer,
	"cached_input_tokens" integer,
	"cost_usd" numeric(16, 10),
	"credits_charged" integer,
	"latency_ms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_generation_events" ADD CONSTRAINT "ai_generation_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_generation_events_user_created_idx" ON "ai_generation_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ai_generation_events_capability_created_idx" ON "ai_generation_events" USING btree ("capability","created_at");--> statement-breakpoint
CREATE INDEX "ai_generation_events_created_idx" ON "ai_generation_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_generation_events_operation_idx" ON "ai_generation_events" USING btree ("operation_id");