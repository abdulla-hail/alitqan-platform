import Link from "next/link";
import { ArrowUp, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Arrow } from "./cards";
import { SocialLinks } from "./SocialLinks";
import { localeHref, pick } from "@/lib/i18n";
import type { SiteContext } from "@/services/site";

/** Ink footer: closing call to action, navigation columns, contact, oversized brand wordmark. */
export function Footer({ ctx }: { ctx: SiteContext }) {
  const { locale, defaultLocale, t, nav, brand, settings, dir } = ctx;
  const contact = settings.contact ?? {};
  const general = settings.general ?? {};
  const year = new Date().getFullYear();
  const wa = typeof contact.whatsapp === "string" ? contact.whatsapp.replace(/[^\d]/g, "") : "";
  const name = pick(brand?.name, locale, defaultLocale) || "ALITQAN";
  return (
    <footer className="mt-auto px-2 pb-2 sm:px-4 sm:pb-4" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
      <div className="ink stage">
        <div className="bg-measure pointer-events-none absolute inset-0 -z-10 opacity-25 [mask-image:linear-gradient(to_bottom,#000,transparent)]" aria-hidden />
        <div className="container-x">
          <div className="grid grid-cols-1 gap-12 pb-10 pt-14 sm:pt-16 md:grid-cols-12">
            <div className="md:col-span-4">
              <Logo brand={brand} locale={locale} />
              <p className="mt-5 max-w-sm leading-relaxed text-muted">{pick(brand?.tagline, locale, defaultLocale)}</p>
              <SocialLinks social={settings.social ?? {}} className="mt-6" />
              <Link href={`/${locale}/request`} className="btn btn-primary group mt-8">{t("footer.cta_button")} <Arrow dir={dir} /></Link>
            </div>
            <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-5" aria-label={t("footer.contact")}>
              {nav.footer.filter((c) => c.is_visible).map((col) => (
                <div key={col.id}>
                  <h2 className="kicker">{pick(col.label, locale, defaultLocale)}</h2>
                  <ul className="mt-4 space-y-3">
                    {(col.children ?? []).filter((c) => c.is_visible).map((c) => (
                      <li key={c.id}>
                        <Link href={localeHref(c.href, locale)} target={c.new_tab ? "_blank" : undefined} className="text-sm text-fg/80 transition-colors hover:text-primary">
                          {pick(c.label, locale, defaultLocale)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
            <div className="md:col-span-3">
              <h2 className="kicker">{t("footer.contact")}</h2>
              <ul className="mt-4 space-y-3 text-sm text-fg/80">
                {contact.email && (
                  <li><a className="inline-flex items-center gap-2 hover:text-primary" href={`mailto:${contact.email}`}><Mail className="h-4 w-4 text-muted" aria-hidden /><span dir="ltr">{contact.email}</span></a></li>
                )}
                {(contact.phones ?? []).map((p: string) => (
                  <li key={p}><a className="inline-flex items-center gap-2 hover:text-primary" href={`tel:${p.replace(/\s/g, "")}`}><Phone className="h-4 w-4 text-muted" aria-hidden /><span dir="ltr">{p}</span></a></li>
                ))}
                {wa && (
                  <li><a className="inline-flex items-center gap-2 hover:text-primary" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4 text-muted" aria-hidden />{t("contact.whatsapp")}</a></li>
                )}
                {pick(contact.address, locale, defaultLocale) && (
                  <li className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 flex-none text-muted" aria-hidden />{pick(contact.address, locale, defaultLocale)}</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* oversized wordmark */}
        <div className="container-x overflow-hidden" aria-hidden>
          <p className="footer-mark select-none whitespace-nowrap">{name}</p>
        </div>

        <div className="border-t border-line">
          <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-sm text-muted sm:flex-row">
            <p>© {year} {pick(general.copyright, locale, defaultLocale) || name}. {t("footer.rights")}.</p>
            <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {nav.footer_bottom.filter((i) => i.is_visible).map((i) => (
                <li key={i.id}><Link href={localeHref(i.href, locale)} className="hover:text-fg">{pick(i.label, locale, defaultLocale)}</Link></li>
              ))}
              <li><a href="#main" className="inline-flex items-center gap-1 hover:text-fg"><ArrowUp className="h-3.5 w-3.5" />{t("footer.back_to_top")}</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
