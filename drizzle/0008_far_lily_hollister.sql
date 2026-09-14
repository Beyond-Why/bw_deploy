CREATE TABLE "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_handle" text NOT NULL,
	"user_display_name" text NOT NULL,
	"user_avatar_url" text,
	"content_id" text NOT NULL,
	"content_type" text NOT NULL,
	"series_id" text NOT NULL,
	"episode_number" text,
	"episode_title" text,
	"parent_id" uuid,
	"body" text NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comments_content_idx" ON "comments" USING btree ("content_id","content_type");--> statement-breakpoint
CREATE INDEX "comments_series_idx" ON "comments" USING btree ("series_id");--> statement-breakpoint
CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parent_id");--> statement-breakpoint
CREATE POLICY "Comments are viewable by everyone" ON "comments" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can comment as themselves" ON "comments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() = "comments"."user_id");--> statement-breakpoint
CREATE POLICY "Users can soft-delete their own comment" ON "comments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (auth.uid() = "comments"."user_id") WITH CHECK (auth.uid() = "comments"."user_id");