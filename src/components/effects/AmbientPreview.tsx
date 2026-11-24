"use client";
import { useEffect, useRef } from "react";
import { sanitizeBrandParticles, type BrandParticles } from "@/lib/brand/particles";
import { ambientSettings } from "@/lib/effects/ambient";
import type { ParticleEngine } from "@/lib/effects/particle-engine";

/** CMS preview of the subtle section particles with unsaved identity colours (light or dark surface). */
export function AmbientPreview({ colors, dark, className = "", label }: { colors: BrandParticles; dark: boolean; className?: string; label?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ParticleEngine | null>(null);
  const key = JSON.stringify(sanitizeBrandParticles(colors));

  useEffect(() => {
    let alive = true;
    // denser than on the site so colours and opacity are easy to judge in a small box
    const base = ambientSettings(JSON.parse(key), dark, 1);
    const s = { ...base, area: { ...base.area, center_density: 0.95, edge_density: 0.95 }, devices: { ...base.devices, desktop: { ...base.devices.desktop, spacing: 40 } } };
    if (engine.current) return void engine.current.update(s);
    void import("@/lib/effects/particle-engine").then(({ ParticleEngine }) => {
      if (!alive || !host.current || !canvas.current) return;
      engine.current = new ParticleEngine({ canvas: canvas.current, host: host.current, settings: s, device: "desktop" });
    });
    return () => { alive = false; };
  }, [key, dark]);
  useEffect(() => () => { engine.current?.destroy(); engine.current = null; }, []);

  return (
    <div ref={host} className={`relative isolate overflow-hidden ${className}`}>
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden><canvas ref={canvas} className="absolute" /></div>
      {label && <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${dark ? "bg-white/10 text-white" : "bg-white text-slate-700 shadow-sm"}`}>{label}</span>}
    </div>
  );
}
