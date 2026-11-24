"use server";
import { z } from "zod";
import { guarded } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { safeColor, safeFont } from "@/lib/brand/theme";
import { refreshSite } from "./actions";
import { safeUrl } from "./sanitize";
import { sanitizeMotion } from "@/lib/motion";
import { publicEnv } from "@/lib/env";
import { sanitizeSvg } from "@/lib/svg-safety";
import { radiusValue } from "@/lib/brand/radius";
import { sanitizeBrandParticles } from "@/lib/brand/particles";
import { normalizeSocial } from "@/lib/social";

type SB = Awaited<ReturnType<typeof createSessionClient>>;
async function codes(sb: SB) {
  const { data } = await sb.from("languages").select("code");
  return (data ?? []).map((l) => l.code as string);
}
const loc = (v: unknown, langs: string[], max = 400) => {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return Object.fromEntries(langs.map((l) => [l, String(o[l] ?? "").trim().slice(0, max)]).filter(([, s]) => s));
};

/* ------------------------------------------------------------------ navigation */
export async function saveNavItem(input: { id?: string | null; menu: string; parent_id?: string | null; label: Record<string, string>; href: string; new_tab?: boolean; is_visible?: boolean }) {
  return guarded("navigation.manage", async () => {
    const sb = await createSessionClient();
    if (!["header", "footer", "footer_bottom"].includes(input.menu)) throw new Error("invalid input: menu");
    const row = {
      menu: input.menu,
      parent_id: input.parent_id && /^[0-9a-f-]{36}$/.test(input.parent_id) ? input.parent_id : null,
      label: loc(input.label, await codes(sb), 120),
      href: safeUrl(input.href || "#", "href") ?? "#",
      new_tab: Boolean(input.new_tab),
      is_visible: input.is_visible !== false,
    };
    if (input.id) {
      if (row.parent_id === input.id) throw new Error("invalid input: parent");
      const { error } = await sb.from("navigation_items").update(row).eq("id", input.id);
      if (error) throw new Error(error.message);
    } else {
      const { data: last } = await sb.from("navigation_items").select("position").eq("menu", row.menu).order("position", { ascending: false }).limit(1).maybeSingle();
      const { error } = await sb.from("navigation_items").insert({ ...row, position: ((last?.position as number) ?? -1) + 1 });
      if (error) throw new Error(error.message);
    }
    await refreshSite();
  });
}
export async function deleteNavItem(id: string) {
  return guarded("navigation.manage", async () => {
    const sb = await createSessionClient();
    const { error } = await sb.from("navigation_items").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}
export async function reorderNav(ids: string[]) {
  return guarded("navigation.manage", async () => {
    const sb = await createSessionClient();
    await Promise.all(ids.slice(0, 300).map((id, i) => sb.from("navigation_items").update({ position: i }).eq("id", id)));
    await refreshSite();
  });
}

/* ------------------------------------------------------------------ brand */
const LOGO_COLOR_KEYS = ["dark", "deep", "primary", "bright", "mono"] as const;
/** Whitelist the logo-system settings (colours must be hex; variants from fixed lists). */
function cleanLogoSystem(v: unknown, prev: Record<string, unknown> | null | undefined) {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const c = (o.colors && typeof o.colors === "object" ? o.colors : {}) as Record<string, unknown>;
  const colors = Object.fromEntries(LOGO_COLOR_KEYS.flatMap((k) => (typeof c[k] === "string" && safeColor(c[k], "") ? [[k, String(c[k]).toUpperCase()]] : [])));
  return {
    colors,
    on_light: ["color", "dark", "mono"].includes(String(o.on_light)) ? o.on_light : "color",
    on_dark: ["light", "white", "color", "mono"].includes(String(o.on_dark)) ? o.on_dark : "light",
    show_name: Boolean(o.show_name),
    dark_mode_logo: o.dark_mode_logo === "variant" ? "variant" : "original",
    header_name: Object.fromEntries(Object.entries(o.header_name && typeof o.header_name === "object" ? (o.header_name as Record<string, unknown>) : {}).filter(([k, v]) => /^[a-z]{2}(-[A-Z]{2})?$/.test(k) && typeof v === "string" && v.trim()).map(([k, v]) => [k, String(v).replace(/[<>]/g, "").trim().slice(0, 40)])),
    // server-owned: never taken from the client
    ...(prev?.previous_colors ? { previous_colors: prev.previous_colors } : {}),
  };
}

/** Uploaded SVG logos must come from our own storage (or /brand) and pass the sanitiser again on the server. */
async function assertSafeSvgUrl(url: string | null, field: string) {
  if (!url || !/\.svg(\?|#|$)/i.test(url)) return;
  if (/^\/brand\/[\w.-]+\.svg$/.test(url)) return;
  const own = publicEnv.supabaseUrl && url.startsWith(`${publicEnv.supabaseUrl}/storage/v1/object/public/`);
  if (!own) throw new Error(`invalid input: ${field} (SVG must be uploaded to the media library)`);
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`invalid input: ${field} (file not reachable)`);
  const check = sanitizeSvg(await res.text());
  if (!check.ok) throw new Error(`invalid input: ${field} (unsafe SVG: ${check.reason})`);
}

export async function saveBrand(input: Record<string, unknown>) {
  return guarded("brand.manage", async () => {
    const sb = await createSessionClient();
    const langs = await codes(sb);
    const palette = (p: unknown, fb: Record<string, string>) => {
      const o = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
      return Object.fromEntries(["primary", "secondary", "accent", "background", "surface", "foreground", "muted", "border"].map((k) => [k, safeColor(o[k], fb[k])]));
    };
    const { data: cur } = await sb.from("brand_settings").select("colors, logo_system").eq("id", 1).single();
    const colors = (input.colors ?? {}) as Record<string, unknown>;
    const row = {
      name: loc(input.name, langs, 80),
      tagline: loc(input.tagline, langs, 200),
      description: loc(input.description, langs, 400),
      logo_mode: ["mark", "symbol_text", "uploaded"].includes(String(input.logo_mode)) ? input.logo_mode : "mark",
      logo_system: cleanLogoSystem(input.logo_system, cur?.logo_system as Record<string, unknown> | null),
      logo_url: safeUrl(input.logo_url, "logo_url"),
      logo_dark_url: safeUrl(input.logo_dark_url, "logo_dark_url"),
      logo_alt_url: safeUrl(input.logo_alt_url, "logo_alt_url"),
      symbol_url: safeUrl(input.symbol_url, "symbol_url"),
      favicon_url: safeUrl(input.favicon_url, "favicon_url"),
      og_image_url: safeUrl(input.og_image_url, "og_image_url"),
      colors: { light: palette(colors.light, cur?.colors?.light ?? {}), dark: palette(colors.dark, cur?.colors?.dark ?? {}), dark_brand: colors.dark_brand === "custom" ? "custom" : "same" },
      radius: radiusValue(input.radius), // Global Border Radius, clamped to 0–40px
      default_theme: input.default_theme === "dark" ? "dark" : "light", // two modes only — no device/system mode
      backgrounds: {
        pattern: (input.backgrounds as Record<string, unknown> | undefined)?.pattern === "none" ? "none" : "measure",
        particles: sanitizeBrandParticles((input.backgrounds as Record<string, unknown> | undefined)?.particles),
      },
    };
    if (row.logo_mode === "uploaded" && !row.logo_url) throw new Error("invalid input: logo_url required");
    for (const f of ["logo_url", "logo_dark_url", "logo_alt_url", "symbol_url", "favicon_url", "og_image_url"] as const) await assertSafeSvgUrl(row[f] ?? null, f);
    const { error } = await sb.from("brand_settings").update(row).eq("id", 1);
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}

/* ------------------------------------------------------------------ settings */
const SETTING_KEYS = ["general", "contact", "social", "seo", "forms", "notifications", "analytics", "motion"] as const;
export async function saveSetting(key: string, value: Record<string, unknown>) {
  return guarded("settings.manage", async () => {
    if (!(SETTING_KEYS as readonly string[]).includes(key)) throw new Error("invalid input: key");
    const sb = await createSessionClient();
    const langs = await codes(sb);
    let v: Record<string, unknown> = {};
    const s = (x: unknown, max = 300) => String(x ?? "").trim().slice(0, max);
    switch (key) {
      case "general":
        v = { site_url: safeUrl(value.site_url, "site_url") ?? "", copyright: loc(value.copyright, langs, 120) };
        break;
      case "contact":
        v = {
          email: z.string().email().or(z.literal("")).parse(s(value.email, 200)),
          phones: (Array.isArray(value.phones) ? value.phones : []).map((p) => s(p, 40)).filter((p) => /^[+\d\s()-]+$/.test(p)).slice(0, 5),
          whatsapp: s(value.whatsapp, 40).replace(/[^\d+]/g, ""),
          address: loc(value.address, langs, 300),
          hours: loc(value.hours, langs, 200),
          map_url: safeUrl(value.map_url, "map_url") ?? "",
        };
        break;
      case "social": {
        // dynamic platform list (order = display order); legacy key→url maps are converted
        const items = [];
        for (const it of normalizeSocial(value)) {
          const url = /^(mailto:|tel:)/i.test(it.url) ? it.url.replace(/[\s<>"]/g, "").slice(0, 200) : safeUrl(it.url, `social.${it.platform}`) ?? "";
          const icon = it.icon_url ? safeUrl(it.icon_url, "social.icon") ?? "" : "";
          if (icon) await assertSafeSvgUrl(icon, "social.icon");
          items.push({ ...it, url, icon_url: icon });
        }
        v = { items };
        break;
      }
      case "seo":
        v = { title_template: loc(value.title_template, langs, 120), default_title: loc(value.default_title, langs, 120), default_description: loc(value.default_description, langs, 320), keywords: loc(value.keywords, langs, 400), twitter_handle: s(value.twitter_handle, 40), google_verification: s(value.google_verification, 120) };
        break;
      case "forms":
        v = { budgets: (Array.isArray(value.budgets) ? value.budgets : []).map((b) => loc(b, langs, 80)).slice(0, 12), timelines: (Array.isArray(value.timelines) ? value.timelines : []).map((b) => loc(b, langs, 80)).slice(0, 12) };
        break;
      case "notifications":
        v = { recipients: (Array.isArray(value.recipients) ? value.recipients : []).map((e) => s(e, 200).toLowerCase()).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)).slice(0, 10) };
        break;
      case "motion":
        v = sanitizeMotion(value) as unknown as Record<string, unknown>; // clamped to safe ranges
        break;
      case "analytics":
        v = { ga_id: /^G-[A-Z0-9]{4,15}$/.test(s(value.ga_id)) ? s(value.ga_id) : "" };
        break;
    }
    const { error } = await sb.from("site_settings").upsert({ key, value: v, is_public: key !== "notifications" });
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}

export async function saveTemplate(key: string, input: { subject: Record<string, string>; body: Record<string, string>; is_enabled: boolean }) {
  return guarded("settings.manage", async () => {
    const sb = await createSessionClient();
    const langs = await codes(sb);
    const { error } = await sb.from("notification_templates").update({ subject: loc(input.subject, langs, 200), body: loc(input.body, langs, 5000), is_enabled: Boolean(input.is_enabled) }).eq("key", key);
    if (error) throw new Error(error.message);
  });
}

/** Removes every row seeded as demo content (is_demo = true). Super admin / settings managers only. */
export async function deleteDemoContent() {
  return guarded("settings.manage", async () => {
    const sb = await createSessionClient();
    for (const t of ["blog_posts", "projects", "services", "testimonials", "clients", "team_members", "blog_tags", "blog_categories", "project_categories", "service_categories"]) {
      const { error } = await sb.from(t).delete().eq("is_demo", true);
      if (error) throw new Error(error.message);
    }
    await refreshSite();
  });
}

/* ------------------------------------------------------------------ languages & translations */
export async function saveLanguage(input: { code: string; name: string; native_name: string; dir: string; is_enabled: boolean; is_new?: boolean }) {
  return guarded("languages.manage", async () => {
    const sb = await createSessionClient();
    const code = String(input.code).trim();
    if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(code)) throw new Error("invalid input: code");
    const row = { code, name: String(input.name).slice(0, 60), native_name: String(input.native_name).slice(0, 60), dir: input.dir === "rtl" ? "rtl" : "ltr", is_enabled: Boolean(input.is_enabled) };
    if (input.is_new) {
      const { data: last } = await sb.from("languages").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
      const { error } = await sb.from("languages").insert({ ...row, position: ((last?.position as number) ?? 0) + 1 });
      if (error) throw new Error(error.message);
    } else {
      const { data: cur } = await sb.from("languages").select("is_default").eq("code", code).single();
      if (cur?.is_default && !row.is_enabled) throw new Error("invalid input: default language must stay enabled");
      const { error } = await sb.from("languages").update(row).eq("code", code);
      if (error) throw new Error(error.message);
    }
    await refreshSite();
  });
}
export async function setDefaultLanguage(code: string) {
  return guarded("languages.manage", async () => {
    const sb = await createSessionClient();
    const { error: e1 } = await sb.from("languages").update({ is_default: false }).eq("is_default", true);
    if (e1) throw new Error(e1.message);
    const { error } = await sb.from("languages").update({ is_default: true, is_enabled: true }).eq("code", code);
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}
export async function deleteLanguage(code: string) {
  return guarded("languages.manage", async () => {
    const sb = await createSessionClient();
    const { data } = await sb.from("languages").select("is_default").eq("code", code).single();
    if (data?.is_default) throw new Error("invalid input: cannot delete default language");
    const { error } = await sb.from("languages").delete().eq("code", code);
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}
export async function saveTranslations(rows: { key: string; locale: string; value: string }[]) {
  return guarded("languages.manage", async () => {
    const sb = await createSessionClient();
    const clean = rows.slice(0, 2000).filter((r) => /^[a-z0-9_.-]{1,120}$/.test(r.key) && /^[a-z]{2}(-[A-Z]{2})?$/.test(r.locale)).map((r) => ({ key: r.key, locale: r.locale, value: String(r.value ?? "").slice(0, 2000), group_key: r.key.split(".")[0] }));
    const { error } = await sb.from("translations").upsert(clean, { onConflict: "key,locale" });
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}
export async function deleteTranslationKey(key: string) {
  return guarded("languages.manage", async () => {
    const sb = await createSessionClient();
    const { error } = await sb.from("translations").delete().eq("key", key);
    if (error) throw new Error(error.message);
    await refreshSite();
  });
}
