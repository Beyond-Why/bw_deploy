import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set.");
}

export default defineConfig({
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
});
