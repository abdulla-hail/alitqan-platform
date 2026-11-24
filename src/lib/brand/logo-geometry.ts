/**
 * ALITQAN / إتقان — master logo geometry (direction A: "The Measure").
 *
 * Every shape is a plain SVG path so the marks scale without loss, can be
 * edited in any vector tool, and can be recoloured through CSS variables.
 * Colour roles: "ink" (the strokes) and "dot" (the calligraphic rhombus).
 */

/** Calligraphic rhombus dot (نقطة) centred on (cx, cy). */
export function rhombus(cx: number, cy: number, r = 5.5): string {
  return `M${cx} ${cy - r}L${cx + r} ${cy}L${cx} ${cy + r}L${cx - r} ${cy}Z`;
}

/** Independent symbol: the tapered bowl of ن holding the measuring dot. viewBox 0 0 64 64 */
export const SYMBOL = {
  viewBox: "0 0 64 64",
  bowl: "M8 30A24 22 0 0 0 56 30L48 30A16 12 0 0 1 16 30Z",
  dot: rhombus(32, 15, 8),
};

/** Arabic wordmark "إتقان" drawn as monoline geometric strokes. */
export const WORDMARK_AR = {
  viewBox: "52 6 164 74",
  strokeWidth: 7,
  // ت (initial tooth) → baseline → ا (final alif)
  strokes: [
    "M184 44V58H118V14", // tooth of ت, joining stroke, final alif
    "M206 14V58", // إ alif
    "M58 40V50A20 20 0 0 0 98 50V40", // ن bowl
  ],
  // ق loop (circle) is drawn as a stroked path too
  loops: ["M142 47a10 10 0 1 0 20 0a10 10 0 1 0 -20 0Z"],
  dots: [
    rhombus(178, 32), rhombus(190, 32), // ت
    rhombus(146, 23), rhombus(158, 23), // ق
    rhombus(78, 30), // ن
  ],
  hamza: rhombus(206, 71, 4), // hamza below alif, drawn in the dot family
};

/** Latin wordmark "ALITQAN" — monoline caps; the A crossbars are rhombus dots. */
export const WORDMARK_EN = {
  viewBox: "-6 10 256 56",
  strokeWidth: 6,
  strokes: [
    "M0 58L14 18L28 58", // A
    "M40 18V58H62", // L
    "M74 18V58", // I
    "M86 18H114M100 18V58", // T
    "M126 38a20 20 0 1 0 40 0a20 20 0 1 0 -40 0ZM153 47L168 62", // Q
    "M176 58L190 18L204 58", // A
    "M216 58V18L244 58V18", // N
  ],
  dots: [rhombus(14, 45, 4.5), rhombus(190, 45, 4.5)],
};

export type LogoColors = { ink: string; dot: string };

function g(inner: string, transform?: string) {
  return `<g${transform ? ` transform="${transform}"` : ""}>${inner}</g>`;
}

export function symbolMarkup({ ink, dot }: LogoColors): string {
  return `<path d="${SYMBOL.bowl}" fill="${ink}"/><path d="${SYMBOL.dot}" fill="${dot}"/>`;
}

export function arabicMarkup({ ink, dot }: LogoColors): string {
  const s = WORDMARK_AR;
  const lines = [...s.strokes, ...s.loops]
    .map((d) => `<path d="${d}"/>`)
    .join("");
  return (
    `<g fill="none" stroke="${ink}" stroke-width="${s.strokeWidth}" stroke-linecap="square" stroke-linejoin="miter">${lines}</g>` +
    `<g fill="${dot}">${s.dots.map((d) => `<path d="${d}"/>`).join("")}<path d="${s.hamza}"/></g>`
  );
}

export function latinMarkup({ ink, dot }: LogoColors): string {
  const s = WORDMARK_EN;
  return (
    `<g fill="none" stroke="${ink}" stroke-width="${s.strokeWidth}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10">${s.strokes
      .map((d) => `<path d="${d}"/>`)
      .join("")}</g>` +
    `<g fill="${dot}">${s.dots.map((d) => `<path d="${d}"/>`).join("")}</g>`
  );
}

/** Full SVG documents for the asset pack (public/brand/*.svg). */
export function svgDoc(viewBox: string, body: string, title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>\n`;
}

export function buildAssets(colors: LogoColors) {
  return {
    symbol: svgDoc(SYMBOL.viewBox, symbolMarkup(colors), "ALITQAN symbol"),
    arabic: svgDoc(WORDMARK_AR.viewBox, arabicMarkup(colors), "إتقان"),
    latin: svgDoc(WORDMARK_EN.viewBox, latinMarkup(colors), "ALITQAN"),
    // horizontal lockup: symbol | Arabic wordmark over Latin wordmark
    horizontal: svgDoc(
      "0 0 330 132",
      g(symbolMarkup(colors), "translate(4 23) scale(1.45)") +
        g(arabicMarkup(colors), "translate(31.4 2) scale(1.32)") +
        g(latinMarkup(colors), "translate(102.3 100.2) scale(0.38)"),
      "إتقان ALITQAN",
    ),
    // vertical lockup: symbol on top, Arabic, Latin
    vertical: svgDoc(
      "0 0 240 240",
      g(symbolMarkup(colors), "translate(76 2) scale(1.375)") +
        g(arabicMarkup(colors), "translate(-41 86) scale(1.2)") +
        g(latinMarkup(colors), "translate(52.8 186) scale(0.55)"),
      "إتقان ALITQAN",
    ),
  };
}
