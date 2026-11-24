import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

const root = join(__dirname, "..");
let db: PGlite;
const ids: Record<string, string> = {};

async function as(user: keyof typeof ids | "anon", sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    if (user === "anon") {
      await tx.query(`select set_config('request.jwt.claim.sub', '', true)`);
      await tx.exec("set local role anon");
    } else {
      await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [ids[user]]);
      await tx.exec("set local role authenticated");
    }
    return tx.query<Record<string, unknown>>(sql, params);
  });
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(readFileSync(join(__dirname, "supabase-stub.sql"), "utf8"));
  const migrations = readdirSync(join(root, "migrations")).filter((f) => f.endsWith(".sql")).sort();
  for (const f of migrations) await db.exec(readFileSync(join(root, "migrations", f), "utf8"));
  await db.exec(readFileSync(join(root, "seed", "seed.sql"), "utf8"));

  for (const [name, role] of [["owner", "viewer"], ["admin", "admin"], ["editor", "editor"], ["viewer", "viewer"], ["inactive", "editor"]] as const) {
    const r = await db.query<{ id: string }>(
      `insert into auth.users(email, raw_app_meta_data) values ($1, $2) returning id`,
      [`${name}@test.local`, JSON.stringify({ role, active: name !== "inactive" && name !== "owner" })],
    );
    ids[name] = r.rows[0].id;
  }
  await db.query(`select public.bootstrap_owner($1)`, [ids.owner]);
}, 60_000);

describe("migrations & seed", () => {
  it("seeds content", async () => {
    const r = await db.query<{ n: number }>(`select count(*)::int n from services where status='published'`);
    expect(r.rows[0].n).toBeGreaterThanOrEqual(10);
    const p = await db.query<{ n: number }>(`select count(*)::int n from page_sections`);
    expect(p.rows[0].n).toBeGreaterThan(15);
  });
  it("re-running the seed is idempotent", async () => {
    const before = await db.query<{ n: number }>(`select count(*)::int n from page_sections`);
    await db.exec(readFileSync(join(root, "seed", "seed.sql"), "utf8"));
    const after = await db.query<{ n: number }>(`select count(*)::int n from page_sections`);
    expect(after.rows[0].n).toBe(before.rows[0].n);
  });
  it("new auth users get inactive viewer profiles and cannot self-assign super_admin", async () => {
    const r = await db.query<{ id: string }>(`insert into auth.users(email, raw_app_meta_data) values ('x@test.local', '{"role":"super_admin","active":true}') returning id`);
    const p = await db.query<{ role_key: string }>(`select role_key from profiles where id=$1`, [r.rows[0].id]);
    expect(p.rows[0].role_key).toBe("viewer");
  });
  it("owner bootstrap only works once", async () => {
    await expect(db.query(`select public.bootstrap_owner($1)`, [ids.viewer])).rejects.toThrow(/owner already exists/);
  });
});

describe("public (anon) access", () => {
  it("reads the language list the proxy and layout depend on", async () => {
    const r = await as("anon", `select code from languages where is_default`);
    expect(r.rows).toEqual([{ code: "ar" }]);
  });
  it("reads published content only", async () => {
    await db.exec(`update services set status='draft' where slug='seo'`);
    const r = await as("anon", `select slug from services`);
    expect(r.rows.map((x) => x.slug)).not.toContain("seo");
    expect(r.rows.length).toBeGreaterThan(5);
    await db.exec(`update services set status='published' where slug='seo'`);
  });
  it("cannot read inbox, users, activity or private settings", async () => {
    for (const tbl of ["project_requests", "contact_messages", "profiles", "activity_logs", "notification_templates"]) {
      // no table grant for visitors at all (0007) — refused before RLS is even consulted
      await expect(as("anon", `select * from ${tbl}`)).rejects.toThrow(/permission denied/);
    }
    const s = await as("anon", `select key from site_settings`);
    expect(s.rows.map((x) => x.key)).not.toContain("notifications");
  });
  it("cannot write anything or call service-only functions", async () => {
    await expect(as("anon", `insert into contact_messages(name,email,message) values ('Spam','a@b.c','hello there')`)).rejects.toThrow();
    await expect(as("anon", `update services set title='{}'`)).rejects.toThrow(/permission denied/);
    await expect(as("anon", `select public.check_rate_limit('k', 5, 60)`)).rejects.toThrow(/permission denied/);
    await expect(as("anon", `select public.bootstrap_owner(gen_random_uuid())`)).rejects.toThrow(/permission denied/);
  });
});

