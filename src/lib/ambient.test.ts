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

describe("subtle section particles", () => {
  it("are far lighter than the hero effect", () => {
    for (const v of [0, 1, 2, 3] as const) {
      const s = ambientSettings(BRAND_PARTICLES_DEFAULTS, false, v);
      expect(s.devices.desktop.max_particles).toBeLessThanOrEqual(HERO_EFFECT_DEFAULTS.devices.desktop.max_particles / 5);
      expect(s.devices.mobile.max_particles).toBeLessThanOrEqual(60);
      expect(s.particles.size).toBeLessThan(HERO_EFFECT_DEFAULTS.particles.size);
      expect(s.particles.speed).toBeLessThan(HERO_EFFECT_DEFAULTS.particles.speed);
      expect(s.interaction.force).toBeLessThan(HERO_EFFECT_DEFAULTS.interaction.force);
      expect(s.interaction.click_wave).toBe(false);
      expect(s.colors.intensity).toBe(0);
    }
  });
  it("sections get different compositions", () => {
    const comps = new Set([0, 1, 2, 3].map((v) => JSON.stringify(ambientSettings(BRAND_PARTICLES_DEFAULTS, false, v as 0).area)));
    expect(comps.size).toBe(4);
  });
  it("use the identity colours, tuned per mode", () => {
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
