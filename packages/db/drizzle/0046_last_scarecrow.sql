CREATE TYPE "public"."fx_rate_source" AS ENUM('DOLAR_BLUE');--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "fx_rate_source" NOT NULL,
	"base" varchar(3) NOT NULL,
	"quote" varchar(3) NOT NULL,
	"bid" numeric(20, 6) NOT NULL,
	"ask" numeric(20, 6) NOT NULL,
	"as_of" timestamp with time zone NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fx_rates_base_length_check" CHECK (char_length("fx_rates"."base") = 3),
	CONSTRAINT "fx_rates_quote_length_check" CHECK (char_length("fx_rates"."quote") = 3),
	CONSTRAINT "fx_rates_positive_check" CHECK ("fx_rates"."bid" > 0 and "fx_rates"."ask" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "fx_rates_source_pair_as_of_unique" ON "fx_rates" USING btree ("source","base","quote","as_of");--> statement-breakpoint
CREATE INDEX "fx_rates_pair_fetched_idx" ON "fx_rates" USING btree ("base","quote","fetched_at");