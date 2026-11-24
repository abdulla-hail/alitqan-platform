"use client";
import { Download, RotateCcw, ShieldCheck } from "lucide-react";
import { BrandMark, Logo, markColors } from "@/components/brand/Logo";
import { MARK_DEFAULT_COLORS, MARK_DEFAULT_MONO, type MarkVariant } from "@/lib/brand/mark";
import type { BrandSettings, LogoSystem, Palette } from "@/types/content";
import { FieldEditor } from "./FieldEditor";
import { Switch } from "./ui";
import { AmbientPreview } from "@/components/effects/AmbientPreview";
import { ParticleShapePicker } from "./ParticleShapePicker";
import { BRAND_PARTICLES_DEFAULTS, sanitizeBrandParticles, type BrandParticles } from "@/lib/brand/particles";

const COLOR_FIELDS = [
  ["dark", "اللون الأساسي الداكن", "Deep navy"],
  ["deep", "لون التدرج الثانوي", "Secondary gradient"],
  ["primary", "الأزرق الرئيسي", "Main blue"],
  ["bright", "الأزرق الساطع", "Bright cyan"],
  ["mono", "لون النسخة الأحادية", "Monochrome colour"],
] as const;

const PACKAGE = ["logo.svg", "logo-monochrome.svg", "logo-white.svg", "logo-dark.svg", "logo-light.svg", "logo-icon.svg", "favicon.svg", "logo.png", "logo-preview.png"];

/**
 * CMS → Brand identity → "Visual identity settings".
 * Edits are previewed live from local state; nothing reaches the site until the form is saved.
 */
