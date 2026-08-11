CREATE TYPE "public"."budget_alert_type" AS ENUM('BUDGET_NEAR_LIMIT', 'BUDGET_EXCEEDED');--> statement-breakpoint
CREATE TABLE "budget_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"budget_id" uuid NOT NULL,
	"period_key" varchar(7) NOT NULL,
	"alert_type" "budget_alert_type" NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_alerts" ADD CONSTRAINT "budget_alerts_budget_id_budgets_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."budgets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "budget_alerts_budget_period_type_unique" ON "budget_alerts" USING btree ("budget_id","period_key","alert_type");--> statement-breakpoint
CREATE INDEX "budget_alerts_user_period_idx" ON "budget_alerts" USING btree ("user_id","period_key");