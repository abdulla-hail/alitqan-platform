"use client";
import { Languages } from "lucide-react";
import { usePathname } from "next/navigation";

/** Language switch. variant "icon" = compact icon button (phone header, next to the theme icon). */
export function LanguageSwitcher({ locale, languages, label, variant = "pill", className = "" }: { locale: string; languages: { code: string; native_name: string }[]; label: string; variant?: "pill" | "icon"; className?: string }) {
  const pathname = usePathname() || `/${locale}`;
  if (languages.length < 2) return null;
  const rest = pathname.split("/").slice(2).join("/");
  const others = languages.filter((l) => l.code !== locale);
  const remember = (code: string) => {
    document.cookie = `locale=${code};path=/;max-age=31536000;samesite=lax`;
  };
  if (others.length === 1) {
    const l = others[0];
    if (variant === "icon")
      return (
        <a href={`/${l.code}${rest ? `/${rest}` : ""}`} hrefLang={l.code} lang={l.code} onClick={() => remember(l.code)} className={`btn btn-ghost btn-icon ${className}`} aria-label={`${label}: ${l.native_name}`} title={l.native_name} data-lang-icon>
          <Languages className="h-[18px] w-[18px]" aria-hidden />
        </a>
      );
    return (
      <a href={`/${l.code}${rest ? `/${rest}` : ""}`} hrefLang={l.code} lang={l.code} onClick={() => remember(l.code)} className="btn btn-ghost btn-sm gap-1.5" aria-label={`${label}: ${l.native_name}`}>
        <Languages className="h-4 w-4" aria-hidden />
        <span>{l.native_name}</span>
      </a>
    );
  }
  return (
    <label className="inline-flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <Languages className="h-4 w-4" aria-hidden />
      <select
        className="bg-transparent text-sm font-medium"
        value={locale}
        onChange={(e) => {
          remember(e.target.value);
          window.location.href = `/${e.target.value}${rest ? `/${rest}` : ""}`;
        }}
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>{l.native_name}</option>
        ))}
      </select>
    </label>
  );
}
