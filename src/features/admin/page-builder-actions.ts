"use server";
import { guarded } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { SECTION_MAP } from "@/features/sections/registry";
import { refreshSite } from "./actions";
import { sanitizeValue } from "./sanitize";

async function codes(sb: Awaited<ReturnType<typeof createSessionClient>>) {
  const { data } = await sb.from("languages").select("code");
  return (data ?? []).map((l) => l.code as string);
}

function clean(type: string, content: Record<string, unknown>, settings: Record<string, unknown>, locales: string[]) {
  const def = SECTION_MAP[type];
  if (!def) throw new Error("invalid input: section type");
  const c: Record<string, unknown> = {};
  for (const f of def.fields) c[f.name] = sanitizeValue(f, content?.[f.name], locales);
  const s: Record<string, unknown> = {};
  for (const f of def.settings ?? []) s[f.name] = sanitizeValue(f, settings?.[f.name], locales);
  return { c, s };
}

export async function addSection(pageId: string, type: string) {
  return guarded("pages.manage", async () => {
    if (!SECTION_MAP[type]) throw new Error("invalid input: type");
    const sb = await createSessionClient();
    const { data: last } = await sb.from("page_sections").select("position").eq("page_id", pageId).order("position", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await sb
      .from("page_sections")
      .insert({ page_id: pageId, type, position: ((last?.position as number) ?? -1) + 1, content: {}, settings: {} })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await refreshSite();
    return data;
  });
}

export async function saveSection(id: string, input: { content: Record<string, unknown>; settings: Record<string, unknown>; label?: string | null }) {
  return guarded("pages.manage", async () => {
    const sb = await createSessionClient();
    const { data: row } = await sb.from("page_sections").select("type").eq("id", id).single();
    if (!row) throw new Error("not found");
    const { c, s } = clean(row.type as string, input.content, input.settings, await codes(sb));
    const { error } = await sb.from("page_sections").update({ content: c, settings: s, label: input.label?.slice(0, 120) || null }).eq("id", id);
    if (error) throw new Error(error.message);
    await refreshSite();
    return { content: c, settings: s };
  });
}

export async function setSectionVisible(id: string, visible: boolean) {
  return guarded("pages.manage", async () => {
    const sb = await createSessionClient();
    const { error } = await sb.from("page_sections").update({ is_visible: visible }).eq("id", id);
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}

export async function deleteSection(id: string) {
  return guarded("pages.manage", async () => {
    const sb = await createSessionClient();
    const { error } = await sb.from("page_sections").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}

export async function duplicateSection(id: string) {
  return guarded("pages.manage", async () => {
    const sb = await createSessionClient();
    const { data: src } = await sb.from("page_sections").select("*").eq("id", id).single();
    if (!src) throw new Error("not found");
    const { data, error } = await sb
      .from("page_sections")
      .insert({ page_id: src.page_id, type: src.type, label: src.label, position: (src.position as number) + 1, is_visible: false, content: src.content, settings: src.settings })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return data;
  });
}

export async function reorderSections(pageId: string, ids: string[]) {
  return guarded("pages.manage", async () => {
    const sb = await createSessionClient();
    await Promise.all(ids.slice(0, 200).map((id, i) => sb.from("page_sections").update({ position: i }).eq("id", id).eq("page_id", pageId)));
    await refreshSite();
  });
}
