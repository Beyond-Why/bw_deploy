-- ============================================================
-- RLS policies for the "avatars" Storage bucket (created manually
-- in the Supabase dashboard — not managed by Drizzle's schema.ts,
-- which only tracks the `public` schema; storage.objects lives in
-- the `storage` schema). Hand-written migration, same pattern as
-- 0001_profiles_trigger.sql.
--
-- Objects are stored at "avatars/{user_id}/avatar" — each user can
-- only write/delete their own path; reads are public since the
-- bucket itself is public.
-- ============================================================

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND name = 'avatars/' || auth.uid() || '/avatar');
--> statement-breakpoint

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND name = 'avatars/' || auth.uid() || '/avatar');
--> statement-breakpoint

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND name = 'avatars/' || auth.uid() || '/avatar');
--> statement-breakpoint

CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
