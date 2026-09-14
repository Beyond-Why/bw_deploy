-- citext for case-insensitive usernames — installed in `extensions`,
-- matching this project's existing convention (pgcrypto, uuid-ossp, etc).
CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;
--> statement-breakpoint

-- `auth.users` is owned by Supabase Auth and already exists in the
-- database. It is declared as a stub table in src/lib/db/schema.ts only
-- so `profiles.id` can carry a real FK reference to it — it must never
-- be created/altered by this migration. (Intentionally omitted here;
-- drizzle-kit's `generate` emits it because it can't tell the
-- difference between a real table and a reference-only stub.)

CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" "citext" NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_users_id_fk" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Profiles are viewable by everyone" ON "profiles" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Users can update their own profile" ON "profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (auth.uid() = "profiles"."id") WITH CHECK (auth.uid() = "profiles"."id");