// Generates the static brand asset pack in public/brand from the master geometry.
// Run: node scripts/build-brand-assets.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { buildAssets, svgDoc, symbolMarkup, SYMBOL } from "../src/lib/brand/logo-geometry.ts";

const out = new URL("../public/brand/", import.meta.url);
mkdirSync(out, { recursive: true });

const variants = {
  color: { ink: "#0B5D50", dot: "#C9963B" },
  "color-dark": { ink: "#F4F1EA", dot: "#E2B565" },
  black: { ink: "#0E1A1F", dot: "#0E1A1F" },
  white: { ink: "#FFFFFF", dot: "#FFFFFF" },
} as const;

for (const [name, colors] of Object.entries(variants)) {
  const a = buildAssets(colors);
  for (const [kind, svg] of Object.entries(a)) {
    writeFileSync(new URL(`${kind}-${name}.svg`, out), svg);
  }
}
// favicon / app icon: symbol on brand tile
const icon = svgDoc(
  "0 0 64 64",
  `<rect width="64" height="64" rx="14" fill="#0B5D50"/><g transform="translate(9 11) scale(0.72)">${symbolMarkup({ ink: "#F4F1EA", dot: "#E2B565" })}</g>`,
  "ALITQAN",
);
writeFileSync(new URL("icon.svg", out), icon);
writeFileSync(new URL("../icon.svg", out), icon);
console.log("brand assets written", SYMBOL.viewBox);
