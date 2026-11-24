"use client";
import type { MeshPattern, ParticleShape } from "@/lib/hero-effect";

const SHAPES: { v: ParticleShape; ar: string; en: string }[] = [
  { v: "circle", ar: "دوائر", en: "Circles" },
  { v: "square", ar: "مربعات", en: "Squares" },
  { v: "triangle", ar: "مثلثات", en: "Triangles" },
  { v: "diamond", ar: "معيّنات", en: "Diamonds" },
  { v: "hexagon", ar: "سداسيات", en: "Hexagons" },
  { v: "mixed", ar: "مزيج", en: "Mixed" },
];
const PATTERNS: { v: MeshPattern; ar: string; en: string }[] = [
  { v: "triangles", ar: "شبكة مثلثات", en: "Triangle mesh" },
  { v: "squares", ar: "شبكة مربعات", en: "Square grid" },
  { v: "hexagons", ar: "خلايا سداسية", en: "Honeycomb" },
];

function ShapeIcon({ shape, x = 12, y = 12, r = 5 }: { shape: ParticleShape; x?: number; y?: number; r?: number }) {
  const poly = (n: number, rad: number, rot: number) =>
    Array.from({ length: n }, (_, k) => {
      const a = rot + (k * Math.PI * 2) / n;
      return `${(x + Math.cos(a) * rad).toFixed(2)},${(y + Math.sin(a) * rad).toFixed(2)}`;
    }).join(" ");
  switch (shape) {
    case "square": return <rect x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} />;
    case "triangle": return <polygon points={poly(3, r * 1.35, -Math.PI / 2)} />;
    case "diamond": return <polygon points={poly(4, r * 1.3, 0)} />;
    case "hexagon": return <polygon points={poly(6, r * 1.15, 0)} />;
    case "mixed":
      return (
        <>
          <ShapeIcon shape="circle" x={7} y={7} r={3} />
          <ShapeIcon shape="square" x={17} y={7} r={3} />
          <ShapeIcon shape="triangle" x={7} y={17} r={3} />
          <ShapeIcon shape="diamond" x={17} y={17} r={3} />
        </>
      );
    default: return <circle cx={x} cy={y} r={r} />;
  }
}

function PatternIcon({ pattern }: { pattern: MeshPattern }) {
  // three touching flat-top hexagons for the honeycomb icon
  const hex = (cx: number, cy: number, r: number) =>
    "M" + Array.from({ length: 6 }, (_, k) => `${(cx + Math.cos((k * Math.PI) / 3) * r).toFixed(2)} ${(cy + Math.sin((k * Math.PI) / 3) * r).toFixed(2)}`).join("L") + "Z";
  const d =
    pattern === "squares"
      ? "M3 3H21V21H3ZM12 3V21M3 12H21"
      : pattern === "hexagons"
        ? hex(7.5, 8, 4.5) + hex(14.25, 11.9, 4.5) + hex(7.5, 15.8, 4.5)
        : "M2 20L7 11.5L12 20ZM7 11.5L12 3L17 11.5ZM12 20L17 11.5L22 20M7 11.5H17";
  return <path d={d} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />;
}

/** Choose how particles are drawn (shape) and which figures their links form (pattern). */
export function ParticleShapePicker({
  shape,
  pattern,
  onChange,
  ar,
  name,
}: {
  shape: ParticleShape;
  pattern: MeshPattern;
  onChange: (patch: { shape?: ParticleShape; pattern?: MeshPattern }) => void;
  ar: boolean;
  /** unique radio group name when several pickers share a page */
  name: string;
}) {
  const btn = "flex flex-col items-center gap-1.5 rounded-xl border border-line p-2.5 text-xs font-medium transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-soft has-[:checked]:text-primary cursor-pointer";
  return (
    <div className="space-y-4" data-shape-picker={name}>
      <fieldset>
        <legend className="label">{ar ? "شكل الجسيمات" : "Particle shape"}</legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SHAPES.map((s) => (
            <label key={s.v} className={btn}>
              <input type="radio" className="sr-only" name={`${name}-shape`} value={s.v} checked={shape === s.v} onChange={() => onChange({ shape: s.v })} />
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden><ShapeIcon shape={s.v} /></svg>
              {ar ? s.ar : s.en}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">{ar ? "نمط الشبكة (الأشكال التي تكوّنها الخطوط)" : "Mesh pattern (figures formed by the lines)"}</legend>
        <div className="grid grid-cols-3 gap-2">
          {PATTERNS.map((p) => (
            <label key={p.v} className={btn}>
              <input type="radio" className="sr-only" name={`${name}-pattern`} value={p.v} checked={pattern === p.v} onChange={() => onChange({ pattern: p.v })} />
              <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden><PatternIcon pattern={p.v} /></svg>
              {ar ? p.ar : p.en}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
