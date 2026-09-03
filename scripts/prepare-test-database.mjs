import postgres from "postgres";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL is required");
const databaseName = decodeURIComponent(new URL(url).pathname.slice(1)).toLowerCase();
if (!/(^|[-_])test($|[-_])/.test(databaseName)) throw new Error("TEST_DATABASE_URL database name must contain test");

const sql = postgres(url, { prepare: false, max: 1 });
try {
  await sql`select 1`;
  console.log(`Test database is reachable: ${databaseName}`);
} finally {
  await sql.end({ timeout: 5 });
}
