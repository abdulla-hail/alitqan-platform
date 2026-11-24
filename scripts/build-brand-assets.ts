// Generates the ALITQAN identity package in public/brand from the vector master
// (src/lib/brand/mark.ts). Re-run after editing the shapes or default colours:
//   node scripts/build-brand-assets.ts
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import {
  MARK_DARK_COLORS,
  MARK_DEFAULT_COLORS,
  MARK_DEFAULT_MONO,
  MARK_SQUARE_VIEWBOX,
  markDocument,
  markIconDocument,
} from "../src/lib/brand/mark.ts";

const out = new URL("../public/brand/", import.meta.url);
mkdirSync(out, { recursive: true });
// remove the previous identity's files so no old logo can be served by accident
for (const f of readdirSync(out)) rmSync(new URL(f, out));

const file = (name: string, body: string | Buffer) => writeFileSync(new URL(name, out), body);
const png = (svg: string, width: number) => sharp(Buffer.from(svg), { density: 300 }).resize({ width }).png({ compressionLevel: 9 }).toBuffer();

// 1–6: SVG package. logo.svg / logo-icon.svg / favicon.svg read CSS variables (with the defaults as fallback).
const svgs: Record<string, string> = {
  "logo.svg": markDocument({ idp: "lg" }),
  "logo-monochrome.svg": markDocument({ idp: "mn", variant: "mono" }),
  "logo-white.svg": markDocument({ idp: "wh", variant: "white" }),
  "logo-light.svg": markDocument({ idp: "lt", variant: "light" }),
  "logo-dark.svg": markDocument({ idp: "dk", variant: "dark", colors: MARK_DARK_COLORS }),
  "logo-icon.svg": markDocument({ idp: "ic", viewBox: MARK_SQUARE_VIEWBOX }),
  "favicon.svg": markIconDocument({ idp: "fv", pad: 0.04 }),
  // app/PWA tile: mark on a white rounded tile (works on any launcher background)
  "app-icon.svg": markIconDocument({ idp: "ap", tile: "#FFFFFF", rx: 112, pad: 0.16, colors: MARK_DEFAULT_COLORS }),
};
for (const [n, s] of Object.entries(svgs)) file(n, s);
writeFileSync(new URL("../icon.svg", out), svgs["favicon.svg"]);

// Raster versions are rendered from explicit colours (rasterisers don't resolve CSS variables).
const color = markDocument({ idp: "r", colors: MARK_DEFAULT_COLORS });
const white = markDocument({ idp: "w", variant: "white" });
const mono = markDocument({ idp: "o", variant: "mono", colors: MARK_DEFAULT_COLORS, mono: MARK_DEFAULT_MONO });
const light = markDocument({ idp: "l", variant: "light" });
const dark = markDocument({ idp: "d", variant: "dark", colors: MARK_DARK_COLORS });

// 7: transparent high-resolution PNG
file("logo.png", await png(color, 2048));
file("logo-white.png", await png(white, 2048));

// PWA / platform icons
const tile = (opts: { pad: number; rx: number; bg: string }) => markIconDocument({ idp: "t", tile: opts.bg, rx: opts.rx, pad: opts.pad, colors: MARK_DEFAULT_COLORS });
file("icon-192.png", await png(tile({ pad: 0.14, rx: 112, bg: "#FFFFFF" }), 192));
file("icon-512.png", await png(tile({ pad: 0.14, rx: 112, bg: "#FFFFFF" }), 512));
// maskable: full-bleed square, artwork inside the 80% safe zone
file("icon-maskable-512.png", await png(tile({ pad: 0.2, rx: 0, bg: "#FFFFFF" }), 512));
file("apple-touch-icon.png", await png(tile({ pad: 0.14, rx: 0, bg: "#FFFFFF" }), 180));
file("favicon-32.png", await png(markIconDocument({ idp: "f", pad: 0.02, colors: MARK_DEFAULT_COLORS }), 32));
// notification badge (monochrome white on transparent, as Android expects)
file("badge-96.png", await png(markIconDocument({ idp: "b", variant: "white", pad: 0.06 }), 96));

// Default share image 1200×630
const og = await sharp({ create: { width: 1200, height: 630, channels: 4, background: "#F7F9FD" } })
  .composite([{ input: await png(color, 760), gravity: "center" }])
  .png()
  .toBuffer();
file("og-default.png", og);

// 8: preview sheet — every variant on its intended background
const W = 1600, H = 1000, cw = Math.floor(W / 3), ch = H / 2;
const bgTile = (bg: string) => sharp({ create: { width: cw, height: ch, channels: 4, background: bg } }).png().toBuffer();
const cell = async (svg: string, bg: string, x: number, y: number, w = 380) => [
  { input: await bgTile(bg), left: x, top: y },
  { input: await png(svg, w), left: x + Math.round((cw - w) / 2), top: y + Math.round((ch - w * (893 / 1260)) / 2) },
];
const iconCell = async (bg: string, x: number, y: number) => [
  { input: await bgTile(bg), left: x, top: y },
  { input: await png(tile({ pad: 0.14, rx: 112, bg: "#FFFFFF" }), 220), left: x + Math.round(cw / 2) - 250, top: y + 140 },
  { input: await png(tile({ pad: 0.14, rx: 112, bg: "#FFFFFF" }), 96), left: x + Math.round(cw / 2) + 10, top: y + 202 },
  { input: await png(markIconDocument({ idp: "s", pad: 0.02, colors: MARK_DEFAULT_COLORS }), 48), left: x + Math.round(cw / 2) + 140, top: y + 226 },
];
const sheet = [
  ...(await cell(color, "#FFFFFF", 0, 0)),
  ...(await cell(white, "#020C4A", cw, 0)),
  ...(await cell(light, "#0B1022", cw * 2, 0)),
  ...(await cell(dark, "#F2F5FB", 0, ch)),
  ...(await cell(mono, "#FFFFFF", cw, ch)),
  ...(await iconCell("#E8EEF9", cw * 2, ch)),
];
file("logo-preview.png", await sharp({ create: { width: W, height: H, channels: 4, background: "#FFFFFF" } }).composite(sheet).png().toBuffer());

console.log("brand package written:", readdirSync(out).join(", "));
