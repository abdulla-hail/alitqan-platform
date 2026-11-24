"use client";
import { Plus, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { deleteFont, registerFont, saveTypography, setFontActive } from "@/features/admin/typography-actions";
import { registerMedia } from "@/features/admin/media-actions";
import { ALLOWED_WEIGHTS, customFontFaces, FONT_CATALOG, googleFontsHref, resolveTypography, type CustomFont, type Typography } from "@/lib/brand/fonts";
import { uploadToMedia } from "./media-upload";
import { Modal, PageTitle, SubmitButton, Switch, useAdmin, useResult } from "./ui";

type FontRow = CustomFont & { id: string; is_active: boolean };

function FontSelect({ label, value, onChange, script, custom }: { label: string; value: string; onChange: (v: string) => void; script: "arabic" | "latin" | "any"; custom: FontRow[] }) {
  const { locale } = useAdmin();
  const list = FONT_CATALOG.filter((f) => script === "any" || f.script === "both" || f.script === script);
  const mine = custom.filter((f) => f.is_active && (script === "any" || f.script === "both" || f.script === script));
  const known = list.some((f) => f.family === value) || mine.some((f) => f.family === value);
  return (
    <label className="field block">
      <span className="label">{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)} style={{ fontFamily: `"${value}", system-ui` }}>
        {!known && <option value={value}>{value}</option>}
        <optgroup label="Google Fonts">
          {list.map((f) => (
            <option key={f.family} value={f.family}>{locale === "ar" ? `${f.label.ar} — ${f.family}` : f.family}</option>
          ))}
        </optgroup>
        {mine.length > 0 && (
          <optgroup label={locale === "ar" ? "خطوط مرفوعة" : "Uploaded fonts"}>
            {mine.map((f) => <option key={f.family} value={f.family}>{f.family}</option>)}
          </optgroup>
        )}
      </select>
    </label>
  );
}

