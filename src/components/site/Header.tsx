import Link from "next/link";
import { Mail, Phone, Rocket } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { HeaderShell, MobileNav, NavLinks, type MegaData } from "./NavClient";
import { localeHref, pick } from "@/lib/i18n";
import { getServiceCategories, getServices } from "@/services/content";
import type { SiteContext } from "@/services/site";

const SOCIAL_SHORT: Record<string, string> = { linkedin: "in", x: "X", instagram: "IG", behance: "Bē", dribbble: "Dr", github: "GH", youtube: "YT", tiktok: "TT", facebook: "f", snapchat: "SC", threads: "@" };

/** Two-tier header: utility bar (contact + social, from Settings) and the main bar with pill navigation. */
export async function Header({ ctx }: { ctx: SiteContext }) {
  const { locale, t, nav, brand, languages, defaultLocale, settings, dir } = ctx;
  const [categories, services] = await Promise.all([getServiceCategories(), getServices()]);
  const P = (v: Parameters<typeof pick>[0]) => pick(v, locale, defaultLocale);
  const items = nav.header
    .filter((i) => i.is_visible)
    .map((i) => ({
      label: P(i.label),
      href: localeHref(i.href, locale),
      newTab: i.new_tab,
      children: (i.children ?? []).filter((c) => c.is_visible).map((c) => ({ label: P(c.label), href: localeHref(c.href, locale), newTab: c.new_tab })),
    }));
  const mega: MegaData = {
    categories: categories
      .map((c) => ({
        name: P(c.name),
        href: `/${locale}/services#${c.slug}`,
        icon: c.icon,
        services: services.filter((s) => s.category_id === c.id).slice(0, 4).map((s) => ({ title: P(s.title), href: `/${locale}/services/${s.slug}`, icon: s.icon, excerpt: P(s.excerpt) })),
      }))
      .filter((c) => c.services.length),
    promo: { title: t("footer.cta_title"), text: t("services.cta_text"), cta: t("common.start_project"), href: `/${locale}/request` },
    allLabel: t("common.view_all"),
    allHref: `/${locale}/services`,
  };
  const contact = settings.contact ?? {};
  const social = Object.entries((settings.social ?? {}) as Record<string, string>).filter(([k, v]) => SOCIAL_SHORT[k] && /^https?:\/\//.test(v ?? ""));
  const themeLabels = { label: t("theme.label"), light: t("theme.light"), dark: t("theme.dark"), system: t("theme.system") };

  const utility = (contact.email || contact.phones?.length || social.length) ? (
    <div className="utility-bar hidden border-b border-line/60 bg-bg md:block">
      <div className="container-x flex h-10 items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          {contact.email && <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 hover:text-primary"><Mail className="h-3.5 w-3.5" aria-hidden /><span dir="ltr">{contact.email}</span></a>}
          {contact.phones?.[0] && <a href={`tel:${String(contact.phones[0]).replace(/\s/g, "")}`} className="hidden items-center gap-2 hover:text-primary lg:inline-flex"><Phone className="h-3.5 w-3.5" aria-hidden /><span dir="ltr">{contact.phones[0]}</span></a>}
        </div>
        {social.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="hidden lg:inline">{t("footer.follow")}:</span>
            {social.map(([k, v]) => <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="social-dot" aria-label={k} dir="ltr">{SOCIAL_SHORT[k]}</a>)}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <HeaderShell utility={utility}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">
        {t("common.skip_to_content")}
      </a>
      <div className="container-x header-row flex items-center gap-3">
        <Link href={`/${locale}`} className="shrink-0 transition-opacity hover:opacity-85" aria-label={P(brand?.name)}>
          <Logo brand={brand} locale={locale} />
        </Link>
        <NavLinks items={items} label={t("header.menu")} mega={mega} dir={dir} />
        <div className="ms-auto flex items-center gap-1 sm:gap-1.5">
          <span className="hidden rounded-pill border border-line bg-surface sm:inline-flex"><LanguageSwitcher locale={locale} languages={languages} label={t("lang.label")} /></span>
          <ThemeToggle labels={themeLabels} defaultTheme={brand?.default_theme} />
          <Link href={`/${locale}/request`} className="btn btn-primary btn-sm ms-1 hidden rounded-pill px-4 md:inline-flex">
            <Rocket className="h-4 w-4" aria-hidden />
            {t("common.start_project")}
          </Link>
          <MobileNav
            items={items}
            dir={dir}
            mega={mega}
            labels={{ menu: t("header.menu"), close: t("header.close"), cta: t("common.start_project") }}
            ctaHref={`/${locale}/request`}
            extra={<div className="flex items-center justify-center gap-2"><span className="rounded-pill border border-line"><LanguageSwitcher locale={locale} languages={languages} label={t("lang.label")} /></span><ThemeToggle labels={themeLabels} defaultTheme={brand?.default_theme} /></div>}
          />
        </div>
      </div>
    </HeaderShell>
  );
}
