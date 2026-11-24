// @vitest-environment node
import { describe, expect, it } from "vitest";
import { BRAND_PARTICLES_DEFAULTS, particlesForTheme, sanitizeBrandParticles } from "./brand/particles";
import { ambientSettings } from "./effects/ambient";
import { DEFAULT_MIX, HERO_EFFECT_DEFAULTS, MESH_PATTERNS, PARTICLE_SHAPES, sanitizeHeroEffect, sanitizeMix, withBrandColors } from "./hero-effect";

describe("brand particle colours", () => {
  it("defaults to the identity blues and validates input", () => {
    expect(sanitizeBrandParticles(undefined)).toEqual(BRAND_PARTICLES_DEFAULTS);
    const p = sanitizeBrandParticles({ particle: "#abc", link: "red", glow: "#00FF88", opacity: 3, link_opacity: -1, extra: 1 });
    expect(p).toMatchObject({ particle: "#ABC", link: BRAND_PARTICLES_DEFAULTS.link, glow: "#00FF88", opacity: 1, link_opacity: 0, size: 1.15, shape: "circle", pattern: "triangles", density: 1, speed: 1 });
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

describe("particle shapes & mesh patterns", () => {
  it("default to the current look (circles on a triangle mesh) and whitelist values", () => {
    expect(HERO_EFFECT_DEFAULTS.particles.shape).toBe("circle");
    expect(HERO_EFFECT_DEFAULTS.particles.pattern).toBe("triangles");
    expect(sanitizeBrandParticles({}).shape).toBe("circle");
    expect(sanitizeBrandParticles({ shape: "<svg>", pattern: "spiral" })).toMatchObject({ shape: "circle", pattern: "triangles" });
    expect(sanitizeHeroEffect({ particles: { shape: "hexagram", pattern: "x" } }).particles).toMatchObject({ shape: "circle", pattern: "triangles" });
  });
  it("accept every offered option and pass them to the section mesh (both modes)", () => {
    for (const shape of PARTICLE_SHAPES) {
      for (const pattern of MESH_PATTERNS) {
        const bp = sanitizeBrandParticles({ shape, pattern });
        expect(bp).toMatchObject({ shape, pattern });
        for (const dark of [false, true]) expect(ambientSettings(bp, dark, 0).particles).toMatchObject({ shape, pattern });
        expect(sanitizeHeroEffect({ particles: { shape, pattern } }).particles).toMatchObject({ shape, pattern });
      }
    }
  });
});

describe("particle size", () => {
  it("is clamped, defaults to the current size, and angular shapes are drawn larger", () => {
    expect(sanitizeBrandParticles({}).size).toBe(1.15);
    expect(sanitizeBrandParticles({ size: 99 }).size).toBe(4);
    expect(sanitizeBrandParticles({ size: -1 }).size).toBe(0.6);
    expect(sanitizeBrandParticles({ size: null }).size).toBe(1.15);
    const dot = ambientSettings(sanitizeBrandParticles({ size: 1.5 }), false, 0).particles.size;
    const tri = ambientSettings(sanitizeBrandParticles({ size: 1.5, shape: "triangle" }), false, 0).particles.size;
    expect(dot).toBe(1.5);
    expect(tri).toBeGreaterThan(dot);
  });
});

describe("shape mix, density and speed", () => {
  it("mix keeps known shapes only (≥2), never 'mixed' itself", () => {
    expect(sanitizeMix(["star", "ring", "star", "mixed", "evil"])).toEqual(["star", "ring"]);
    expect(sanitizeMix(["star"])).toEqual(DEFAULT_MIX);
    expect(sanitizeMix("x")).toEqual(DEFAULT_MIX);
    expect(sanitizeHeroEffect({ particles: { mix: ["plus", "pentagon"] } }).particles.mix).toEqual(["plus", "pentagon"]);
  });
  it("identity density tightens spacing and speed scales the drift, both clamped", () => {
    const base = ambientSettings(BRAND_PARTICLES_DEFAULTS, false, 0);
    const dense = ambientSettings(sanitizeBrandParticles({ density: 2 }), false, 0);
    expect(dense.devices.desktop.spacing).toBeLessThan(base.devices.desktop.spacing);
    expect(ambientSettings(sanitizeBrandParticles({ speed: 0 }), false, 0).particles.speed).toBe(0);
    expect(sanitizeBrandParticles({ density: 99, speed: -5 })).toMatchObject({ density: 2, speed: 0 });
  });
  it("section particles react to touch (phones)", () => {
    expect(ambientSettings(BRAND_PARTICLES_DEFAULTS, false, 0).interaction.touch).toBe(true);
  });
});
