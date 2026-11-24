"use client";
import Link from "next/link";
import { ExternalLink, Eye, GripVertical, Minus, Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { reorderHomeProjects, setHomeProject } from "@/features/admin/actions";
import { ProjectsSlider, type Slide } from "@/components/sections/ProjectsSlider";
import { Empty, L, Modal, PageTitle, StatusBadge, useAdmin, useResult } from "./ui";

export interface SliderProject {
  id: string; slug: string; title: Record<string, string>; excerpt: Record<string, string>; cover_url: string | null; thumbnail_url: string | null;
  mobile_image_url: string | null; cover_alt: Record<string, string>; status: string; show_on_home: boolean; home_position: number;
  link_target: "_self" | "_blank"; slider_link: string | null; category: Record<string, string> | null;
}

function Row({ p, onRemove, onTarget }: { p: SliderProject; onRemove: () => void; onTarget: (t: "_self" | "_blank") => void }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  const img = p.thumbnail_url || p.cover_url;
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, position: "relative", zIndex: isDragging ? 10 : undefined }}
      className={`card flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap ${isDragging ? "shadow-xl ring-2 ring-primary" : ""}`}>
      <button type="button" className="cursor-grab touch-none rounded p-1 text-muted hover:bg-subtle active:cursor-grabbing" {...attributes} {...listeners} aria-label={d.drag_to_reorder}><GripVertical className="h-4 w-4" /></button>
      <div className="h-14 w-20 flex-none overflow-hidden rounded-md bg-subtle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{L(p.title, locale)}</p>
        <p className="truncate text-xs text-muted" dir="ltr">{p.slider_link || `/projects/${p.slug}`}</p>
        {p.status !== "published" && <p className="mt-0.5 text-xs text-warning">{ar ? "غير منشور — لن يظهر حتى يُنشر" : "Not published — hidden until published"}</p>}
      </div>
      <StatusBadge status={p.status} d={d} />
      <select value={p.link_target} onChange={(e) => onTarget(e.target.value as "_self" | "_blank")} className="input min-h-0 w-auto py-1.5 text-xs" aria-label={ar ? "طريقة فتح الرابط" : "Open link in"}>
        <option value="_self">{ar ? "نفس النافذة" : "Same window"}</option>
        <option value="_blank">{ar ? "نافذة جديدة" : "New window"}</option>
      </select>
      <Link href={`/admin/r/projects/${p.id}`} className="btn btn-ghost btn-icon btn-sm" title={d.edit}><Pencil className="h-4 w-4" /></Link>
      <button type="button" onClick={onRemove} className="btn btn-ghost btn-icon btn-sm text-danger" title={ar ? "إزالة من السلايدر" : "Remove from slider"}><Minus className="h-4 w-4" /></button>
    </li>
  );
}

