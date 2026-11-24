import type { Metadata } from "next";
import { normalizeSiteUrl, publicEnv } from "@/lib/env";
import { pick } from "@/lib/i18n";
import { socialUrls } from "@/lib/social";
import type { SiteContext } from "@/services/site";
import type { Localized, Seo } from "@/types/content";

export function siteUrl(ctx?: SiteContext) {
  // env (normalised) wins; otherwise the CMS setting; never an invalid URL
  if (normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)) return publicEnv.siteUrl;
  return normalizeSiteUrl(ctx?.settings?.general?.site_url) ?? publicEnv.siteUrl;
}

const absolute = (base: string, u?: string | null) => (!u ? undefined : /^https?:/.test(u) ? u : `${base}${u.startsWith("/") ? "" : "/"}${u}`);

/**
 * Builds per-page metadata: localized title/description, canonical URL, hreflang
 * alternates for every enabled language, Open Graph and Twitter cards.
 * `seo` (per-page overrides from the CMS) wins over title/description.
 */
export function buildMetadata(
  ctx: SiteContext,
  opts: { path: string; title?: Localized | string; description?: Localized | string; image?: string | null; seo?: Seo; type?: "website" | "article"; publishedTime?: string | null; noindex?: boolean },
): Metadata {
  const { locale, defaultLocale, settings, brand } = ctx;
  const base = siteUrl(ctx);
  const seoCfg = settings.seo ?? {};
  const override = opts.seo?.[locale];
  const brandName = pick(brand?.name, locale, defaultLocale) || "ALITQAN";
  const rawTitle = override?.title || (opts.title ? pick(opts.title as Localized, locale, defaultLocale) : "");
  const template = pick(seoCfg.title_template, locale, defaultLocale) || `%s | ${brandName}`;
  const title = rawTitle ? template.replace("%s", rawTitle) : pick(seoCfg.default_title, locale, defaultLocale) || brandName;
  const description =
    override?.description ||
    (opts.description ? pick(opts.description as Localized, locale, defaultLocale) : "") ||
    pick(seoCfg.default_description, locale, defaultLocale) ||
    pick(brand?.description, locale, defaultLocale);
  const image = absolute(base, override?.image || opts.image || brand?.og_image_url || "/brand/og-default.png");
  const path = opts.path ? `/${opts.path.replace(/^\//, "")}` : "";
  const languages: Record<string, string> = {};
  for (const l of ctx.languages) languages[l.code] = `${base}/${l.code}${path}`;
  languages["x-default"] = `${base}/${defaultLocale}${path}`;
  return {
    metadataBase: new URL(base),
    title: { absolute: title },
    description,
    keywords: pick(seoCfg.keywords, locale, defaultLocale) || undefined,
    alternates: { canonical: `${base}/${locale}${path}`, languages },
    openGraph: {
      type: opts.type ?? "website",
      title,
      description,
      url: `${base}/${locale}${path}`,
      siteName: brandName,
      locale: locale === "ar" ? "ar_SA" : locale.replace("-", "_"),
      images: image ? [{ url: image }] : undefined,
      ...(opts.publishedTime ? { publishedTime: opts.publishedTime } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined, site: seoCfg.twitter_handle || undefined },
    icons: brand?.favicon_url
      ? { icon: brand.favicon_url, apple: "/brand/apple-touch-icon.png" }
      : { icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }, { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" }], apple: "/brand/apple-touch-icon.png" },
    manifest: "/manifest.webmanifest",
    verification: seoCfg.google_verification ? { google: seoCfg.google_verification } : undefined,
    robots: opts.noindex ? { index: false, follow: true } : undefined,
  };
}

export function organizationJsonLd(ctx: SiteContext) {
  const base = siteUrl(ctx);
  const c = ctx.settings.contact ?? {};
  const social = socialUrls(ctx.settings.social);
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: pick(ctx.brand?.name, ctx.locale, ctx.defaultLocale),
    alternateName: ctx.languages.map((l) => pick(ctx.brand?.name, l.code)).filter(Boolean),
    url: `${base}/${ctx.locale}`,
    logo: `${base}/brand/logo.png`,
    email: c.email || undefined,
    telephone: c.phones?.[0] || undefined,
    sameAs: social,
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
