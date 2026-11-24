/**
 * Background particle mesh for every public section (not the hero, which keeps its own strong
 * effect and settings). Same engine as the hero, tuned as a calm geometric texture:
 *
 *  - Closeness: a tight, UNIFORM triangular lattice — no random thinning, so there are no clusters
 *    and no empty holes; the spacing is the same everywhere.
 *  - Connections: every neighbouring pair is linked (right, down-left, down-right), so all lines
 *    have the same length and the mesh reads as one woven fabric.
 *  - Balance: small dots, soft lines, slow drift, a gentle pointer nudge; the layer fades out at the
 *    top/bottom of each section (CSS mask) so sections blend instead of showing hard seams.
 *
 * Colours/opacities come from the brand identity (brand_settings.backgrounds.particles) and are
 * tuned per light/dark mode. Variants only shift spacing/drift a little so pages don't look cloned.
 */
import { particlesForTheme, type BrandParticles } from "@/lib/brand/particles";
import { HERO_EFFECT_DEFAULTS, sanitizeHeroEffect, type HeroEffectSettings } from "@/lib/hero-effect";

export type AmbientVariant = 0 | 1 | 2 | 3;

/** desktop spacing (px) and drift per variant — deliberately close to each other */
const VARIANTS: Record<AmbientVariant, { spacing: number; randomness: number; speed: number }> = {
  0: { spacing: 36, randomness: 0.08, speed: 0.15 },
  1: { spacing: 40, randomness: 0.07, speed: 0.13 },
  2: { spacing: 38, randomness: 0.09, speed: 0.16 },
  3: { spacing: 42, randomness: 0.07, speed: 0.14 },
};

/** links are the texture: make them readable but calm (identity link opacity × 1.8, capped) */
const LINK_BOOST = 1.8;

export function ambientSettings(brand: BrandParticles, dark: boolean, variant: AmbientVariant): HeroEffectSettings {
  const c = particlesForTheme(brand, dark);
  const v = VARIANTS[variant];
  return sanitizeHeroEffect({
    mode: "all",
    fallback: "static",
    particles: {
      size: 1.15,
      opacity: c.opacity,
      speed: v.speed,
      randomness: v.randomness,
      return_speed: 0.04,
      link_density: 1, // every neighbour linked → even mesh
      link_distance: Math.round(v.spacing * 2), // neighbour links (≈ spacing) always drawn, stretched ones fade
    },
    interaction: { repulsion: true, force: 0.3, radius: 120, response: 0.08, release: 0.05, touch: false, click_wave: false, wave_strength: 0, wave_speed: 1 },
    colors: { particle: c.particle, link: c.link, glow: c.glow, gradient: false, gradient_to: c.glow, intensity: 0, link_opacity: Math.min(0.5, c.link_opacity * LINK_BOOST), hover_glow: 0.1 },
    // uniform: same density in the middle and at the edges (no gaps / clusters)
    area: { ...HERO_EFFECT_DEFAULTS.area, height: 100, width: 100, position: "center", center_density: 1, edge_density: 1, text_clarity: 0.6, protect_padding: 18 }, // mesh softens behind the section heading
    devices: {
      // caps sized so normal sections keep the intended spacing; very tall sections widen it slightly
      desktop: { spacing: v.spacing, max_particles: 1100, size_scale: 1, speed_scale: 1, force_scale: 1 },
      tablet: { spacing: v.spacing + 4, max_particles: 650, size_scale: 1, speed_scale: 0.9, force_scale: 0.8 },
      mobile: { spacing: v.spacing + 6, max_particles: 380, size_scale: 0.95, speed_scale: 0.8, force_scale: 0.6 },
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
