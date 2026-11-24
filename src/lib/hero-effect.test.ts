import { describe, expect, it } from "vitest";
import { deviceFor, effectRunsOn, HERO_EFFECT_DEFAULTS, RANGES, sameSettings, sanitizeHeroEffect } from "./hero-effect";

describe("hero effect settings", () => {
  it("falls back to complete defaults for empty / invalid input", () => {
    for (const v of [undefined, null, {}, "x", 42, []]) expect(sanitizeHeroEffect(v)).toEqual(HERO_EFFECT_DEFAULTS);
  });
  it("clamps every number into its range and rounds to the step", () => {
    const s = sanitizeHeroEffect({
      particles: { size: 999, opacity: -1, link_distance: "500" },
      interaction: { radius: 1, force: Number.NaN },
      devices: { mobile: { max_particles: 1e9, spacing: 0 } },
    });
    expect(s.particles.size).toBe(RANGES.size[1]);
    expect(s.particles.opacity).toBe(RANGES.opacity[0]);
    expect(s.particles.link_distance).toBe(RANGES.link_distance[1]);
    expect(s.interaction.radius).toBe(RANGES.radius[0]);
    expect(s.interaction.force).toBe(HERO_EFFECT_DEFAULTS.interaction.force);
    expect(s.devices.mobile.max_particles).toBe(RANGES.max_particles[1]);
    expect(s.devices.mobile.spacing).toBe(RANGES.spacing[0]);
  });
  it("whitelists enums, booleans and colours; drops unknown keys", () => {
    const s = sanitizeHeroEffect({
      mode: "rocket",
      fallback: "<script>",
      interaction: { repulsion: "yes", touch: false },
      colors: { particle: "red", glow: "#00ff88", link: "#12345", gradient_to: "url(javascript:alert(1))" },
      area: { position: "left" },
      evil: { x: 1 },
    } as never);
    expect(s.mode).toBe("all");
    expect(s.fallback).toBe("static");
    expect(s.interaction.repulsion).toBe(true);
    expect(s.interaction.touch).toBe(false);
    expect(s.colors.particle).toBe(HERO_EFFECT_DEFAULTS.colors.particle);
    expect(s.colors.glow).toBe("#00FF88");
    expect(s.colors.link).toBe(HERO_EFFECT_DEFAULTS.colors.link);
    expect(s.colors.gradient_to).toBe(HERO_EFFECT_DEFAULTS.colors.gradient_to);
    expect(s.area.position).toBe("center");
    expect("evil" in s).toBe(false);
  });
  it("is idempotent", () => {
    const once = sanitizeHeroEffect({ particles: { size: 2.37 }, devices: { tablet: { speed_scale: 0.333 } } });
    expect(sanitizeHeroEffect(once)).toEqual(once);
    expect(sameSettings(once, sanitizeHeroEffect(JSON.parse(JSON.stringify(once))))).toBe(true);
  });
  it("device rules: modes and breakpoints", () => {
    expect([deviceFor(375), deviceFor(800), deviceFor(1280)]).toEqual(["mobile", "tablet", "desktop"]);
    const desk = sanitizeHeroEffect({ mode: "desktop" });
    expect(effectRunsOn(desk, "desktop")).toBe(true);
    expect(effectRunsOn(desk, "mobile")).toBe(false);
    expect(effectRunsOn(sanitizeHeroEffect({ mode: "off" }), "desktop")).toBe(false);
    expect(effectRunsOn(HERO_EFFECT_DEFAULTS, "mobile")).toBe(true);
  });
  it("defaults keep phones light", () => {
    const { desktop, mobile } = HERO_EFFECT_DEFAULTS.devices;
    expect(mobile.max_particles).toBeLessThan(desktop.max_particles / 2);
  });
});
