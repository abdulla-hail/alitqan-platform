"use client";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SocialIcon } from "@/components/site/SocialIcon";
import { normalizeSocial, SOCIAL_LIBRARY, SOCIAL_MAX, socialName, type SocialItem } from "@/lib/social";
import { FieldEditor } from "./FieldEditor";
import { Switch } from "./ui";

const PLACES = [
  ["header", "الهيدر", "Header"],
  ["footer", "الفوتر", "Footer"],
  ["contact", "صفحة التواصل", "Contact page"],
] as const;

const newId = () => `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function Row({ item, ar, onChange, onRemove }: { item: SocialItem; ar: boolean; onChange: (p: Partial<SocialItem>) => void; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [open, setOpen] = useState(!item.url);
  const urlOk = !item.url || /^(https?:\/\/|mailto:|tel:)/i.test(item.url);
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border bg-surface ${isDragging ? "z-10 border-primary shadow-lg" : "border-line"} ${item.enabled ? "" : "opacity-60"}`}
      data-social-row={item.platform}
    >
      <div className="flex items-center gap-2 p-2.5">
        <button type="button" className="grid h-9 w-7 flex-none cursor-grab place-items-center text-muted active:cursor-grabbing" aria-label={ar ? "اسحب لإعادة الترتيب" : "Drag to reorder"} {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="grid h-9 w-9 flex-none place-items-center rounded-full border border-line text-fg"><SocialIcon item={item} className="h-4 w-4" /></span>
        <button type="button" className="min-w-0 flex-1 text-start" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <span className="block truncate text-sm font-semibold">{socialName(item)}</span>
          <span className={`block truncate text-xs ${urlOk ? "text-muted" : "text-danger"}`} dir="ltr">{item.url || (ar ? "بدون رابط" : "No link yet")}</span>
        </button>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => onChange({ enabled: !item.enabled })} title={item.enabled ? (ar ? "إخفاء (تُحفظ البيانات)" : "Hide (data kept)") : ar ? "إظهار" : "Show"} aria-pressed={item.enabled}>
          {item.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </button>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setOpen((o) => !o)} aria-label={ar ? "تعديل" : "Edit"}>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="space-y-4 border-t border-line p-3 sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="label">{ar ? "المنصة / الأيقونة" : "Platform / icon"}</span>
              <select className="input" value={SOCIAL_LIBRARY[item.platform] ? item.platform : "link"} onChange={(e) => onChange({ platform: e.target.value })}>
                {Object.entries(SOCIAL_LIBRARY).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">{ar ? "الاسم الظاهر (اختياري)" : "Display name (optional)"}</span>
              <input className="input" maxLength={40} value={item.label} placeholder={SOCIAL_LIBRARY[item.platform]?.label ?? ""} onChange={(e) => onChange({ label: e.target.value })} />
            </label>
          </div>
          <label className="block">
            <span className="label">{ar ? "الرابط" : "Link"}</span>
            <input className="input" dir="ltr" value={item.url} placeholder="https://… / mailto:… / tel:…" onChange={(e) => onChange({ url: e.target.value.trim() })} aria-invalid={!urlOk} />
            {!urlOk && <span className="mt-1 block text-xs text-danger">{ar ? "يجب أن يبدأ بـ https:// أو mailto: أو tel:" : "Must start with https://, mailto: or tel:"}</span>}
          </label>
          <div>
            <span className="label">{ar ? "مكان الظهور" : "Show in"}</span>
            <div className="flex flex-wrap gap-4">
              {PLACES.map(([k, a, e]) => <Switch key={k} checked={item[k]} onChange={(v) => onChange({ [k]: v })} label={ar ? a : e} />)}
            </div>
          </div>
          <FieldEditor
            field={{ name: "icon_url", kind: "image", label: { ar: "أيقونة مخصصة (اختياري — SVG أو PNG، تُفحص ملفات SVG قبل القبول)", en: "Custom icon (optional — SVG or PNG; SVG files are checked)" } }}
            value={item.icon_url || null}
            onChange={(v) => onChange({ icon_url: (v as string | null) ?? "" })}
          />
          <div className="flex justify-end">
            <button type="button" className="btn btn-ghost text-danger" onClick={onRemove}><Trash2 className="h-4 w-4" />{ar ? "حذف المنصة" : "Delete platform"}</button>
          </div>
        </div>
      )}
    </li>
  );
}

