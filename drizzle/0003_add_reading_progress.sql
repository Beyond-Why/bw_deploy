CREATE TABLE "reading_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_id" text NOT NULL,
	"content_type" text NOT NULL,
	"series_id" text,
	"scroll_percent" double precision DEFAULT 0 NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reading_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reading_progress_user_content_unique" ON "reading_progress" USING btree ("user_id","content_id","content_type");--> statement-breakpoint
CREATE INDEX "reading_progress_user_last_read_idx" ON "reading_progress" USING btree ("user_id","last_read_at");--> statement-breakpoint
CREATE POLICY "Users can view their own reading progress" ON "reading_progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "reading_progress"."user_id");--> statement-breakpoint
CREATE POLICY "Users can insert their own reading progress" ON "reading_progress" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() = "reading_progress"."user_id");--> statement-breakpoint
CREATE POLICY "Users can update their own reading progress" ON "reading_progress" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (auth.uid() = "reading_progress"."user_id") WITH CHECK (auth.uid() = "reading_progress"."user_id");