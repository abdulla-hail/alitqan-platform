"use server";
import { revalidatePath } from "next/cache";
import { guarded } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { RESOURCE_MAP } from "./resources";
import { requiredMissing, sanitizeValue, ValidationError } from "./sanitize";

/** Purge cached public pages after any content change (ISR). */
export async function refreshSite() {
  revalidatePath("/", "layout");
}

async function locales(sb: Awaited<ReturnType<typeof createSessionClient>>) {
  const { data } = await sb.from("languages").select("code,is_default").order("position");
  const list = (data ?? []) as { code: string; is_default: boolean }[];
  return { codes: list.map((l) => l.code), def: list.find((l) => l.is_default)?.code ?? list[0]?.code ?? "ar" };
}

/** Create or update any CMS resource. Validation + permission on the server; RLS in the DB. */
export async function saveRecord(resourceKey: string, id: string | null, values: Record<string, unknown>) {
  const def = RESOURCE_MAP[resourceKey];
  if (!def) return { ok: false as const, error: "invalid" };
  return guarded(def.permission, async () => {
    const sb = await createSessionClient();
    const { codes, def: defLocale } = await locales(sb);
    const row: Record<string, unknown> = {};
    const joins: { table: string; self: string; other: string; ids: string[] }[] = [];
    let gallery: { table: string; fk: string; items: { url: string; alt: Record<string, string> }[] } | null = null;
    for (const f of def.fields) {
      if (!(f.name in values)) continue;
      let v: unknown;
      try {
        v = sanitizeValue(f, values[f.name], codes);
      } catch (e) {
        if (e instanceof ValidationError) throw new Error(`invalid input: ${e.field}`);
        throw e;
      }
      if (v == null && f.default !== undefined) v = f.default;
      if (requiredMissing(f, v, defLocale)) throw new Error(`invalid input: required ${f.name}`);
      if (f.kind === "relation_multi" && f.join) joins.push({ ...f.join, ids: v as string[] });
      else if (f.kind === "gallery" && f.gallery) gallery = { ...f.gallery, items: v as { url: string; alt: Record<string, string> }[] };
      else row[f.name] = v;
    }
    if (def.key === "pages" && id) {
      const { data: cur } = await sb.from("pages").select("kind,slug").eq("id", id).single();
      if (cur?.kind === "system") {
        row.kind = "system";
        row.slug = cur.slug; // routes depend on system page slugs
      }
    } else if (def.key === "pages" && row.kind === "system") row.kind = "custom";
    let recordId = id;
    if (id) {
      const { error } = await sb.from(def.table).update(row).eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      if (def.sortable) {
        const { data: last } = await sb.from(def.table).select("position").order("position", { ascending: false }).limit(1).maybeSingle();
        row.position = ((last?.position as number | undefined) ?? -1) + 1;
      }
      const { data, error } = await sb.from(def.table).insert(row).select("id").single();
      if (error) throw new Error(error.message);
      recordId = data.id as string;
    }
    for (const j of joins) {
      const { error: delErr } = await sb.from(j.table).delete().eq(j.self, recordId);
      if (delErr) throw new Error(delErr.message);
      if (j.ids.length) {
        const { error } = await sb.from(j.table).insert(j.ids.map((other) => ({ [j.self]: recordId, [j.other]: other })));
        if (error) throw new Error(error.message);
      }
    }
    if (gallery) {
      await sb.from(gallery.table).delete().eq(gallery.fk, recordId);
      if (gallery.items.length) {
        const { error } = await sb.from(gallery.table).insert(gallery.items.map((g, i) => ({ [gallery!.fk]: recordId, url: g.url, alt: g.alt, position: i })));
        if (error) throw new Error(error.message);
      }
    }
    await refreshSite();
    return { id: recordId };
  });
}

