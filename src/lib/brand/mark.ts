/**
 * ALITQAN / إتقان — official mark (2026-11 identity).
 *
 * Vector redraw of the reference artwork in brand-source/logo-reference.webp:
 * a sharp "A" whose crossbar is a sweeping orbit, with five "pixels" rising
 * to the upper right. Every shape is a real SVG path (no embedded bitmap);
 * coordinates are in the reference image's pixel space (1536×1024).
 *
 * Colours are four roles so the mark can be re-coloured without redrawing:
 *   dark    – deepest navy (shadows, the lower legs)
 *   deep    – navy blue (upper right leg, square shading)
 *   primary – main blue
 *   bright  – cyan highlight
 * In "vars" mode each stop reads a CSS variable (--logo-dark, --logo-deep,
 * --logo-primary, --logo-bright, --logo-mono) with the default as fallback.
 */

export type MarkColors = { dark: string; deep: string; primary: string; bright: string };
export type MarkVariant = "color" | "light" | "dark" | "white" | "mono";

export const MARK_DEFAULT_COLORS: MarkColors = { dark: "#020C4A", deep: "#022A7C", primary: "#0563EA", bright: "#00C8FD" };
/** Tonal navy version for light backgrounds when the full-colour mark is too loud. */
export const MARK_DARK_COLORS: MarkColors = { dark: "#010726", deep: "#06184F", primary: "#0B2C7A", bright: "#1C4FB4" };
export const MARK_DEFAULT_MONO = "#0B2A7A";

