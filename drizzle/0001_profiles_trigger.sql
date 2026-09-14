-- ============================================================
-- Auto-create a profile row whenever a new auth.users row is
-- inserted, deriving an initial username from the email
-- local-part with collision-safe numeric-suffix resolution.
--
-- This is not expressible via Drizzle's schema DSL (no triggers/
-- functions), so it's a hand-written migration alongside the
-- generated one in 0000_profiles_table.sql.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base_username extensions.citext;
  candidate_username extensions.citext;
  suffix int := 1;
  initial_display_name text;
BEGIN
  -- Derive a base username from the email local-part: lowercase,
  -- strip everything before '@', keep only [a-z0-9._-], collapse
  -- leading/trailing separators, fall back to 'user' if empty.
  base_username := lower(split_part(coalesce(new.email, ''), '@', 1));
  base_username := regexp_replace(base_username, '[^a-z0-9._-]', '', 'g');
  base_username := regexp_replace(base_username, '^[._-]+|[._-]+$', '', 'g');

  IF base_username IS NULL OR length(base_username) = 0 THEN
    base_username := 'user';
  END IF;

  candidate_username := base_username;

  -- Sensible initial display name: prefer full_name/name from OAuth
  -- provider metadata when present, otherwise leave null.
  initial_display_name := coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name'
  );

  -- Collision-safe insert: try the base username, then base+2, base+3, ...
  -- Concurrency-safe because we let the unique constraint itself decide
  -- collisions (loop + catch unique_violation) rather than check-then-insert.
  LOOP
    BEGIN
      INSERT INTO public.profiles (id, username, display_name, avatar_url, bio)
      VALUES (new.id, candidate_username, initial_display_name, null, null);
      EXIT;
    EXCEPTION
      WHEN unique_violation THEN
        suffix := suffix + 1;
        candidate_username := base_username || suffix::text;
    END;
  END LOOP;

  RETURN new;
END;
$$;
--> statement-breakpoint

-- Trigger-only function: not meant to be callable via the PostgREST
-- API by anon/authenticated roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
--> statement-breakpoint

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
