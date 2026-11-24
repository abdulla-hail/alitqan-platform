"use client";
import { DEFAULT_MIX, MIXABLE_SHAPES, type MeshPattern, type ParticleShape } from "@/lib/hero-effect";

type Mixable = Exclude<ParticleShape, "mixed">;

const SHAPES: { v: ParticleShape; ar: string; en: string }[] = [
  { v: "circle", ar: "دوائر ونقاط", en: "Circles" },
  { v: "triangle", ar: "مثلثات", en: "Triangles" },
  { v: "square", ar: "مربعات", en: "Squares" },
  { v: "diamond", ar: "معيّنات", en: "Diamonds" },
  { v: "hexagon", ar: "سداسيات", en: "Hexagons" },
  { v: "pentagon", ar: "متعدد الأضلاع", en: "Polygons" },
  { v: "star", ar: "نجوم هندسية", en: "Stars" },
  { v: "plus", ar: "علامات (+)", en: "Plus marks" },
  { v: "ring", ar: "حلقات", en: "Rings" },
  { v: "mixed", ar: "مزيج أشكال", en: "Mixed" },
];
const PATTERNS: { v: MeshPattern; ar: string; en: string }[] = [
  { v: "triangles", ar: "مثلثات مترابطة", en: "Triangle mesh" },
  { v: "squares", ar: "شبكة مربعات", en: "Square grid" },
  { v: "hexagons", ar: "خلايا سداسية", en: "Honeycomb" },
  { v: "diamonds", ar: "شبكة معيّنات", en: "Diamond mesh" },
  { v: "polygons", ar: "مضلعات (Low-poly)", en: "Low-poly facets" },
  { v: "mixed", ar: "شبكة مختلطة", en: "Mixed mesh" },
  { v: "constellation", ar: "كوكبة نقاط", en: "Constellation" },
];
const label = (list: { v: string; ar: string; en: string }[], v: string, ar: boolean) => {
  const x = list.find((i) => i.v === v);
  return x ? (ar ? x.ar : x.en) : v;
};

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
    case "pentagon": return <polygon points={poly(5, r * 1.25, -Math.PI / 2)} />;
    case "star":
      return (
        <polygon
          points={Array.from({ length: 10 }, (_, k) => {
            const a = -Math.PI / 2 + (k * Math.PI) / 5, rad = k % 2 ? r * 0.62 : r * 1.55;
            return `${(x + Math.cos(a) * rad).toFixed(2)},${(y + Math.sin(a) * rad).toFixed(2)}`;
          }).join(" ")}
        />
      );
    case "plus": {
      const a = r * 1.4, t = r * 0.42;
      return <path d={`M${x - t} ${y - a}H${x + t}V${y - t}H${x + a}V${y + t}H${x + t}V${y + a}H${x - t}V${y + t}H${x - a}V${y - t}H${x - t}Z`} />;
    }
    case "ring": return <circle cx={x} cy={y} r={r * 1.05} fill="none" stroke="currentColor" strokeWidth={r * 0.6} />;
    case "mixed":
      return (
        <>
          <ShapeIcon shape="circle" x={7} y={7} r={3} />
          <ShapeIcon shape="square" x={17} y={7} r={3} />
          <ShapeIcon shape="triangle" x={7} y={17} r={3} />
          <ShapeIcon shape="star" x={17} y={17} r={2.6} />
        </>
      );
    default: return <circle cx={x} cy={y} r={r} />;
  }
}

