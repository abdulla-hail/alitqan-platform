/**
 * Subtle background particles for every public section (not the hero, which has its own strong
 * effect and settings). Same engine as the hero, tuned to be barely-there:
 * few, small, low-opacity particles, very slow drift, a gentle pointer nudge, no click waves,
 * no ambient glow. Colours come from the brand identity (brand_settings.backgrounds.particles).
 *
 * Sections differ on purpose: each gets one of a few compositions (particles gathered at the
 * edges / along one side / sparse field), so pages don't all look the same and text in the
 * middle of a section stays clean.
 */
import { particlesForTheme, type BrandParticles } from "@/lib/brand/particles";
import { HERO_EFFECT_DEFAULTS, sanitizeHeroEffect, type HeroEffectSettings } from "@/lib/hero-effect";

export type AmbientVariant = 0 | 1 | 2 | 3;

const COMPOSITIONS: Record<AmbientVariant, Partial<HeroEffectSettings["area"]> & { spacing: number; link_density: number }> = {
  // edges: particles gather towards the sides, the centre stays almost clear
  0: { center_density: 0.2, edge_density: 0.85, spacing: 74, link_density: 0.55 },
  // sparse field across the whole section
  1: { center_density: 0.45, edge_density: 0.6, spacing: 92, link_density: 0.4 },
  // one band at the top of the section
  2: { center_density: 0.3, edge_density: 0.8, height: 60, position: "top", spacing: 80, link_density: 0.5 },
  // one band at the bottom of the section
  3: { center_density: 0.3, edge_density: 0.8, height: 60, position: "bottom", spacing: 80, link_density: 0.5 },
};

export function ambientSettings(brand: BrandParticles, dark: boolean, variant: AmbientVariant): HeroEffectSettings {
  const c = particlesForTheme(brand, dark);
  const v = COMPOSITIONS[variant];
  return sanitizeHeroEffect({
    mode: "all",
    fallback: "static",
    particles: { size: 1.1, opacity: c.opacity, speed: 0.16, randomness: 0.1, return_speed: 0.035, link_density: v.link_density, link_distance: Math.round(v.spacing * 1.8) },
    interaction: { repulsion: true, force: 0.35, radius: 110, response: 0.08, release: 0.04, touch: false, click_wave: false, wave_strength: 0, wave_speed: 1 },
    colors: { particle: c.particle, link: c.link, glow: c.glow, gradient: false, gradient_to: c.glow, intensity: 0, link_opacity: c.link_opacity, hover_glow: 0.12 },
    area: { ...HERO_EFFECT_DEFAULTS.area, height: v.height ?? 100, width: 100, position: v.position ?? "center", center_density: v.center_density, edge_density: v.edge_density, text_clarity: 0, protect_padding: 0 },
    devices: {
      desktop: { spacing: v.spacing, max_particles: 160, size_scale: 1, speed_scale: 1, force_scale: 1 },
      tablet: { spacing: v.spacing + 6, max_particles: 110, size_scale: 1, speed_scale: 0.9, force_scale: 0.8 },
      mobile: { spacing: v.spacing + 10, max_particles: 60, size_scale: 0.9, speed_scale: 0.8, force_scale: 0.6 },
    },
  });
}

/**
 * Which sections get subtle particles. Public pages only (the component is not mounted in the CMS);
 * skips the hero, sections holding forms (focus areas), nested sections and tiny ones.
 */
export function ambientTargets(root: ParentNode): HTMLElement[] {
  const all = Array.from(root.querySelectorAll<HTMLElement>("main section"));
  return all.filter((el) => {
    if (el.dataset.section === "hero" || el.closest("[data-hero-host]") || el.querySelector("[data-hero-host]")) return false;
    if (el.dataset.ambient === "off") return false;
    if (el.querySelector("form, input, textarea, select")) return false;
    if (el.parentElement?.closest("main section")) return false; // nested
    return el.offsetHeight >= 180;
  });
}
