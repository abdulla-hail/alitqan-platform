// Applies database/migrations/*.sql in order (each once, tracked in public._migrations),
// and with --seed also applies database/seed/seed.sql (idempotent).
// Usage: npm run db:migrate   |   npm run db:seed
// Needs DATABASE_URL (Supabase → Project Settings → Database → Session pooler, port 5432).
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (see .env.example)");
  process.exit(1);
}
const root = new URL("../database/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const local = /localhost|127\.0\.0\.1/.test(url);
const client = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query(`create table if not exists public._migrations (name text primary key, applied_at timestamptz not null default now())`);
  await client.query(`alter table public._migrations enable row level security`);
  const done = new Set((await client.query(`select name from public._migrations`)).rows.map((r) => r.name));
  const files = readdirSync(join(root, "migrations")).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) {
    if (done.has(f)) {
      console.log(`· ${f} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(root, "migrations", f), "utf8");
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(`insert into public._migrations(name) values ($1)`, [f]);
      await client.query("commit");
      console.log(`✓ ${f}`);
    } catch (e) {
      await client.query("rollback");
      console.error(`✗ ${f}: ${e.message}`);
      process.exit(1);
    }
  }
  if (process.argv.includes("--seed")) {
    await client.query(readFileSync(join(root, "seed", "seed.sql"), "utf8"));
    console.log("✓ seed.sql");
  }
  console.log("Database is up to date.");
} finally {
  await client.end();
}
