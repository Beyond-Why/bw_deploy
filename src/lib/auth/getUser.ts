import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Deduped per-request: multiple server components/layouts can call this
 * without triggering multiple auth round trips for the same render.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
