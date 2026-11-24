/**
 * Hero "Interactive Particle Grid" settings.
 *
 * Stored in site_settings:
 *   hero_effect        – PUBLISHED settings (is_public = true, read by the homepage)
 *   hero_effect_draft  – DRAFT settings     (is_public = false, readable only with settings.manage)
 *
 * Every value is clamped / whitelisted here, on the server before saving and again on the
 * client before rendering, so a bad value can never break the page.
 */

export type DeviceKey = "desktop" | "tablet" | "mobile";
export type EffectMode = "all" | "desktop" | "off";
export type Fallback = "static" | "glow" | "none";
export type AreaPosition = "top" | "center" | "bottom";

export interface DeviceProfile {
  /** grid spacing between particles (px) — smaller = denser */
  spacing: number;
  /** hard cap on particle count for this device */
  max_particles: number;
  /** multipliers applied on top of the global values */
  size_scale: number;
  speed_scale: number;
  force_scale: number;
}

export interface HeroEffectSettings {
  /** all = phones, tablets and desktop · desktop = desktop only · off = disabled */
  mode: EffectMode;
  /** what to show when the effect is off / not running (reduced motion, disabled device) */
  fallback: Fallback;
  particles: {
    size: number; // px radius
    opacity: number; // 0–1
    speed: number; // ambient drift speed
    randomness: number; // ambient drift amplitude (× spacing)
    return_speed: number; // spring back to home position
    link_density: number; // share of neighbour links drawn (0–1)
    link_distance: number; // max length of a drawn link (px)
  };
  interaction: {
    repulsion: boolean;
    force: number;
    radius: number; // px
    response: number; // how fast particles feel the pointer (0–1)
    release: number; // how fast the pointer's influence fades after it leaves (0–1)
    touch: boolean;
    click_wave: boolean;
    wave_strength: number;
    wave_speed: number;
  };
  colors: {
    /** custom = the colours below · brand = the identity particle colours (Brand identity → Particle colours) */
    source: "custom" | "brand";
    particle: string;
    link: string;
    glow: string;
    gradient: boolean;
    gradient_to: string;
    intensity: number; // ambient light / glow strength (0–1)
    link_opacity: number; // 0–1
    hover_glow: number; // extra glow near the pointer (0–1)
  };
  area: {
    height: number; // % of the hero panel
    width: number; // % of the hero panel
    position: AreaPosition;
    center_density: number; // 0.2–1 share of particles kept in the middle
    edge_density: number; // 0–1 share kept at the edges
    text_clarity: number; // 0–1 how much particles fade behind the title
    protect_padding: number; // px around the title kept calm
  };
  devices: Record<DeviceKey, DeviceProfile>;
}

export const HERO_EFFECT_DEFAULTS: HeroEffectSettings = {
  mode: "all",
  fallback: "static",
  particles: { size: 1.6, opacity: 0.6, speed: 0.35, randomness: 0.12, return_speed: 0.05, link_density: 1, link_distance: 64 },
  interaction: { repulsion: true, force: 1, radius: 150, response: 0.18, release: 0.06, touch: true, click_wave: true, wave_strength: 1, wave_speed: 1 },
  colors: { source: "custom", particle: "#3D7BFF", link: "#2563EB", glow: "#00C8FD", gradient: true, gradient_to: "#00C8FD", intensity: 0.55, link_opacity: 0.22, hover_glow: 0.75 },
  area: { height: 100, width: 100, position: "center", center_density: 1, edge_density: 0.8, text_clarity: 0.8, protect_padding: 28 },
  devices: {
    desktop: { spacing: 38, max_particles: 1400, size_scale: 1, speed_scale: 1, force_scale: 1 },
    tablet: { spacing: 42, max_particles: 800, size_scale: 1, speed_scale: 0.9, force_scale: 0.9 },
    mobile: { spacing: 44, max_particles: 420, size_scale: 0.9, speed_scale: 0.8, force_scale: 0.8 },
  },
};

