CREATE TYPE "public"."reminder_channel" AS ENUM('IN_APP');--> statement-breakpoint
CREATE TYPE "public"."reminder_preset" AS ENUM('DUE_DATE', 'BEFORE_1_DAY', 'BEFORE_3_DAYS', 'BEFORE_7_DAYS', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."reminder_source_type" AS ENUM('DEBT_INSTALLMENT', 'SCHEDULED_TRANSACTION');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('PENDING', 'SENT', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_type" "reminder_source_type" NOT NULL,
	"source_id" uuid NOT NULL,
	"preset" "reminder_preset" NOT NULL,
	"channel" "reminder_channel" DEFAULT 'IN_APP' NOT NULL,
	"timezone" text NOT NULL,
	"local_date" date NOT NULL,
	"local_time" varchar(5) DEFAULT '09:00' NOT NULL,
	"remind_at" timestamp with time zone NOT NULL,
	"dedup_key" text NOT NULL,
	"status" "reminder_status" DEFAULT 'PENDING' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reminders_local_time_check" CHECK ("reminders"."local_time" ~ '^[0-2][0-9]:[0-5][0-9]$')
);
--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reminders_user_dedup_unique" ON "reminders" USING btree ("user_id","dedup_key");--> statement-breakpoint
CREATE INDEX "reminders_user_remind_status_idx" ON "reminders" USING btree ("user_id","remind_at","status");--> statement-breakpoint
CREATE INDEX "reminders_user_source_idx" ON "reminders" USING btree ("user_id","source_type","source_id");