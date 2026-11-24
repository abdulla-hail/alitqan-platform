"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { BrandParticles } from "@/lib/brand/particles";
import { ambientSettings, ambientTargets, type AmbientVariant } from "@/lib/effects/ambient";

/**
 * Mounted once in the public layout. After the page is idle it adds a very light particle layer
 * behind each eligible section (see ambientTargets), all driven by ONE shared animation loop.
 * Off-screen sections pause, hidden tabs pause, reduced-motion visitors and low-power phones get a
 * still frame, theme switches recolour the layers, and everything is torn down on navigation.
 */
export function AmbientParticles({ colors }: { colors: BrandParticles }) {
  const pathname = usePathname();
  const key = JSON.stringify(colors);

  useEffect(() => {
    let cancelled = false;
    const cleanups: (() => void)[] = [];
    const run = async () => {
      const { ParticleEngine, FrameScheduler } = await import("@/lib/effects/particle-engine");
      if (cancelled) return;
      const root = document.documentElement;
      // Only the visitor's accessibility setting freezes the mesh. Phones keep moving: they get a
      // 30 fps cap (battery) and the engine thins the lattice itself if frames get slow.
      const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const phone = window.innerWidth < 768 || matchMedia("(pointer: coarse)").matches;
      const dark = () => root.getAttribute("data-theme") === "dark";
      const scheduler = new FrameScheduler(phone ? 33 : 0);
      const brand = JSON.parse(key) as BrandParticles;
      const fields: { engine: InstanceType<typeof ParticleEngine>; variant: AmbientVariant }[] = [];

      ambientTargets(document).forEach((section, i) => {
        const layer = document.createElement("div");
        layer.setAttribute("aria-hidden", "true");
        layer.dataset.ambientLayer = "";
        const canvas = document.createElement("canvas");
        canvas.style.cssText = "position:absolute;opacity:0;transition:opacity .9s ease";
        layer.appendChild(canvas);
        section.dataset.ambientHost = "";
        section.appendChild(layer);
        const variant = (i % 4) as AmbientVariant;
        try {
          // the section's main heading stays clean: the mesh fades softly around it
          const protect = section.querySelector<HTMLElement>("h1, h2");
          const engine = new ParticleEngine({ canvas, host: section, protect, settings: ambientSettings(brand, dark(), variant), scheduler, still });
          fields.push({ engine, variant });
          requestAnimationFrame(() => (canvas.style.opacity = "1"));
        } catch {
          /* no canvas support: leave the section as it was */
        }
        cleanups.push(() => {
          layer.remove();
          delete section.dataset.ambientHost;
        });
      });

      // recolour on light/dark switch
      const mo = new MutationObserver(() => fields.forEach((f) => f.engine.update(ambientSettings(brand, dark(), f.variant), undefined, still)));
      mo.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
      cleanups.push(() => {
        mo.disconnect();
        fields.forEach((f) => f.engine.destroy());
      });
    };
    // after the page has settled (and after route transitions) — never competes with first paint
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };
    const timer = window.setTimeout(() => {
      if (w.requestIdleCallback) w.requestIdleCallback(() => void run(), { timeout: 1500 });
      else void run();
    }, 450);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      cleanups.forEach((f) => f());
    };
  }, [pathname, key]);

  return null;
}