/** Loads the fonts being previewed (Google CSS link + @font-face for uploaded fonts) into the page. */
function usePreviewFonts(families: string[], weights: number[], custom: FontRow[]) {
  const key = families.join("|") + weights.join(",");
  useEffect(() => {
    const href = googleFontsHref(families, weights, custom.map((c) => c.family));
    const link = document.createElement("link");
    if (href) {
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    }
    const style = document.createElement("style");
    style.textContent = customFontFaces(custom, families);
    document.head.appendChild(style);
    return () => { link.remove(); style.remove(); };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function TypographyManager({ fonts, custom }: { fonts: Typography; custom: FontRow[] }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const router = useRouter();
  const init = resolveTypography(fonts);
  const [t, setT] = useState({ ...init, display_ar: fonts.display_ar ?? init.display_ar, display_en: fonts.display_en ?? init.display_en });
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const eff = resolveTypography(t);
  const families = useMemo(() => [...new Set([eff.display_ar, eff.body_ar, eff.display_en, eff.body_en, eff.admin])], [eff.display_ar, eff.body_ar, eff.display_en, eff.body_en, eff.admin]);
  usePreviewFonts(families, eff.weights, custom);
  const set = (patch: Partial<typeof t>) => setT((c) => ({ ...c, ...patch }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = result(await saveTypography(t));
    setBusy(false);
    if (ok) router.refresh();
  }

  const Preview = ({ dir, display, body, lang }: { dir: "rtl" | "ltr"; display: string; body: string; lang: "ar" | "en" }) => (
    <div dir={dir} lang={lang} className="rounded-[var(--radius)] border border-line bg-bg p-6" style={{ fontFamily: `"${body}", system-ui` }}>
      <nav className="mb-5 flex flex-wrap gap-4 border-b border-line pb-3 text-sm font-medium text-muted">
        {(lang === "ar" ? ["الرئيسية", "الخدمات", "أعمالنا", "تواصل"] : ["Home", "Services", "Work", "Contact"]).map((x, i) => (
          <span key={x} className={i === 0 ? "border-b-2 border-primary pb-1 text-primary" : ""}>{x}</span>
        ))}
      </nav>
      <p className="eyebrow">{lang === "ar" ? "استوديو رقمي" : "Digital studio"}</p>
      <h2 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl" style={{ fontFamily: `"${display}", system-ui` }}>
        {lang === "ar" ? "نحوّل أفكارك إلى منتجات رقمية مُتقنة" : "We turn ideas into precisely crafted products"}
      </h2>
      <h3 className="mt-3 text-xl font-semibold" style={{ fontFamily: `"${display}", system-ui` }}>{lang === "ar" ? "عنوان فرعي متوسط" : "A medium sub-heading"}</h3>
      <p className="mt-3 leading-relaxed text-muted">
        {lang === "ar" ? "نص فقرة لمعاينة سهولة القراءة والمسافات بين الأسطر في الخط المختار، مع أرقام 0123456789." : "Paragraph text to preview readability and line spacing in the chosen font, with numbers 0123456789."}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <span className="btn btn-primary btn-sm">{lang === "ar" ? "ابدأ مشروعك" : "Start a project"}</span>
        <span className="btn btn-outline btn-sm">{lang === "ar" ? "استعرض أعمالنا" : "See our work"}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-lg">
        {eff.weights.map((w) => <span key={w} style={{ fontWeight: w }}>{lang === "ar" ? "إتقان" : "Precision"} {w}</span>)}
      </div>
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-6 pb-24">
      <PageTitle title={ar ? "إدارة الخطوط" : "Typography settings"} subtitle={ar ? "اختر خطوط الموقع ولوحة التحكم لكل لغة، مع معاينة مباشرة قبل الحفظ. تُحمّل الأوزان المحددة فقط." : "Choose site and CMS fonts per language with a live preview. Only the selected weights are loaded."} />

      <section className="card space-y-5 p-6" data-anim="up">
        <Switch checked={t.unify} onChange={(v) => set({ unify: v })} label={ar ? "توحيد الخط" : "Use one font everywhere"} description={ar ? "استخدام خط النصوص للعناوين أيضاً في كل لغة" : "Headings use the text font for each language"} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FontSelect label={ar ? "الخط الأساسي / النصوص — العربية" : "Base / text font — Arabic"} value={t.body_ar} onChange={(v) => set({ body_ar: v })} script="arabic" custom={custom} />
          {!t.unify && <FontSelect label={ar ? "خط العناوين — العربية" : "Headings — Arabic"} value={t.display_ar} onChange={(v) => set({ display_ar: v })} script="arabic" custom={custom} />}
          <FontSelect label={ar ? "الخط الأساسي / النصوص — الإنجليزية" : "Base / text font — English"} value={t.body_en} onChange={(v) => set({ body_en: v })} script="latin" custom={custom} />
          {!t.unify && <FontSelect label={ar ? "خط العناوين — الإنجليزية" : "Headings — English"} value={t.display_en} onChange={(v) => set({ display_en: v })} script="latin" custom={custom} />}
          <FontSelect label={ar ? "خط لوحة التحكم" : "CMS (admin) font"} value={t.admin} onChange={(v) => set({ admin: v })} script="any" custom={custom} />
        </div>
        <fieldset>
          <legend className="label">{ar ? "الأوزان المحمّلة" : "Loaded weights"}</legend>
          <div className="flex flex-wrap gap-2">
            {ALLOWED_WEIGHTS.map((w) => {
              const on = t.weights.includes(w);
              return (
                <button key={w} type="button" aria-pressed={on} disabled={w === 400}
                  onClick={() => set({ weights: on ? t.weights.filter((x) => x !== w) : [...t.weights, w].sort((a, b) => a - b) })}
                  className={`chip ${on ? "chip-active" : ""} disabled:opacity-60`} style={{ fontWeight: w }}>{w}</button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted">{ar ? "الوزن 400 مطلوب دائماً. أوزان غير متوفرة في خط ما لا تُطلب (لا أخطاء تحميل)؛ يستخدم المتصفح أقرب وزن." : "400 is always required. Weights a font lacks are skipped (no failed requests); the browser uses the nearest weight."}</p>
        </fieldset>
      </section>

      <section className="space-y-4" data-anim="up">
        <h2 className="text-lg font-bold">{ar ? "معاينة مباشرة" : "Live preview"}</h2>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Preview dir="rtl" lang="ar" display={eff.display_ar} body={eff.body_ar} />
          <Preview dir="ltr" lang="en" display={eff.display_en} body={eff.body_en} />
        </div>
        <div className="rounded-[var(--radius)] border border-dashed border-line p-4 text-sm" style={{ fontFamily: `"${eff.admin}", system-ui` }}>
          <span className="font-semibold">{ar ? "لوحة التحكم:" : "CMS:"}</span> {ar ? "الطلبات · المشاريع · حفظ التغييرات" : "Requests · Projects · Save changes"}
        </div>
      </section>

      <section className="card space-y-4 p-6" data-anim="up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{ar ? "خطوط مخصصة" : "Custom fonts"}</h2>
            <p className="text-sm text-muted">{ar ? "ارفع ملفات WOFF2 أو WOFF لخط تملك رخصة استخدامه على الويب." : "Upload WOFF2/WOFF files of a font licensed for web use."}</p>
          </div>
          <button type="button" className="btn btn-outline" onClick={() => setAdding(true)}><Plus className="h-4 w-4" />{ar ? "إضافة خط" : "Add font"}</button>
        </div>
        {custom.length === 0 ? (
          <p className="text-sm text-muted">{d.no_items}</p>
        ) : (
          <ul className="divide-y divide-line">
            {custom.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-semibold" style={{ fontFamily: `"${f.family}"` }}>{f.family}</span>
                  <span className="text-xs text-muted">{f.script} · {f.files.map((x) => `${x.weight}${x.style === "italic" ? "i" : ""} ${x.format}`).join(" · ")}</span>
                </span>
                <Switch checked={f.is_active} onChange={async (v) => { if (result(await setFontActive(f.id, v))) router.refresh(); }} label={ar ? "مفعّل" : "Active"} />
                <button type="button" className="btn btn-ghost btn-icon text-danger" title={d.delete}
                  onClick={async () => { if (confirm(d.confirm_delete) && result(await deleteFont(f.id), d.delete)) router.refresh(); }}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddFont open={adding} onClose={() => setAdding(false)} onDone={() => { setAdding(false); router.refresh(); }} />

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:start-[var(--sb)]">
        <div className="mx-auto flex max-w-5xl justify-end px-4 py-3"><SubmitButton busy={busy}>{busy ? d.saving : d.save}</SubmitButton></div>
      </div>
    </form>
  );
}

function AddFont({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const [family, setFamily] = useState("");
  const [script, setScript] = useState("both");
  const [files, setFiles] = useState<{ file: File; weight: number; style: "normal" | "italic" }[]>([]);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const valid = /^[A-Za-z0-9 ]{2,60}$/.test(family) && files.length > 0;
  async function submit() {
    setBusy(true);
    try {
      const uploaded = [];
      for (const [i, f] of files.entries()) {
        const up = await uploadToMedia(f.file, "fonts", (p) => setPct((i + p) / files.length));
        const reg = await registerMedia({ ...up, folder: "fonts" });
        if (!reg.ok) throw new Error("register");
        uploaded.push({ url: up.url, weight: f.weight, style: f.style, format: /\.woff2$/i.test(f.file.name) ? "woff2" : "woff" });
      }
      if (result(await registerFont({ family: family.trim(), script, files: uploaded }))) {
        setFamily(""); setFiles([]); onDone();
      }
    } catch {
      result({ ok: false, error: "generic" });
    }
    setBusy(false);
    setPct(0);
  }
  return (
    <Modal open={open} onClose={onClose} title={ar ? "إضافة خط مخصص" : "Add custom font"} dismissable={!busy}
      footer={<><button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>{d.cancel}</button><button type="button" className="btn btn-primary" disabled={!valid || busy} data-loading={busy} onClick={submit}>{d.save}</button></>}>
      <div className="space-y-4">
        <label className="field block"><span className="label">{ar ? "اسم الخط (حروف إنجليزية)" : "Family name (Latin letters)"}</span>
          <input className="input" dir="ltr" value={family} onChange={(e) => setFamily(e.target.value.replace(/[^A-Za-z0-9 ]/g, ""))} placeholder="Brand Sans" required /></label>
        <label className="field block"><span className="label">{ar ? "يدعم" : "Supports"}</span>
          <select className="input" value={script} onChange={(e) => setScript(e.target.value)}>
            <option value="both">{ar ? "العربية والإنجليزية" : "Arabic & Latin"}</option>
            <option value="arabic">{ar ? "العربية" : "Arabic"}</option>
            <option value="latin">{ar ? "الإنجليزية" : "Latin"}</option>
          </select></label>
        <div>
          <span className="label">{ar ? "ملفات الخط (WOFF2 / WOFF)" : "Font files (WOFF2 / WOFF)"}</span>
          <button type="button" onClick={() => input.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line p-5 text-muted hover:border-primary hover:text-primary"><Upload className="h-5 w-5" />{d.upload}</button>
          <input ref={input} type="file" accept=".woff2,.woff" multiple className="sr-only" onChange={(e) => {
            const list = Array.from(e.target.files ?? []).filter((f) => /\.(woff2?)$/i.test(f.name) && f.size <= 10 * 1024 * 1024);
            setFiles((cur) => [...cur, ...list.map((file) => ({ file, weight: /bold/i.test(file.name) ? 700 : /medium/i.test(file.name) ? 500 : /light/i.test(file.name) ? 300 : 400, style: /italic/i.test(file.name) ? ("italic" as const) : ("normal" as const) }))]);
            e.target.value = "";
          }} />
          <ul className="mt-3 space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg bg-subtle p-2 text-sm">
                <span className="min-w-0 flex-1 truncate" dir="ltr">{f.file.name}</span>
                <select className="input min-h-0 w-auto py-1 text-xs" value={f.weight} onChange={(e) => setFiles(files.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)))} aria-label="weight">
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
                <select className="input min-h-0 w-auto py-1 text-xs" value={f.style} onChange={(e) => setFiles(files.map((x, j) => (j === i ? { ...x, style: e.target.value as "normal" | "italic" } : x)))} aria-label="style">
                  <option value="normal">normal</option><option value="italic">italic</option>
                </select>
                <button type="button" className="text-danger" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={d.remove}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </div>
        {busy && <div className="h-1.5 overflow-hidden rounded-full bg-subtle" role="progressbar" aria-valuenow={Math.round(pct * 100)}><div className="h-full bg-primary transition-[width]" style={{ width: `${Math.max(5, pct * 100)}%` }} /></div>}
      </div>
    </Modal>
  );
}
