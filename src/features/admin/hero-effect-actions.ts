"use server";
import { guarded } from "@/lib/auth";
import { sanitizeHeroEffect } from "@/lib/hero-effect";
import { createSessionClient } from "@/lib/supabase/clients";
import { refreshSite } from "./actions";

/**
 * Hero particle effect — draft & publish.
 * Draft  → site_settings.hero_effect_draft (is_public = false: invisible to visitors)
 * Publish → copies the validated settings to site_settings.hero_effect (public) and
 *           revalidates the site so the homepage uses them immediately.
 * Both require the settings.manage permission (checked here and by RLS).
 */
const DRAFT = "hero_effect_draft";
const LIVE = "hero_effect";

async function write(key: string, value: unknown, isPublic: boolean) {
  const sb = await createSessionClient();
  const clean = sanitizeHeroEffect(value);
  const { data, error } = await sb
    .from("site_settings")
    .upsert({ key, value: clean, is_public: isPublic }, { onConflict: "key" })
    .select("updated_at")
    .single();
  if (error) throw new Error(error.message);
  return { settings: clean, updated_at: (data?.updated_at as string) ?? new Date().toISOString() };
}

export async function saveHeroEffectDraft(value: unknown) {
  return guarded("settings.manage", async () => write(DRAFT, value, false));
}

export async function publishHeroEffect(value: unknown) {
  return guarded("settings.manage", async () => {
    const draft = await write(DRAFT, value, false);
    const live = await write(LIVE, value, true);
    await refreshSite();
    return { settings: live.settings, draft_at: draft.updated_at, published_at: live.updated_at };
  });
}