function PatternIcon({ pattern }: { pattern: MeshPattern }) {
  const hex = (cx: number, cy: number, r: number) =>
    "M" + Array.from({ length: 6 }, (_, k) => `${(cx + Math.cos((k * Math.PI) / 3) * r).toFixed(2)} ${(cy + Math.sin((k * Math.PI) / 3) * r).toFixed(2)}`).join("L") + "Z";
  const d: Record<MeshPattern, string> = {
    triangles: "M2 20L7 11.5L12 20ZM7 11.5L12 3L17 11.5ZM12 20L17 11.5L22 20M7 11.5H17",
    squares: "M3 3H21V21H3ZM12 3V21M3 12H21",
    hexagons: hex(7.5, 8, 4.5) + hex(14.25, 11.9, 4.5) + hex(7.5, 15.8, 4.5),
    diamonds: "M12 2L22 12L12 22L2 12ZM7 7L17 17M17 7L7 17",
    polygons: "M3 5L10 3L9 11ZM10 3L20 6L9 11ZM20 6L21 15L9 11ZM3 5L9 11L4 19ZM9 11L21 15L13 21ZM4 19L9 11L13 21Z",
    mixed: "M2 20L7 11.5L12 20ZM12 20L17 11.5H22V20ZM7 11.5L12 3L17 11.5",
    constellation: "M4 6L10 4L13 11L20 8M13 11L8 17L16 19L20 8M4 6L8 17",
  };
  return (
    <>
      <path d={d[pattern]} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      {pattern === "constellation" && [[4, 6], [10, 4], [13, 11], [20, 8], [8, 17], [16, 19]].map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.6" fill="currentColor" />)}
    </>
  );
}

/**
 * Choose how particles are drawn (shape, or a mix of shapes) and which figures their links form.
 * Every option previews instantly in the live preview next to it.
 */
export function ParticleShapePicker({
  shape,
  pattern,
  mix = DEFAULT_MIX,
  onChange,
  ar,
  name,
}: {
  shape: ParticleShape;
  pattern: MeshPattern;
  mix?: Mixable[];
  onChange: (patch: { shape?: ParticleShape; pattern?: MeshPattern; mix?: Mixable[] }) => void;
  ar: boolean;
  /** unique radio group name when several pickers share a page */
  name: string;
}) {
  const btn =
    "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-line p-2.5 text-center text-xs font-medium leading-tight transition-colors hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-soft has-[:checked]:text-primary";
  const toggleMix = (v: Mixable) => {
    const next = mix.includes(v) ? mix.filter((m) => m !== v) : [...mix, v];
    if (next.length >= 2) onChange({ mix: next });
  };
  return (
    <div className="space-y-4" data-shape-picker={name}>
      <fieldset>
        <legend className="label">
          {ar ? "شكل الجسيمات" : "Particle shape"} — <span className="text-primary">{label(SHAPES, shape, ar)}</span>
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SHAPES.map((s) => (
            <label key={s.v} className={btn}>
              <input type="radio" className="sr-only" name={`${name}-shape`} value={s.v} checked={shape === s.v} onChange={() => onChange({ shape: s.v })} />
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden><ShapeIcon shape={s.v} /></svg>
              {ar ? s.ar : s.en}
            </label>
          ))}
        </div>
      </fieldset>
      {shape === "mixed" && (
        <fieldset className="rounded-xl bg-subtle p-3">
          <legend className="sr-only">{ar ? "الأشكال المستخدمة في المزيج" : "Shapes in the mix"}</legend>
          <p className="mb-2 text-xs text-muted">{ar ? "اختر شكلين أو أكثر يتناوبان في الشبكة:" : "Pick two or more shapes to alternate:"}</p>
          <div className="flex flex-wrap gap-2" data-mix-picker>
            {MIXABLE_SHAPES.map((v) => (
              <label key={v} className="inline-flex cursor-pointer items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1.5 text-xs has-[:checked]:border-primary has-[:checked]:text-primary">
                <input type="checkbox" className="sr-only" value={v} checked={mix.includes(v)} onChange={() => toggleMix(v)} />
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden><ShapeIcon shape={v} /></svg>
                {label(SHAPES, v, ar)}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <fieldset>
        <legend className="label">
          {ar ? "نمط الشبكة (الأشكال التي تكوّنها الخطوط)" : "Mesh pattern (figures formed by the lines)"} — <span className="text-primary">{label(PATTERNS, pattern, ar)}</span>
        </legend>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
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
