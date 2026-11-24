"use client";
import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSetting } from "@/features/admin/system-actions";
import { MOTION_DEFAULTS, sanitizeMotion, type MotionSettings } from "@/lib/motion";
import { PageTitle, SubmitButton, Switch, useAdmin, useResult } from "./ui";

function Range({ label, value, min, max, step, unit, onChange, hint }: { label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void; hint?: string }) {
  return (
    <label className="field block">
      <span className="label flex items-center justify-between"><span>{label}</span><span className="font-mono text-xs text-muted" dir="ltr">{value}{unit}</span></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--color-primary)]" />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function MotionManager({ initial }: { initial: MotionSettings }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const router = useRouter();
  const [m, setM] = useState<MotionSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(0);
  const set = (patch: Partial<MotionSettings>) => setM((c) => sanitizeMotion({ ...c, ...patch }));
  const levels: { v: MotionSettings["level"]; t: string; s: string }[] = [
    { v: "calm", t: ar ? "هادئ" : "Calm", s: ar ? "ظهور ناعم بلا Parallax أو عناصر طافية" : "Soft fades, no parallax or floating shapes" },
    { v: "balanced", t: ar ? "متوسط" : "Balanced", s: ar ? "الموصى به: حركة واضحة وخفيفة" : "Recommended: clear, light motion" },
    { v: "rich", t: ar ? "غني" : "Rich", s: ar ? "حركة أوسع ومسافات أكبر" : "Bolder distances and timing" },
  ];
  const distance = m.level === "calm" ? 8 : m.level === "rich" ? 28 : 18;
  const dur = Math.round(m.duration_ms * (m.level === "calm" ? 0.7 : m.level === "rich" ? 1.15 : 1));

  return (
    <form className="space-y-6 pb-24" onSubmit={async (e) => {
      e.preventDefault();
      setBusy(true);
      const ok = result(await saveSetting("motion", m as unknown as Record<string, unknown>));
      setBusy(false);
      if (ok) router.refresh();
    }}>
      <PageTitle
        title={ar ? "الحركة والتفاعل" : "Motion & interaction"}
        subtitle={ar ? "إعدادات مركزية للحركة في الموقع. القيم محصورة في نطاقات آمنة، والمحتوى يبقى ظاهراً دائماً، ويُحترم إعداد «تقليل الحركة» في أجهزة الزوار." : "Central motion settings. Values are clamped to safe ranges, content always stays visible, and visitors' reduce-motion setting is always respected."}
        actions={<button type="button" className="btn btn-ghost" onClick={() => setM(MOTION_DEFAULTS)}><RotateCcw className="h-4 w-4" />{ar ? "القيم الافتراضية" : "Defaults"}</button>}
      />
      <section className="card space-y-5 p-6" data-anim="up">
        <Switch checked={m.enabled} onChange={(v) => set({ enabled: v })} label={ar ? "تشغيل الحركات العامة" : "Enable motion"} description={ar ? "عند الإيقاف يظهر كل شيء فوراً دون أي حركة" : "When off, everything appears instantly with no motion"} />
        <fieldset disabled={!m.enabled} className="space-y-5 disabled:opacity-50">
          <div>
            <legend className="label">{ar ? "مستوى الحركة" : "Motion level"}</legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {levels.map((l) => (
                <label key={l.v} className="cursor-pointer rounded-[var(--radius-brand-sm)] border border-line p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-soft">
                  <input type="radio" name="level" className="sr-only" checked={m.level === l.v} onChange={() => set({ level: l.v })} />
                  <span className="block font-semibold">{l.t}</span>
                  <span className="text-xs text-muted">{l.s}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Range label={ar ? "مدة الانتقالات" : "Transition duration"} value={m.duration_ms} min={200} max={1200} step={50} unit="ms" onChange={(v) => set({ duration_ms: v })} />
            <Range label={ar ? "سرعة ظهور العناصر المتتابعة" : "Stagger between elements"} value={m.stagger_ms} min={0} max={250} step={10} unit="ms" onChange={(v) => set({ stagger_ms: v })} hint={ar ? "0 = تظهر العناصر معاً" : "0 = elements appear together"} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Switch checked={m.reveal} onChange={(v) => set({ reveal: v })} label={ar ? "ظهور العناصر عند التمرير" : "Scroll reveal"} />
            <Switch checked={m.hover} onChange={(v) => set({ hover: v })} label={ar ? "تأثيرات المرور (Hover)" : "Hover effects"} />
            <Switch checked={m.parallax} onChange={(v) => set({ parallax: v })} label="Parallax" description={ar ? "خفيف، بواسطة CSS فقط، ومعطل في مستوى «هادئ»" : "Light, CSS-only, off in Calm level"} />
            <Switch checked={m.page_transitions} onChange={(v) => set({ page_transitions: v })} label={ar ? "انتقالات الصفحات" : "Page transitions"} />
          </div>
          <div className="grid grid-cols-1 gap-5 border-t border-line pt-5 md:grid-cols-2">
            <div className="space-y-4">
              <Switch checked={m.slider_autoplay} onChange={(v) => set({ slider_autoplay: v })} label={ar ? "تشغيل تلقائي لسلايدر المشاريع" : "Projects slider autoplay"} description={ar ? "يتوقف عند المرور أو اللمس أو التركيز، ويوجد زر إيقاف دائماً" : "Pauses on hover, touch or focus; a pause button is always shown"} />
              <Range label={ar ? "مدة عرض الشريحة" : "Time per slide"} value={m.slider_interval_ms} min={3000} max={15000} step={500} unit="ms" onChange={(v) => set({ slider_interval_ms: v })} />
            </div>
            <label className="field block">
              <span className="label">{ar ? "الحركة على الهاتف" : "Motion on phones"}</span>
              <select className="input" value={m.mobile} onChange={(e) => set({ mobile: e.target.value as MotionSettings["mobile"] })}>
                <option value="reduced">{ar ? "مخففة (موصى به): مسافات أقصر وبلا Parallax" : "Reduced (recommended): shorter moves, no parallax"}</option>
                <option value="full">{ar ? "كاملة كالحاسوب" : "Full, like desktop"}</option>
              </select>
            </label>
          </div>
        </fieldset>
      </section>
      <section className="card p-6" data-anim="up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">{d.preview}</h2>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDemo((x) => x + 1)}>{ar ? "إعادة التشغيل" : "Replay"}</button>
        </div>
        <div key={demo} className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card grid h-24 place-items-center text-sm text-muted"
              style={m.enabled && m.reveal ? { animation: `rise-in ${dur}ms var(--ease-out) both`, animationDelay: `${i * m.stagger_ms}ms`, ["--motion-distance" as string]: `${distance}px` } : undefined}>
              {i + 1}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">{ar ? "المعاينة تقريبية؛ زوار الموقع الذين فعّلوا «تقليل الحركة» يرون المحتوى بلا حركة دائماً." : "Approximate preview; visitors with reduce-motion enabled always see content without motion."}</p>
      </section>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:start-[var(--sb)]">
        <div className="mx-auto flex max-w-5xl justify-end px-4 py-3"><SubmitButton busy={busy}>{busy ? d.saving : d.save}</SubmitButton></div>
      </div>
    </form>
  );
}
