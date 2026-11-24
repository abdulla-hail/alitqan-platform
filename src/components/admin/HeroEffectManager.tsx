"use client";
import { Eye, Laptop, Monitor, Rocket, RotateCcw, Save, Smartphone, Tablet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HeroParticles } from "@/components/effects/HeroParticles";
import { publishHeroEffect, saveHeroEffectDraft } from "@/features/admin/hero-effect-actions";
import { HERO_COLOR_PRESETS, HERO_EFFECT_DEFAULTS, RANGES, sameSettings, sanitizeHeroEffect, type DeviceKey, type HeroEffectSettings } from "@/lib/hero-effect";
import { PageTitle, Switch, useAdmin, useResult } from "./ui";
import { ParticleShapePicker } from "./ParticleShapePicker";

type K = keyof typeof RANGES;
type Group = "particles" | "interaction" | "colors" | "area";

function Range({ label, k, value, onChange, unit = "", hint }: { label: string; k: K; value: number; onChange: (v: number) => void; unit?: string; hint?: string }) {
  const [min, max, step] = RANGES[k];
  return (
    <label className="block">
      <span className="label flex items-center justify-between gap-2">
        <span>{label}</span>
        <span className="font-mono text-xs text-muted" dir="ltr">{value}{unit}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" dir="ltr" data-range={k} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} className="h-10 w-12 flex-none cursor-pointer rounded-md border border-line bg-transparent" aria-label={label} />
        <input value={value} onChange={(e) => onChange(e.target.value.trim())} className="input min-h-0 py-2 font-mono text-xs" dir="ltr" maxLength={7} />
      </span>
    </label>
  );
}

