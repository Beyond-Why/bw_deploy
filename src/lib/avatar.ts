import type { SupabaseClient } from "@supabase/supabase-js";

const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

/**
 * Uploads a user's avatar to the public "avatars" Storage bucket at a
 * fixed per-user path (`avatars/{userId}/avatar`), overwriting any
 * previous avatar. Client-safe — no server-only imports, so it can be
 * called directly from AvatarUpload.tsx with the browser Supabase
 * client (whose session is what the bucket's RLS policies check).
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  if (!VALID_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Use JPG, PNG, or WebP.");
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("File too large. Maximum size is 2MB.");
  }

  const path = `avatars/${userId}/avatar`;

  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);

  // Cache-bust so the browser doesn't keep showing the previous avatar
  // for this same URL.
  return `${data.publicUrl}?t=${Date.now()}`;
}
