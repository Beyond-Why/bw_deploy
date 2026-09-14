CREATE TYPE "public"."notification_type" AS ENUM('new_deep_dive', 'new_episode', 'new_insight_collection');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"content_url" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE POLICY "Users can view their own notifications" ON "notifications" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = "notifications"."user_id");--> statement-breakpoint
CREATE POLICY "Users can mark their own notifications read" ON "notifications" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (auth.uid() = "notifications"."user_id") WITH CHECK (auth.uid() = "notifications"."user_id");