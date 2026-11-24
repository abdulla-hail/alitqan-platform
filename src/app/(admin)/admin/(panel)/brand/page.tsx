import { BrandManager } from "@/components/admin/BrandManager";
import { FALLBACK_PALETTES } from "@/lib/brand/theme";
import { requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import type { BrandSettings } from "@/types/content";

export default async function BrandPage() {
  await requirePage("brand.manage");
  const sb = await createSessionClient();
  const { data } = await sb.from("brand_settings").select("*").eq("id", 1).maybeSingle();
  const b = (data ?? {}) as Partial<BrandSettings>;
  const brand: BrandSettings = {
    name: b.name ?? {}, tagline: b.tagline ?? {}, description: b.description ?? {}, logo_mode: !b.logo_mode || b.logo_mode === "builtin" ? "mark" : b.logo_mode,
    logo_system: b.logo_system ?? {},
    logo_url: b.logo_url ?? null, logo_dark_url: b.logo_dark_url ?? null, logo_alt_url: b.logo_alt_url ?? null, symbol_url: b.symbol_url ?? null,
    favicon_url: b.favicon_url ?? null, og_image_url: b.og_image_url ?? null,
    colors: { light: { ...FALLBACK_PALETTES.light, ...(b.colors?.light ?? {}) }, dark: { ...FALLBACK_PALETTES.dark, ...(b.colors?.dark ?? {}) }, dark_brand: b.colors?.dark_brand === "custom" ? "custom" : "same" },
    fonts: b.fonts ?? {}, radius: b.radius ?? "14px", backgrounds: b.backgrounds ?? {}, default_theme: b.default_theme === "dark" ? "dark" : "light",
  };
  return <BrandManager brand={brand} />;
}
