"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Copy, ExternalLink, Eye, EyeOff, GripVertical, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ICONS } from "@/components/ui/Icon";
import { SECTION_MAP, SECTION_TYPES } from "@/features/sections/registry";
import { addSection, deleteSection, duplicateSection, reorderSections, saveSection, setSectionVisible } from "@/features/admin/page-builder-actions";
import { FieldEditor } from "./FieldEditor";
import { L, Modal, StatusBadge, SubmitButton, useAdmin, useResult } from "./ui";

interface Section { id: string; type: string; label: string | null; position: number; is_visible: boolean; content: Record<string, unknown>; settings: Record<string, unknown> }
interface PageRow { id: string; slug: string; title: Record<string, string>; status: string; kind: string }

function Row({ s, onEdit, onToggle, onDelete, onDuplicate }: { s: Section; onEdit: () => void; onToggle: () => void; onDelete: () => void; onDuplicate: () => void }) {
  const { locale, d } = useAdmin();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const def = SECTION_MAP[s.type];
  const I = def ? ICONS[def.icon] : null;
  const preview = L(s.content?.title, locale) || L(s.content?.eyebrow, locale) || s.label || "";
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, position: "relative", zIndex: isDragging ? 10 : undefined }} className={`card flex items-center gap-3 p-3 ${isDragging ? "shadow-xl ring-2 ring-primary" : ""} ${s.is_visible ? "" : "opacity-60"}`}>
      <button type="button" className="cursor-grab touch-none rounded p-1 text-muted hover:bg-subtle" {...attributes} {...listeners} aria-label={d.drag_to_reorder}><GripVertical className="h-4 w-4" /></button>
      <span className="icon-tile h-10 w-10">{I ? <I className="h-4 w-4" /> : null}</span>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-start">
        <p className="text-xs font-semibold text-primary">{def?.label[locale] ?? s.type}</p>
        <p className="truncate font-medium">{preview || "—"}</p>
      </button>
      <button type="button" onClick={onToggle} className="btn btn-ghost btn-icon btn-sm" title={s.is_visible ? d.hide : d.show}>{s.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
      <button type="button" onClick={onEdit} className="btn btn-ghost btn-icon btn-sm" title={d.edit}><Pencil className="h-4 w-4" /></button>
      <button type="button" onClick={onDuplicate} className="btn btn-ghost btn-icon btn-sm hidden sm:inline-flex" title={d.duplicate}><Copy className="h-4 w-4" /></button>
      <button type="button" onClick={onDelete} className="btn btn-ghost btn-icon btn-sm text-danger" title={d.delete}><Trash2 className="h-4 w-4" /></button>
    </li>
  );
}

function SectionEditor({ section, onClose, onSaved }: { section: Section; onClose: () => void; onSaved: (s: Section) => void }) {
  const { d, locale } = useAdmin();
  const result = useResult();
  const def = SECTION_MAP[section.type];
  const [content, setContent] = useState<Record<string, unknown>>(section.content ?? {});
  const [settings, setSettings] = useState<Record<string, unknown>>(section.settings ?? {});
  const [label, setLabel] = useState(section.label ?? "");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    const res = await saveSection(section.id, { content, settings, label });
    setBusy(false);
    if (result(res) && res.ok && res.data) {
      onSaved({ ...section, content: res.data.content, settings: res.data.settings, label: label || null });
      onClose();
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={`${d.edit_section}: ${def?.label[locale] ?? section.type}`}
      wide
      footer={<><button type="button" className="btn btn-ghost" onClick={onClose}>{d.cancel}</button><form onSubmit={(e) => { e.preventDefault(); save(); }}><SubmitButton busy={busy}>{busy ? d.saving : d.save}</SubmitButton></form></>}
    >
      <div className="space-y-5">
        <p className="text-sm text-muted">{def?.description[locale]}</p>
        {(def?.fields ?? []).map((f) => (
          <FieldEditor key={f.name} field={f} value={content[f.name]} onChange={(v) => setContent((c) => ({ ...c, [f.name]: v }))} />
        ))}
        {!!def?.settings?.length && (
          <fieldset className="rounded-[var(--radius-brand-sm)] border border-dashed border-line p-4">
            <legend className="flex items-center gap-1.5 px-1 text-sm font-semibold"><Settings2 className="h-4 w-4" />{d.settings_tab}</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {def.settings.map((f) => (
                <FieldEditor key={f.name} field={f} value={settings[f.name]} onChange={(v) => setSettings((c) => ({ ...c, [f.name]: v }))} />
              ))}
            </div>
          </fieldset>
        )}
        <div>
          <label className="label" htmlFor="sec-label">{locale === "ar" ? "اسم داخلي (اختياري)" : "Internal label (optional)"}</label>
          <input id="sec-label" value={label} onChange={(e) => setLabel(e.target.value)} className="input" />
        </div>
      </div>
    </Modal>
  );
}

