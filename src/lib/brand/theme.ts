import type { BrandSettings, Palette } from "@/types/content";
import { customFontFaces, FONT_CATALOG, googleFontsHref as gfHref, resolveTypography, safeFamily, type CustomFont } from "./fonts";

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RADIUS = /^\d{1,2}(\.\d+)?(px|rem)$/;

export const FALLBACK_PALETTES: { light: Palette; dark: Palette } = {
  light: { primary: "#0B5D50", secondary: "#16324F", accent: "#C9963B", background: "#FAF8F4", surface: "#FFFFFF", foreground: "#0E1A1F", muted: "#5B6B70", border: "#E6E1D8" },
  dark: { primary: "#3CC7A8", secondary: "#9DB8D9", accent: "#E2B565", background: "#0B1215", surface: "#121C20", foreground: "#ECE9E2", muted: "#93A3A8", border: "#22313A" },
};

/** Kept for compatibility: names of catalog fonts by script. */
export const FONT_CHOICES = {
  arabic: FONT_CATALOG.filter((f) => f.script !== "latin").map((f) => f.family),
  latin: FONT_CATALOG.filter((f) => f.script !== "arabic").map((f) => f.family),
};

export const safeColor = (v: unknown, fb: string) => (typeof v === "string" && HEX.test(v) ? v : fb);
export const safeFont = safeFamily;

function hexToRgb(hex: string) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
/** WCAG relative luminance */
export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
/** Text colour to put ON a brand colour (white or near-black, whichever reads better). */
export function onColor(bg: string) {
  return contrastRatio(bg, "#FFFFFF") >= contrastRatio(bg, "#0E1A1F") ? "#FFFFFF" : "#0E1A1F";
}

function paletteVars(p: Partial<Palette> | undefined, fb: Palette) {
  const c = {
    primary: safeColor(p?.primary, fb.primary),
    secondary: safeColor(p?.secondary, fb.secondary),
    accent: safeColor(p?.accent, fb.accent),
    background: safeColor(p?.background, fb.background),
    surface: safeColor(p?.surface, fb.surface),
    foreground: safeColor(p?.foreground, fb.foreground),
    muted: safeColor(p?.muted, fb.muted),
    border: safeColor(p?.border, fb.border),
  };
  return [
    `--c-primary:${c.primary}`,
    `--c-on-primary:${onColor(c.primary)}`,
    `--c-secondary:${c.secondary}`,
    `--c-accent:${c.accent}`,
    `--c-on-accent:${onColor(c.accent)}`,
    `--c-background:${c.background}`,
    `--c-surface:${c.surface}`,
    `--c-foreground:${c.foreground}`,
    `--c-muted:${c.muted}`,
    `--c-border:${c.border}`,
  ].join(";");
}

/**
 * Font stacks for a direction. Arabic families lead in RTL, Latin in LTR; each covers
 * the other's missing glyphs. `admin` uses the CMS font for both display and body.
 */
export function fontStacks(brand: Pick<BrandSettings, "fonts"> | null, dir: "rtl" | "ltr", scope: "site" | "admin" = "site") {
  const t = resolveTypography(brand?.fonts);
  if (scope === "admin") {
    const stack = `"${t.admin}", "${t.body_en}", system-ui, sans-serif`;
    return { display: stack, body: stack, families: [...new Set([t.admin, t.body_en])], weights: t.weights };
  }
  const display = dir === "rtl" ? `"${t.display_ar}", "${t.display_en}"` : `"${t.display_en}", "${t.display_ar}"`;
  const body = dir === "rtl" ? `"${t.body_ar}", "${t.body_en}"` : `"${t.body_en}", "${t.body_ar}"`;
  return {
    display: `${display}, system-ui, sans-serif`,
    body: `${body}, system-ui, sans-serif`,
    families: [...new Set([t.display_ar, t.body_ar, t.display_en, t.body_en])],
    weights: t.weights,
  };
}

/** Stylesheet URL for the Google fonts in use (custom uploaded families are excluded). */
export function fontsHref(stacks: { families: string[]; weights: number[] }, custom: CustomFont[] = []) {
  return gfHref(stacks.families, stacks.weights, custom.map((c) => c.family));
}
/** Back-compat helper (all default weights). */
export function googleFontsHref(families: string[]) {
  return gfHref(families, [400, 500, 600, 700]);
}

/** Complete CSS injected in <head>: design tokens for light + dark, fonts, custom @font-face. */
export function brandCss(brand: BrandSettings | null, dir: "rtl" | "ltr", opts: { scope?: "site" | "admin"; customFonts?: CustomFont[] } = {}) {
  const fonts = fontStacks(brand, dir, opts.scope);
  const radius = brand && RADIUS.test(brand.radius) ? brand.radius : "14px";
  const light = paletteVars(brand?.colors?.light, FALLBACK_PALETTES.light);
  const dark = paletteVars(brand?.colors?.dark, FALLBACK_PALETTES.dark);
  const pattern = brand?.backgrounds?.pattern === "none" ? ".bg-measure{background-image:none!important}" : "";
  const faces = customFontFaces(opts.customFonts ?? [], fonts.families);
  const inkPrimary = safeColor(brand?.colors?.dark?.primary, FALLBACK_PALETTES.dark.primary);
  const ink = `--c-ink-primary:${inkPrimary};--c-ink-on-primary:${onColor(inkPrimary)}`;
  return `${faces}:root{${light};${ink};--radius:${radius};--f-display:${fonts.display};--f-body:${fonts.body}}[data-theme="dark"]{${dark}}${pattern}`;
}
