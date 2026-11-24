/**
 * Font catalog for Typography Settings. Each Google family lists the weights it
 * really ships, so the stylesheet request only asks for weights that exist
 * (Google Fonts rejects the whole request if one weight is missing) and only
 * the weights the admin enabled — nothing more is downloaded.
 */
export type FontScript = "arabic" | "latin" | "both";
export interface CatalogFont { family: string; label: { ar: string; en: string }; script: FontScript; weights: number[] }

const W = (from: number, to: number) => [100, 200, 300, 400, 500, 600, 700, 800, 900].filter((w) => w >= from && w <= to);

export const FONT_CATALOG: CatalogFont[] = [
  { family: "Almarai", label: { ar: "المراعي", en: "Almarai" }, script: "arabic", weights: [300, 400, 700, 800] },
  { family: "IBM Plex Sans Arabic", label: { ar: "آي بي إم بلكس عربي", en: "IBM Plex Sans Arabic" }, script: "arabic", weights: W(100, 700) },
  { family: "Tajawal", label: { ar: "تجوال", en: "Tajawal" }, script: "arabic", weights: [200, 300, 400, 500, 700, 800, 900] },
  { family: "Cairo", label: { ar: "القاهرة", en: "Cairo" }, script: "arabic", weights: W(200, 900) },
  { family: "Noto Sans Arabic", label: { ar: "نوتو سانس عربي", en: "Noto Sans Arabic" }, script: "arabic", weights: W(100, 900) },
  { family: "Readex Pro", label: { ar: "ريدكس برو", en: "Readex Pro" }, script: "both", weights: W(200, 700) },
  { family: "Alexandria", label: { ar: "الإسكندرية", en: "Alexandria" }, script: "both", weights: W(100, 900) },
  { family: "Noto Kufi Arabic", label: { ar: "نوتو كوفي", en: "Noto Kufi Arabic" }, script: "arabic", weights: W(100, 900) },
  { family: "El Messiri", label: { ar: "المسيري", en: "El Messiri" }, script: "arabic", weights: W(400, 700) },
  { family: "Changa", label: { ar: "تشانغا", en: "Changa" }, script: "arabic", weights: W(200, 800) },
  { family: "Vazirmatn", label: { ar: "وزيرمتن", en: "Vazirmatn" }, script: "arabic", weights: W(100, 900) },
  { family: "Rubik", label: { ar: "روبيك", en: "Rubik" }, script: "both", weights: W(300, 900) },
  { family: "Sora", label: { ar: "سورا", en: "Sora" }, script: "latin", weights: W(100, 800) },
  { family: "Inter", label: { ar: "إنتر", en: "Inter" }, script: "latin", weights: W(100, 900) },
  { family: "Manrope", label: { ar: "مانروب", en: "Manrope" }, script: "latin", weights: W(200, 800) },
  { family: "Plus Jakarta Sans", label: { ar: "جاكرتا", en: "Plus Jakarta Sans" }, script: "latin", weights: W(200, 800) },
  { family: "Space Grotesk", label: { ar: "سبيس غروتسك", en: "Space Grotesk" }, script: "latin", weights: W(300, 700) },
  { family: "DM Sans", label: { ar: "دي إم سانس", en: "DM Sans" }, script: "latin", weights: W(100, 900) },
  { family: "Outfit", label: { ar: "أوتفت", en: "Outfit" }, script: "latin", weights: W(100, 900) },
  { family: "Urbanist", label: { ar: "أوربانست", en: "Urbanist" }, script: "latin", weights: W(100, 900) },
  { family: "Poppins", label: { ar: "بوبينز", en: "Poppins" }, script: "latin", weights: W(100, 900) },
  { family: "Work Sans", label: { ar: "ورك سانس", en: "Work Sans" }, script: "latin", weights: W(100, 900) },
  { family: "Lexend", label: { ar: "ليكسند", en: "Lexend" }, script: "latin", weights: W(100, 900) },
];
export const CATALOG_MAP = Object.fromEntries(FONT_CATALOG.map((f) => [f.family, f]));

export const ALLOWED_WEIGHTS = [300, 400, 500, 600, 700, 800] as const;
export const DEFAULT_WEIGHTS = [400, 500, 600, 700];

export interface CustomFont { family: string; script: FontScript; files: { url: string; weight: number; style?: string; format: "woff2" | "woff" }[] }

/** Typography settings (stored in brand_settings.fonts). */
export interface Typography {
  display_ar?: string; body_ar?: string; display_en?: string; body_en?: string;
  admin?: string; unify?: boolean; weights?: number[];
}

const FONT_NAME = /^[A-Za-z0-9 ]{2,60}$/;
export const safeFamily = (v: unknown, fb: string) => (typeof v === "string" && FONT_NAME.test(v) ? v : fb);

export function resolveTypography(f: Typography | undefined | null) {
  const display_ar = safeFamily(f?.display_ar, "Alexandria");
  const body_ar = safeFamily(f?.body_ar, "IBM Plex Sans Arabic");
  const display_en = safeFamily(f?.display_en, "Sora");
  const body_en = safeFamily(f?.body_en, "Inter");
  const weights = (Array.isArray(f?.weights) ? f!.weights : DEFAULT_WEIGHTS).filter((w) => (ALLOWED_WEIGHTS as readonly number[]).includes(w));
  return {
    display_ar: f?.unify ? body_ar : display_ar,
    body_ar,
    display_en: f?.unify ? body_en : display_en,
    body_en,
    admin: safeFamily(f?.admin, body_ar),
    unify: Boolean(f?.unify),
    weights: weights.length ? weights.sort((a, b) => a - b) : DEFAULT_WEIGHTS,
  };
}

/** One Google Fonts request for the catalog families in use, with only real & enabled weights. */
export function googleFontsHref(families: string[], weights: number[], custom: string[] = []) {
  const parts = [...new Set(families)]
    .filter((f) => !custom.includes(f))
    .map((family) => {
      const cat = CATALOG_MAP[family];
      const name = encodeURIComponent(family).replace(/%20/g, "+");
      if (!cat) return `family=${name}`; // unknown family: default weight only (always valid)
      const ws = weights.filter((w) => cat.weights.includes(w));
      if (!ws.length) ws.push(cat.weights.includes(400) ? 400 : cat.weights[0]);
      return `family=${name}:wght@${ws.join(";")}`;
    });
  return parts.length ? `https://fonts.googleapis.com/css2?${parts.join("&")}&display=swap` : null;
}

/** @font-face rules for uploaded fonts that are actually in use. */
export function customFontFaces(fonts: CustomFont[], used: string[]) {
  return fonts
    .filter((f) => used.includes(f.family))
    .flatMap((f) =>
      (f.files ?? [])
        .filter((x) => /^https:\/\/[^"')\s]+$/.test(x.url) && (x.format === "woff2" || x.format === "woff"))
        .map((x) => `@font-face{font-family:"${f.family}";src:url("${x.url}") format("${x.format}");font-weight:${Math.min(900, Math.max(100, Number(x.weight) || 400))};font-style:${x.style === "italic" ? "italic" : "normal"};font-display:swap}`),
    )
    .join("");
}
