-- ============================================================
-- Update handle_new_user() to:
--   1. Prefer a client-supplied username (raw_user_meta_data->>'username',
--      set by the new password-based signup form) over the email-derived
--      fallback — Google OAuth users still have no such metadata, so they
--      keep falling back to the email local-part exactly as before.
--   2. Snapshot the new user's email onto profiles.email (added in
--      0010) — the sign-in-by-username flow reads it directly instead of
--      needing a service-role admin lookup.
-- Collision-safe suffix loop and display_name derivation are unchanged.
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
  -- Prefer the username generated client-side at signup (stored in
  -- user metadata); fall back to deriving one from the email
  -- local-part for OAuth sign-ins and anything else that didn't supply
  -- one. Either way it's sanitized the same way before use.
  base_username := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  base_username := regexp_replace(base_username, '[^a-z0-9._-]', '', 'g');
  base_username := regexp_replace(base_username, '^[._-]+|[._-]+$', '', 'g');

  IF base_username IS NULL OR length(base_username) = 0 THEN
    base_username := lower(split_part(coalesce(new.email, ''), '@', 1));
    base_username := regexp_replace(base_username, '[^a-z0-9._-]', '', 'g');
    base_username := regexp_replace(base_username, '^[._-]+|[._-]+$', '', 'g');
  END IF;

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
      INSERT INTO public.profiles (id, username, display_name, avatar_url, bio, email)
      VALUES (new.id, candidate_username, initial_display_name, null, null, new.email);
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
