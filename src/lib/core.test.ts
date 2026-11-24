import { describe, expect, it } from "vitest";
import { localeHref, makeTranslator, pick } from "./i18n";
import { brandCss, contrastRatio, onColor, safeColor, safeFont } from "./brand/theme";
import { sanitizeValue, ValidationError } from "@/features/admin/sanitize";
import { RESOURCES } from "@/features/admin/resources";
import { SECTION_TYPES, ICON_CHOICES } from "@/features/sections/registry";
import { ICONS } from "@/components/ui/Icon";

describe("i18n", () => {
  it("picks localized values with fallback", () => {
    expect(pick({ ar: "مرحبا", en: "Hi" }, "en")).toBe("Hi");
    expect(pick({ ar: "مرحبا" }, "en", "ar")).toBe("مرحبا");
    expect(pick({ fr: "Salut" }, "en", "ar")).toBe("Salut");
    expect(pick(null, "en")).toBe("");
  });
  it("prefixes internal links with the locale only", () => {
    expect(localeHref("/services", "ar")).toBe("/ar/services");
    expect(localeHref("/", "en")).toBe("/en");
    expect(localeHref("/en/blog", "ar")).toBe("/en/blog");
    expect(localeHref("https://x.com", "ar")).toBe("https://x.com");
    expect(localeHref("mailto:a@b.c", "ar")).toBe("mailto:a@b.c");
  });
  it("translator falls back to default dictionary then key", () => {
    const t = makeTranslator({ a: "A" }, { b: "B" });
    expect(t("a")).toBe("A");
    expect(t("b")).toBe("B");
    expect(t("form.submit_request")).toBe("Submit request");
  });
});

describe("brand tokens", () => {
  it("rejects CSS injection in colours and fonts", () => {
    expect(safeColor("red;}body{display:none", "#000000")).toBe("#000000");
    expect(safeColor("#0B5D50", "#000")).toBe("#0B5D50");
    expect(safeFont("Inter'); @import url(x)", "Inter")).toBe("Inter");
  });
  it("chooses readable text colour on brand colours", () => {
    expect(onColor("#0B5D50")).toBe("#FFFFFF");
    expect(onColor("#E2B565")).toBe("#0E1A1F");
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
  });
  it("default palette meets WCAG AA for body text in both modes", () => {
    expect(contrastRatio("#0E1A1F", "#FAF8F4")).toBeGreaterThan(4.5);
    expect(contrastRatio("#ECE9E2", "#0B1215")).toBeGreaterThan(4.5);
    expect(contrastRatio("#5B6B70", "#FAF8F4")).toBeGreaterThan(4.5);
    expect(contrastRatio("#93A3A8", "#0B1215")).toBeGreaterThan(4.5);
  });
  it("emits light and dark token blocks", () => {
    const css = brandCss(null, "rtl");
    expect(css).toContain(":root{--c-primary:");
    expect(css).toContain('[data-theme="dark"]{');
    expect(css).toContain("Alexandria");
  });
});

describe("CMS input sanitising", () => {
  const langs = ["ar", "en"];
  it("keeps only known languages and trims", () => {
    expect(sanitizeValue({ name: "t", kind: "text", localized: true }, { ar: " أ ", en: "b", xx: "evil" }, langs)).toEqual({ ar: "أ", en: "b" });
  });
  it("rejects javascript: URLs and bad slugs", () => {
    expect(() => sanitizeValue({ name: "u", kind: "url" }, "javascript:alert(1)", langs)).toThrow(ValidationError);
    expect(() => sanitizeValue({ name: "s", kind: "slug" }, "Bad Slug!", langs)).toThrow(ValidationError);
    expect(sanitizeValue({ name: "s", kind: "slug" }, "web-design", langs)).toBe("web-design");
    expect(sanitizeValue({ name: "u", kind: "url" }, "/services", langs)).toBe("/services");
  });
  it("validates nested lists and status", () => {
    const v = sanitizeValue({ name: "l", kind: "list", fields: [{ name: "title", kind: "text", localized: true, label: { ar: "", en: "" } }] }, [{ title: { ar: "x" }, junk: 1 }], langs);
    expect(v).toEqual([{ title: { ar: "x" } }]);
    expect(() => sanitizeValue({ name: "st", kind: "status" }, "deleted", langs)).toThrow();
  });
  it("every resource and section field kind is supported", () => {
    for (const r of RESOURCES) for (const f of r.fields) sanitizeValue(f, f.kind === "status" ? "draft" : undefined, langs);
    for (const s of SECTION_TYPES) for (const f of [...s.fields, ...(s.settings ?? [])]) sanitizeValue(f, undefined, langs);
  });
  it("every curated icon exists in the icon map", () => {
    for (const name of ICON_CHOICES) expect(ICONS[name], name).toBeDefined();
  });
});

import { normalizeSiteUrl } from "./env";
describe("site URL normalisation (production env had '1. https://…')", () => {
  it("extracts a clean origin", () => {
    expect(normalizeSiteUrl("1. https://alitqan-platform.vercel.app")).toBe("https://alitqan-platform.vercel.app");
    expect(normalizeSiteUrl("https://alitqan.com/")).toBe("https://alitqan.com");
    expect(normalizeSiteUrl("alitqan.com")).toBe("https://alitqan.com");
    expect(normalizeSiteUrl("not a url")).toBeNull();
    expect(normalizeSiteUrl(undefined)).toBeNull();
  });
});
