CREATE TABLE "comment_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"comment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "comment_likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_comment_id_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_likes" ADD CONSTRAINT "comment_likes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "comment_likes_user_comment_unique" ON "comment_likes" USING btree ("user_id","comment_id");--> statement-breakpoint
CREATE INDEX "comment_likes_comment_idx" ON "comment_likes" USING btree ("comment_id");--> statement-breakpoint
CREATE POLICY "Comment likes are viewable by everyone" ON "comment_likes" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can like comments as themselves" ON "comment_likes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() = "comment_likes"."user_id");--> statement-breakpoint
CREATE POLICY "Users can remove their own comment like" ON "comment_likes" AS PERMISSIVE FOR DELETE TO "authenticated" USING (auth.uid() = "comment_likes"."user_id");