function Card({ letter, title, children, desc }: { letter: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-5 p-5 sm:p-6">
      <header className="flex items-start gap-3">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-lg bg-soft text-sm font-bold text-primary">{letter}</span>
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {desc && <p className="text-sm text-muted">{desc}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

const fmt = (iso: string | null, ar: boolean) => (iso ? new Date(iso).toLocaleString(ar ? "ar-SA" : "en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");

export function HeroEffectManager({ published, draft, publishedAt, draftAt, heroTitle, brandColors }: { published: HeroEffectSettings; draft: HeroEffectSettings; publishedAt: string | null; draftAt: string | null; heroTitle: Record<string, string>; brandColors?: unknown }) {
  const { locale } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const router = useRouter();
  const [s, setS] = useState<HeroEffectSettings>(draft);
  const [saved, setSaved] = useState<HeroEffectSettings>(draft);
  const [live, setLive] = useState<HeroEffectSettings>(published);
  const [times, setTimes] = useState({ draft: draftAt, published: publishedAt });
  const [device, setDevice] = useState<DeviceKey>("desktop");
  const [replay, setReplay] = useState(0);
  const [busy, setBusy] = useState<"" | "draft" | "publish">("");
  const dirty = !sameSettings(s, saved);
  const unpublished = !times.published || !sameSettings(saved, live) || dirty;
  const title = heroTitle[locale] || heroTitle.ar || "نحوّل أفكارك إلى منتجات رقمية مُتقنة";

  const set = <G extends Group>(g: G, patch: Partial<HeroEffectSettings[G]>) => setS((c) => sanitizeHeroEffect({ ...c, [g]: { ...c[g], ...patch } }));
  const setDev = (patch: Partial<HeroEffectSettings["devices"][DeviceKey]>) => setS((c) => sanitizeHeroEffect({ ...c, devices: { ...c.devices, [device]: { ...c.devices[device], ...patch } } }));
  const prof = s.devices[device];

  // warn before leaving with unsaved edits (the draft in the database is the safe copy)
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  async function saveDraft() {
    setBusy("draft");
    const res = await saveHeroEffectDraft(s);
    setBusy("");
    if (result(res, ar ? "تم حفظ المسودة — لم يتغير الموقع العام" : "Draft saved — the public site is unchanged") && res.ok && res.data) {
      setSaved(res.data.settings);
      setS(res.data.settings);
      const at = res.data.updated_at;
      setTimes((t) => ({ ...t, draft: at }));
    }
  }
  async function publish() {
    if (!window.confirm(ar ? "نشر هذه الإعدادات على الصفحة الرئيسية للموقع العام؟" : "Publish these settings to the public homepage?")) return;
    setBusy("publish");
    const res = await publishHeroEffect(s);
    setBusy("");
    if (result(res, ar ? "تم النشر — التأثير محدَّث على الموقع" : "Published — the homepage now uses these settings") && res.ok && res.data) {
      setSaved(res.data.settings);
      setLive(res.data.settings);
      setS(res.data.settings);
      setTimes({ draft: res.data.draft_at, published: res.data.published_at });
      router.refresh();
    }
  }

  const frame = useMemo(() => (device === "mobile" ? "max-w-[390px]" : device === "tablet" ? "max-w-[768px]" : "max-w-none"), [device]);
  const devices: { v: DeviceKey; t: string; I: typeof Monitor }[] = [
    { v: "desktop", t: ar ? "كمبيوتر" : "Desktop", I: Monitor },
    { v: "tablet", t: ar ? "تابلت" : "Tablet", I: Tablet },
    { v: "mobile", t: ar ? "هاتف" : "Mobile", I: Smartphone },
  ];

  return (
    <div className="space-y-6 pb-28">
      <PageTitle
        title={ar ? "إعدادات التأثير التفاعلي للقسم الرئيسي" : "Hero interactive effect"}
        subtitle={ar ? "شبكة جسيمات تفاعلية خلف عنوان الصفحة الرئيسية. عدّل القيم وجرّبها في المعاينة؛ لا يتغير الموقع العام إلا بعد «نشر التغييرات»." : "Interactive particle grid behind the homepage title. Tweak and test in the preview; the public site changes only when you publish."}
      />

      <div className="flex flex-wrap items-center gap-2 text-xs" aria-live="polite">
        <span className={`rounded-pill px-3 py-1 font-semibold ${dirty ? "bg-warning/15 text-warning" : "bg-success/12 text-success"}`} data-status="draft">
          {dirty ? (ar ? "تعديلات غير محفوظة" : "Unsaved changes") : ar ? "المسودة محفوظة" : "Draft saved"}
        </span>
        <span className={`rounded-pill px-3 py-1 font-semibold ${unpublished ? "bg-subtle text-muted" : "bg-success/12 text-success"}`} data-status="publish">
          {unpublished ? (ar ? "لم تُنشر بعد" : "Not published yet") : ar ? "مطابقة للمنشور" : "Matches the live site"}
        </span>
        <span className="text-muted">{ar ? "آخر حفظ للمسودة:" : "Draft saved:"} {fmt(times.draft, ar)} · {ar ? "آخر نشر:" : "Published:"} {fmt(times.published, ar)}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* -------------------------------------------------------------- controls */}
        <div className="order-2 space-y-6 xl:order-1">
          <Card letter={ar ? "أ" : "A"} title={ar ? "تشغيل التأثير" : "Effect"}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup">
              {([
                ["all", ar ? "الهاتف والكمبيوتر" : "Phones & desktop"],
                ["desktop", ar ? "الكمبيوتر فقط" : "Desktop only"],
                ["off", ar ? "إيقاف التأثير" : "Off"],
              ] as const).map(([v, t]) => (
                <label key={v} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line p-3 has-[:checked]:border-primary has-[:checked]:bg-soft">
                  <input type="radio" name="mode" checked={s.mode === v} onChange={() => setS((c) => ({ ...c, mode: v }))} />
                  <span className="text-sm font-medium">{t}</span>
                </label>
              ))}
            </div>
            <div>
              <label className="label" htmlFor="fallback">{ar ? "البديل الثابت عند إيقاف الحركة" : "Still fallback when motion is off"}</label>
              <select id="fallback" className="input" value={s.fallback} onChange={(e) => setS((c) => ({ ...c, fallback: e.target.value as HeroEffectSettings["fallback"] }))}>
                <option value="static">{ar ? "شبكة ثابتة بدون حركة" : "Still grid (no motion)"}</option>
                <option value="glow">{ar ? "توهج ناعم فقط" : "Soft glow only"}</option>
                <option value="none">{ar ? "بدون خلفية" : "Nothing"}</option>
              </select>
              <p className="mt-1 text-xs text-muted">{ar ? "يُستخدم أيضاً تلقائياً لزوار «تقليل الحركة» وللأجهزة غير المفعّلة." : "Also used automatically for reduce-motion visitors and disabled devices."}</p>
            </div>
          </Card>

          <Card letter={ar ? "ب" : "B"} title={ar ? "إعدادات الجسيمات" : "Particles"} desc={ar ? "العدد والمسافات تُضبط لكل جهاز في القسم «و»." : "Count and spacing are set per device in section F."}>
            <ParticleShapePicker name="hero-particles" ar={ar} shape={s.particles.shape} pattern={s.particles.pattern} mix={s.particles.mix} onChange={(patch) => set("particles", patch)} />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Range k="size" label={ar ? "حجم النقاط" : "Dot size"} unit="px" value={s.particles.size} onChange={(v) => set("particles", { size: v })} />
              <Range k="opacity" label={ar ? "شفافية النقاط" : "Dot opacity"} value={s.particles.opacity} onChange={(v) => set("particles", { opacity: v })} />
              <Range k="speed" label={ar ? "سرعة الحركة" : "Motion speed"} value={s.particles.speed} onChange={(v) => set("particles", { speed: v })} />
              <Range k="randomness" label={ar ? "مقدار الحركة العشوائية" : "Random drift"} value={s.particles.randomness} onChange={(v) => set("particles", { randomness: v })} />
              <Range k="return_speed" label={ar ? "سرعة العودة إلى الموقع الأصلي" : "Return to position"} value={s.particles.return_speed} onChange={(v) => set("particles", { return_speed: v })} />
              <Range k="link_density" label={ar ? "كثافة خطوط الاتصال" : "Link density"} value={s.particles.link_density} onChange={(v) => set("particles", { link_density: v })} />
              <Range k="link_distance" label={ar ? "أقصى مسافة للاتصال" : "Max link distance"} unit="px" value={s.particles.link_distance} onChange={(v) => set("particles", { link_distance: v })} />
            </div>
          </Card>

          <Card letter={ar ? "ج" : "C"} title={ar ? "تفاعل الماوس واللمس" : "Mouse & touch"} desc={ar ? "جرّب بتحريك الماوس أو النقر داخل المعاينة." : "Try it by moving or clicking inside the preview."}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Switch checked={s.interaction.repulsion} onChange={(v) => set("interaction", { repulsion: v })} label={ar ? "دفع الجسيمات بالماوس" : "Mouse repulsion"} />
              <Switch checked={s.interaction.touch} onChange={(v) => set("interaction", { touch: v })} label={ar ? "التفاعل باللمس" : "Touch interaction"} />
              <Switch checked={s.interaction.click_wave} onChange={(v) => set("interaction", { click_wave: v })} label={ar ? "موجة عند النقر" : "Click wave"} />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Range k="force" label={ar ? "قوة الدفع" : "Push force"} value={s.interaction.force} onChange={(v) => set("interaction", { force: v })} />
              <Range k="radius" label={ar ? "نصف قطر التأثير" : "Influence radius"} unit="px" value={s.interaction.radius} onChange={(v) => set("interaction", { radius: v })} />
              <Range k="response" label={ar ? "سرعة الاستجابة للمؤشر" : "Response speed"} value={s.interaction.response} onChange={(v) => set("interaction", { response: v })} />
              <Range k="release" label={ar ? "سرعة العودة بعد ابتعاد المؤشر" : "Release speed"} value={s.interaction.release} onChange={(v) => set("interaction", { release: v })} />
              <Range k="wave_strength" label={ar ? "قوة الموجة" : "Wave strength"} value={s.interaction.wave_strength} onChange={(v) => set("interaction", { wave_strength: v })} />
              <Range k="wave_speed" label={ar ? "سرعة الموجة" : "Wave speed"} value={s.interaction.wave_speed} onChange={(v) => set("interaction", { wave_speed: v })} />
            </div>
          </Card>

          <Card letter={ar ? "د" : "D"} title={ar ? "الألوان والإضاءة" : "Colours & light"}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup">
              {([
                ["custom", ar ? "ألوان مخصصة لهذا القسم" : "Custom colours for the hero"],
                ["brand", ar ? "استخدام ألوان الهوية (ألوان الجسيمات)" : "Use identity colours (particle colours)"],
              ] as const).map(([v, t]) => (
                <label key={v} className="flex cursor-pointer items-center gap-2 rounded-xl border border-line p-3 has-[:checked]:border-primary has-[:checked]:bg-soft">
                  <input type="radio" name="color-source" checked={s.colors.source === v} onChange={() => set("colors", { source: v })} />
                  <span className="text-sm font-medium">{t}</span>
                </label>
              ))}
            </div>
            {s.colors.source === "brand" && <p className="text-xs text-muted">{ar ? "الألوان تأتي من «الهوية البصرية ← ألوان الجسيمات». باقي إعدادات الإضاءة أدناه تبقى مستقلة." : "Colours come from Brand identity → Particle colours. The light settings below stay independent."}</p>}
            <fieldset disabled={s.colors.source === "brand"} className="space-y-4 disabled:opacity-50">
            <div className="flex flex-wrap gap-2">
              {HERO_COLOR_PRESETS.map((p) => (
                <button key={p.id} type="button" onClick={() => setS((c) => sanitizeHeroEffect({ ...c, colors: { ...c.colors, ...p.colors } }))} className="inline-flex items-center gap-2 rounded-pill border border-line px-3 py-1.5 text-sm hover:border-primary">
                  <span className="flex -space-x-1 rtl:space-x-reverse" aria-hidden>
                    {[p.colors.particle, p.colors.link, p.colors.glow].map((c, i) => <span key={i} className="h-4 w-4 rounded-full ring-2 ring-surface" style={{ background: c }} />)}
                  </span>
                  {ar ? p.ar : p.en}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Color label={ar ? "لون الجسيمات" : "Particles"} value={s.colors.particle} onChange={(v) => set("colors", { particle: v })} />
              <Color label={ar ? "لون خطوط الاتصال" : "Links"} value={s.colors.link} onChange={(v) => set("colors", { link: v })} />
              <Color label={ar ? "لون التوهج" : "Glow"} value={s.colors.glow} onChange={(v) => set("colors", { glow: v })} />
            </div>
            <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
              <Switch checked={s.colors.gradient} onChange={(v) => set("colors", { gradient: v })} label={ar ? "استخدام تدرج لوني" : "Use a gradient"} />
              {s.colors.gradient && <Color label={ar ? "لون نهاية التدرج" : "Gradient end"} value={s.colors.gradient_to} onChange={(v) => set("colors", { gradient_to: v })} />}
            </div>
            </fieldset>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <Range k="intensity" label={ar ? "قوة الإضاءة" : "Light intensity"} value={s.colors.intensity} onChange={(v) => set("colors", { intensity: v })} />
              <Range k="link_opacity" label={ar ? "شفافية الخطوط" : "Link opacity"} value={s.colors.link_opacity} onChange={(v) => set("colors", { link_opacity: v })} />
              <Range k="hover_glow" label={ar ? "التوهج عند اقتراب المؤشر" : "Glow near pointer"} value={s.colors.hover_glow} onChange={(v) => set("colors", { hover_glow: v })} />
            </div>
          </Card>

          <Card letter={ar ? "هـ" : "E"} title={ar ? "مساحة التأثير" : "Effect area"}>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Range k="height" label={ar ? "ارتفاع مساحة التأثير" : "Area height"} unit="%" value={s.area.height} onChange={(v) => set("area", { height: v })} />
              <Range k="width" label={ar ? "عرض الشبكة" : "Grid width"} unit="%" value={s.area.width} onChange={(v) => set("area", { width: v })} />
              <div>
                <label className="label" htmlFor="pos">{ar ? "موقع الشبكة داخل القسم" : "Position in the section"}</label>
                <select id="pos" className="input" value={s.area.position} onChange={(e) => set("area", { position: e.target.value as HeroEffectSettings["area"]["position"] })}>
                  <option value="top">{ar ? "أعلى" : "Top"}</option>
                  <option value="center">{ar ? "الوسط" : "Centre"}</option>
                  <option value="bottom">{ar ? "أسفل" : "Bottom"}</option>
                </select>
              </div>
              <Range k="center_density" label={ar ? "الكثافة في الوسط" : "Density in the centre"} value={s.area.center_density} onChange={(v) => set("area", { center_density: v })} />
              <Range k="edge_density" label={ar ? "الكثافة في الأطراف" : "Density at the edges"} value={s.area.edge_density} onChange={(v) => set("area", { edge_density: v })} />
              <Range k="text_clarity" label={ar ? "وضوح النص (خفوت الجسيمات خلفه)" : "Text clarity (fade behind title)"} value={s.area.text_clarity} onChange={(v) => set("area", { text_clarity: v })} />
              <Range k="protect_padding" label={ar ? "المساحة المحمية حول العنوان" : "Protected space around the title"} unit="px" value={s.area.protect_padding} onChange={(v) => set("area", { protect_padding: v })} />
            </div>
          </Card>

          <Card letter={ar ? "و" : "F"} title={ar ? "إعدادات الأجهزة" : "Per device"} desc={ar ? "اختيار الجهاز هنا يبدّل المعاينة أيضاً." : "Choosing a device here also switches the preview."}>
            <div className="flex flex-wrap gap-2" role="tablist">
              {devices.map(({ v, t, I }) => (
                <button key={v} type="button" role="tab" aria-selected={device === v} onClick={() => setDevice(v)} className={`inline-flex items-center gap-2 rounded-pill border px-4 py-2 text-sm font-semibold ${device === v ? "border-primary bg-primary text-on-primary" : "border-line hover:border-primary"}`}>
                  <I className="h-4 w-4" aria-hidden />{t}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Range k="spacing" label={ar ? "المسافة بين الجسيمات (الكثافة)" : "Spacing (density)"} unit="px" value={prof.spacing} onChange={(v) => setDev({ spacing: v })} hint={ar ? "أصغر = جسيمات أكثر" : "Smaller = more particles"} />
              <Range k="max_particles" label={ar ? "الحد الأقصى لعدد الجسيمات" : "Max particles"} value={prof.max_particles} onChange={(v) => setDev({ max_particles: v })} />
              <Range k="size_scale" label={ar ? "مضاعف الحجم" : "Size ×"} value={prof.size_scale} onChange={(v) => setDev({ size_scale: v })} />
              <Range k="speed_scale" label={ar ? "مضاعف السرعة" : "Speed ×"} value={prof.speed_scale} onChange={(v) => setDev({ speed_scale: v })} />
              <Range k="force_scale" label={ar ? "مضاعف قوة التأثير" : "Force ×"} value={prof.force_scale} onChange={(v) => setDev({ force_scale: v })} />
            </div>
          </Card>
        </div>

        {/* -------------------------------------------------------------- live preview */}
        <div className="order-1 xl:order-2">
          <div className="space-y-3 xl:sticky xl:top-20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-bold"><Eye className="h-4 w-4 text-primary" aria-hidden />{ar ? "معاينة مباشرة" : "Live preview"}</h2>
              <div className="flex gap-1 rounded-pill border border-line p-1" role="tablist" aria-label={ar ? "جهاز المعاينة" : "Preview device"}>
                {devices.map(({ v, t, I }) => (
                  <button key={v} type="button" role="tab" aria-selected={device === v} onClick={() => setDevice(v)} className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold ${device === v ? "bg-primary text-on-primary" : "text-muted hover:text-fg"}`} title={t}>
                    <I className="h-3.5 w-3.5" aria-hidden /><span className="hidden sm:inline">{t}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-line bg-subtle p-2 sm:p-3">
              <div className={`mx-auto transition-[max-width] duration-500 ${frame}`}>
                <div key={replay} className="panel-soft relative isolate flex min-h-[420px] cursor-crosshair flex-col items-center justify-center overflow-hidden px-4 py-14 text-center sm:min-h-[480px]" data-hero-host data-preview-host>
                  <HeroParticles settings={s} device={device} preview brandColors={brandColors} />
                  <p className="badge-pill">{ar ? "معاينة" : "Preview"}</p>
                  <h3 className={`mt-6 font-display font-bold leading-[1.15] ${device === "mobile" ? "text-3xl" : "text-4xl sm:text-5xl"}`} data-hero-title>{title}</h3>
                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    <span className="btn btn-primary rounded-pill px-5"><Rocket className="h-4 w-4" aria-hidden />{ar ? "ابدأ مشروعك" : "Start a project"}</span>
                    <span className="btn btn-outline rounded-pill px-5">{ar ? "استعرض أعمالنا" : "Our work"}</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="flex items-center gap-2 text-xs text-muted"><Laptop className="h-3.5 w-3.5" aria-hidden />{ar ? "حرّك الماوس أو المس المعاينة لاختبار الدفع، وانقر لإطلاق موجة." : "Move the mouse or touch the preview to test repulsion; click for a wave."}</p>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------- actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:start-[var(--sb)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-2 px-4 py-3">
          <button type="button" className="btn btn-ghost" onClick={() => { setS(HERO_EFFECT_DEFAULTS); }}><RotateCcw className="h-4 w-4" />{ar ? "إعادة الإعدادات الافتراضية" : "Reset to defaults"}</button>
          <button type="button" className="btn btn-outline" onClick={() => { setReplay((n) => n + 1); document.querySelector("[data-preview-host]")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}><Eye className="h-4 w-4" />{ar ? "معاينة التغييرات" : "Preview changes"}</button>
          <button type="button" className="btn btn-outline" onClick={saveDraft} disabled={!!busy || !dirty} data-loading={busy === "draft"}><Save className="h-4 w-4" />{ar ? "حفظ المسودة" : "Save draft"}</button>
          <button type="button" className="btn btn-primary" onClick={publish} disabled={!!busy || !unpublished} data-loading={busy === "publish"}><Rocket className="h-4 w-4" />{ar ? "نشر التغييرات" : "Publish changes"}</button>
        </div>
      </div>
    </div>
  );
}
