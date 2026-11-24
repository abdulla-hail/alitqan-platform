"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, ExternalLink, Eye, EyeOff, GripVertical, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteRecord, duplicateRecord, reorderRecords, setRecordField } from "@/features/admin/actions";
import { publicUrl, RESOURCE_MAP } from "@/features/admin/resources";
import { Empty, L, PageTitle, StatusBadge, useAdmin, useResult } from "./ui";

type Row = Record<string, unknown> & { id: string };

function SortableRow({ id, disabled, children }: { id: string; disabled: boolean; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined, position: "relative" as const };
  const handle = disabled ? null : (
    <button type="button" className="cursor-grab touch-none rounded p-1 text-muted hover:bg-subtle active:cursor-grabbing" {...attributes} {...listeners} aria-label="Drag">
      <GripVertical className="h-4 w-4" />
    </button>
  );
  return (
    <li ref={setNodeRef} style={style} className={`card flex items-center gap-3 p-3 ${isDragging ? "shadow-xl ring-2 ring-primary" : ""}`}>
      {children(handle)}
    </li>
  );
}

export function ResourceList({ resourceKey, rows: initial, extraActions }: { resourceKey: string; rows: Row[]; extraActions?: React.ReactNode }) {
  const def = RESOURCE_MAP[resourceKey];
  const { d, locale } = useAdmin();
  const result = useResult();
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [, start] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!needle) return true;
      return JSON.stringify([r[def.titleField], r.slug, def.subtitleField ? r[def.subtitleField] : ""]).toLowerCase().includes(needle);
    });
  }, [rows, q, status, def]);
  const canDrag = def.sortable && !q && status === "all";

  function onDragEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const from = rows.findIndex((r) => r.id === e.active.id);
    const to = rows.findIndex((r) => r.id === e.over!.id);
    const next = arrayMove(rows, from, to);
    setRows(next);
    start(async () => {
      result(await reorderRecords(resourceKey, next.map((r) => r.id)), d.order_saved);
    });
  }

  async function toggle(row: Row, field: "status" | "is_visible" | "is_featured", value: string | boolean) {
    const res = await setRecordField(resourceKey, row.id, field, value);
    if (result(res)) setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, [field]: value } : r)));
  }
  async function remove(row: Row) {
    if (!confirm(d.confirm_delete)) return;
    const res = await deleteRecord(resourceKey, row.id);
    if (result(res, d.delete)) setRows((rs) => rs.filter((r) => r.id !== row.id));
  }
  async function dup(row: Row) {
    const res = await duplicateRecord(resourceKey, row.id);
    if (result(res, d.duplicate) && res.ok && res.data) router.push(`/admin/r/${resourceKey}/${res.data.id}`);
  }

  const editHref = (r: Row) => (resourceKey === "pages" ? `/admin/pages/${r.id}` : `/admin/r/${resourceKey}/${r.id}`);

  return (
    <div>
      <PageTitle
        title={def.label[locale]}
        actions={
          <>
            {extraActions}
            <Link href={resourceKey === "pages" ? "/admin/r/pages/new" : `/admin/r/${resourceKey}/new`} className="btn btn-primary"><Plus className="h-4 w-4" />{d.add} {def.singular[locale]}</Link>
          </>
        }
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={d.search} className="input ps-9" />
        </label>
        {def.status && (
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input sm:w-44">
            <option value="all">{d.all}</option>
            <option value="published">{d.published}</option>
            <option value="draft">{d.draft}</option>
            <option value="archived">{d.archived}</option>
          </select>
        )}
      </div>
      {def.sortable && <p className="mb-2 text-xs text-muted">{canDrag ? d.drag_to_reorder : ""}</p>}
      {filtered.length === 0 ? (
        <Empty>{d.no_items}</Empty>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={filtered.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {filtered.map((r) => {
                const title = L(r[def.titleField], locale) || String(r.slug ?? r.id);
                const img = def.imageField ? (r[def.imageField] as string | null) : null;
                const pub = publicUrl(def, r, locale);
                return (
                  <SortableRow key={r.id} id={r.id} disabled={!canDrag}>
                    {(handle) => (
                      <>
                        {handle}
                        {def.imageField && (
                          <div className="h-12 w-16 flex-none overflow-hidden rounded-md bg-subtle">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            {img && <img src={img} alt="" className="h-full w-full object-cover" />}
                          </div>
                        )}
                        <Link href={editHref(r)} className="min-w-0 flex-1">
                          <p className="truncate font-semibold hover:text-primary">{title}</p>
                          <p className="truncate text-xs text-muted">
                            {def.subtitleField ? L(r[def.subtitleField], locale) : ""}
                            {r.slug ? <span dir="ltr" className="ms-2 font-mono">/{String(r.slug)}</span> : null}
                            {r.is_demo ? <span className="ms-2 rounded bg-accent-soft px-1.5 text-[10px] font-bold text-fg">DEMO</span> : null}
                          </p>
                        </Link>
                        <div className="flex flex-none items-center gap-1">
                          {def.status && (
                            <button type="button" onClick={() => toggle(r, "status", r.status === "published" ? "draft" : "published")} title={r.status === "published" ? d.unpublish : d.publish}>
                              <StatusBadge status={String(r.status)} d={d} />
                            </button>
                          )}
                          {"is_featured" in r && (
                            <button type="button" onClick={() => toggle(r, "is_featured", !r.is_featured)} className={`btn btn-ghost btn-icon btn-sm ${r.is_featured ? "text-accent" : "text-muted"}`} title="Featured">
                              <Star className={`h-4 w-4 ${r.is_featured ? "fill-current" : ""}`} />
                            </button>
                          )}
                          {def.visibility && (
                            <button type="button" onClick={() => toggle(r, "is_visible", !r.is_visible)} className="btn btn-ghost btn-icon btn-sm" title={r.is_visible ? d.hide : d.show}>
                              {r.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted" />}
                            </button>
                          )}
                          {pub && r.status === "published" && (
                            <a href={pub} target="_blank" rel="noreferrer" className="btn btn-ghost btn-icon btn-sm hidden sm:inline-flex" title={d.preview}><ExternalLink className="h-4 w-4" /></a>
                          )}
                          <Link href={editHref(r)} className="btn btn-ghost btn-icon btn-sm" title={d.edit}><Pencil className="h-4 w-4" /></Link>
                          <button type="button" onClick={() => dup(r)} className="btn btn-ghost btn-icon btn-sm hidden sm:inline-flex" title={d.duplicate}><Copy className="h-4 w-4" /></button>
                          {!(resourceKey === "pages" && r.kind === "system") && (
                            <button type="button" onClick={() => remove(r)} className="btn btn-ghost btn-icon btn-sm text-danger" title={d.delete}><Trash2 className="h-4 w-4" /></button>
                          )}
                        </div>
                      </>
                    )}
                  </SortableRow>
                );
              })}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <p className="mt-4 text-xs text-muted">{d.total}: {rows.length}</p>
    </div>
  );
}