export async function deleteRecord(resourceKey: string, id: string) {
  const def = RESOURCE_MAP[resourceKey];
  if (!def) return { ok: false as const, error: "invalid" };
  return guarded(def.permission, async () => {
    const sb = await createSessionClient();
    if (def.key === "pages") {
      const { data } = await sb.from("pages").select("kind").eq("id", id).single();
      if (data?.kind === "system") throw new Error("invalid input: system pages cannot be deleted");
    }
    const { error, count } = await sb.from(def.table).delete({ count: "exact" }).eq("id", id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("permission denied");
    await refreshSite();
  });
}

export async function reorderRecords(resourceKey: string, ids: string[]) {
  const def = RESOURCE_MAP[resourceKey];
  if (!def?.sortable) return { ok: false as const, error: "invalid" };
  return guarded(def.permission, async () => {
    const sb = await createSessionClient();
    await Promise.all(ids.slice(0, 500).map((rid, i) => sb.from(def.table).update({ position: i }).eq("id", rid)));
    await refreshSite();
  });
}

export async function setRecordField(resourceKey: string, id: string, field: "status" | "is_visible" | "is_featured" | "show_on_home", value: string | boolean) {
  if (field === "show_on_home" && resourceKey !== "projects") return { ok: false as const, error: "invalid" };
  const def = RESOURCE_MAP[resourceKey];
  if (!def) return { ok: false as const, error: "invalid" };
  if (field === "status" && !["draft", "published", "archived"].includes(String(value))) return { ok: false as const, error: "invalid" };
  return guarded(def.permission, async () => {
    const sb = await createSessionClient();
    const { error } = await sb.from(def.table).update({ [field]: field === "status" ? value : Boolean(value) }).eq("id", id);
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}

export async function duplicateRecord(resourceKey: string, id: string) {
  const def = RESOURCE_MAP[resourceKey];
  if (!def) return { ok: false as const, error: "invalid" };
  return guarded(def.permission, async () => {
    const sb = await createSessionClient();
    const { data: src, error } = await sb.from(def.table).select("*").eq("id", id).single();
    if (error || !src) throw new Error(error?.message ?? "not found");
    const copy: Record<string, unknown> = { ...src };
    for (const k of ["id", "created_at", "updated_at", "created_by", "updated_by", "published_at"]) delete copy[k];
    if ("slug" in copy && copy.slug) copy.slug = `${copy.slug}-copy-${Date.now().toString(36).slice(-4)}`;
    if ("status" in copy) copy.status = "draft";
    if (def.key === "pages") copy.kind = "custom";
    const { data: ins, error: e2 } = await sb.from(def.table).insert(copy).select("id").single();
    if (e2) throw new Error(e2.message);
    if (def.key === "pages") {
      const { data: secs } = await sb.from("page_sections").select("type,label,position,is_visible,content,settings").eq("page_id", id);
      if (secs?.length) await sb.from("page_sections").insert(secs.map((s) => ({ ...s, page_id: ins.id })));
    }
    if (def.key === "projects") {
      const { data: imgs } = await sb.from("project_images").select("url,alt,position").eq("project_id", id);
      if (imgs?.length) await sb.from("project_images").insert(imgs.map((s) => ({ ...s, project_id: ins.id })));
    }
    return { id: ins.id as string };
  });
}

/** Homepage slider order (projects.home_position), set by drag & drop in CMS → Projects slider. */
export async function reorderHomeProjects(ids: string[]) {
  return guarded("projects.manage", async () => {
    const sb = await createSessionClient();
    await Promise.all(ids.slice(0, 100).map((id, i) => sb.from("projects").update({ home_position: i }).eq("id", id)));
    await refreshSite();
  });
}

export async function setHomeProject(id: string, show: boolean, linkTarget?: "_self" | "_blank") {
  return guarded("projects.manage", async () => {
    const sb = await createSessionClient();
    const patch: Record<string, unknown> = { show_on_home: show };
    if (linkTarget === "_self" || linkTarget === "_blank") patch.link_target = linkTarget;
    if (show) {
      const { data: last } = await sb.from("projects").select("home_position").eq("show_on_home", true).order("home_position", { ascending: false }).limit(1).maybeSingle();
      patch.home_position = ((last?.home_position as number | undefined) ?? -1) + 1;
    }
    const { error } = await sb.from("projects").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}
