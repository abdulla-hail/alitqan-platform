/**
 * Particle colours of the brand identity (CMS → Brand identity → Visual identity → Particle colours).
 * Stored in brand_settings.backgrounds.particles. Shared by the subtle background particles on
 * every public page, and optionally by the homepage hero ("use identity colours").
 * Defaults come from the official mark's blues.
 */
import { mixHex } from "./mark";

export interface BrandParticles {
  particle: string;
  link: string;
  glow: string;
  /** dot opacity (0–1) */
  opacity: number;
  /** link opacity (0–1) */
  link_opacity: number;
}

export const BRAND_PARTICLES_DEFAULTS: BrandParticles = { particle: "#0563EA", link: "#3D7BFF", glow: "#00C8FD", opacity: 0.35, link_opacity: 0.14 };

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const col = (v: unknown, fb: string) => (typeof v === "string" && HEX.test(v.trim()) ? v.trim().toUpperCase() : fb);
const op = (v: unknown, fb: number) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.round(Math.min(1, Math.max(0, n)) * 100) / 100 : fb;
};

export function sanitizeBrandParticles(v: unknown): BrandParticles {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const D = BRAND_PARTICLES_DEFAULTS;
  return { particle: col(o.particle, D.particle), link: col(o.link, D.link), glow: col(o.glow, D.glow), opacity: op(o.opacity, D.opacity), link_opacity: op(o.link_opacity, D.link_opacity) };
}

const full = (h: string) => (h.length === 4 ? "#" + [...h.slice(1)].map((c) => c + c).join("") : h);

/**
 * Same identity colours, tuned per mode so particles stay calm:
 * light mode uses them as set; dark mode lifts the blues a little (navy would vanish on a dark
 * background) and lowers opacity so nothing glows harshly.
 */
export function particlesForTheme(p: BrandParticles, dark: boolean): BrandParticles {
  if (!dark) return p;
  return {
    particle: mixHex(full(p.particle), "#FFFFFF", 0.72),
    link: mixHex(full(p.link), "#FFFFFF", 0.7),
    glow: full(p.glow),
    opacity: Math.round(p.opacity * 0.75 * 100) / 100,
    link_opacity: Math.round(p.link_opacity * 0.8 * 100) / 100,
  };
}
