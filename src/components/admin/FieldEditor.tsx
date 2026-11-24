"use client";
import { ArrowDown, ArrowUp, Eye, ImageIcon, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ICONS } from "@/components/ui/Icon";
import { ICON_CHOICES, type FieldDef } from "@/features/sections/registry";
import type { AdminField } from "@/features/admin/resources";
import { MediaPicker } from "./MediaPicker";
import { L, Switch, useAdmin } from "./ui";

type AnyField = (FieldDef | AdminField) & { kind: string };
export type RelationOptions = Record<string, { value: string; label: string }[]>;

const SOCIAL = ["linkedin", "x", "instagram", "behance", "dribbble", "github", "youtube", "tiktok", "website", "email"];

function Label({ f, htmlFor }: { f: AnyField; htmlFor?: string }) {
  const { locale } = useAdmin();
  return (
    <label htmlFor={htmlFor} className="label">
      {f.label[locale]} {"required" in f && f.required && <span className="text-danger">*</span>}
    </label>
  );
}

/** Text inputs with one tab per content language (RTL/LTR aware). */
function LocalizedText({ f, value, onChange, multiline, markdown }: { f: AnyField; value: Record<string, string> | undefined; onChange: (v: Record<string, string>) => void; multiline?: boolean; markdown?: boolean }) {
  const { languages } = useAdmin();
  const [lang, setLang] = useState(languages.find((l) => l.is_default)?.code ?? languages[0]?.code ?? "ar");
  const [preview, setPreview] = useState(false);
  const v = value ?? {};
  const meta = languages.find((l) => l.code === lang);
  const id = `${f.name}-${lang}`;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label f={f} htmlFor={id} />
        <div className="flex items-center gap-1">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ${lang === l.code ? "bg-primary text-on-primary" : "bg-subtle text-muted"} ${!v[l.code] ? "opacity-70" : ""}`}
              title={v[l.code] ? "" : "—"}
            >
              {l.code.toUpperCase()}{!v[l.code] && <span className="ms-0.5 text-danger">•</span>}
            </button>
          ))}
          {markdown && (
            <button type="button" onClick={() => setPreview((p) => !p)} className={`ms-1 rounded-md p-1 ${preview ? "bg-primary text-on-primary" : "bg-subtle text-muted"}`} aria-label="Preview">
              <Eye className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      {preview && markdown ? (
        <div dir={meta?.dir} className="prose-brand min-h-32 rounded-[var(--radius-brand-sm)] border border-line bg-subtle p-4 text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{v[lang] ?? ""}</ReactMarkdown>
        </div>
      ) : multiline ? (
        <textarea id={id} dir={meta?.dir} value={v[lang] ?? ""} onChange={(e) => onChange({ ...v, [lang]: e.target.value })} rows={markdown ? 12 : 3} className={`input ${markdown ? "font-mono text-sm" : ""}`} />
      ) : (
        <input id={id} dir={meta?.dir} value={v[lang] ?? ""} onChange={(e) => onChange({ ...v, [lang]: e.target.value })} className="input" />
      )}
      {markdown && <p className="mt-1 text-xs text-muted">Markdown: ## عنوان · **غامق** · - قائمة · [رابط](https://…)</p>}
    </div>
  );
}

function ImageField({ f, value, onChange }: { f: AnyField; value: string | null; onChange: (v: string | null) => void }) {
  const { d } = useAdmin();
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Label f={f} />
      <div className="flex items-center gap-3">
        <div className="grid h-20 w-28 flex-none place-items-center overflow-hidden rounded-lg border border-line bg-subtle">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setOpen(true)}>{d.choose_image}</button>
            {value && <button type="button" className="btn btn-ghost btn-sm text-danger" onClick={() => onChange(null)}>{d.remove}</button>}
          </div>
          <input value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} placeholder="https://… / /path.svg" dir="ltr" className="input min-h-0 py-1.5 text-xs" />
        </div>
      </div>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(m) => onChange(m.url)} />
    </div>
  );
}

function GalleryField({ f, value, onChange }: { f: AnyField; value: { url: string; alt?: Record<string, string> }[]; onChange: (v: { url: string; alt?: Record<string, string> }[]) => void }) {
  const { d } = useAdmin();
  const [open, setOpen] = useState(false);
  const list = value ?? [];
  const move = (i: number, dir: -1 | 1) => {
    const n = [...list];
    const j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <div>
      <Label f={f} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {list.map((g, i) => (
          <li key={g.url + i} className="group relative overflow-hidden rounded-lg border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={g.url} alt="" className="aspect-[4/3] w-full object-cover" />
            <div className="absolute inset-x-1 top-1 flex justify-between opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <span className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} className="rounded bg-black/60 p-1 text-white" aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => move(i, 1)} className="rounded bg-black/60 p-1 text-white" aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></button>
              </span>
              <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))} className="rounded bg-danger p-1 text-white" aria-label={d.remove}><X className="h-3.5 w-3.5" /></button>
            </div>
          </li>
        ))}
        <li>
          <button type="button" onClick={() => setOpen(true)} className="grid aspect-[4/3] w-full place-items-center rounded-lg border-2 border-dashed border-line text-muted hover:border-primary hover:text-primary">
            <Plus className="h-6 w-6" />
          </button>
        </li>
      </ul>
      <MediaPicker open={open} onClose={() => setOpen(false)} onPick={(m) => onChange([...list, { url: m.url, alt: m.alt }])} folder="projects" />
    </div>
  );
}

function TagsField({ f, value, onChange }: { f: AnyField; value: string[]; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const list = value ?? [];
  const add = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...new Set([...list, ...parts])]);
    setDraft("");
  };
  return (
    <div>
      <Label f={f} />
      <div className="input flex min-h-11 flex-wrap items-center gap-1.5 py-1.5">
        {list.map((t) => (
          <span key={t} className="chip gap-1 py-0.5" dir="auto">
            {t}
            <button type="button" onClick={() => onChange(list.filter((x) => x !== t))} aria-label="Remove"><X className="h-3 w-3" /></button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !draft && list.length) onChange(list.slice(0, -1));
          }}
          onBlur={add}
          className="min-w-24 flex-1 bg-transparent py-1 outline-none"
          placeholder="+"
        />
      </div>
    </div>
  );
}

function ListField({ f, value, onChange, relations }: { f: AnyField; value: Record<string, unknown>[]; onChange: (v: Record<string, unknown>[]) => void; relations?: RelationOptions }) {
  const { d, locale } = useAdmin();
  const list = Array.isArray(value) ? value : [];
  const update = (i: number, item: Record<string, unknown>) => onChange(list.map((x, j) => (j === i ? item : x)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const n = [...list];
    [n[i], n[j]] = [n[j], n[i]];
    onChange(n);
  };
  return (
    <fieldset className="rounded-[var(--radius-brand-sm)] border border-line p-4">
      <legend className="px-1 text-sm font-semibold">{f.label[locale]}</legend>
      <ol className="space-y-3">
        {list.map((item, i) => (
          <li key={i} className="rounded-lg bg-subtle p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-muted">#{i + 1}</span>
              <span className="flex gap-1">
                <button type="button" className="btn btn-ghost btn-sm px-2" onClick={() => move(i, -1)} aria-label="Up"><ArrowUp className="h-3.5 w-3.5" /></button>
                <button type="button" className="btn btn-ghost btn-sm px-2" onClick={() => move(i, 1)} aria-label="Down"><ArrowDown className="h-3.5 w-3.5" /></button>
                <button type="button" className="btn btn-ghost btn-sm px-2 text-danger" onClick={() => onChange(list.filter((_, j) => j !== i))} aria-label={d.delete}><Trash2 className="h-3.5 w-3.5" /></button>
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {(f.fields ?? []).map((sub) => (
                <FieldEditor key={sub.name} field={sub} value={item[sub.name]} onChange={(v) => update(i, { ...item, [sub.name]: v })} relations={relations} />
              ))}
            </div>
          </li>
        ))}
      </ol>
      <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => onChange([...list, {}])}><Plus className="h-4 w-4" />{d.add_item}</button>
    </fieldset>
  );
}

function SeoField({ f, value, onChange }: { f: AnyField; value: Record<string, { title?: string; description?: string; image?: string }>; onChange: (v: Record<string, { title?: string; description?: string; image?: string }>) => void }) {
  const { languages, d, locale } = useAdmin();
  const v = value ?? {};
  return (
    <div className="space-y-4">
      {languages.map((l) => {
        const e = v[l.code] ?? {};
        const set = (k: string, val: string) => onChange({ ...v, [l.code]: { ...e, [k]: val } });
        return (
          <fieldset key={l.code} className="rounded-[var(--radius-brand-sm)] border border-line p-4" dir={l.dir}>
            <legend className="px-1 text-sm font-semibold">{f.label[locale]} — {l.native_name}</legend>
            <div className="space-y-3">
              <div>
                <label className="label">{d.seo_title} <span className="text-xs font-normal text-muted">({(e.title ?? "").length}/60)</span></label>
                <input value={e.title ?? ""} onChange={(x) => set("title", x.target.value)} maxLength={120} className="input" />
              </div>
              <div>
                <label className="label">{d.seo_description} <span className="text-xs font-normal text-muted">({(e.description ?? "").length}/160)</span></label>
                <textarea value={e.description ?? ""} onChange={(x) => set("description", x.target.value)} maxLength={320} rows={2} className="input" />
              </div>
              <ImageField f={{ name: "image", kind: "image", label: { ar: d.seo_image, en: d.seo_image } }} value={e.image ?? null} onChange={(u) => set("image", u ?? "")} />
              <div className="rounded-lg bg-subtle p-3 text-sm" dir={l.dir}>
                <p className="truncate font-semibold text-[#1a0dab] dark:text-[#8ab4f8]">{e.title || "—"}</p>
                <p className="line-clamp-2 text-muted">{e.description || "—"}</p>
              </div>
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}

/** Renders the right input for any CMS field definition. */
export function FieldEditor({ field, value, onChange, relations }: { field: AnyField; value: unknown; onChange: (v: unknown) => void; relations?: RelationOptions }) {
  const f = field;
  const { locale, d } = useAdmin();
  const id = `f-${f.name}`;
  const help = "help" in f && f.help ? <p className="mt-1 text-xs text-muted">{f.help[locale]}</p> : null;
  switch (f.kind) {
    case "text":
    case "textarea":
    case "markdown":
      if (f.localized) return <div><LocalizedText f={f} value={value as Record<string, string>} onChange={onChange} multiline={f.kind !== "text"} markdown={f.kind === "markdown"} />{help}</div>;
      return (
        <div>
          <Label f={f} htmlFor={id} />
          {f.kind === "text" ? <input id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className="input" dir="auto" /> : <textarea id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} rows={f.kind === "markdown" ? 10 : 3} className="input" dir="auto" />}
          {help}
        </div>
      );
    case "slug":
      return (
        <div>
          <Label f={f} htmlFor={id} />
          <input id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-"))} dir="ltr" className="input font-mono text-sm" />
          {help}
        </div>
      );
    case "url":
      return (
        <div>
          <Label f={f} htmlFor={id} />
          <input id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} dir="ltr" placeholder="https://… or /services" className="input" />
          {help}
        </div>
      );
    case "number":
      return (
        <div>
          <Label f={f} htmlFor={id} />
          <input id={id} type="number" value={value == null ? "" : String(value)} onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))} className="input" dir="ltr" />
          {help}
        </div>
      );
    case "date":
      return (<div><Label f={f} htmlFor={id} /><input id={id} type="date" value={String(value ?? "").slice(0, 10)} onChange={(e) => onChange(e.target.value || null)} className="input" dir="ltr" />{help}</div>);
    case "datetime": {
      const local = value ? new Date(String(value)) : null;
      const str = local ? new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
      return (<div><Label f={f} htmlFor={id} /><input id={id} type="datetime-local" value={str} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)} className="input" dir="ltr" />{help}</div>);
    }
    case "boolean":
      return <div className="py-1"><Switch checked={Boolean(value)} onChange={onChange} label={f.label[locale]} />{help}</div>;
    case "status":
      return (
        <div>
          <Label f={f} htmlFor={id} />
          <select id={id} value={String(value ?? "draft")} onChange={(e) => onChange(e.target.value)} className="input">
            <option value="draft">{d.draft}</option>
            <option value="published">{d.published}</option>
            <option value="archived">{d.archived}</option>
          </select>
        </div>
      );
    case "select":
      return (
        <div>
          <Label f={f} htmlFor={id} />
          <select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value || null)} className="input">
            <option value="">—</option>
            {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label[locale]}</option>)}
          </select>
        </div>
      );
    case "icon":
      return (
        <div>
          <Label f={f} />
          <div className="grid max-h-44 grid-cols-8 gap-1.5 overflow-y-auto rounded-lg border border-line p-2 sm:grid-cols-10">
            {ICON_CHOICES.map((name) => {
              const I = ICONS[name];
              return (
                <button key={name} type="button" title={name} onClick={() => onChange(value === name ? null : name)} className={`grid aspect-square place-items-center rounded-md ${value === name ? "bg-primary text-on-primary" : "hover:bg-subtle"}`}>
                  {I ? <I className="h-4 w-4" /> : name.slice(0, 2)}
                </button>
              );
            })}
          </div>
        </div>
      );
    case "image":
      return <ImageField f={f} value={(value as string) ?? null} onChange={onChange} />;
    case "gallery":
      return <GalleryField f={f} value={value as { url: string }[]} onChange={onChange} />;
    case "tags":
      return <TagsField f={f} value={value as string[]} onChange={onChange} />;
    case "list":
      return <ListField f={f} value={value as Record<string, unknown>[]} onChange={onChange} relations={relations} />;
    case "seo":
      return <SeoField f={f} value={value as Record<string, { title?: string }>} onChange={onChange} />;
    case "relation": {
      const opts = relations?.[f.name] ?? [];
      return (
        <div>
          <Label f={f} htmlFor={id} />
          <select id={id} value={String(value ?? "")} onChange={(e) => onChange(e.target.value || null)} className="input">
            <option value="">—</option>
            {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      );
    }
    case "relation_multi": {
      const opts = relations?.[f.name] ?? [];
      const sel = new Set((value as string[]) ?? []);
      return (
        <div>
          <Label f={f} />
          <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-line p-2">
            {opts.length === 0 && <span className="text-sm text-muted">—</span>}
            {opts.map((o) => (
              <button key={o.value} type="button" onClick={() => { const n = new Set(sel); if (n.has(o.value)) n.delete(o.value); else n.add(o.value); onChange([...n]); }} className={`chip ${sel.has(o.value) ? "chip-active" : ""}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      );
    }
    case "social": {
      const v = (value as Record<string, string>) ?? {};
      return (
        <fieldset className="rounded-[var(--radius-brand-sm)] border border-line p-4">
          <legend className="px-1 text-sm font-semibold">{f.label[locale]}</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {SOCIAL.map((k) => (
              <label key={k} className="block">
                <span className="mb-1 block text-xs font-semibold capitalize text-muted">{k}</span>
                <input value={v[k] ?? ""} onChange={(e) => onChange({ ...v, [k]: e.target.value })} dir="ltr" className="input" placeholder={k === "email" ? "name@company.com" : "https://"} />
              </label>
            ))}
          </div>
        </fieldset>
      );
    }
    default:
      return <p className="text-sm text-danger">Unknown field: {String((field as { kind: string }).kind)}</p>;
  }
}

export { L };
