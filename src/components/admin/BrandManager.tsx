"use client";
import { AlertTriangle, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { saveBrand } from "@/features/admin/system-actions";
import { contrastRatio } from "@/lib/brand/theme";
import type { BrandSettings, Palette } from "@/types/content";
import { FieldEditor } from "./FieldEditor";
import { PageTitle, SubmitButton, Tabs, useAdmin, useResult } from "./ui";

const KEYS: (keyof Palette)[] = ["primary", "secondary", "accent", "background", "surface", "foreground", "muted", "border"];

export function BrandManager({ brand }: { brand: BrandSettings }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const router = useRouter();
  const [b, setB] = useState<BrandSettings>(brand);
  const [mode, setMode] = useState<"light" | "dark">("light");
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof BrandSettings>(k: K, v: BrandSettings[K]) => setB((cur) => ({ ...cur, [k]: v }));
  const pal = b.colors[mode];
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

      <section className="card space-y-5 p-6">
        <h2 className="text-lg font-bold">{ar ? "الشعارات" : "Logos"}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([
            ["builtin", ar ? "شعار إتقان الأصلي (SVG)" : "Original ALITQAN mark (SVG)"],
            ["symbol_text", ar ? "الرمز + اسم العلامة كنص" : "Symbol + brand name as text"],
            ["uploaded", ar ? "شعار مرفوع" : "Uploaded logo"],
          ] as const).map(([v, label]) => (
            <label key={v} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line p-3 has-[:checked]:border-primary has-[:checked]:bg-soft">
              <input type="radio" name="logo_mode" checked={b.logo_mode === v} onChange={() => set("logo_mode", v)} />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-6 rounded-lg bg-subtle p-5">
          <Logo brand={b} locale="ar" />
          <Logo brand={b} locale="en" />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FieldEditor field={{ name: "logo_url", kind: "image", label: { ar: "الشعار الأساسي", en: "Primary logo" } }} value={b.logo_url} onChange={(v) => set("logo_url", v as string | null)} />
          <FieldEditor field={{ name: "logo_dark_url", kind: "image", label: { ar: "الشعار للوضع الداكن", en: "Logo for dark mode" } }} value={b.logo_dark_url} onChange={(v) => set("logo_dark_url", v as string | null)} />
          <FieldEditor field={{ name: "logo_alt_url", kind: "image", label: { ar: "الشعار البديل", en: "Alternate logo" } }} value={b.logo_alt_url} onChange={(v) => set("logo_alt_url", v as string | null)} />
          <FieldEditor field={{ name: "symbol_url", kind: "image", label: { ar: "الرمز المستقل", en: "Standalone symbol" } }} value={b.symbol_url} onChange={(v) => set("symbol_url", v as string | null)} />
          <FieldEditor field={{ name: "favicon_url", kind: "image", label: { ar: "أيقونة الموقع (Favicon)", en: "Favicon" } }} value={b.favicon_url} onChange={(v) => set("favicon_url", v as string | null)} />
          <FieldEditor field={{ name: "og_image_url", kind: "image", label: { ar: "صورة المشاركة الافتراضية", en: "Default share image" } }} value={b.og_image_url} onChange={(v) => set("og_image_url", v as string | null)} />
        </div>
        <p className="flex items-center gap-2 text-sm text-muted">
          <Download className="h-4 w-4" />
          {ar ? "ملفات الهوية الأصلية (SVG):" : "Original identity files (SVG):"}{" "}
          {["horizontal-color", "vertical-color", "symbol-color", "symbol-white", "arabic-black", "latin-black"].map((f) => (
            <a key={f} href={`/brand/${f}.svg`} download className="font-mono text-xs text-primary underline" dir="ltr">{f}</a>
          ))}
        </p>
      </section>

      <section className="card space-y-5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{ar ? "الألوان (Design Tokens)" : "Colours (design tokens)"}</h2>
          <div className="w-56"><Tabs value={mode} onChange={(v) => setMode(v as "light" | "dark")} tabs={[{ value: "light", label: ar ? "الوضع الفاتح" : "Light" }, { value: "dark", label: ar ? "الوضع الداكن" : "Dark" }]} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {KEYS.map((k) => (
            <label key={k} className="block">
              <span className="label capitalize">{k}</span>
              <span className="flex items-center gap-2">
                <input type="color" value={pal[k]} onChange={(e) => set("colors", { ...b.colors, [mode]: { ...pal, [k]: e.target.value } })} className="h-10 w-12 flex-none cursor-pointer rounded border border-line bg-transparent" />
                <input value={pal[k]} onChange={(e) => set("colors", { ...b.colors, [mode]: { ...pal, [k]: e.target.value } })} className="input min-h-0 py-2 font-mono text-xs" dir="ltr" />
              </span>
            </label>
          ))}
        </div>
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

      <section className="card space-y-5 p-6">
        <h2 className="text-lg font-bold">{ar ? "إعدادات الثيم" : "Theme settings"}</h2>
        <p className="text-sm text-muted">
          {ar ? "الخطوط وأوزانها والخطوط المخصصة تُدار من صفحة " : "Fonts, weights and custom fonts are managed in "}
          <a href="/admin/typography" className="font-semibold text-primary underline">{ar ? "إدارة الخطوط" : "Typography settings"}</a>.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">{ar ? "انحناء الحواف" : "Corner radius"}</label>
            <select className="input" value={b.radius} onChange={(e) => set("radius", e.target.value)}>
              {["0px", "6px", "10px", "14px", "18px", "24px"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{ar ? "نمط الخلفية" : "Background pattern"}</label>
            <select className="input" value={b.backgrounds?.pattern ?? "measure"} onChange={(e) => set("backgrounds", { ...b.backgrounds, pattern: e.target.value })}>
              <option value="measure">{ar ? "شبكة نقاط القياس" : "Measure dot grid"}</option>
              <option value="none">{ar ? "بدون" : "None"}</option>
            </select>
          </div>
          <div>
            <label className="label">{ar ? "الثيم الافتراضي للزوار" : "Default theme for visitors"}</label>
            <select className="input" value={b.default_theme} onChange={(e) => set("default_theme", e.target.value as BrandSettings["default_theme"])}>
              <option value="system">{ar ? "حسب النظام" : "System"}</option>
              <option value="light">{ar ? "فاتح" : "Light"}</option>
              <option value="dark">{ar ? "داكن" : "Dark"}</option>
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
