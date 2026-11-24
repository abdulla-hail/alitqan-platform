import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { SocialLinks } from "./SocialLinks";
import { localeHref, pick } from "@/lib/i18n";
import type { SiteContext } from "@/services/site";

export function Footer({ ctx }: { ctx: SiteContext }) {
  const { locale, defaultLocale, t, nav, brand, settings } = ctx;
  const contact = settings.contact ?? {};
  const general = settings.general ?? {};
  const year = new Date().getFullYear();
  const wa = typeof contact.whatsapp === "string" ? contact.whatsapp.replace(/[^\d]/g, "") : "";
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-line bg-surface">
      <div className="container-x grid grid-cols-1 gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo brand={brand} locale={locale} size="lg" />
          <p className="mt-5 max-w-sm leading-relaxed text-muted">{pick(brand?.tagline, locale, defaultLocale)}</p>
          <SocialLinks social={settings.social ?? {}} className="mt-6" />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-5">
          {nav.footer.filter((c) => c.is_visible).map((col) => (
            <div key={col.id}>
              <h2 className="text-sm font-semibold">{pick(col.label, locale, defaultLocale)}</h2>
              <ul className="mt-4 space-y-2.5">
                {(col.children ?? []).filter((c) => c.is_visible).map((c) => (
                  <li key={c.id}>
                    <Link href={localeHref(c.href, locale)} target={c.new_tab ? "_blank" : undefined} className="text-sm text-muted transition-colors hover:text-primary">
                      {pick(c.label, locale, defaultLocale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="md:col-span-3">
          <h2 className="text-sm font-semibold">{t("footer.contact")}</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            {contact.email && (
              <li><a className="inline-flex items-center gap-2 hover:text-primary" href={`mailto:${contact.email}`}><Mail className="h-4 w-4" aria-hidden /><span dir="ltr">{contact.email}</span></a></li>
            )}
            {(contact.phones ?? []).map((p: string) => (
              <li key={p}><a className="inline-flex items-center gap-2 hover:text-primary" href={`tel:${p.replace(/\s/g, "")}`}><Phone className="h-4 w-4" aria-hidden /><span dir="ltr">{p}</span></a></li>
            ))}
            {wa && (
              <li><a className="inline-flex items-center gap-2 hover:text-primary" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-4 w-4" aria-hidden />{t("contact.whatsapp")}</a></li>
            )}
            {pick(contact.address, locale, defaultLocale) && (
              <li className="inline-flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 flex-none" aria-hidden />{pick(contact.address, locale, defaultLocale)}</li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted sm:flex-row">
          <p>© {year} {pick(general.copyright, locale, defaultLocale) || pick(brand?.name, locale)}. {t("footer.rights")}.</p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {nav.footer_bottom.filter((i) => i.is_visible).map((i) => (
              <li key={i.id}><Link href={localeHref(i.href, locale)} className="hover:text-primary">{pick(i.label, locale, defaultLocale)}</Link></li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
