import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for server-side use — Server Components, Server
 * Actions, and Route Handlers (all expose the same `next/headers`
 * cookies() API this relies on).
 *
 * In a Server Component render, cookies() is read-only, so `setAll`
 * will throw; that's caught and ignored here. Session refresh across
 * requests instead relies on middleware calling this same pattern
 * (not implemented yet — infrastructure only at this checkpoint).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — no-op; middleware session
            // refresh (added later) is what keeps cookies fresh here.
          }
        },
      },
    }
  );
}