export function LogoIdentityPanel({ b, set, ar }: { b: BrandSettings; set: <K extends keyof BrandSettings>(k: K, v: BrandSettings[K]) => void; ar: boolean }) {
  const sys: LogoSystem = b.logo_system ?? {};
  const colors = { ...markColors(sys), mono: sys.colors?.mono ?? MARK_DEFAULT_MONO };
  const setSys = (patch: Partial<LogoSystem>) => set("logo_system", { ...sys, ...patch });
  const setColor = (k: (typeof COLOR_FIELDS)[number][0], v: string) => setSys({ colors: { ...sys.colors, [k]: v } });
  const prev = sys.previous_colors as { light?: Palette; dark?: Palette } | undefined;
  const canRestorePalette = Boolean(prev?.light?.primary && prev?.dark?.primary);
  const preview = { ...b, logo_system: sys };
  const onLight = (sys.on_light ?? "color") as MarkVariant;
  const onDark = (sys.on_dark ?? "light") as MarkVariant;
  const particles = sanitizeBrandParticles(b.backgrounds?.particles);
  const setParticles = (p: BrandParticles) => set("backgrounds", { ...b.backgrounds, particles: p });

  return (
    <section className="card space-y-6 p-6" aria-labelledby="identity-h">
      <div>
        <h2 id="identity-h" className="text-lg font-bold">{ar ? "إعدادات الهوية البصرية" : "Visual identity settings"}</h2>
        <p className="mt-1 text-sm text-muted">
          {ar ? "الشعار الرسمي مرسوم كمتجهات SVG وتُلوَّن نسخه من هنا. المعاينة فورية، ولا يتغير الموقع إلا بعد الحفظ." : "The official mark is vector SVG and is re-coloured from here. Preview is instant; the site changes only after saving."}
        </p>
      </div>

      {/* which logo the site uses */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {([
          ["mark", ar ? "الشعار الرسمي (SVG قابل للتلوين)" : "Official mark (recolourable SVG)"],
          ["symbol_text", ar ? "الرمز + اسم العلامة كنص" : "Mark + brand name as text"],
          ["uploaded", ar ? "شعار بديل مرفوع" : "Uploaded replacement logo"],
        ] as const).map(([v, label]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line p-3 has-[:checked]:border-primary has-[:checked]:bg-soft">
            <input type="radio" name="logo_mode" checked={b.logo_mode === v || (v === "mark" && b.logo_mode === "builtin")} onChange={() => set("logo_mode", v)} />
            <span className="text-sm font-medium">{label}</span>
          </label>
        ))}
      </div>

      {/* live preview on both surfaces */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3" data-logo-preview>
        <div className="grid min-h-40 place-items-center rounded-2xl border border-line bg-white p-6">
          <div className="text-[#0A1433]"><Logo brand={preview} locale={ar ? "ar" : "en"} surface="light" size="lg" previewColors={colors} /></div>
          <span className="mt-3 text-xs text-slate-500">{ar ? "خلفية فاتحة" : "Light background"}</span>
        </div>
        <div className="grid min-h-40 place-items-center rounded-2xl bg-[#070B1A] p-6">
          <div className="text-white"><Logo brand={preview} locale={ar ? "ar" : "en"} surface="dark" size="lg" previewColors={colors} /></div>
          <span className="mt-3 text-xs text-white/60">{ar ? "خلفية داكنة" : "Dark background"}</span>
        </div>
        <div className="grid min-h-40 place-items-center rounded-2xl border border-line bg-subtle p-6">
          <div className="flex items-end gap-4">
            <span className="grid h-20 w-20 place-items-center rounded-[calc(var(--radius)*1.6)] bg-white shadow-md"><BrandMark square className="h-16 w-16" colors={colors} /></span>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white shadow"><BrandMark square className="h-9 w-9" colors={colors} /></span>
            <BrandMark square className="h-6 w-6" colors={colors} />
          </div>
          <span className="mt-3 text-xs text-muted">{ar ? "أيقونة التطبيق والمتصفح" : "App & browser icon"}</span>
        </div>
      </div>

      {/* colours */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">{ar ? "ألوان الشعار" : "Logo colours"}</h3>
          <button type="button" className="btn btn-ghost min-h-0 px-3 py-1.5 text-sm" onClick={() => setSys({ colors: {} })}>
            <RotateCcw className="h-4 w-4" />{ar ? "إعادة الألوان الافتراضية" : "Reset default colours"}
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {COLOR_FIELDS.map(([k, arL, enL]) => (
            <label key={k} className="block">
              <span className="label">{ar ? arL : enL}</span>
              <span className="flex items-center gap-2">
                <input type="color" value={colors[k]} onChange={(e) => setColor(k, e.target.value.toUpperCase())} className="h-10 w-12 flex-none cursor-pointer rounded-sm border border-line bg-transparent" aria-label={ar ? arL : enL} />
                <input value={sys.colors?.[k] ?? ""} placeholder={k === "mono" ? MARK_DEFAULT_MONO : MARK_DEFAULT_COLORS[k]} onChange={(e) => setColor(k, e.target.value.trim())} className="input min-h-0 py-2 font-mono text-xs" dir="ltr" />
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* variant per background */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="on-light">{ar ? "النسخة على الخلفيات الفاتحة" : "Version on light backgrounds"}</label>
          <select id="on-light" className="input" value={onLight} onChange={(e) => setSys({ on_light: e.target.value as LogoSystem["on_light"] })}>
            <option value="color">{ar ? "ملوّنة (الرسمية)" : "Full colour (official)"}</option>
            <option value="dark">{ar ? "داكنة" : "Dark"}</option>
            <option value="mono">{ar ? "أحادية اللون" : "Monochrome"}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="on-dark">{ar ? "النسخة على الخلفيات الداكنة" : "Version on dark backgrounds"}</label>
          <select id="on-dark" className="input" value={onDark} onChange={(e) => setSys({ on_dark: e.target.value as LogoSystem["on_dark"] })}>
            <option value="light">{ar ? "ملوّنة مُفتّحة" : "Colour, lifted for dark"}</option>
            <option value="white">{ar ? "بيضاء" : "White"}</option>
            <option value="color">{ar ? "ملوّنة كما هي" : "Full colour as is"}</option>
            <option value="mono">{ar ? "أحادية اللون" : "Monochrome"}</option>
          </select>
        </div>
      </div>

      {/* company name beside the logo (header only) */}
      <div className="space-y-4 rounded-2xl border border-line p-4 sm:p-5" data-header-name-settings>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold">{ar ? "إظهار اسم الشركة بجوار الشعار في الهيدر" : "Show the company name beside the logo in the header"}</h3>
            <p className="mt-1 text-sm text-muted">{ar ? "الاسم العربي يظهر في الواجهة العربية والإنجليزي في الإنجليزية. اتركهما فارغين لاستخدام اسم العلامة." : "Arabic name in the Arabic site, English in the English site. Leave empty to use the brand name."}</p>
          </div>
          <Switch checked={Boolean(sys.show_name)} onChange={(v) => setSys({ show_name: v })} label={sys.show_name ? (ar ? "ظاهر" : "Shown") : ar ? "الشعار فقط" : "Logo only"} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">{ar ? "الاسم بالعربية" : "Name in Arabic"}</span>
            <input className="input" dir="rtl" lang="ar" maxLength={40} value={sys.header_name?.ar ?? ""} placeholder={b.name?.ar || "إتقان"} onChange={(e) => setSys({ header_name: { ...sys.header_name, ar: e.target.value } })} />
          </label>
          <label className="block">
            <span className="label">{ar ? "الاسم بالإنجليزية" : "Name in English"}</span>
            <input className="input" dir="ltr" lang="en" maxLength={40} value={sys.header_name?.en ?? ""} placeholder={b.name?.en || "ALITQAN"} onChange={(e) => setSys({ header_name: { ...sys.header_name, en: e.target.value } })} />
          </label>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2" aria-label={ar ? "معاينة الهيدر" : "Header preview"}>
          {(["ar", "en"] as const).map((lng) => (
            <div key={lng} dir={lng === "ar" ? "rtl" : "ltr"} className="flex h-16 items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 text-[#0A1433]" data-header-preview={lng}>
              <Logo brand={preview} locale={lng} surface="light" context="header" previewColors={colors} />
              <span className="flex items-center gap-1.5 text-slate-400" aria-hidden><span className="h-8 w-8 rounded-full border border-slate-200" /><span className="h-8 w-8 rounded-full border border-slate-200" /></span>
            </div>
          ))}
        </div>
      </div>

      {/* particle colours (shared by every page's subtle background particles; optional for the hero) */}
      <div className="space-y-4 rounded-2xl border border-line p-4 sm:p-5" data-particle-settings>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold">{ar ? "الجسيمات: الألوان والأشكال" : "Particles: colours & shapes"}</h3>
            <p className="mt-1 text-sm text-muted">{ar ? "تُطبَّق على الجسيمات الخفيفة في جميع أقسام الموقع، وتُضبط تلقائياً للوضع الليلي. تأثير القسم الرئيسي له إعداداته المستقلة ويمكنه استخدام هذه الألوان." : "Used by the subtle particles in every section, auto-tuned for dark mode. The hero effect has its own settings and can use these colours."}</p>
          </div>
          <button type="button" className="btn btn-ghost min-h-0 px-3 py-1.5 text-sm" onClick={() => setParticles(BRAND_PARTICLES_DEFAULTS)}>
            <RotateCcw className="h-4 w-4" />{ar ? "الألوان الافتراضية" : "Defaults"}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {([
            ["particle", ar ? "اللون الأساسي للجسيمات" : "Particle colour"],
            ["link", ar ? "لون خطوط الاتصال" : "Link colour"],
            ["glow", ar ? "لون التوهج" : "Glow colour"],
          ] as const).map(([k, label]) => (
            <label key={k} className="block">
              <span className="label">{label}</span>
              <span className="flex items-center gap-2">
                <input type="color" value={particles[k]} onChange={(e) => setParticles({ ...particles, [k]: e.target.value.toUpperCase() })} className="h-10 w-12 flex-none cursor-pointer rounded border border-line bg-transparent" aria-label={label} />
                <input value={particles[k]} onChange={(e) => setParticles({ ...particles, [k]: e.target.value.trim() })} className="input min-h-0 py-2 font-mono text-xs" dir="ltr" maxLength={7} />
              </span>
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {([
            ["opacity", ar ? "شفافية الجسيمات" : "Particle opacity"],
            ["link_opacity", ar ? "شفافية خطوط الاتصال" : "Link opacity"],
          ] as const).map(([k, label]) => (
            <label key={k} className="block">
              <span className="label flex items-center justify-between"><span>{label}</span><span className="font-mono text-xs text-muted" dir="ltr">{particles[k]}</span></span>
              <input type="range" min={0} max={1} step={0.01} value={particles[k]} onChange={(e) => setParticles({ ...particles, [k]: Number(e.target.value) })} className="w-full accent-[var(--color-primary)]" dir="ltr" />
            </label>
          ))}
        </div>
        <label className="block">
          <span className="label flex items-center justify-between"><span>{ar ? "حجم الجسيمات" : "Particle size"}</span><span className="font-mono text-xs text-muted" dir="ltr">{particles.size}</span></span>
          <input type="range" min={0.6} max={4} step={0.05} value={particles.size} onChange={(e) => setParticles({ ...particles, size: Number(e.target.value) })} className="w-full accent-[var(--color-primary)]" dir="ltr" />
          <span className="mt-1 block text-xs text-muted">{ar ? "الأشكال غير الدائرية تُرسم أكبر قليلاً تلقائياً ليظهر شكلها بوضوح." : "Non-circle shapes are drawn slightly larger automatically so their shape reads."}</span>
        </label>
        <ParticleShapePicker name="site-particles" ar={ar} shape={particles.shape} pattern={particles.pattern} onChange={(patch) => setParticles({ ...particles, ...patch })} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AmbientPreview colors={particles} dark={false} label={ar ? "الوضع النهاري" : "Light mode"} className="grid h-40 place-items-center rounded-xl border border-line bg-[#F7F9FD]" />
          <AmbientPreview colors={particles} dark label={ar ? "الوضع الليلي" : "Dark mode"} className="grid h-40 place-items-center rounded-xl bg-[#070B1A]" />
        </div>
        <p className="text-xs text-muted">{ar ? "المعاينة أكثف من الموقع لتسهيل الحكم على الألوان. حرّك الماوس فوقها لتجربة التفاعل." : "The preview is denser than the site so colours are easy to judge. Hover to try the interaction."}</p>
      </div>

      {canRestorePalette && (
        <p className="flex flex-wrap items-center gap-3 rounded-xl bg-subtle p-3 text-sm">
          {ar ? "تم تحديث ألوان الموقع لتتناسق مع الشعار الجديد. يمكنك استعادة الألوان السابقة:" : "Site colours were updated to match the new mark. You can restore the previous palette:"}
          <button type="button" className="btn btn-outline min-h-0 px-3 py-1.5 text-sm" onClick={() => set("colors", { light: prev!.light!, dark: prev!.dark! })}>
            <RotateCcw className="h-4 w-4" />{ar ? "استعادة ألوان الموقع السابقة" : "Restore previous site colours"}
          </button>
        </p>
      )}

      {/* replacement files */}
      <div>
        <h3 className="font-bold">{ar ? "رفع شعار بديل" : "Upload a replacement logo"}</h3>
        <p className="mt-1 flex items-start gap-2 text-sm text-muted">
          <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-success" />
          {ar
            ? "ملفات SVG تُفحص وتُنقّى قبل الرفع، ويُرفض أي ملف يحتوي على سكربتات أو روابط خارجية. الشعارات المرفوعة تُعرض كصور فقط. اختر «شعار بديل مرفوع» أعلاه لتفعيلها."
            : "SVG files are checked and cleaned before upload; files with scripts or external references are refused. Uploaded logos are only displayed as images. Choose “Uploaded replacement logo” above to use them."}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          <FieldEditor field={{ name: "logo_url", kind: "image", label: { ar: "الشعار للخلفيات الفاتحة", en: "Logo for light backgrounds" } }} value={b.logo_url} onChange={(v) => set("logo_url", v as string | null)} />
          <FieldEditor field={{ name: "logo_dark_url", kind: "image", label: { ar: "الشعار للخلفيات الداكنة", en: "Logo for dark backgrounds" } }} value={b.logo_dark_url} onChange={(v) => set("logo_dark_url", v as string | null)} />
          <FieldEditor field={{ name: "symbol_url", kind: "image", label: { ar: "رمز مستقل (اختياري)", en: "Standalone symbol (optional)" } }} value={b.symbol_url} onChange={(v) => set("symbol_url", v as string | null)} />
          <FieldEditor field={{ name: "logo_alt_url", kind: "image", label: { ar: "الشعار البديل", en: "Alternate logo" } }} value={b.logo_alt_url} onChange={(v) => set("logo_alt_url", v as string | null)} />
          <FieldEditor field={{ name: "favicon_url", kind: "image", label: { ar: "أيقونة المتصفح (اتركها فارغة لاستخدام الرسمية)", en: "Favicon (empty = official)" } }} value={b.favicon_url} onChange={(v) => set("favicon_url", v as string | null)} />
          <FieldEditor field={{ name: "og_image_url", kind: "image", label: { ar: "صورة المشاركة (اتركها فارغة للرسمية)", en: "Share image (empty = official)" } }} value={b.og_image_url} onChange={(v) => set("og_image_url", v as string | null)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Download className="h-4 w-4" />
        {ar ? "حزمة الشعار الرسمية:" : "Official logo package:"}
        {PACKAGE.map((f) => (
          <a key={f} href={`/brand/${f}`} download className="rounded-pill border border-line px-2.5 py-0.5 font-mono text-xs text-primary hover:border-primary" dir="ltr">{f}</a>
        ))}
      </div>
    </section>
  );
}
