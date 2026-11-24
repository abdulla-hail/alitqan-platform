"use server";
import { z } from "zod";
import { guarded } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { publicEnv } from "@/lib/env";

export interface MediaRow {
  id: string;
  path: string;
  url: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt: Record<string, string>;
  folder: string;
  created_at: string;
}

export async function listMedia(opts: { search?: string; folder?: string; imagesOnly?: boolean; limit?: number } = {}) {
  return guarded("dashboard.view", async () => {
    const sb = await createSessionClient();
    let q = sb.from("media").select("*").order("created_at", { ascending: false }).limit(Math.min(opts.limit ?? 200, 500));
    if (opts.folder) q = q.eq("folder", opts.folder);
    if (opts.imagesOnly) q = q.like("mime_type", "image/%");
    if (opts.search) q = q.ilike("file_name", `%${opts.search.replace(/[%_]/g, "")}%`);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data ?? []) as MediaRow[];
  });
}

const registerSchema = z.object({
  path: z.string().min(3).max(300).regex(/^[\w-]+\/\d{4}-\d{2}\/[\w.-]+$/),
  url: z.string().url().max(2000),
  file_name: z.string().min(1).max(200),
  mime_type: z.string().max(120),
  size_bytes: z.number().int().nonnegative().max(10 * 1024 * 1024),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  folder: z.string().max(40).regex(/^[\w-]*$/),
});

/** Records an uploaded file in the media library (the upload itself went through Storage RLS). */
export async function registerMedia(input: unknown) {
  return guarded("media.manage", async () => {
    const m = registerSchema.parse(input);
    if (!m.url.startsWith(`${publicEnv.supabaseUrl}/storage/v1/object/public/media/`)) throw new Error("invalid input: url");
    const sb = await createSessionClient();
    const { data, error } = await sb.from("media").insert({ ...m, folder: m.folder || "general", bucket: "media" }).select("*").single();
    if (error) throw new Error(error.message);
    return data as MediaRow;
  });
}

export async function updateMedia(id: string, patch: { alt?: Record<string, string>; folder?: string; tags?: string[] }) {
  return guarded("media.manage", async () => {
    const sb = await createSessionClient();
    const clean: Record<string, unknown> = {};
    if (patch.alt) clean.alt = Object.fromEntries(Object.entries(patch.alt).map(([k, v]) => [k.slice(0, 10), String(v).slice(0, 300)]));
    if (patch.folder != null) clean.folder = patch.folder.replace(/[^\w-]/g, "").slice(0, 40) || "general";
    const { error } = await sb.from("media").update(clean).eq("id", id);
    if (error) throw new Error(error.message);
  });
}

export async function mediaUsage(url: string) {
  return guarded("dashboard.view", async () => {
    const sb = await createSessionClient();
    const { data, error } = await sb.rpc("media_usage", { p_url: url });
    if (error) throw new Error(error.message);
    return (data ?? []) as { entity: string; id: string }[];
  });
}

/** Deletes a file only when nothing references it (or force=true for super admins handled by RLS). */
export async function deleteMedia(id: string, force = false) {
  return guarded("media.manage", async () => {
    const sb = await createSessionClient();
    const { data: row, error } = await sb.from("media").select("*").eq("id", id).single();
    if (error || !row) throw new Error(error?.message ?? "not found");
    if (!force) {
      const { data: used } = await sb.rpc("media_usage", { p_url: row.url });
      if (used && (used as unknown[]).length) throw new Error("invalid input: in use");
    }
    const { error: se } = await sb.storage.from("media").remove([row.path]);
    if (se) throw new Error(se.message);
    const { error: de } = await sb.from("media").delete().eq("id", id);
    if (de) throw new Error(de.message);
  });
}
