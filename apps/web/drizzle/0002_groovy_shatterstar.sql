CREATE TABLE "canvas_state" (
	"id" text PRIMARY KEY NOT NULL,
	"space_id" text NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"state" jsonb DEFAULT '{"id":"","version":0,"elements":[],"updatedAt":0}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "canvas_state" ADD CONSTRAINT "canvas_state_space_id_couple_space_id_fk" FOREIGN KEY ("space_id") REFERENCES "public"."couple_space"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "canvas_state_space_idx" ON "canvas_state" USING btree ("space_id");