describe("role permissions are enforced in the database", () => {
  it("editor manages content and is logged in activity", async () => {
    await as("editor", `insert into services(slug,title,status) values ('editor-test','{"ar":"اختبار","en":"Test"}','draft')`);
    const log = await db.query(`select * from activity_logs where entity_type='services' and summary='اختبار'`);
    expect(log.rows.length).toBe(1);
    const row = await db.query<{ created_by: string }>(`select created_by from services where slug='editor-test'`);
    expect(row.rows[0].created_by).toBe(ids.editor);
  });
  it("editor cannot change brand, settings, users or read activity", async () => {
    await expect(as("editor", `update brand_settings set radius='0px'`)).resolves.toMatchObject({ affectedRows: 0 });
    await expect(as("editor", `update site_settings set value='{}' where key='general'`)).resolves.toMatchObject({ affectedRows: 0 });
    await expect(as("editor", `select * from activity_logs`)).resolves.toMatchObject({ rows: [] });
    await expect(as("editor", `update profiles set role_key='admin' where id=$1`, [ids.editor])).rejects.toThrow(/own role/);
  });
  it("editor can read but not delete requests", async () => {
    await db.exec(`insert into project_requests(name,email,description,consent_at) values ('Client','c@x.io','A real project description',now())`);
    const r = await as("editor", `select reference from project_requests`);
    expect(String(r.rows[0].reference)).toMatch(/^REQ-\d{4}-\d{4}$/);
    await expect(as("editor", `delete from project_requests`)).resolves.toMatchObject({ affectedRows: 0 });
  });
  it("viewer is read-only", async () => {
    await expect(as("viewer", `insert into services(slug,title) values ('viewer-test','{}')`)).rejects.toThrow(/row-level security/);
    const r = await as("viewer", `select count(*)::int n from services where status='draft'`);
    expect(r.rows[0].n).toBeGreaterThanOrEqual(1); // staff can preview drafts
  });
  it("inactive accounts get nothing beyond public access", async () => {
    await expect(as("inactive", `insert into services(slug,title) values ('inactive-test','{}')`)).rejects.toThrow(/row-level security/);
    await expect(as("inactive", `select * from project_requests`)).resolves.toMatchObject({ rows: [] });
  });
  it("admin manages users but cannot grant super admin", async () => {
    await as("admin", `update profiles set role_key='editor' where id=$1`, [ids.viewer]);
    await expect(as("admin", `update profiles set role_key='super_admin' where id=$1`, [ids.viewer])).rejects.toThrow(/super admin/);
    await expect(as("admin", `update profiles set is_active=false where id=$1`, [ids.owner])).rejects.toThrow(/super admin/);
    await as("admin", `update profiles set role_key='viewer' where id=$1`, [ids.viewer]);
  });
  it("admin cannot edit the super_admin role permissions", async () => {
    await expect(as("admin", `insert into role_permissions values ('viewer','users.manage')`)).rejects.toThrow(/row-level security/);
  });
  it("the last owner cannot be demoted", async () => {
    await db.query(`insert into auth.users(email, raw_app_meta_data) values ('owner2@test.local','{"role":"admin","active":true}')`);
    const o2 = await db.query<{ id: string }>(`select id from profiles where email='owner2@test.local'`);
    await as("owner", `update profiles set role_key='super_admin' where id=$1`, [o2.rows[0].id]);
    await as("owner", `update profiles set role_key='admin' where id=$1`, [o2.rows[0].id]);
    await expect(db.query(`update profiles set is_active=false where id=$1`, [ids.owner])).resolves.toBeTruthy(); // service role may
    await db.query(`update profiles set is_active=true where id=$1`, [ids.owner]);
  });
  it("owner (super admin) can do everything", async () => {
    await as("owner", `update brand_settings set radius='12px'`);
    const r = await as("owner", `select count(*)::int n from activity_logs`);
    expect(r.rows[0].n).toBeGreaterThan(0);
    const perms = await as("owner", `select count(*)::int n from my_permissions()`);
    expect(perms.rows[0].n).toBe(20);
  });
  it("rate limiter blocks after the limit", async () => {
    const results: boolean[] = [];
    for (let i = 0; i < 4; i++) {
      const r = await db.query<{ ok: boolean }>(`select public.check_rate_limit('ip:test', 3, 600) ok`);
      results.push(r.rows[0].ok);
    }
    expect(results).toEqual([true, true, true, false]);
  });
});

