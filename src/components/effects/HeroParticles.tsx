"use client";
import { useEffect, useRef } from "react";
import { deviceFor, effectRunsOn, sanitizeHeroEffect, withBrandColors, type DeviceKey, type HeroEffectSettings } from "@/lib/hero-effect";
import { sanitizeBrandParticles } from "@/lib/brand/particles";
import type { ParticleEngine } from "@/lib/effects/particle-engine";

/**
 * Interactive particle grid behind the homepage hero (and inside the admin preview).
 * - Independent island: finds its host (`[data-hero-host]`) and the title (`[data-hero-title]`).
 * - Starts after the browser is idle, so it never competes with the first paint.
 * - Reduced motion / site motion "off" / disabled device → the configured fallback:
 *   "static" (one still frame of the grid), "glow" (soft CSS glows only), "none".
 * - Sets data-effect on the host so CSS can hide the old dot grid / glows accordingly.
 */
export function HeroParticles({ settings, device, preview = false, brandColors }: { settings: HeroEffectSettings | unknown; device?: DeviceKey; preview?: boolean; brandColors?: unknown }) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ParticleEngine | null>(null);
  const cfg = withBrandColors(sanitizeHeroEffect(settings), brandColors ? sanitizeBrandParticles(brandColors) : null);
  const key = JSON.stringify(cfg);

  useEffect(() => {
    const el = wrap.current, cv = canvas.current;
    if (!el || !cv) return;
    const host = (el.closest("[data-hero-host]") as HTMLElement | null) ?? el.parentElement!;
    const protect = host.querySelector<HTMLElement>("[data-hero-title]");
    const s = JSON.parse(key) as HeroEffectSettings;
    const dev = device ?? deviceFor(window.innerWidth);
    // only the visitor's accessibility "reduce motion" setting stops the animation (the admin can turn the effect off)
    const reduced = !preview && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // the preview mirrors the public rules for the chosen device (so "desktop only" shows the fallback on mobile)
    const runs = effectRunsOn(s, dev) && !reduced;
    const mode = runs ? "running" : s.fallback;
    host.dataset.effect = mode;
    if (mode === "glow" || mode === "none") {
      engine.current?.destroy();
      engine.current = null;
      cv.style.opacity = "0";
      return;
    }
    const still = mode === "static";
    cv.style.opacity = engine.current ? "1" : cv.style.opacity;
    if (engine.current) {
      engine.current.update(s, device, still);
      return;
    }
    let cancelled = false;
    const start = async () => {
      const { ParticleEngine } = await import("@/lib/effects/particle-engine");
      if (cancelled || !canvas.current) return;
      try {
        engine.current = new ParticleEngine({ canvas: cv, host, protect, settings: s, device, still });
        requestAnimationFrame(() => { cv.style.opacity = "1"; });
      } catch {
        host.dataset.effect = "glow"; // no canvas support → keep the CSS look
      }
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const handle = idle ? idle(() => void start(), { timeout: 1200 }) : window.setTimeout(() => void start(), 300);
    return () => {
      cancelled = true;
      const cancelIdle = (window as Window & { cancelIdleCallback?: (h: number) => void }).cancelIdleCallback;
      if (typeof idle === "function" && cancelIdle) cancelIdle(handle as number);
      else window.clearTimeout(handle as number);
    };
  }, [key, device, preview]);

  // full teardown on unmount (navigation away, preview closed)
  useEffect(() => () => { engine.current?.destroy(); engine.current = null; }, []);

  return (
    <div ref={wrap} className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <canvas ref={canvas} className="absolute opacity-0 transition-opacity duration-700" />
    </div>
  );
}