/** Colour presets in the ALITQAN identity (official mark blues). */
export const HERO_COLOR_PRESETS: { id: string; ar: string; en: string; colors: Pick<HeroEffectSettings["colors"], "particle" | "link" | "glow" | "gradient" | "gradient_to"> }[] = [
  { id: "alitqan", ar: "أزرق إتقان", en: "ALITQAN blue", colors: { particle: "#3D7BFF", link: "#2563EB", glow: "#00C8FD", gradient: true, gradient_to: "#00C8FD" } },
  { id: "deep", ar: "كحلي عميق", en: "Deep navy", colors: { particle: "#1E3A8A", link: "#022A7C", glow: "#0563EA", gradient: true, gradient_to: "#0563EA" } },
  { id: "cyan", ar: "سماوي مضيء", en: "Bright cyan", colors: { particle: "#00C8FD", link: "#0EA5E9", glow: "#00C8FD", gradient: false, gradient_to: "#3D7BFF" } },
  { id: "mono", ar: "رمادي هادئ", en: "Quiet slate", colors: { particle: "#64748B", link: "#94A3B8", glow: "#3D7BFF", gradient: false, gradient_to: "#64748B" } },
];

/* ---------------------------------------------------------------- validation */
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const num = (v: unknown, min: number, max: number, fb: number, step = 0) => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? Number(v) : NaN;
  if (!Number.isFinite(n)) return fb;
  const c = Math.min(max, Math.max(min, n));
  return step ? Math.round(c / step) * step : c;
};
const round = (n: number, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
const bool = (v: unknown, fb: boolean) => (typeof v === "boolean" ? v : fb);
const color = (v: unknown, fb: string) => (typeof v === "string" && HEX.test(v.trim()) ? v.trim().toUpperCase() : fb);
const pickOne = <T extends string>(v: unknown, list: readonly T[], fb: T): T => (list.includes(v as T) ? (v as T) : fb);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Numeric ranges (also drive the admin sliders). [min, max, step] */
export const RANGES = {
  size: [0.5, 5, 0.1],
  opacity: [0.05, 1, 0.05],
  speed: [0, 2, 0.05],
  randomness: [0, 0.6, 0.02],
  return_speed: [0.01, 0.2, 0.005],
  link_density: [0, 1, 0.05],
  link_distance: [20, 160, 2],
  force: [0, 3, 0.05],
  radius: [40, 400, 5],
  response: [0.02, 1, 0.02],
  release: [0.01, 0.5, 0.01],
  wave_strength: [0, 3, 0.1],
  wave_speed: [0.2, 3, 0.1],
  intensity: [0, 1, 0.05],
  link_opacity: [0, 1, 0.02],
  hover_glow: [0, 1, 0.05],
  height: [30, 100, 1],
  width: [40, 100, 1],
  center_density: [0.2, 1, 0.05],
  edge_density: [0, 1, 0.05],
  text_clarity: [0, 1, 0.05],
  protect_padding: [0, 160, 2],
  spacing: [18, 120, 1],
  max_particles: [50, 3000, 10],
  size_scale: [0.3, 2, 0.05],
  speed_scale: [0, 2, 0.05],
  force_scale: [0, 2, 0.05],
} as const satisfies Record<string, readonly [number, number, number]>;

const r = (k: keyof typeof RANGES, v: unknown, fb: number) => {
  const [min, max, step] = RANGES[k];
  return round(num(v, min, max, fb, step));
};

function device(v: unknown, fb: DeviceProfile): DeviceProfile {
  const o = obj(v);
  return {
    spacing: r("spacing", o.spacing, fb.spacing),
    max_particles: r("max_particles", o.max_particles, fb.max_particles),
    size_scale: r("size_scale", o.size_scale, fb.size_scale),
    speed_scale: r("speed_scale", o.speed_scale, fb.speed_scale),
    force_scale: r("force_scale", o.force_scale, fb.force_scale),
  };
}

/** Whitelists and clamps any input into complete, safe settings (missing values → defaults). */
export function sanitizeHeroEffect(input: unknown): HeroEffectSettings {
  const D = HERO_EFFECT_DEFAULTS;
  const o = obj(input);
  const p = obj(o.particles), i = obj(o.interaction), c = obj(o.colors), a = obj(o.area), d = obj(o.devices);
  return {
    mode: pickOne(o.mode, ["all", "desktop", "off"] as const, D.mode),
    fallback: pickOne(o.fallback, ["static", "glow", "none"] as const, D.fallback),
    particles: {
      size: r("size", p.size, D.particles.size),
      opacity: r("opacity", p.opacity, D.particles.opacity),
      speed: r("speed", p.speed, D.particles.speed),
      randomness: r("randomness", p.randomness, D.particles.randomness),
      return_speed: r("return_speed", p.return_speed, D.particles.return_speed),
      link_density: r("link_density", p.link_density, D.particles.link_density),
      link_distance: r("link_distance", p.link_distance, D.particles.link_distance),
    },
    interaction: {
      repulsion: bool(i.repulsion, D.interaction.repulsion),
      force: r("force", i.force, D.interaction.force),
      radius: r("radius", i.radius, D.interaction.radius),
      response: r("response", i.response, D.interaction.response),
      release: r("release", i.release, D.interaction.release),
      touch: bool(i.touch, D.interaction.touch),
      click_wave: bool(i.click_wave, D.interaction.click_wave),
      wave_strength: r("wave_strength", i.wave_strength, D.interaction.wave_strength),
      wave_speed: r("wave_speed", i.wave_speed, D.interaction.wave_speed),
    },
    colors: {
      source: pickOne(c.source, ["custom", "brand"] as const, D.colors.source),
      particle: color(c.particle, D.colors.particle),
      link: color(c.link, D.colors.link),
      glow: color(c.glow, D.colors.glow),
      gradient: bool(c.gradient, D.colors.gradient),
      gradient_to: color(c.gradient_to, D.colors.gradient_to),
      intensity: r("intensity", c.intensity, D.colors.intensity),
      link_opacity: r("link_opacity", c.link_opacity, D.colors.link_opacity),
      hover_glow: r("hover_glow", c.hover_glow, D.colors.hover_glow),
    },
    area: {
      height: r("height", a.height, D.area.height),
      width: r("width", a.width, D.area.width),
      position: pickOne(a.position, ["top", "center", "bottom"] as const, D.area.position),
      center_density: r("center_density", a.center_density, D.area.center_density),
      edge_density: r("edge_density", a.edge_density, D.area.edge_density),
      text_clarity: r("text_clarity", a.text_clarity, D.area.text_clarity),
      protect_padding: r("protect_padding", a.protect_padding, D.area.protect_padding),
    },
    devices: {
      desktop: device(d.desktop, D.devices.desktop),
      tablet: device(d.tablet, D.devices.tablet),
      mobile: device(d.mobile, D.devices.mobile),
    },
  };
}

/** Device class for a given viewport width (matches Tailwind sm / lg). */
export const deviceFor = (width: number): DeviceKey => (width < 640 ? "mobile" : width < 1024 ? "tablet" : "desktop");

/** Whether the animated effect should run for this device. */
export const effectRunsOn = (s: HeroEffectSettings, dev: DeviceKey) => s.mode === "all" || (s.mode === "desktop" && dev === "desktop");

/** Hero colours taken from the identity when the admin chose "use identity colours". */
export function withBrandColors(s: HeroEffectSettings, brand?: { particle: string; link: string; glow: string } | null): HeroEffectSettings {
  if (s.colors.source !== "brand" || !brand) return s;
  return { ...s, colors: { ...s.colors, particle: brand.particle, link: brand.link, glow: brand.glow, gradient_to: brand.glow } };
}

export const sameSettings = (a: HeroEffectSettings, b: HeroEffectSettings) => JSON.stringify(a) === JSON.stringify(b);
