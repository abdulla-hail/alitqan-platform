import { describe, expect, it } from "vitest";
import { customFontFaces, googleFontsHref, resolveTypography } from "./brand/fonts";
import { motionHtmlAttrs, sanitizeMotion } from "./motion";

describe("typography", () => {
  it("requests only weights each family really has (Almarai lacks 500/600)", () => {
    const href = googleFontsHref(["Almarai", "Inter"], [400, 500, 600, 700])!;
    expect(href).toContain("family=Almarai:wght@400;700");
    expect(href).toContain("family=Inter:wght@400;500;600;700");
    expect(href).toContain("display=swap");
  });
  it("excludes uploaded fonts from Google and emits safe @font-face", () => {
    expect(googleFontsHref(["Brand Sans"], [400], ["Brand Sans"])).toBeNull();
    const css = customFontFaces([{ family: "Brand Sans", script: "both", files: [{ url: "https://x.supabase.co/a.woff2", weight: 700, format: "woff2" }, { url: "javascript:alert(1)", weight: 400, format: "woff2" }] }], ["Brand Sans"]);
    expect(css).toContain('font-family:"Brand Sans"');
    expect(css).toContain("font-weight:700");
    expect(css).not.toContain("javascript");
  });
  it("unify uses the text font for headings; invalid names fall back", () => {
    const t = resolveTypography({ body_ar: "Almarai", display_ar: "Cairo", unify: true, display_en: "x;}" });
    expect(t.display_ar).toBe("Almarai");
    expect(resolveTypography({ display_en: "bad;}" }).display_en).toBe("Sora");
  });
});

describe("motion settings", () => {
  it("clamps values into safe ranges", () => {
    const m = sanitizeMotion({ duration_ms: 99999, stagger_ms: -5, slider_interval_ms: 100, level: "crazy" });
    expect(m.duration_ms).toBe(1200);
    expect(m.stagger_ms).toBe(0);
    expect(m.slider_interval_ms).toBe(3000);
    expect(m.level).toBe("balanced");
  });
  it("turning motion off disables every effect flag", () => {
    const a = motionHtmlAttrs({ enabled: false });
    expect(a["data-motion"]).toBe("off");
    expect(a["data-reveal"]).toBe("off");
    expect(a["data-parallax"]).toBe("off");
    expect(a["data-page-transitions"]).toBe("off");
  });
  it("calm level never enables parallax", () => {
    expect(motionHtmlAttrs({ level: "calm", parallax: true })["data-parallax"]).toBe("off");
  });
});