export function SliderManager({ projects, autoplay, interval }: { projects: SliderProject[]; autoplay: boolean; interval: number }) {
  const { d, locale, languages } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const [items, setItems] = useState(projects);
  const [preview, setPreview] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const inSlider = useMemo(() => items.filter((p) => p.show_on_home).sort((a, b) => a.home_position - b.home_position), [items]);
  const available = items.filter((p) => !p.show_on_home);
  const dir = languages.find((l) => l.code === locale)?.dir ?? (ar ? "rtl" : "ltr");

  async function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const next = arrayMove(inSlider, inSlider.findIndex((p) => p.id === e.active.id), inSlider.findIndex((p) => p.id === e.over!.id));
    setItems((cur) => cur.map((p) => ({ ...p, home_position: next.findIndex((x) => x.id === p.id) >= 0 ? next.findIndex((x) => x.id === p.id) : p.home_position })));
    result(await reorderHomeProjects(next.map((p) => p.id)), d.order_saved);
  }
  async function toggle(p: SliderProject, show: boolean) {
    if (result(await setHomeProject(p.id, show), show ? (ar ? "أُضيف إلى السلايدر" : "Added to slider") : ar ? "أُزيل من السلايدر" : "Removed from slider")) {
      setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, show_on_home: show, home_position: show ? inSlider.length : x.home_position } : x)));
    }
  }
  async function target(p: SliderProject, t: "_self" | "_blank") {
    if (result(await setHomeProject(p.id, true, t))) setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, link_target: t } : x)));
  }
  const slides: Slide[] = inSlider.map((p) => ({
    id: p.id,
    href: "#",
    target: p.link_target,
    external: false,
    title: `${L(p.title, locale)}${p.status !== "published" ? (ar ? " (مسودة)" : " (draft)") : ""}`,
    excerpt: L(p.excerpt, locale),
    category: L(p.category, locale),
    alt: L(p.cover_alt, locale),
    image: p.cover_url || p.thumbnail_url ? { src: (p.cover_url || p.thumbnail_url)! } : null,
    mobile: p.mobile_image_url ? { src: p.mobile_image_url } : null,
  }));

  return (
    <div>
      <PageTitle
        title={ar ? "سلايدر المشاريع" : "Projects slider"}
        subtitle={ar ? "اختر المشاريع التي تظهر في سلايدر الصفحة الرئيسية ورتّبها بالسحب. التفاصيل (الصور، النص البديل، الرابط) من صفحة تعديل المشروع." : "Choose and drag-order the projects in the homepage slider. Images, alt text and links are edited on each project."}
        actions={<button type="button" className="btn btn-outline" onClick={() => setPreview(true)} disabled={!inSlider.length}><Eye className="h-4 w-4" />{d.preview}</button>}
      />
      <section className="mb-8">
        <h2 className="mb-3 font-bold">{ar ? "في السلايدر" : "In the slider"} <span className="text-sm font-normal text-muted">({inSlider.length})</span></h2>
        {inSlider.length === 0 ? (
          <Empty>{ar ? "لا توجد مشاريع في السلايدر بعد. أضف من القائمة أدناه." : "No projects in the slider yet. Add some below."}</Empty>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={inSlider.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">{inSlider.map((p) => <Row key={p.id} p={p} onRemove={() => toggle(p, false)} onTarget={(t) => target(p, t)} />)}</ul>
            </SortableContext>
          </DndContext>
        )}
      </section>
      <section>
        <h2 className="mb-3 font-bold">{ar ? "مشاريع متاحة" : "Available projects"}</h2>
        {available.length === 0 ? (
          <p className="text-sm text-muted">{ar ? "كل المشاريع مضافة." : "All projects are in the slider."}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((p) => (
              <li key={p.id} className="card card-hover flex items-center gap-3 p-3">
                <div className="h-12 w-16 flex-none overflow-hidden rounded-md bg-subtle">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {(p.thumbnail_url || p.cover_url) && <img src={(p.thumbnail_url || p.cover_url)!} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{L(p.title, locale)}</p><StatusBadge status={p.status} d={d} /></div>
                <button type="button" onClick={() => toggle(p, true)} className="btn btn-outline btn-icon btn-sm" title={d.add}><Plus className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
        <Link href="/admin/r/projects/new" className="btn btn-primary mt-4"><Plus className="h-4 w-4" />{d.add} {ar ? "مشروع" : "project"}</Link>
      </section>
      <Modal open={preview} onClose={() => setPreview(false)} title={d.preview} wide>
        <div className="-mx-5" dir={dir}>
          <ProjectsSlider slides={slides} dir={dir} autoplay={autoplay} interval={interval}
            labels={{ prev: "‹", next: "›", pause: "Pause", play: "Play", view: d.preview, region: d.preview, slide: "", of: "/" }} />
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted"><ExternalLink className="h-3.5 w-3.5" />{ar ? "المعاينة تشمل المسودات؛ الموقع العام يعرض المنشور فقط." : "Preview includes drafts; the public site shows published projects only."}</p>
      </Modal>
    </div>
  );
}
