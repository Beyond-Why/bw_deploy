CREATE TABLE "likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_id" text NOT NULL,
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "likes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "likes_user_content_unique" ON "likes" USING btree ("user_id","content_id","content_type");--> statement-breakpoint
CREATE INDEX "likes_content_idx" ON "likes" USING btree ("content_id","content_type");--> statement-breakpoint
CREATE POLICY "Likes are viewable by everyone" ON "likes" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can like as themselves" ON "likes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (auth.uid() = "likes"."user_id");--> statement-breakpoint
CREATE POLICY "Users can remove their own like" ON "likes" AS PERMISSIVE FOR DELETE TO "authenticated" USING (auth.uid() = "likes"."user_id");