import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Server-only Drizzle client. The `server-only` import above makes any
 * attempt to pull this module into a Client Component bundle fail at
 * build time, since a database connection string must never reach the
 * browser.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

/**
 * `max`/`idle_timeout` matter here: DATABASE_URL points at Supabase's
 * session-mode pooler, which hard-caps total client connections (15 on
 * this project). postgres.js defaults to `max: 10` per instance — with
 * more than one `next dev` process running locally against the same
 * project (normal when working across multiple terminals), that default
 * alone is enough to exhaust the pooler and start failing unrelated
 * queries. Keeping each process's footprint small, and releasing idle
 * connections instead of holding them open indefinitely, leaves room for
 * several concurrent dev servers.
 */
const client = postgres(connectionString, { prepare: false, max: 3, idle_timeout: 20 });

export const db = drizzle(client, { schema });
