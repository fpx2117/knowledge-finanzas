CREATE TABLE "kai_notification_mutes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"muted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kai_notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"dedup_key" text NOT NULL,
	"priority" integer DEFAULT 3 NOT NULL,
	"state" text DEFAULT 'PENDING' NOT NULL,
	"payload" jsonb NOT NULL,
	"shown_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"action_taken_at" timestamp with time zone,
	"snoozed_until" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "kai_notification_mutes" ADD CONSTRAINT "kai_notification_mutes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kai_notifications" ADD CONSTRAINT "kai_notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "kai_notification_mutes_user_kind_idx" ON "kai_notification_mutes" USING btree ("user_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "kai_notifications_user_dedup_idx" ON "kai_notifications" USING btree ("user_id","dedup_key");--> statement-breakpoint
CREATE INDEX "kai_notifications_user_state_idx" ON "kai_notifications" USING btree ("user_id","state");