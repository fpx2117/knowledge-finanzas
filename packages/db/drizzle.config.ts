import { defineConfig } from "drizzle-kit";
import { env } from "@know-finanzas/config";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
