DROP INDEX "couple_member_user_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "couple_member_user_unique_idx" ON "couple_member" USING btree ("user_id");