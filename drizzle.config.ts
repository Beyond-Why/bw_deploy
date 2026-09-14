if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set.");
}

// Installed drizzle-kit is 0.18.1, whose Config type predates `defineConfig`
// and the dialect/dbCredentials/schemaFilter fields used below (those match
// a newer drizzle-kit CLI). Cast rather than restructure so the CLI args
// this file has always produced stay unchanged.
export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Only manage tables in `public` — `auth.*` is Supabase-owned; the
  // `authUsers` stub in schema.ts exists solely so `profiles.id` can
  // declare a real FK reference to it, not for Drizzle to create/alter.
  schemaFilter: ["public"],
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} as any;
