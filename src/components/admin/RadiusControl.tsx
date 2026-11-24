"use client";
import { RotateCcw } from "lucide-react";
import { RADIUS_DEFAULT, RADIUS_MAX, RADIUS_MIN, radiusPx } from "@/lib/brand/radius";

/**
 * Global Border Radius — one slider that drives --global-border-radius for the whole site.
 * The preview below re-scopes the variable locally, so changes are visible before saving.
 */
export function RadiusControl({ value, onChange, ar }: { value: string; onChange: (v: string) => void; ar: boolean }) {
  const px = radiusPx(value);
  const preview = { ["--global-border-radius" as string]: `${px}px` } as React.CSSProperties;
  return (
    <section className="card space-y-5 p-6" aria-labelledby="radius-h">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="radius-h" className="text-lg font-bold">{ar ? "التحكم في تدوير الزوايا (Global Border Radius)" : "Global Border Radius"}</h2>
          <p className="mt-1 text-sm text-muted">
            {ar
              ? "إعداد واحد لتدوير زوايا كل عناصر الموقع: الأزرار، الصور، البطاقات، الحقول، القوائم، النوافذ والأقسام. القيمة 0 تجعل الزوايا حادة تماماً."
              : "One setting for every rounded element: buttons, images, cards, inputs, menus, modals and sections. 0 makes all corners sharp."}
          </p>
        </div>
        <button type="button" className="btn btn-ghost min-h-0 px-3 py-1.5 text-sm" onClick={() => onChange(`${RADIUS_DEFAULT}px`)} disabled={px === RADIUS_DEFAULT}>
          <RotateCcw className="h-4 w-4" />
          {ar ? `إعادة القيمة الافتراضية (${RADIUS_DEFAULT}px)` : `Reset to default (${RADIUS_DEFAULT}px)`}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <input
          id="global-radius"
          type="range"
          min={RADIUS_MIN}
          max={RADIUS_MAX}
          step={1}
          value={px}
          onChange={(e) => onChange(`${e.target.value}px`)}
          className="h-2 flex-1 cursor-pointer accent-[var(--color-primary)]"
          aria-label={ar ? "درجة تدوير الزوايا" : "Corner radius"}
          aria-valuetext={`${px}px`}
          dir="ltr"
        />
        <output htmlFor="global-radius" className="min-w-16 rounded-md border border-line bg-subtle px-2.5 py-1.5 text-center font-mono text-sm font-semibold tabular-nums" dir="ltr" data-radius-value>
          {px}px
        </output>
      </div>

      {/* live preview: same classes as the site, scoped to the unsaved value */}
      <div style={preview} className="grid grid-cols-1 gap-4 rounded-xl border border-dashed border-line p-4 sm:grid-cols-3" data-radius-preview>
        <div className="lift overflow-hidden p-0">
          <div className="aspect-[16/9] rounded-lg bg-soft" />
          <div className="p-3 text-sm font-semibold">{ar ? "بطاقة" : "Card"}</div>
        </div>
        <div className="space-y-3">
          <span className="btn btn-primary w-full">{ar ? "زر" : "Button"}</span>
          <span className="btn btn-primary w-full rounded-pill">{ar ? "زر دائري" : "Pill button"}</span>
          <span className="badge-pill">{ar ? "شارة" : "Badge"}</span>
        </div>
        <div className="space-y-3">
          <span className="input flex items-center text-muted">{ar ? "حقل إدخال" : "Input field"}</span>
          <div className="panel-soft p-4 text-sm">{ar ? "قسم / لوحة" : "Section / panel"}</div>
        </div>
      </div>
    </section>
  );
}
