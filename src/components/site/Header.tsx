import Link from "next/link";
import { ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { HeaderShell, MobileNav, NavLinks } from "./NavClient";
import { localeHref, pick } from "@/lib/i18n";
import type { SiteContext } from "@/services/site";

export function Header({ ctx }: { ctx: SiteContext }) {
  const { locale, t, nav, brand, languages, defaultLocale } = ctx;
  const items = nav.header
    .filter((i) => i.is_visible)
    .map((i) => ({
      label: pick(i.label, locale, defaultLocale),
      href: localeHref(i.href, locale),
      newTab: i.new_tab,
      children: (i.children ?? []).filter((c) => c.is_visible).map((c) => ({ label: pick(c.label, locale, defaultLocale), href: localeHref(c.href, locale), newTab: c.new_tab })),
    }));
  const Arrow = ctx.dir === "rtl" ? ArrowUpLeft : ArrowUpRight;
  const themeLabels = { label: t("theme.label"), light: t("theme.light"), dark: t("theme.dark"), system: t("theme.system") };
  return (
    <HeaderShell>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2">
        {t("common.skip_to_content")}
      </a>
      <div className="container-x header-row flex items-center gap-3">
        <Link href={`/${locale}`} className="shrink-0 transition-opacity hover:opacity-85" aria-label={pick(brand?.name, locale)}>
          <Logo brand={brand} locale={locale} />
        </Link>
        <NavLinks items={items} label={t("header.menu")} />
        <div className="ms-auto flex items-center gap-0.5 sm:gap-1">
          <span className="hidden sm:inline-flex"><LanguageSwitcher locale={locale} languages={languages} label={t("lang.label")} /></span>
          <ThemeToggle labels={themeLabels} defaultTheme={brand?.default_theme} />
          <Link href={`/${locale}/request`} className="btn btn-primary btn-sm ms-1 hidden md:inline-flex">
            {t("common.start_project")}
            <Arrow className="h-4 w-4" aria-hidden />
          </Link>
          <MobileNav
            items={items}
            dir={ctx.dir}
            labels={{ menu: t("header.menu"), close: t("header.close"), cta: t("common.start_project") }}
            ctaHref={`/${locale}/request`}
            extra={<div className="flex justify-center sm:hidden"><LanguageSwitcher locale={locale} languages={languages} label={t("lang.label")} /></div>}
          />
        </div>
      </div>
    </HeaderShell>
  );
}
