// Generates abstract demo artwork (project covers, galleries, blog covers, fictional
// client marks) from the brand geometry, so the seeded site looks finished without
// borrowing real photos or logos. Replace them with real media from the CMS.
// Run: node scripts/build-demo-art.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { projects, posts, clients } from "../database/seed/seed-data.ts";

const out = new URL("../public/demo/", import.meta.url);
mkdirSync(out, { recursive: true });

function rng(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296;
}
const palettes = [
  ["#0B5D50", "#16324F", "#C9963B", "#F4F1EA"],
  ["#16324F", "#0B1215", "#3CC7A8", "#ECE9E2"],
  ["#F4F1EA", "#E6E1D8", "#0B5D50", "#C9963B"],
  ["#0E1A1F", "#0B5D50", "#E2B565", "#FAF8F4"],
];
const rh = (x: number, y: number, r: number) => `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`;

function art(seed: string, w = 1600, h = 1000) {
  const r = rng(seed);
  const [bg1, bg2, accent, ink] = palettes[Math.floor(r() * palettes.length)];
  const parts: string[] = [];
  parts.push(`<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
  <pattern id="d" width="40" height="40" patternUnits="userSpaceOnUse"><path d="${rh(20, 20, 1.6)}" fill="${ink}" opacity="0.18"/></pattern></defs>`);
  parts.push(`<rect width="${w}" height="${h}" fill="url(#g)"/><rect width="${w}" height="${h}" fill="url(#d)"/>`);
  const n = 2 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const cx = w * (0.15 + r() * 0.7), cy = h * (0.25 + r() * 0.5), R = 120 + r() * 320, t = 18 + r() * 60;
    parts.push(`<path d="M${cx - R} ${cy}A${R} ${R * 0.9} 0 0 0 ${cx + R} ${cy}L${cx + R - t} ${cy}A${R - t} ${R * 0.9 - t * 1.3} 0 0 1 ${cx - R + t} ${cy}Z" fill="${i % 2 ? accent : ink}" opacity="${0.35 + r() * 0.5}"/>`);
  }
  for (let i = 0; i < 5; i++) parts.push(`<path d="${rh(w * r(), h * r(), 8 + r() * 26)}" fill="${accent}" opacity="${0.6 + r() * 0.4}"/>`);
  for (let i = 1; i < 4; i++) parts.push(`<line x1="0" y1="${(h / 4) * i}" x2="${w}" y2="${(h / 4) * i}" stroke="${ink}" stroke-opacity="0.08"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">${parts.join("")}</svg>\n`;
}

const seeds = new Set<string>(["about-story"]);
for (const p of projects) { seeds.add(p.slug); [1, 2, 3].forEach((i) => seeds.add(`${p.slug}-${i}`)); }
for (const p of posts) seeds.add(`blog-${p.slug}`);
for (const s of seeds) writeFileSync(new URL(`${s}.svg`, out), art(s));

clients.forEach((c, i) => {
  const name = c.name.en.replace(" (sample)", "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80"><path d="${rh(34, 40, 14)}" fill="none" stroke="#5B6B70" stroke-width="4"/><path d="${rh(34, 40, 5)}" fill="#5B6B70"/><text x="62" y="50" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="600" letter-spacing="2" fill="#5B6B70">${name.toUpperCase()}</text></svg>\n`;
  writeFileSync(new URL(`client-${i + 1}.svg`, out), svg);
});
console.log(`demo art: ${seeds.size} images + ${clients.length} client marks`);
