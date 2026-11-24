import { describe, expect, it } from "vitest";
import { liftForDark, MARK_DEFAULT_COLORS, markDocument, markMarkup, mixHex } from "./brand/mark";
import { brandCss, contrastRatio, logoVars, readableOn } from "./brand/theme";
import { sanitizeSvg } from "./svg-safety";

describe("official mark", () => {
  it("is pure vector (no embedded bitmap) and uses CSS variables by default", () => {
    const svg = markDocument();
    expect(svg).not.toMatch(/<image|data:image|base64/);
    expect(svg).toContain("var(--logo-primary, #0563EA)");
    expect(svg).toContain("var(--logo-bright, #00C8FD)");
    expect((svg.match(/<path /g) ?? []).length).toBeGreaterThanOrEqual(7);
    expect((svg.match(/<rect /g) ?? []).length).toBe(5);
  });
  it("prefixes gradient ids so several marks can share a page", () => {
    const a = markMarkup({ idp: "a1" });
    expect(a).toContain('id="a1-leg"');
    expect(a).toContain("url(#a1-leg)");
    expect(markMarkup({ idp: "x:y<z" })).toContain('id="xyz-leg"');
  });
  it("one-colour variants use a single fill and no gradients", () => {
    const w = markMarkup({ variant: "white" });
    expect(w).not.toContain("linearGradient");
    expect(new Set(w.match(/#[0-9A-F]{6}/gi))).toEqual(new Set(["#FFFFFF"]));
    expect(markMarkup({ variant: "mono", mono: "#123456", colors: MARK_DEFAULT_COLORS })).toContain('fill="#123456"');
  });
  it("ignores invalid colours", () => {
    const m = markMarkup({ colors: { ...MARK_DEFAULT_COLORS, primary: "red;}<script>" } });
    expect(m).not.toContain("script");
    expect(m).toContain(MARK_DEFAULT_COLORS.primary);
  });
  it("lifts colours for dark backgrounds", () => {
    expect(mixHex("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    const l = liftForDark(MARK_DEFAULT_COLORS);
    for (const v of Object.values(l)) expect(v).toMatch(/^#[0-9A-F]{6}$/);
  });
  it("brand CSS exposes logo variables from the CMS, falling back on bad input", () => {
    const css = logoVars({ logo_system: { colors: { primary: "#112233", dark: "nope" } } } as never);
    expect(css).toContain("--logo-primary:#112233");
    expect(css).toContain(`--logo-dark:${MARK_DEFAULT_COLORS.dark}`);
    expect(brandCss(null, "rtl")).toContain("--logo-bright:");
  });
});

describe("svg sanitiser", () => {
  const ok = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><defs><linearGradient id="g"/></defs><rect fill="url(#g)" width="10" height="10"/></svg>';
  it("accepts a clean logo and strips comments / xml declarations", () => {
    const r = sanitizeSvg('<?xml version="1.0"?><!-- made in X -->' + ok);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.svg.startsWith("<svg")).toBe(true);
  });
  it.each([
    ['<svg><script>alert(1)</script></svg>', "script"],
    ['<svg onload="alert(1)"></svg>', "event"],
    ['<svg><a href="javascript:alert(1)"><rect/></a></svg>', "script URL"],
    ['<svg><a href="&#106;avascript:alert(1)"></a></svg>', "encoded"],
    ['<svg><foreignObject><div/></foreignObject></svg>', "foreignObject"],
    ['<svg><image href="https://evil.test/x.png"/></svg>', "external"],
    ['<svg><use xlink:href="https://evil.test/s.svg#a"/></svg>', "external use"],
    ['<svg><style>@import url(https://evil.test/a.css)</style></svg>', "css import"],
    ['<!DOCTYPE svg [<!ENTITY x "y">]><svg></svg>', "entities"],
    ['<svg><set attributeName="href" to="javascript:alert(1)"/></svg>', "set"],
    ["<html><body/></html>", "not svg"],
  ])("rejects %s (%s)", (svg) => {
    expect(sanitizeSvg(svg).ok).toBe(false);
  });
});

describe("global border radius", () => {
  it("parses, clamps and normalises the stored value", async () => {
    const { radiusPx, radiusValue } = await import("./brand/radius");
    expect(radiusPx("14px")).toBe(14);
    expect(radiusPx("0px")).toBe(0);
    expect(radiusPx("1rem")).toBe(16);
    expect(radiusPx("999px")).toBe(40);
    expect(radiusPx("-3px")).toBe(14);
    expect(radiusPx("10px; color:red")).toBe(14);
    expect(radiusValue(undefined)).toBe("14px");
  });
  it("injects --global-border-radius from brand settings", () => {
    expect(brandCss({ radius: "0px" } as never, "rtl")).toContain("--global-border-radius:0px");
    expect(brandCss({ radius: "22px" } as never, "ltr")).toContain("--global-border-radius:22px");
    expect(brandCss(null, "ltr")).toContain("--global-border-radius:14px");
  });
});

describe("light/dark: brand colours stay fixed", () => {
  const brand = {
    colors: {
      light: { primary: "#1D149F", secondary: "#16324F", accent: "#C9963B", background: "#FAF8F4", surface: "#FFFFFF", foreground: "#0E1A1F", muted: "#5B6B70", border: "#E6E1D8" },
      dark: { primary: "#3CC7A8", secondary: "#9DB8D9", accent: "#E2B565", background: "#0B1215", surface: "#121C20", foreground: "#ECE9E2", muted: "#93A3A8", border: "#22313A" },
    },
  };
  const darkBlock = (css: string) => css.slice(css.indexOf('[data-theme="dark"]{'));
  it("dark mode keeps the light-mode primary/secondary/accent by default; only UI colours change", () => {
    const d = darkBlock(brandCss(brand as never, "rtl"));
    expect(d).toContain("--c-primary:#1D149F");
    expect(d).toContain("--c-accent:#C9963B");
    expect(d).not.toContain("#3CC7A8");
    expect(d).toContain("--c-background:#0B1215");
  });
  it("brand-coloured text gets a readable variant on dark backgrounds (fills keep the exact colour)", () => {
    const d = darkBlock(brandCss(brand as never, "rtl"));
    const text = /--c-primary-text:(#[0-9A-F]{6})/i.exec(d)?.[1] ?? "";
    expect(text).not.toBe("#1D149F");
    expect(contrastRatio(text, "#0B1215")).toBeGreaterThanOrEqual(4.5);
    expect(readableOn("#FFFFFF", "#0B1215")).toBe("#FFFFFF");
  });
  it("an explicit 'custom' choice uses the dark palette's own brand colours", () => {
    const d = darkBlock(brandCss({ colors: { ...brand.colors, dark_brand: "custom" } } as never, "rtl"));
    expect(d).toContain("--c-primary:#3CC7A8");
  });
});
