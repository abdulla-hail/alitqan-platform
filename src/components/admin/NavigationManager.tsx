"use client";
import { ArrowDown, ArrowUp, CornerDownLeft, ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteNavItem, reorderNav, saveNavItem } from "@/features/admin/system-actions";
import { FieldEditor } from "./FieldEditor";
import { L, Modal, PageTitle, SubmitButton, Switch, Tabs, useAdmin, useResult } from "./ui";

interface Item { id: string; menu: string; parent_id: string | null; label: Record<string, string>; href: string; new_tab: boolean; is_visible: boolean; position: number }

export function NavigationManager({ items }: { items: Item[] }) {
  const { d, locale } = useAdmin();
  const result = useResult();
  const router = useRouter();
  const [menu, setMenu] = useState("header");
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [busy, setBusy] = useState(false);
  const ar = locale === "ar";
  const menus = [
    { value: "header", label: ar ? "القائمة الرئيسية" : "Header menu" },
    { value: "footer", label: ar ? "أعمدة التذييل" : "Footer columns" },
    { value: "footer_bottom", label: ar ? "روابط أسفل التذييل" : "Footer bottom links" },
  ];
  const ofMenu = items.filter((i) => i.menu === menu);
  const roots = ofMenu.filter((i) => !i.parent_id).sort((a, b) => a.position - b.position);
  const children = (id: string) => ofMenu.filter((i) => i.parent_id === id).sort((a, b) => a.position - b.position);

  async function move(list: Item[], idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= list.length) return;
    const n = [...list];
    [n[idx], n[j]] = [n[j], n[idx]];
    if (result(await reorderNav(n.map((x) => x.id)), d.order_saved)) router.refresh();
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    const res = await saveNavItem({ id: editing.id ?? null, menu, parent_id: editing.parent_id ?? null, label: editing.label ?? {}, href: editing.href ?? "", new_tab: editing.new_tab, is_visible: editing.is_visible ?? true });
    setBusy(false);
    if (result(res)) {
      setEditing(null);
      router.refresh();
    }
  }
  const row = (it: Item, list: Item[], i: number, depth: number) => (
    <li key={it.id} className={`card flex items-center gap-2 p-3 ${depth ? "ms-8" : ""} ${it.is_visible ? "" : "opacity-60"}`}>
      {depth > 0 && <CornerDownLeft className="h-4 w-4 text-muted rtl:-scale-x-100" />}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{L(it.label, locale)}</p>
        <p className="truncate font-mono text-xs text-muted" dir="ltr">{it.href}{it.new_tab && <ExternalLink className="ms-1 inline h-3 w-3" />}</p>
      </div>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => move(list, i, -1)} aria-label="Up"><ArrowUp className="h-4 w-4" /></button>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => move(list, i, 1)} aria-label="Down"><ArrowDown className="h-4 w-4" /></button>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={async () => { if (result(await saveNavItem({ ...it, is_visible: !it.is_visible }))) router.refresh(); }} title={it.is_visible ? d.hide : d.show}>{it.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setEditing(it)} title={d.edit}><Pencil className="h-4 w-4" /></button>
      <button className="btn btn-ghost btn-icon btn-sm text-danger" onClick={async () => { if (confirm(d.confirm_delete) && result(await deleteNavItem(it.id), d.delete)) router.refresh(); }} title={d.delete}><Trash2 className="h-4 w-4" /></button>
    </li>
  );
  return (
    <div>
      <PageTitle title={d.navigation} subtitle={ar ? "روابط داخلية تُكتب بدون رمز اللغة، مثل /services — وتُضاف اللغة تلقائياً." : "Internal links are written without a language prefix, e.g. /services — it is added automatically."}
        actions={<button className="btn btn-primary" onClick={() => setEditing({ menu, is_visible: true, label: {}, href: "/" })}><Plus className="h-4 w-4" />{d.add}</button>} />
      <div className="mb-5"><Tabs tabs={menus} value={menu} onChange={setMenu} /></div>
      <ul className="space-y-2">
        {roots.map((r, i) => [row(r, roots, i, 0), ...children(r.id).map((c, ci, arr) => row(c, arr, ci, 1))])}
      </ul>
      {!roots.length && <p className="py-10 text-center text-muted">{d.no_items}</p>}
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? d.edit : d.add}
        footer={<form onSubmit={save} className="flex gap-2"><button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>{d.cancel}</button><SubmitButton busy={busy}>{d.save}</SubmitButton></form>}>
        {editing && (
          <div className="space-y-4">
            <FieldEditor field={{ name: "label", kind: "text", localized: true, label: { ar: "النص", en: "Label" } }} value={editing.label} onChange={(v) => setEditing({ ...editing, label: v as Record<string, string> })} />
            <FieldEditor field={{ name: "href", kind: "url", label: { ar: "الرابط", en: "Link" } }} value={editing.href} onChange={(v) => setEditing({ ...editing, href: String(v ?? "") })} />
            <div>
              <label className="label">{ar ? "تحت عنصر (قائمة فرعية)" : "Parent (sub-menu)"}</label>
              <select className="input" value={editing.parent_id ?? ""} onChange={(e) => setEditing({ ...editing, parent_id: e.target.value || null })}>
                <option value="">—</option>
                {roots.filter((r) => r.id !== editing.id).map((r) => <option key={r.id} value={r.id}>{L(r.label, locale)}</option>)}
              </select>
            </div>
            <Switch checked={Boolean(editing.new_tab)} onChange={(v) => setEditing({ ...editing, new_tab: v })} label={ar ? "فتح في نافذة جديدة" : "Open in new tab"} />
          </div>
        )}
      </Modal>
    </div>
  );
}