export function PageBuilder({ page, sections: initial, publicHref }: { page: PageRow; sections: Section[]; publicHref: string }) {
  const { d, locale } = useAdmin();
  const result = useResult();
  const [sections, setSections] = useState(initial);
  const [editing, setEditing] = useState<Section | null>(null);
  const [adding, setAdding] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const Back = locale === "ar" ? ArrowRight : ArrowLeft;

  async function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(sections, sections.findIndex((s) => s.id === e.active.id), sections.findIndex((s) => s.id === e.over!.id));
    setSections(next);
    result(await reorderSections(page.id, next.map((s) => s.id)), d.order_saved);
  }
  async function add(type: string) {
    setAdding(false);
    const res = await addSection(page.id, type);
    if (result(res, "") && res.ok && res.data) {
      const s = res.data as Section;
      setSections((cur) => [...cur, s]);
      setEditing(s);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/admin/r/pages" className="btn btn-ghost btn-icon" aria-label={d.back}><Back className="h-5 w-5" /></Link>
          <div className="min-w-0">
            <p className="text-sm text-muted">{d.pages} · <span dir="ltr" className="font-mono">/{page.slug}</span></p>
            <h1 className="flex items-center gap-2 truncate text-2xl font-bold">{L(page.title, locale)} <StatusBadge status={page.status} d={d} /></h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/r/pages/${page.id}`} className="btn btn-outline"><Settings2 className="h-4 w-4" />{d.page_settings}</Link>
          <a href={publicHref} target="_blank" rel="noreferrer" className="btn btn-outline"><ExternalLink className="h-4 w-4" />{d.preview}</a>
          <button type="button" onClick={() => setAdding(true)} className="btn btn-primary"><Plus className="h-4 w-4" />{d.add_section}</button>
        </div>
      </div>
      {["services", "projects", "team", "blog", "contact", "request"].includes(page.slug) && (
        <p className="mb-4 rounded-lg bg-soft px-4 py-3 text-sm">
          {locale === "ar" ? "هذه صفحة نظام: محتواها الأساسي (القوائم/النماذج) يُعرض تلقائياً، والأقسام هنا تظهر قبله (الترويسة) وبعده." : "System page: its main listing/form is rendered automatically; sections here appear around it (header first)."}
        </p>
      )}
      {sections.length === 0 ? (
        <button type="button" onClick={() => setAdding(true)} className="card grid w-full place-items-center gap-2 border-dashed p-12 text-muted hover:text-primary"><Plus className="h-6 w-6" />{d.add_section}</button>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {sections.map((s) => (
                <Row
                  key={s.id}
                  s={s}
                  onEdit={() => setEditing(s)}
                  onToggle={async () => { if (result(await setSectionVisible(s.id, !s.is_visible))) setSections((cur) => cur.map((x) => (x.id === s.id ? { ...x, is_visible: !x.is_visible } : x))); }}
                  onDelete={async () => { if (confirm(d.confirm_delete) && result(await deleteSection(s.id), d.delete)) setSections((cur) => cur.filter((x) => x.id !== s.id)); }}
                  onDuplicate={async () => {
                    const res = await duplicateSection(s.id);
                    if (result(res, d.duplicate) && res.ok && res.data) {
                      const copy = res.data as Section;
                      setSections((cur) => { const i = cur.findIndex((x) => x.id === s.id); const n = [...cur]; n.splice(i + 1, 0, copy); reorderSections(page.id, n.map((x) => x.id)); return n; });
                    }
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title={d.add_section} wide>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_TYPES.map((t) => {
            const I = ICONS[t.icon];
            return (
              <li key={t.type}>
                <button type="button" onClick={() => add(t.type)} className="card card-hover flex h-full w-full items-start gap-3 p-4 text-start">
                  <span className="icon-tile h-10 w-10">{I ? <I className="h-4 w-4" /> : null}</span>
                  <span><span className="block font-semibold">{t.label[locale]}</span><span className="text-sm text-muted">{t.description[locale]}</span></span>
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>
      {editing && <SectionEditor section={editing} onClose={() => setEditing(null)} onSaved={(s) => setSections((cur) => cur.map((x) => (x.id === s.id ? s : x)))} />}
    </div>
  );
}
