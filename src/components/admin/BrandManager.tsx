"use client";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { saveBrand } from "@/features/admin/system-actions";
import { contrastRatio } from "@/lib/brand/theme";
import type { BrandSettings, Palette } from "@/types/content";
import { FieldEditor } from "./FieldEditor";
import { LogoIdentityPanel } from "./LogoIdentityPanel";
import { RadiusControl } from "./RadiusControl";
import { PageTitle, SubmitButton, Tabs, useAdmin, useResult } from "./ui";

const KEYS: (keyof Palette)[] = ["primary", "secondary", "accent", "background", "surface", "foreground", "muted", "border"];
/** brand colours — identical in both modes unless "custom dark brand colours" is chosen */
const BRAND_KEYS: (keyof Palette)[] = ["primary", "secondary", "accent"];

export function BrandManager({ brand }: { brand: BrandSettings }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const router = useRouter();
  const [b, setB] = useState<BrandSettings>(brand);
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof BrandSettings>(k: K, v: BrandSettings[K]) => setB((cur) => ({ ...cur, [k]: v }));
  const customDark = b.colors.dark_brand === "custom";
  // in dark mode (default) the preview uses the light palette's brand colours over the dark interface colours
  const pal = mode === "dark" && !customDark ? { ...b.colors.dark, primary: b.colors.light.primary, secondary: b.colors.light.secondary, accent: b.colors.light.accent } : b.colors[mode];
  const warnings = useMemo(() => {
    const w: string[] = [];
    const ratio = (a: string, c: string) => contrastRatio(a, c);
    if (ratio(pal.foreground, pal.background) < 4.5) w.push(ar ? "تباين النص مع الخلفية أقل من 4.5:1" : "Text vs background contrast below 4.5:1");
    if (ratio(pal.muted, pal.background) < 3) w.push(ar ? "النص الثانوي باهت جداً" : "Muted text is too faint");
    if (ratio(pal.primary, pal.background) < 3) w.push(ar ? "اللون الأساسي ضعيف التباين مع الخلفية" : "Primary colour has low contrast on the background");
    return w;
  }, [pal, ar]);

  // live preview of the edited palette
  const previewVars = Object.fromEntries(KEYS.map((k) => [`--c-${k}`, pal[k]])) as React.CSSProperties;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await saveBrand(b as unknown as Record<string, unknown>);
    setBusy(false);
    if (result(res)) router.refresh();
  }
  return (
    <form onSubmit={save} className="space-y-6 pb-24">
      <PageTitle title={d.brand} subtitle={ar ? "كل تغيير هنا ينعكس على الموقع بالكامل فور الحفظ." : "Every change here is applied across the whole site on save."} />

      <section className="card space-y-5 p-6">
        <h2 className="text-lg font-bold">{ar ? "اسم العلامة والشعار التسويقي" : "Brand name & tagline"}</h2>
        <FieldEditor field={{ name: "name", kind: "text", localized: true, label: { ar: "اسم العلامة", en: "Brand name" } }} value={b.name} onChange={(v) => set("name", v as never)} />
        <FieldEditor field={{ name: "tagline", kind: "text", localized: true, label: { ar: "الشعار التسويقي (Tagline)", en: "Tagline" } }} value={b.tagline} onChange={(v) => set("tagline", v as never)} />
        <FieldEditor field={{ name: "description", kind: "textarea", localized: true, label: { ar: "تعريف العلامة", en: "Brand description" } }} value={b.description} onChange={(v) => set("description", v as never)} />
      </section>

      <LogoIdentityPanel b={b} set={set} ar={ar} />

      <section className="card space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{ar ? "الألوان (Design Tokens)" : "Colours (design tokens)"}</h2>
          <div className="w-56"><Tabs value={mode} onChange={(v) => setMode(v as "light" | "dark")} tabs={[{ value: "light", label: ar ? "الوضع الفاتح" : "Light" }, { value: "dark", label: ar ? "الوضع الداكن" : "Dark" }]} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {KEYS.filter((k) => !(mode === "dark" && !customDark && BRAND_KEYS.includes(k))).map((k) => (
            <label key={k} className="block">
              <span className="label capitalize">{k}</span>
              <span className="flex items-center gap-2">
                <input type="color" value={pal[k]} onChange={(e) => set("colors", { ...b.colors, [mode]: { ...pal, [k]: e.target.value } })} className="h-10 w-12 flex-none cursor-pointer rounded-sm border border-line bg-transparent" />
                <input value={pal[k]} onChange={(e) => set("colors", { ...b.colors, [mode]: { ...pal, [k]: e.target.value } })} className="input min-h-0 py-2 font-mono text-xs" dir="ltr" />
              </span>
            </label>
          ))}
        </div>
        {mode === "dark" && !customDark && (
          <p className="rounded-lg bg-soft p-3 text-sm" data-dark-brand-note>
            {ar
              ? "ألوان الهوية (الأساسي، الثانوي، التمييز) ثابتة في الوضع الليلي ومأخوذة من الوضع النهاري. هنا تُعدَّل ألوان الواجهة فقط: الخلفية، البطاقات، النصوص، الحدود."
              : "Brand colours (primary, secondary, accent) stay the same in dark mode, taken from light mode. Here you edit interface colours only: background, cards, text, borders."}
          </p>
        )}
        {warnings.length > 0 && (
          <ul className="space-y-1 rounded-lg bg-warning/12 p-3 text-sm text-warning">{warnings.map((w) => <li key={w} className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{w}</li>)}</ul>
        )}
        <div style={previewVars} className="rounded-[var(--radius)] border p-6" data-preview>
          <div style={{ background: "var(--c-background)", color: "var(--c-foreground)", borderColor: "var(--c-border)" }} className="rounded-xl border p-6">
            <p style={{ color: "var(--c-primary)" }} className="text-sm font-semibold">{ar ? "معاينة مباشرة" : "Live preview"}</p>
            <p className="mt-2 text-2xl font-bold">{ar ? "نحوّل أفكارك إلى منتجات مُتقنة" : "Ideas, precisely crafted"}</p>
            <p style={{ color: "var(--c-muted)" }} className="mt-1">{ar ? "نص ثانوي لعرض التباين." : "Secondary text for contrast."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span style={{ background: "var(--c-primary)", color: "#fff" }} className="rounded-lg px-4 py-2 text-sm font-semibold">{ar ? "زر أساسي" : "Primary"}</span>
              <span style={{ background: "var(--c-accent)" }} className="rounded-lg px-4 py-2 text-sm font-semibold text-black">{ar ? "تمييز" : "Accent"}</span>
              <span style={{ background: "var(--c-surface)", borderColor: "var(--c-border)" }} className="rounded-lg border px-4 py-2 text-sm">{ar ? "بطاقة" : "Card"}</span>
            </div>
          </div>
        </div>
      </section>

      <RadiusControl value={b.radius} onChange={(v) => set("radius", v)} ar={ar} />

      <section className="card space-y-5 p-6">
        <h2 className="text-lg font-bold">{ar ? "إعدادات الثيم والوضع النهاري/الليلي" : "Theme & light/dark mode"}</h2>
        <p className="text-sm text-muted">
          {ar ? "الخطوط وأوزانها والخطوط المخصصة تُدار من صفحة " : "Fonts, weights and custom fonts are managed in "}
          <a href="/admin/typography" className="font-semibold text-primary underline">{ar ? "إدارة الخطوط" : "Typography settings"}</a>.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{ar ? "نمط الخلفية" : "Background pattern"}</label>
            <select className="input" value={String(b.backgrounds?.pattern ?? "measure")} onChange={(e) => set("backgrounds", { ...b.backgrounds, pattern: e.target.value })}>
              <option value="measure">{ar ? "شبكة نقاط القياس" : "Measure dot grid"}</option>
              <option value="none">{ar ? "بدون" : "None"}</option>
            </select>
          </div>
          <div>
            <label className="label">{ar ? "الوضع الافتراضي لأول زيارة" : "Mode for first-time visitors"}</label>
            <select className="input" value={b.default_theme === "dark" ? "dark" : "light"} onChange={(e) => set("default_theme", e.target.value as BrandSettings["default_theme"])}>
              <option value="light">{ar ? "نهاري" : "Light"}</option>
              <option value="dark">{ar ? "ليلي" : "Dark"}</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dark-brand">{ar ? "ألوان الهوية في الوضع الليلي" : "Brand colours in dark mode"}</label>
            <select id="dark-brand" className="input" value={customDark ? "custom" : "same"} onChange={(e) => set("colors", { ...b.colors, dark_brand: e.target.value as "same" | "custom" })}>
              <option value="same">{ar ? "ثابتة كما في الوضع النهاري (موصى به)" : "Same as light mode (recommended)"}</option>
              <option value="custom">{ar ? "ألوان مخصصة للوضع الليلي" : "Custom colours for dark mode"}</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="dark-logo">{ar ? "الشعار عند تفعيل الوضع الليلي" : "Logo when dark mode is on"}</label>
            <select id="dark-logo" className="input" value={b.logo_system?.dark_mode_logo === "variant" ? "variant" : "original"} onChange={(e) => set("logo_system", { ...(b.logo_system ?? {}), dark_mode_logo: e.target.value as "original" | "variant" })}>
              <option value="original">{ar ? "الشعار الأصلي بألوانه (موصى به)" : "Original logo and colours (recommended)"}</option>
              <option value="variant">{ar ? "نسخة الخلفيات الداكنة" : "Dark-background version"}</option>
            </select>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:start-[var(--sb)]">
        <div className="mx-auto flex max-w-5xl justify-end px-4 py-3"><SubmitButton busy={busy}>{busy ? d.saving : d.save}</SubmitButton></div>
      </div>
    </form>
  );
}
