import Link from "next/link";
import { ArrowUp, Mail, MapPin, MessageCircle, Phone, Rocket } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { localeHref, pick } from "@/lib/i18n";
import type { SiteContext } from "@/services/site";

const SOCIAL_SHORT: Record<string, string> = { linkedin: "in", x: "X", instagram: "IG", behance: "Bē", dribbble: "Dr", github: "GH", youtube: "YT", tiktok: "TT", facebook: "f", snapchat: "SC", threads: "@" };

/** Ink footer: CTA strip, brand + social, link columns, contact, legal row. Plus floating call/WhatsApp buttons. */
export function Footer({ ctx }: { ctx: SiteContext }) {
  const { locale, defaultLocale, t, nav, brand, settings } = ctx;
  const P = (v: Parameters<typeof pick>[0]) => pick(v, locale, defaultLocale);
  const contact = settings.contact ?? {};
  const general = settings.general ?? {};
  const year = new Date().getFullYear();
  const wa = typeof contact.whatsapp === "string" ? contact.whatsapp.replace(/[^\d]/g, "") : "";
  const phone = contact.phones?.[0] ? String(contact.phones[0]).replace(/\s/g, "") : "";
  const social = Object.entries((settings.social ?? {}) as Record<string, string>).filter(([k, v]) => SOCIAL_SHORT[k] && /^https?:\/\//.test(v ?? ""));
  const name = P(brand?.name) || "ALITQAN";
  return (
    <>
      <footer className="mt-auto px-2 pb-2 sm:px-4 sm:pb-4" style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}>
        <div className="ink stage">
          <div className="bg-measure pointer-events-none absolute inset-0 -z-10 opacity-20 [mask-image:linear-gradient(to_bottom,#000,transparent)]" aria-hidden />
          <div className="pointer-events-none absolute -top-40 start-1/3 -z-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl" aria-hidden />
          <div className="container-x pt-8 sm:pt-10">
            {/* CTA strip */}
            <div className="flex flex-col items-start justify-between gap-5 rounded-[calc(var(--radius)*1.4)] border border-line bg-white/5 p-6 sm:flex-row sm:items-center sm:p-7">
              <div>
                <p className="text-xl font-bold sm:text-2xl">{t("footer.cta_title")}</p>
                <p className="mt-1 text-sm text-muted">{t("services.cta_text")}</p>
              </div>
              <Link href={`/${locale}/request`} className="btn btn-primary group flex-none rounded-full px-6"><Rocket className="h-4 w-4" aria-hidden />{t("footer.cta_button")}</Link>
            </div>

            <div className="grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <Logo brand={brand} locale={locale} size="lg" surface="dark" />
                <p className="mt-5 max-w-sm leading-relaxed text-muted">{P(brand?.tagline)}</p>
                {social.length > 0 && (
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {social.map(([k, v]) => <li key={k}><a href={v} target="_blank" rel="noopener noreferrer" className="social-dot !h-9 !min-w-9 !border-line !text-fg hover:!bg-primary hover:!text-on-primary" aria-label={k} dir="ltr">{SOCIAL_SHORT[k]}</a></li>)}
                  </ul>
                )}
              </div>
              <div className="lg:col-span-3">
                <h2 className="text-base font-bold">{t("footer.contact")}</h2>
                <ul className="mt-5 space-y-3.5 text-sm">
                  {phone && <li><a className="group inline-flex items-center gap-3 hover:text-primary" href={`tel:${phone}`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/8"><Phone className="h-4 w-4" aria-hidden /></span><span dir="ltr">{contact.phones[0]}</span></a></li>}
                  {contact.email && <li><a className="group inline-flex items-center gap-3 hover:text-primary" href={`mailto:${contact.email}`}><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/8"><Mail className="h-4 w-4" aria-hidden /></span><span dir="ltr">{contact.email}</span></a></li>}
                  {wa && <li><a className="group inline-flex items-center gap-3 hover:text-primary" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/8"><MessageCircle className="h-4 w-4" aria-hidden /></span>{t("contact.whatsapp")}</a></li>}
                  {P(contact.address) && <li className="flex items-start gap-3"><span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-white/8"><MapPin className="h-4 w-4" aria-hidden /></span><span className="pt-2 text-muted">{P(contact.address)}</span></li>}
                </ul>
              </div>
              <nav className="grid grid-cols-2 gap-8 sm:col-span-2 lg:col-span-5 lg:grid-cols-3" aria-label={t("footer.contact")}>
                {nav.footer.filter((c) => c.is_visible).map((col) => (
                  <div key={col.id}>
                    <h2 className="text-base font-bold">{P(col.label)}</h2>
                    <ul className="mt-5 space-y-3">
                      {(col.children ?? []).filter((c) => c.is_visible).map((c) => (
                        <li key={c.id}>
                          <Link href={localeHref(c.href, locale)} target={c.new_tab ? "_blank" : undefined} className="group inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg">
                            <span className="rhombus scale-50 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />{P(c.label)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>
            </div>
          </div>
          <div className="border-t border-line">
            <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-sm text-muted md:flex-row">
              <p>© {year} {P(general.copyright) || name}. {t("footer.rights")}.</p>
              <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {nav.footer_bottom.filter((i) => i.is_visible).map((i) => (
                  <li key={i.id}><Link href={localeHref(i.href, locale)} className="hover:text-fg">{P(i.label)}</Link></li>
                ))}
                <li><a href="#main" className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 hover:text-fg"><ArrowUp className="h-3.5 w-3.5" />{t("footer.back_to_top")}</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>

      {/* floating quick-contact buttons (only when configured in Settings → Contact) */}
      {(wa || phone) && (
        <div className="fixed bottom-4 end-4 z-30 flex flex-col gap-3 print:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
          {phone && <a href={`tel:${phone}`} className="fab relative bg-primary" aria-label={t("common.call")}><Phone className="h-5 w-5" /></a>}
          {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="fab relative bg-[#25D366]" aria-label={t("contact.whatsapp")}><MessageCircle className="h-5 w-5" /></a>}
        </div>
      )}
    </>
  );
}
