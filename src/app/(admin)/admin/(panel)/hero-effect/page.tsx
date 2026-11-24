import { HeroEffectManager } from "@/components/admin/HeroEffectManager";
import { requirePage } from "@/lib/auth";
import { sanitizeHeroEffect } from "@/lib/hero-effect";
import { createSessionClient } from "@/lib/supabase/clients";

export const dynamic = "force-dynamic";

/** CMS → Hero effect: draft/publish settings for the homepage particle grid. */
export default async function HeroEffectPage() {
  await requirePage("settings.manage");
  const sb = await createSessionClient();
  const [{ data: rows }, { data: hero }, { data: brand }] = await Promise.all([
    sb.from("site_settings").select("key,value,updated_at").in("key", ["hero_effect", "hero_effect_draft"]),
    sb.from("page_sections").select("content, pages!inner(slug)").eq("type", "hero").eq("pages.slug", "home").order("position").limit(1).maybeSingle(),
    sb.from("brand_settings").select("backgrounds").eq("id", 1).maybeSingle(),
  ]);
  const row = (k: string) => rows?.find((r) => r.key === k);
  const live = row("hero_effect");
  const draft = row("hero_effect_draft");
  const hasDraft = draft?.value && Object.keys(draft.value as object).length > 0;
  const title = (hero?.content as { title?: Record<string, string> } | null)?.title ?? {};
  return (
    <HeroEffectManager
      published={sanitizeHeroEffect(live?.value)}
      draft={sanitizeHeroEffect(hasDraft ? draft?.value : live?.value)}
      publishedAt={live && Object.keys((live.value as object) ?? {}).length ? (live.updated_at as string) : null}
      draftAt={hasDraft ? (draft?.updated_at as string) : null}
      heroTitle={title}
      brandColors={(brand?.backgrounds as Record<string, unknown> | null)?.particles}
    />
  );
}
