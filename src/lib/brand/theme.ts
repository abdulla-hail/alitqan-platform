import type { BrandSettings, Palette } from "@/types/content";
import { MARK_DEFAULT_COLORS, MARK_DEFAULT_MONO, mixHex } from "./mark";
import { RADIUS_DEFAULT, radiusValue } from "./radius";
import { customFontFaces, FONT_CATALOG, googleFontsHref as gfHref, resolveTypography, safeFamily, type CustomFont } from "./fonts";

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const FALLBACK_PALETTES: { light: Palette; dark: Palette } = {
  light: { primary: "#0756D8", secondary: "#022A7C", accent: "#00B4EE", background: "#F7F9FD", surface: "#FFFFFF", foreground: "#0A1433", muted: "#56627A", border: "#E0E6F1" },
  dark: { primary: "#4D94FF", secondary: "#8DB2FF", accent: "#2BD4FF", background: "#070B1A", surface: "#0E1430", foreground: "#E9EEFA", muted: "#96A1BE", border: "#1F2A4A" },
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

/** Fills a palette from CMS input with safe fallbacks. */
function resolvePalette(p: Partial<Palette> | undefined, fb: Palette): Palette {
  return {
    primary: safeColor(p?.primary, fb.primary),
    secondary: safeColor(p?.secondary, fb.secondary),
    accent: safeColor(p?.accent, fb.accent),
    background: safeColor(p?.background, fb.background),
    surface: safeColor(p?.surface, fb.surface),
    foreground: safeColor(p?.foreground, fb.foreground),
    muted: safeColor(p?.muted, fb.muted),
    border: safeColor(p?.border, fb.border),
  };
}

/**
 * Same hue, adjusted only as much as needed for text to be readable on `bg` (WCAG ratio `target`).
 * Used ONLY for brand-coloured text; fills, buttons and the logo keep the exact brand colour.
 */
export function readableOn(color: string, bg: string, target = 4.5): string {
  if (contrastRatio(color, bg) >= target) return color;
  const toward = luminance(bg) < 0.4 ? "#FFFFFF" : "#000000";
  for (let w = 0.95; w >= 0.1; w -= 0.05) {
    const c = mixHex(full(color), toward, w);
    if (contrastRatio(c, bg) >= target) return c;
  }
  return toward;
}
const full = (h: string) => (h.length === 4 ? "#" + [...h.slice(1)].map((c) => c + c).join("") : h.slice(0, 7));

function paletteVars(c: Palette, textBg = c.background, textTarget = 3) {
  return [
    `--c-primary:${c.primary}`,
    `--c-primary-text:${readableOn(c.primary, textBg, textTarget)}`,
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
/** CSS variables read by the inline vector mark (and logo.svg) — editable in CMS → Brand identity. */
export function logoVars(brand: BrandSettings | null) {
  const c = brand?.logo_system?.colors ?? {};
  return [
    `--logo-dark:${safeColor(c.dark, MARK_DEFAULT_COLORS.dark)}`,
    `--logo-deep:${safeColor(c.deep, MARK_DEFAULT_COLORS.deep)}`,
    `--logo-primary:${safeColor(c.primary, MARK_DEFAULT_COLORS.primary)}`,
    `--logo-bright:${safeColor(c.bright, MARK_DEFAULT_COLORS.bright)}`,
    `--logo-mono:${safeColor(c.mono, MARK_DEFAULT_MONO)}`,
  ].join(";");
}

export function brandCss(brand: BrandSettings | null, dir: "rtl" | "ltr", opts: { scope?: "site" | "admin"; customFonts?: CustomFont[] } = {}) {
  const fonts = fontStacks(brand, dir, opts.scope);
  const radius = radiusValue(brand?.radius ?? RADIUS_DEFAULT); // → --global-border-radius
  // Brand colours (primary / secondary / accent) are the SAME in light and dark mode unless the admin
  // explicitly chose "custom" for dark mode. Dark mode only swaps the interface colours
  // (background, surface, text, muted text, borders).
  const L = resolvePalette(brand?.colors?.light, FALLBACK_PALETTES.light);
  const D0 = resolvePalette(brand?.colors?.dark, FALLBACK_PALETTES.dark);
  const customDark = brand?.colors?.dark_brand === "custom";
  const D = customDark ? D0 : { ...D0, primary: L.primary, secondary: L.secondary, accent: L.accent };
  const light = paletteVars(L);
  const dark = paletteVars(D, D.background, 4.5);
  const pattern = brand?.backgrounds?.pattern === "none" ? ".bg-measure{background-image:none!important}" : "";
  const faces = customFontFaces(opts.customFonts ?? [], fonts.families);
  // ink stages (footer, dark panels) keep the brand primary too; only its text use is made readable
  const inkPrimary = customDark ? D0.primary : L.primary;
  const ink = `--c-ink-primary:${inkPrimary};--c-ink-on-primary:${onColor(inkPrimary)};--c-ink-primary-text:${readableOn(inkPrimary, "#0B1022", 4.5)}`;
  return `${faces}:root{${light};${ink};${logoVars(brand)};--global-border-radius:${radius};--f-display:${fonts.display};--f-body:${fonts.body}}[data-theme="dark"]{${dark}}${pattern}`;
}
