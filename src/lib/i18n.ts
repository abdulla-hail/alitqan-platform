import type { Localized } from "@/types/content";

export const LOCALE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

/** Pick the value for `locale`, falling back to the default language, then any non-empty value. */
export function pick(value: Localized | string | null | undefined, locale: string, fallback?: string): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  return (
    value[locale]?.trim() ||
    (fallback ? value[fallback]?.trim() : "") ||
    Object.values(value).find((v) => typeof v === "string" && v.trim())?.trim() ||
    ""
  );
}

/** Builds a locale-prefixed href for internal links; external/anchor/mail links are returned untouched. */
export function localeHref(href: string | undefined | null, locale: string): string {
  if (!href) return `/${locale}`;
  if (/^(https?:|mailto:|tel:|#)/i.test(href)) return href;
  const clean = href.startsWith("/") ? href : `/${href}`;
  const first = clean.split("/")[1] ?? "";
  if (LOCALE_PATTERN.test(first)) return clean;
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}

export function isExternal(href: string) {
  return /^https?:/i.test(href);
}

export function formatDate(value: string | null | undefined, locale: string, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : locale, opts ?? { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));
  } catch {
    return value.slice(0, 10);
  }
}

export type Translator = (key: string, vars?: Record<string, string | number>) => string;

export function makeTranslator(dict: Record<string, string>, fallbackDict: Record<string, string> = {}): Translator {
  return (key, vars) => {
    let s = dict[key] || fallbackDict[key] || humanize(key);
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

function humanize(key: string) {
  const last = key.split(".").pop() ?? key;
  return last.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}
