import { describe, expect, it } from "vitest";
import { liftForDark, MARK_DEFAULT_COLORS, markDocument, markMarkup, mixHex } from "./brand/mark";
import { brandCss, logoVars } from "./brand/theme";
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
