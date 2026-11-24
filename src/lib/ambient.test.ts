// @vitest-environment node
import { describe, expect, it } from "vitest";
import { BRAND_PARTICLES_DEFAULTS, particlesForTheme, sanitizeBrandParticles } from "./brand/particles";
import { ambientSettings } from "./effects/ambient";
import { HERO_EFFECT_DEFAULTS, sanitizeHeroEffect, withBrandColors } from "./hero-effect";

describe("brand particle colours", () => {
  it("defaults to the identity blues and validates input", () => {
    expect(sanitizeBrandParticles(undefined)).toEqual(BRAND_PARTICLES_DEFAULTS);
    const p = sanitizeBrandParticles({ particle: "#abc", link: "red", glow: "#00FF88", opacity: 3, link_opacity: -1, extra: 1 });
    expect(p).toEqual({ particle: "#ABC", link: BRAND_PARTICLES_DEFAULTS.link, glow: "#00FF88", opacity: 1, link_opacity: 0 });
  });
  it("dark mode lifts the colours and lowers opacity (never brighter than light mode)", () => {
    const d = particlesForTheme(BRAND_PARTICLES_DEFAULTS, true);
    expect(d.opacity).toBeLessThan(BRAND_PARTICLES_DEFAULTS.opacity);
    expect(d.link_opacity).toBeLessThan(BRAND_PARTICLES_DEFAULTS.link_opacity);
    expect(d.particle).not.toBe(BRAND_PARTICLES_DEFAULTS.particle);
    expect(particlesForTheme(BRAND_PARTICLES_DEFAULTS, false)).toEqual(BRAND_PARTICLES_DEFAULTS);
  });
});

describe("section particle mesh", () => {
  it("is a tight, uniform, fully linked lattice (no random thinning)", () => {
    for (const v of [0, 1, 2, 3] as const) {
      const s = ambientSettings(BRAND_PARTICLES_DEFAULTS, false, v);
      expect(s.devices.desktop.spacing).toBeLessThanOrEqual(42);
      expect(s.area.center_density).toBe(1);
      expect(s.area.edge_density).toBe(1);
      expect(s.particles.link_density).toBe(1);
      // neighbour links (≈ spacing) are always inside the link distance
      expect(s.particles.link_distance).toBeGreaterThanOrEqual(s.devices.desktop.spacing * 1.8);
    }
  });
  it("stays calm and lighter than the hero", () => {
    for (const v of [0, 1, 2, 3] as const) {
      const s = ambientSettings(BRAND_PARTICLES_DEFAULTS, false, v);
      expect(s.particles.size).toBeLessThan(HERO_EFFECT_DEFAULTS.particles.size);
      expect(s.particles.speed).toBeLessThan(HERO_EFFECT_DEFAULTS.particles.speed);
      expect(s.interaction.force).toBeLessThan(HERO_EFFECT_DEFAULTS.interaction.force);
      expect(s.interaction.click_wave).toBe(false);
      expect(s.colors.intensity).toBe(0);
      expect(s.colors.link_opacity).toBeLessThanOrEqual(0.5);
      expect(s.devices.mobile.max_particles).toBeLessThanOrEqual(400);
    }
  });
  it("links are clearer than the identity setting but capped", () => {
    const s = ambientSettings(BRAND_PARTICLES_DEFAULTS, false, 0);
    expect(s.colors.link_opacity).toBeGreaterThan(BRAND_PARTICLES_DEFAULTS.link_opacity);
    expect(ambientSettings({ ...BRAND_PARTICLES_DEFAULTS, link_opacity: 1 }, false, 0).colors.link_opacity).toBe(0.5);
  });
  it("uses the identity colours, tuned per mode", () => {
    const light = ambientSettings({ ...BRAND_PARTICLES_DEFAULTS, particle: "#112233" }, false, 0);
    expect(light.colors.particle).toBe("#112233");
    const dark = ambientSettings(BRAND_PARTICLES_DEFAULTS, true, 0);
    expect(dark.particles.opacity).toBeLessThan(light.particles.opacity);
  });
});

describe("hero identity colours", () => {
  it("only replace the hero colours when the admin chose the identity source", () => {
    const brand = { particle: "#111111", link: "#222222", glow: "#333333" };
    expect(withBrandColors(HERO_EFFECT_DEFAULTS, brand)).toBe(HERO_EFFECT_DEFAULTS);
    const s = withBrandColors(sanitizeHeroEffect({ colors: { source: "brand" } }), brand);
    expect([s.colors.particle, s.colors.link, s.colors.glow]).toEqual(["#111111", "#222222", "#333333"]);
    expect(sanitizeHeroEffect({ colors: { source: "evil" } }).colors.source).toBe("custom");
  });
});