/**
 * CMS → Settings → Social: fully dynamic list of platforms (add / edit / hide / delete / reorder),
 * library icons or a custom icon, and per-place visibility (header, footer, contact page).
 */
export function SocialManager({ value, onChange, ar }: { value: unknown; onChange: (v: { items: SocialItem[] }) => void; ar: boolean }) {
  const items = useMemo(() => normalizeSocial(value), [value]);
  const [add, setAdd] = useState("instagram");
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const commit = (next: SocialItem[]) => onChange({ items: next });
  const patch = (id: string, p: Partial<SocialItem>) => commit(items.map((it) => (it.id === id ? { ...it, ...p } : it)));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = items.findIndex((x) => x.id === e.active.id), to = items.findIndex((x) => x.id === e.over!.id);
    commit(arrayMove(items, from, to));
  };
  const remove = (it: SocialItem) => {
    if (window.confirm(ar ? `حذف «${socialName(it)}» نهائياً؟ (لإخفائها مؤقتاً استخدم زر الإخفاء)` : `Delete “${socialName(it)}”? (To hide it temporarily use the hide button)`)) commit(items.filter((x) => x.id !== it.id));
  };

  return (
    <div className="space-y-5" data-social-manager>
      <p className="text-sm text-muted">
        {ar
          ? "رتّب المنصات بالسحب، وأخفِ أي منصة دون حذف بياناتها، واختر أين تظهر. الأيقونات بلون واحد تتبع الوضع النهاري والليلي تلقائياً."
          : "Drag to reorder, hide a platform without losing its data, and choose where it appears. Icons are single-colour and follow light/dark mode."}
      </p>

      {items.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">{ar ? "لا توجد منصات بعد." : "No platforms yet."}</p>}
      <DndContext id="social-platforms" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map((it) => <Row key={it.id} item={it} ar={ar} onChange={(p) => patch(it.id, p)} onRemove={() => remove(it)} />)}
          </ul>
        </SortableContext>
      </DndContext>

      <div className="flex flex-wrap items-end gap-2 rounded-xl bg-subtle p-3">
        <label className="block min-w-48 flex-1">
          <span className="label">{ar ? "إضافة منصة" : "Add a platform"}</span>
          <select className="input" value={add} onChange={(e) => setAdd(e.target.value)} data-social-add>
            {Object.entries(SOCIAL_LIBRARY).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={items.length >= SOCIAL_MAX}
          onClick={() => commit([...items, { id: newId(), platform: add, label: "", url: "", icon_url: "", enabled: true, header: true, footer: true, contact: true }])}
        >
          <Plus className="h-4 w-4" />{ar ? "إضافة" : "Add"}
        </button>
      </div>

      {/* live preview in both modes */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label={ar ? "معاينة" : "Preview"}>
        {([false, true] as const).map((dark) => (
          <div key={String(dark)} className={`rounded-xl p-4 ${dark ? "bg-[#070B1A] text-white" : "border border-line bg-white text-[#0A1433]"}`}>
            <p className={`mb-3 text-xs ${dark ? "text-white/60" : "text-slate-500"}`}>{dark ? (ar ? "الوضع الليلي" : "Dark mode") : ar ? "الوضع النهاري" : "Light mode"}</p>
            <ul className="flex flex-wrap gap-2">
              {items.filter((i) => i.enabled).map((i) => (
                <li key={i.id} className={`grid h-9 w-9 place-items-center rounded-full border ${dark ? "border-white/15" : "border-slate-200"}`} title={socialName(i)}>
                  <SocialIcon item={i} className="h-4 w-4" />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
