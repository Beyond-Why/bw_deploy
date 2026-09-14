import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components. Safe to call from
 * browser-bundled code — uses only the public URL and publishable key.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
