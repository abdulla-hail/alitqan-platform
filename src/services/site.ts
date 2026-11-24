import "server-only";
import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/clients";
import { isSupabaseConfigured } from "@/lib/env";
import { makeTranslator, type Translator } from "@/lib/i18n";
import type { BrandSettings, Language, NavItem } from "@/types/content";
import type { CustomFont } from "@/lib/brand/fonts";

export interface SiteContext {
  locale: string;
  dir: "rtl" | "ltr";
  defaultLocale: string;
  languages: Language[];
  brand: BrandSettings | null;
  settings: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  nav: { header: NavItem[]; footer: NavItem[]; footer_bottom: NavItem[] };
  dict: Record<string, string>;
  t: Translator;
  customFonts: CustomFont[];
}

export class SetupRequiredError extends Error {}

function tree(items: NavItem[]): NavItem[] {
  const byParent = new Map<string | null, NavItem[]>();
  for (const it of items) {
    const list = byParent.get(it.parent_id) ?? [];
    list.push({ ...it });
    byParent.set(it.parent_id, list);
  }
  const build = (pid: string | null): NavItem[] =>
    (byParent.get(pid) ?? []).sort((a, b) => a.position - b.position).map((n) => ({ ...n, children: build(n.id) }));
  return build(null);
}

/** Global site data, deduplicated per request with React cache(). */
export const getLanguages = cache(async (): Promise<Language[]> => {
  if (!isSupabaseConfigured()) throw new SetupRequiredError("Supabase is not configured");
  const { data, error } = await createPublicClient().from("languages").select("*").eq("is_enabled", true).order("position");
  if (error) throw new SetupRequiredError(error.message);
  return (data ?? []) as Language[];
});

export const getSiteContext = cache(async (locale: string): Promise<SiteContext> => {
  const sb = createPublicClient();
  const languages = await getLanguages();
  const def = languages.find((l) => l.is_default) ?? languages[0];
  const current = languages.find((l) => l.code === locale) ?? def;
  const locales = [...new Set([current.code, def.code])];
  const [brand, settings, nav, tr, fonts] = await Promise.all([
    sb.from("brand_settings").select("*").eq("id", 1).maybeSingle(),
    sb.from("site_settings").select("key,value"),
    sb.from("navigation_items").select("*").order("position"),
    sb.from("translations").select("key,locale,value").in("locale", locales).limit(5000),
    sb.from("custom_fonts").select("family,script,files").eq("is_active", true),
  ]);
  const dict: Record<string, string> = {};
  const fallback: Record<string, string> = {};
  for (const row of tr.data ?? []) {
    if (!row.value) continue;
    if (row.locale === current.code) dict[row.key] = row.value;
    else fallback[row.key] = row.value;
  }
  const items = (nav.data ?? []) as NavItem[];
  return {
    locale: current.code,
    dir: current.dir,
    defaultLocale: def.code,
    languages,
    brand: (brand.data as BrandSettings) ?? null,
    settings: Object.fromEntries((settings.data ?? []).map((s) => [s.key, s.value])),
    nav: {
      header: tree(items.filter((i) => i.menu === "header")),
      footer: tree(items.filter((i) => i.menu === "footer")),
      footer_bottom: tree(items.filter((i) => i.menu === "footer_bottom")),
    },
    dict,
    t: makeTranslator(dict, fallback),
    customFonts: (fonts.data ?? []) as CustomFont[],
  };
});
