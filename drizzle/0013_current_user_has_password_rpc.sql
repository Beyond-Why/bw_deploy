-- ============================================================
-- RPC: public.current_user_has_password()
--
-- Lets app code check whether the signed-in user has a real
-- password set, without ever reading auth.users.encrypted_password
-- into the app itself — the hash stays inside this SECURITY DEFINER
-- function and only a boolean crosses back out.
--
-- Why this exists: the Edit Profile page's Password section needs
-- to tell a Google-only user who has never set a password (show
-- "Set a password") apart from one who has (show the full update
-- form). The obvious signal — an "email" entry in auth.users'
-- identities — is NOT reliable: Supabase does not consistently add
-- one when updateUser({ password }) sets a password for an
-- OAuth-only user. encrypted_password IS reliably populated by that
-- same call, so it's the correct signal, just not one that can be
-- read via supabase-js (PostgREST never exposes auth.*, and no
-- Admin API response ever includes password hashes) — hence this
-- RPC. Scoped to auth.uid() so a caller can only ever check their
-- own status, never another user's.
-- ============================================================

CREATE OR REPLACE FUNCTION public.current_user_has_password()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT encrypted_password IS NOT NULL AND encrypted_password <> ''
  FROM auth.users
  WHERE id = auth.uid();
$$;
--> statement-breakpoint

REVOKE EXECUTE ON FUNCTION public.current_user_has_password() FROM public, anon;
--> statement-breakpoint

GRANT EXECUTE ON FUNCTION public.current_user_has_password() TO authenticated;
