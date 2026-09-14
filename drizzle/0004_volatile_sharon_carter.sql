CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_id" text NOT NULL,
	"content_type" text NOT NULL,
	"content_title" text NOT NULL,
	"content_url" text NOT NULL,
	"series_title" text,
	"series_slug" text,
	"episode_number" integer,
	"thumbnail_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookmarks_user_content_unique" ON "bookmarks" USING btree ("user_id","content_id","content_type");--> statement-breakpoint
CREATE INDEX "bookmarks_content_idx" ON "bookmarks" USING btree ("content_id","content_type");--> statement-breakpoint
CREATE INDEX "bookmarks_user_created_idx" ON "bookmarks" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE POLICY "Bookmarks are viewable by everyone" ON "bookmarks" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can bookmark as themselves" ON "bookmarks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() = "bookmarks"."user_id");--> statement-breakpoint
CREATE POLICY "Users can remove their own bookmark" ON "bookmarks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (auth.uid() = "bookmarks"."user_id");