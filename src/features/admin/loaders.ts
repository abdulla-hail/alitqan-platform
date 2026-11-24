import "server-only";
import { createSessionClient } from "@/lib/supabase/clients";
import type { RelationOptions } from "@/components/admin/FieldEditor";
import type { ResourceDef } from "./resources";

const label = (v: unknown, locale: string) => {
  if (v && typeof v === "object") {
    const o = v as Record<string, string>;
    return o[locale] || o.ar || o.en || "";
  }
  return String(v ?? "");
};

/** Options for relation selects + current join-table selections for a record. */
export async function loadRelations(def: ResourceDef, recordId: string | null, locale: string) {
  const sb = await createSessionClient();
  const relations: RelationOptions = {};
  const joined: Record<string, string[]> = {};
  for (const f of def.fields) {
    if ((f.kind === "relation" || f.kind === "relation_multi") && f.relation) {
      const { data } = await sb.from(f.relation.table).select(`id, ${f.relation.label}`).limit(500);
      relations[f.name] = ((data ?? []) as unknown as Record<string, unknown>[])
        .filter((r) => r.id !== recordId)
        .map((r) => ({ value: String(r.id), label: label(r[f.relation!.label], locale) }));
    }
    if (f.kind === "relation_multi" && f.join && recordId) {
      const { data } = await sb.from(f.join.table).select(f.join.other).eq(f.join.self, recordId);
      joined[f.name] = ((data ?? []) as unknown as Record<string, string>[]).map((r) => r[f.join!.other]);
    }
  }
  return { relations, joined };
}

export async function loadRecord(def: ResourceDef, id: string) {
  const sb = await createSessionClient();
  const { data } = await sb.from(def.table).select("*").eq("id", id).maybeSingle();
  if (!data) return null;
  const record = data as Record<string, unknown>;
  for (const f of def.fields) {
    if (f.kind === "gallery" && f.gallery) {
      const { data: imgs } = await sb.from(f.gallery.table).select("url,alt,position").eq(f.gallery.fk, id).order("position");
      record[f.name] = imgs ?? [];
    }
  }
  return record;
}
