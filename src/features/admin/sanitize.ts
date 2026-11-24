import { ICON_CHOICES, type FieldDef } from "@/features/sections/registry";
import type { AdminField } from "./resources";

/** Server-side validation/sanitising of CMS input, driven by the field definitions. */
export class ValidationError extends Error {
  constructor(public field: string) {
    super(`invalid:${field}`);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX: Record<string, number> = { text: 400, textarea: 4000, markdown: 200000, url: 2000, image: 2000 };
const SOCIAL_KEYS = ["linkedin", "x", "instagram", "behance", "dribbble", "github", "youtube", "tiktok", "facebook", "snapchat", "threads", "website", "email"];

function str(v: unknown, max: number) {
  if (v == null) return "";
  return String(v).replace(/\u0000/g, "").trim().slice(0, max);
}
export function safeUrl(v: unknown, field: string): string | null {
  const s = str(v, 2000);
  if (!s) return null;
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  if (/^(https?:|mailto:|tel:)/i.test(s)) return s;
  if (s.startsWith("#")) return s;
  throw new ValidationError(field);
}
function localized(v: unknown, max: number, locales: string[]) {
  const out: Record<string, string> = {};
  const obj = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  for (const l of locales) {
    const s = str(obj[l], max);
    if (s) out[l] = s;
  }
  return out;
}

type SanitizableField = { name: string; kind: string; localized?: boolean; options?: FieldDef["options"]; fields?: FieldDef[] };
export function sanitizeValue(f: SanitizableField, v: unknown, locales: string[]): unknown {
  const k: string = f.kind;
  if ((k === "text" || k === "textarea" || k === "markdown") && f.localized) return localized(v, MAX[k], locales);
  switch (k) {
    case "text":
    case "textarea":
    case "markdown":
      return str(v, MAX[k]) || null;
    case "image":
    case "url":
      return safeUrl(v, f.name);
    case "number": {
      if (v === "" || v == null) return null;
      const n = Number(v);
      if (!Number.isFinite(n)) throw new ValidationError(f.name);
      return Math.round(n);
    }
    case "boolean":
      return v === true || v === "true" || v === "on";
    case "select": {
      const s = str(v, 100);
      if (!s) return null;
      if (f.options && !f.options.some((o) => o.value === s)) throw new ValidationError(f.name);
      return s;
    }
    case "icon": {
      const s = str(v, 40);
      return s && (ICON_CHOICES as readonly string[]).includes(s) ? s : null;
    }
    case "tags":
      return (Array.isArray(v) ? v : []).map((x) => str(x, 60)).filter(Boolean).slice(0, 60);
    case "list":
      return (Array.isArray(v) ? v : []).slice(0, 60).map((item) => {
        const o: Record<string, unknown> = {};
        for (const sub of f.fields ?? []) o[sub.name] = sanitizeValue(sub, (item as Record<string, unknown>)?.[sub.name], locales);
        return o;
      });
    case "slug": {
      const s = str(v, 120).toLowerCase();
      if (!s) return null;
      if (!SLUG.test(s)) throw new ValidationError(f.name);
      return s;
    }
    case "date": {
      const s = str(v, 10);
      if (!s) return null;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new ValidationError(f.name);
      return s;
    }
    case "datetime": {
      const s = str(v, 40);
      if (!s) return null;
      const d = new Date(s);
      if (Number.isNaN(d.getTime())) throw new ValidationError(f.name);
      return d.toISOString();
    }
    case "relation": {
      const s = str(v, 40);
      if (!s) return null;
      if (!UUID.test(s)) throw new ValidationError(f.name);
      return s;
    }
    case "relation_multi":
      return (Array.isArray(v) ? v : []).map((x) => str(x, 40)).filter((x) => UUID.test(x)).slice(0, 100);
    case "status": {
      const s = str(v, 20);
      if (!["draft", "published", "archived"].includes(s)) throw new ValidationError(f.name);
      return s;
    }
    case "seo": {
      const out: Record<string, { title?: string; description?: string; image?: string }> = {};
      const obj = v && typeof v === "object" ? (v as Record<string, Record<string, unknown>>) : {};
      for (const l of locales) {
        const e = obj[l] ?? {};
        const entry = { title: str(e.title, 120), description: str(e.description, 320), image: safeUrl(e.image, "seo") ?? "" };
        if (entry.title || entry.description || entry.image) out[l] = entry;
      }
      return out;
    }
    case "social": {
      const out: Record<string, string> = {};
      const obj = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
      for (const key of SOCIAL_KEYS) {
        const u = obj[key];
        if (!u) continue;
        const s = key === "email" ? str(u, 200) : safeUrl(u, `social.${key}`);
        if (s) out[key] = s;
      }
      return out;
    }
    case "gallery":
      return (Array.isArray(v) ? v : []).slice(0, 60).map((g) => ({
        url: safeUrl((g as Record<string, unknown>)?.url, f.name),
        alt: localized((g as Record<string, unknown>)?.alt, 300, locales),
      })).filter((g) => g.url);
    default:
      throw new ValidationError(f.name);
  }
}

export function requiredMissing(f: AdminField, value: unknown, defaultLocale: string) {
  if (!f.required) return false;
  if (f.localized) return !(value as Record<string, string>)?.[defaultLocale];
  return value == null || value === "";
}