const toRgb = (h: string) => {
  let x = h.replace("#", "");
  if (x.length === 3) x = [...x].map((c) => c + c).join("");
  const n = parseInt(x.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** a·w + b·(1−w) in sRGB, returned as #RRGGBB */
export function mixHex(a: string, b: string, w: number): string {
  const A = toRgb(a), B = toRgb(b);
  return "#" + A.map((v, i) => Math.round(v * w + B[i] * (1 - w)).toString(16).padStart(2, "0")).join("").toUpperCase();
}
/** Same mark, lifted so the navy parts stay visible on dark backgrounds. */
export function liftForDark(c: MarkColors): MarkColors {
  return {
    dark: mixHex(c.primary, c.dark, 0.6),
    deep: mixHex(c.primary, "#FFFFFF", 0.85),
    primary: mixHex(c.primary, "#FFFFFF", 0.72),
    bright: mixHex(c.bright, "#FFFFFF", 0.85),
  };
}

/** Tight artwork bounds with breathing room (wide). */
export const MARK_VIEWBOX = "165 13 1260 893";
/** Square, optically centred box for icons/favicons. */
export const MARK_SQUARE_VIEWBOX = "150 -175 1290 1290";

export const MARK_SHAPES = {
  /** upper half of the right leg — sits behind the left leg */
  legRightUpper: "M836 182L1027 455Q940 505 852 543L742 376Z",
  /** left (front) leg with the rounded apex */
  legLeft: "M330 705L650 183Q660 166 688 165L808 165Q832 166 845 188Q850 205 832 233L570 650Q450 690 330 705Z",
  /** thin highlight where the front leg folds over the back leg */
  legEdge: "M832 233L839 238L575 653L570 650Z",
  /** right-upper leg for one-colour versions: starts a hairline away from the front leg so the fold stays visible */
  legRightUpperFlat: "M860 216L1027 455Q940 505 852 543L751 389Z",
  /** lower half of the right leg, below the orbit */
  legRightLower: "M902 657L1090 555L1310 862Q1322 880 1302 880L1068 880Q1045 878 1032 860Z",
  /** the orbit (crossbar) */
  orbit:
    "M395 495C300 550 240 610 243 670C246 710 290 725 345 723C600 715 1000 540 1180 400C1225 362 1232 340 1222 330Q1220 324 1240 324L1312 324Q1332 326 1327 348C1315 400 1150 510 900 640C700 740 450 800 290 810C220 812 185 770 185 735C186 640 260 555 395 495Z",
  /** inner fold shading on the orbit's lower edge */
  orbitShade: "M212 788C400 792 600 742 772 688C600 762 420 806 296 811C262 812 236 803 212 788Z",
  /** short trailing stroke under the orbit */
  tail: "M262 822C360 830 450 815 530 797C430 840 330 875 240 885Q222 886 228 875Z",
  /** the five pixels: [x, y, w, h, r, tone] */
  squares: [
    [1052, 205, 136, 135, 18, "mid"],
    [1170, 100, 90, 92, 12, "light"],
    [1278, 33, 76, 77, 10, "light"],
    [1347, 162, 58, 58, 8, "light"],
    [1258, 214, 65, 61, 8, "deep"],
  ] as const,
};

type Role = keyof MarkColors;
type Stop = [offset: number, role: Role];
type Grad = { id: string; x1: number | string; y1: number | string; x2: number | string; y2: number | string; user: boolean; stops: Stop[] };

const GRADIENTS: Grad[] = [
  { id: "leg", user: true, x1: 840, y1: 170, x2: 350, y2: 700, stops: [[0, "bright"], [0.3, "primary"], [0.68, "deep"], [1, "dark"]] },
  { id: "legR", user: true, x1: 845, y1: 190, x2: 960, y2: 520, stops: [[0, "dark"], [0.4, "deep"], [1, "deep"]] },
  { id: "legL", user: true, x1: 930, y1: 640, x2: 1300, y2: 875, stops: [[0, "dark"], [0.42, "deep"], [0.74, "primary"], [0.96, "bright"]] },
  { id: "orbit", user: true, x1: 190, y1: 760, x2: 1325, y2: 330, stops: [[0, "primary"], [0.2, "dark"], [0.52, "primary"], [0.95, "bright"]] },
  { id: "shade", user: true, x1: 212, y1: 800, x2: 772, y2: 690, stops: [[0, "dark"], [1, "deep"]] },
  { id: "sqL", user: false, x1: 1, y1: 0, x2: 0, y2: 1, stops: [[0, "bright"], [1, "primary"]] },
  { id: "sqM", user: false, x1: 1, y1: 0, x2: 0, y2: 1, stops: [[0, "primary"], [0.55, "primary"], [1, "deep"]] },
  { id: "sqD", user: false, x1: 1, y1: 0, x2: 0, y2: 1, stops: [[0, "primary"], [1, "deep"]] },
];

const VAR: Record<Role, string> = { dark: "--logo-dark", deep: "--logo-deep", primary: "--logo-primary", bright: "--logo-bright" };

export type MarkOptions = {
  /** prefix that keeps gradient ids unique when several marks share a page */
  idp?: string;
  variant?: MarkVariant;
  /** explicit colours (static files); omitted → CSS variables with default fallbacks */
  colors?: MarkColors;
  /** single colour for "mono" (white variant always uses #FFFFFF) */
  mono?: string;
};

const esc = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "");

/** Inner SVG markup (defs + shapes) for the mark. Safe: built only from constants and validated hex colours. */
export function markMarkup({ idp = "m", variant = "color", colors, mono }: MarkOptions = {}): string {
  const p = esc(idp) || "m";
  const hex = /^#[0-9a-fA-F]{3,8}$/;
  const flat =
    variant === "white" ? "#FFFFFF" : variant === "mono" ? (mono && hex.test(mono) ? mono : colors ? MARK_DEFAULT_MONO : `var(--logo-mono, ${MARK_DEFAULT_MONO})`) : null;
  const S = MARK_SHAPES;
  if (flat) {
    const f = `fill="${flat}"`;
    const fs = flat.startsWith("var(") ? ` style="fill:${flat}"` : ` ${f}`;
    const rects = S.squares.map(([x, y, w, h, r]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"${fs}/>`).join("");
    return `<g${fs}><path d="${S.legRightUpperFlat}"/><path d="${S.legLeft}"/><path d="${S.legRightLower}"/><path d="${S.orbit}"/><path d="${S.tail}"/></g>` + rects;
  }
  const pal = variant === "dark" ? colors ?? MARK_DARK_COLORS : variant === "light" ? liftForDark(colors ?? MARK_DEFAULT_COLORS) : colors;
  const stop = (role: Role) => {
    if (pal) return `stop-color="${hex.test(pal[role]) ? pal[role] : MARK_DEFAULT_COLORS[role]}"`;
    return `style="stop-color:var(${VAR[role]}, ${MARK_DEFAULT_COLORS[role]})"`;
  };
  const defs = GRADIENTS.map(
    (g) =>
      `<linearGradient id="${p}-${g.id}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}"${g.user ? ` gradientUnits="userSpaceOnUse"` : ""}>` +
      g.stops.map(([o, r]) => `<stop offset="${o}" ${stop(r)}/>`).join("") +
      `</linearGradient>`,
  ).join("");
  const u = (id: string) => `fill="url(#${p}-${id})"`;
  const rects = S.squares.map(([x, y, w, h, r, tone]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${u(tone === "light" ? "sqL" : tone === "mid" ? "sqM" : "sqD")}/>`).join("");
  return (
    `<defs>${defs}</defs>` +
    `<path d="${S.legRightUpper}" ${u("legR")}/>` +
    `<path d="${S.legLeft}" ${u("leg")}/>` +
    `<path d="${S.legEdge}" ${u("sqM")} opacity="0.9"/>` +
    `<path d="${S.legRightLower}" ${u("legL")}/>` +
    `<path d="${S.orbit}" ${u("orbit")}/>` +
    `<path d="${S.orbitShade}" ${u("shade")} opacity="0.85"/>` +
    `<path d="${S.tail}" ${u("shade")}/>` +
    rects
  );
}

/** Complete standalone SVG document. */
export function markDocument(opts: MarkOptions & { viewBox?: string; title?: string; background?: { fill: string; rx?: number } } = {}): string {
  const vb = opts.viewBox ?? MARK_VIEWBOX;
  const [x, y, w, h] = vb.split(/\s+/).map(Number);
  const bg = opts.background ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${opts.background.rx ?? 0}" fill="${opts.background.fill}"/>` : "";
  const title = opts.title ?? "ALITQAN";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}" role="img" aria-label="${title}"><title>${title}</title>${bg}${markMarkup(opts)}</svg>\n`;
}

/** Shapes scaled into a padded square tile (for favicons / app icons). */
export function markIconDocument(opts: MarkOptions & { tile?: string; rx?: number; pad?: number } = {}): string {
  const pad = opts.pad ?? 0.14; // fraction of the tile left empty on each side
  const [vx, vy, vw, vh] = MARK_VIEWBOX.split(/\s+/).map(Number);
  const size = 512;
  const inner = size * (1 - pad * 2);
  const s = inner / Math.max(vw, vh);
  const tx = (size - vw * s) / 2 - vx * s;
  const ty = (size - vh * s) / 2 - vy * s;
  const tile = opts.tile ? `<rect width="${size}" height="${size}" rx="${opts.rx ?? 112}" fill="${opts.tile}"/>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><title>ALITQAN</title>${tile}<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})">${markMarkup(opts)}</g></svg>\n`;
}
