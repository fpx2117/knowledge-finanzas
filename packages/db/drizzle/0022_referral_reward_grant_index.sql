CREATE UNIQUE INDEX "ai_credit_entries_referral_reward_grant_unique" ON "ai_credit_entries" USING btree ("user_id","reference_id") WHERE "ai_credit_entries"."type" = 'REFERRAL_REWARD_GRANT';