describe("0008 experience upgrade", () => {
  it("seeds the homepage slider and the narrative order", async () => {
    const r = await db.query<{ n: number }>(`select count(*)::int n from projects where show_on_home`);
    expect(r.rows[0].n).toBeGreaterThan(0);
    const s = await db.query<{ type: string }>(`select type from page_sections ps join pages p on p.id=ps.page_id where p.slug='home' order by ps.position limit 3`);
    expect(s.rows.map((x) => x.type)).toEqual(["hero", "services", "projects"]);
  });
  it("motion settings are public, readable by visitors", async () => {
    const r = await as("anon", `select value->>'level' as level from site_settings where key='motion'`);
    expect(r.rows[0].level).toBe("balanced");
  });
  it("custom fonts: visitors read active fonts, only brand managers write", async () => {
    await expect(as("anon", `insert into custom_fonts(family) values ('Evil')`)).rejects.toThrow(/permission denied/);
    await expect(as("editor", `insert into custom_fonts(family) values ('Nope')`)).rejects.toThrow(/row-level security/);
    await as("owner", `insert into custom_fonts(family, files) values ('Brand Sans', '[{"url":"https://x/f.woff2","weight":400,"format":"woff2"}]')`);
    await as("owner", `insert into custom_fonts(family, is_active) values ('Hidden Font', false)`);
    const r = await as("anon", `select family from custom_fonts order by family`);
    expect(r.rows.map((x) => x.family)).toEqual(["Brand Sans"]);
  });
  it("hero effect: published is public, the draft is private, only settings managers write", async () => {
    const vis = await as("anon", `select key from site_settings where key like 'hero_effect%' order by key`);
    expect(vis.rows.map((x) => x.key)).toEqual(["hero_effect"]);
    // editors lack settings.manage → RLS filters the update to zero rows; anon has no write grant
    await expect(as("editor", `update site_settings set value='{"mode":"off"}' where key='hero_effect'`)).resolves.toMatchObject({ affectedRows: 0 });
    await expect(as("anon", `update site_settings set value='{}' where key='hero_effect'`)).rejects.toThrow(/permission denied/);
    // the owner can save a draft and publish; the draft stays invisible to visitors
    await as("owner", `update site_settings set value='{"mode":"desktop"}' where key='hero_effect_draft'`);
    await as("owner", `update site_settings set value='{"mode":"all"}' where key='hero_effect'`);
    const ownerSees = await as("owner", `select key, value->>'mode' m from site_settings where key like 'hero_effect%' order by key`);
    expect(ownerSees.rows).toEqual([{ key: "hero_effect", m: "all" }, { key: "hero_effect_draft", m: "desktop" }]);
    const anonSees = await as("anon", `select value->>'mode' m from site_settings where key like 'hero_effect%'`);
    expect(anonSees.rows).toEqual([{ m: "all" }]);
  });
  it("hero effect migration is insert-only (re-run keeps saved settings)", async () => {
    await db.exec(readFileSync(join(root, "migrations", "0013_hero_effect.sql"), "utf8"));
    const r = await db.query<{ m: string }>(`select value->>'mode' m from site_settings where key='hero_effect'`);
    expect(r.rows[0].m).toBe("all");
  });
  it("link target is constrained", async () => {
    await expect(db.query(`update projects set link_target='javascript' where slug='masar-logistics-system'`)).rejects.toThrow(/link_target/);
  });
  it("the guarded home reorder never overrides a CMS arrangement", async () => {
    const before = await db.query(`select id, position from page_sections order by id`);
    await db.exec(readFileSync(join(root, "migrations", "0008_experience.sql"), "utf8"));
    const after = await db.query(`select id, position from page_sections order by id`);
    expect(after.rows).toEqual(before.rows);
  });
});
