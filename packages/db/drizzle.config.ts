import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "drizzle-kit";

// drizzle-kit runs with its cwd at packages/db, so its built-in .env lookup
// misses the monorepo-root .env where DATABASE_URL actually lives. Load it here
// before reading the connection string. Real process env still wins (CI, Railway).
const rootEnvPath = resolve(__dirname, "../../.env");
try {
  for (const line of readFileSync(rootEnvPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (key in process.env) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
} catch {
  // No root .env (e.g. CI with real env vars) — fall through to the check below.
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required — set it in the monorepo-root .env or the environment.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
});
