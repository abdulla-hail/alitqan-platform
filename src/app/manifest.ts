import type { MetadataRoute } from "next";
import { pick } from "@/lib/i18n";
import { getSiteContext } from "@/services/site";

export const revalidate = 3600;

/** PWA manifest: name from the CMS brand, icons from the official mark package (public/brand). */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = "ALITQAN — إتقان";
  let short = "ALITQAN";
  let description: string | undefined;
  let lang = "ar";
  try {
    const ctx = await getSiteContext("ar");
    lang = ctx.defaultLocale;
    const ar = pick(ctx.brand?.name, "ar");
    const en = pick(ctx.brand?.name, "en");
    if (ar || en) name = [en, ar].filter(Boolean).join(" — ");
    short = en || ar || short;
    description = pick(ctx.brand?.description, ctx.defaultLocale) || undefined;
  } catch {
    // database unavailable at build time: keep defaults
  }
  return {
    name,
    short_name: short,
    description,
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    start_url: `/${lang}`,
    scope: "/",
    display: "standalone",
    background_color: "#F7F9FD",
    theme_color: "#0756D8",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/brand/favicon.svg", sizes: "any", type: "image/svg+xml" },
    ],
    shortcuts: [
      { name: "اطلب مشروعك", short_name: "طلب", url: `/${lang}/request`, icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }] },
      { name: "تواصل معنا", short_name: "تواصل", url: `/${lang}/contact`, icons: [{ src: "/brand/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
