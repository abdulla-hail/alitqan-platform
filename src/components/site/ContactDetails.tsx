import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { pick } from "@/lib/i18n";
import type { SiteContext } from "@/services/site";

export function ContactDetails({ ctx, compact = false }: { ctx: SiteContext; compact?: boolean }) {
  const { t, locale, defaultLocale, settings } = ctx;
  const c = settings.contact ?? {};
  const wa = typeof c.whatsapp === "string" ? c.whatsapp.replace(/[^\d]/g, "") : "";
  const rows = [
    c.email && { icon: Mail, label: t("contact.email"), value: <a href={`mailto:${c.email}`} dir="ltr" className="hover:text-primary">{c.email}</a> },
    c.phones?.length && {
      icon: Phone,
      label: t("contact.phone"),
      value: (
        <span className="flex flex-col">
          {c.phones.map((p: string) => <a key={p} href={`tel:${p.replace(/\s/g, "")}`} dir="ltr" className="hover:text-primary">{p}</a>)}
        </span>
      ),
    },
    wa && { icon: MessageCircle, label: t("contact.whatsapp"), value: <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" dir="ltr" className="hover:text-primary">+{wa}</a> },
    pick(c.address, locale, defaultLocale) && {
      icon: MapPin,
      label: t("contact.address"),
      value: (
        <span>
          {pick(c.address, locale, defaultLocale)}
          {c.map_url && /^https?:/.test(c.map_url) && (
            <a href={c.map_url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-sm font-semibold text-primary">{t("contact.map")}</a>
          )}
        </span>
      ),
    },
    pick(c.hours, locale, defaultLocale) && { icon: Clock, label: t("contact.hours"), value: pick(c.hours, locale, defaultLocale) },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }[];
  return (
    <ul className={`grid grid-cols-1 gap-4 ${compact ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
      {rows.map(({ icon: I, label, value }) => (
        <li key={label} className="card flex gap-4 p-5">
          <span className="icon-tile"><I className="h-5 w-5" /></span>
          <div className="min-w-0">
            <p className="text-sm text-muted">{label}</p>
            <div className="mt-1 break-words font-semibold">{value}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}
