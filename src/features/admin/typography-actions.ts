"use server";
import { z } from "zod";
import { guarded } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { publicEnv } from "@/lib/env";
import { ALLOWED_WEIGHTS, safeFamily } from "@/lib/brand/fonts";
import { refreshSite } from "./actions";

const FAMILY = /^[A-Za-z0-9 ]{2,60}$/;

/** Saves Typography Settings into brand_settings.fonts (other brand fields untouched). */
export async function saveTypography(input: { display_ar?: string; body_ar?: string; display_en?: string; body_en?: string; admin?: string; unify?: boolean; weights?: number[] }) {
  return guarded("brand.manage", async () => {
    const weights = [...new Set((input.weights ?? []).map(Number).filter((w) => (ALLOWED_WEIGHTS as readonly number[]).includes(w)))].sort((a, b) => a - b);
    if (!weights.includes(400)) weights.unshift(400); // body text always needs regular
    const fonts = {
      display_ar: safeFamily(input.display_ar, "Alexandria"),
      body_ar: safeFamily(input.body_ar, "IBM Plex Sans Arabic"),
      display_en: safeFamily(input.display_en, "Sora"),
      body_en: safeFamily(input.body_en, "Inter"),
      admin: safeFamily(input.admin, safeFamily(input.body_ar, "IBM Plex Sans Arabic")),
      unify: Boolean(input.unify),
      weights,
    };
    const sb = await createSessionClient();
    const { error } = await sb.from("brand_settings").update({ fonts }).eq("id", 1);
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}

const fileSchema = z.object({
  url: z.string().url().max(2000),
  weight: z.number().int().min(100).max(900).refine((w) => w % 100 === 0),
  style: z.enum(["normal", "italic"]).default("normal"),
  format: z.enum(["woff2", "woff"]),
});

/** Registers an uploaded font family (files already uploaded to the media bucket). */
export async function registerFont(input: { family: string; script: string; files: unknown[] }) {
  return guarded("brand.manage", async () => {
    const family = String(input.family ?? "").trim();
    if (!FAMILY.test(family)) throw new Error("invalid input: family");
    const script = ["arabic", "latin", "both"].includes(input.script) ? input.script : "both";
    const files = z.array(fileSchema).min(1).max(18).parse(input.files);
    const prefix = `${publicEnv.supabaseUrl}/storage/v1/object/public/media/`;
    if (files.some((f) => !f.url.startsWith(prefix) || !new RegExp(`\\.${f.format}$`, "i").test(f.url))) throw new Error("invalid input: url");
    const sb = await createSessionClient();
    const { error } = await sb.from("custom_fonts").insert({ family, script, files, is_active: true });
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}

export async function setFontActive(id: string, active: boolean) {
  return guarded("brand.manage", async () => {
    const sb = await createSessionClient();
    const { error } = await sb.from("custom_fonts").update({ is_active: active }).eq("id", id);
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}

export async function deleteFont(id: string) {
  return guarded("brand.manage", async () => {
    const sb = await createSessionClient();
    const { data: font } = await sb.from("custom_fonts").select("family").eq("id", id).single();
    const { data: brand } = await sb.from("brand_settings").select("fonts").eq("id", 1).single();
    const inUse = font && Object.values((brand?.fonts ?? {}) as Record<string, unknown>).includes(font.family);
    if (inUse) throw new Error("invalid input: font in use");
    const { error, count } = await sb.from("custom_fonts").delete({ count: "exact" }).eq("id", id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("permission denied");
    await refreshSite();
  });
}
