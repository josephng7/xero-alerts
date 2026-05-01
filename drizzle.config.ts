import { defineConfig } from "drizzle-kit";

// `generate` does not connect; `migrate` / `studio` require a real URL (e.g. Supabase in .env).
const url =
  process.env.DATABASE_URL ??
  "postgresql://placeholder:placeholder@127.0.0.1:5432/placeholder";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url
  }
});
