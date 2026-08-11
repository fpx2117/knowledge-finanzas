CREATE TABLE "analytics_event_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text,
	"event_name" text NOT NULL,
	"event_version" integer NOT NULL,
	"user_id" uuid,
	"occurred_at" timestamp with time zone NOT NULL,
	"environment" text NOT NULL,
	"internal" boolean DEFAULT false NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "analytics_event_log" ADD CONSTRAINT "analytics_event_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "analytics_event_log_event_id_unique" ON "analytics_event_log" USING btree ("event_id") WHERE "analytics_event_log"."event_id" is not null;--> statement-breakpoint
CREATE INDEX "analytics_event_log_name_occurred_idx" ON "analytics_event_log" USING btree ("event_name","occurred_at");--> statement-breakpoint
CREATE INDEX "analytics_event_log_user_idx" ON "analytics_event_log" USING btree ("user_id");