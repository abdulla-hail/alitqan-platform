"use client";
import { Lock, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteRole, saveRole } from "@/features/admin/user-actions";
import { L, PageTitle, SubmitButton, useAdmin, useResult } from "./ui";

interface Role { key: string; name: Record<string, string>; is_system: boolean }
interface Perm { key: string; group_key: string; description: Record<string, string> }

export function RolesManager({ roles, permissions, matrix }: { roles: Role[]; permissions: Perm[]; matrix: Record<string, string[]> }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const router = useRouter();
  const [m, setM] = useState<Record<string, Set<string>>>(() => Object.fromEntries(roles.map((r) => [r.key, new Set(matrix[r.key] ?? [])])));
  const [busy, setBusy] = useState(false);
  const [newRole, setNewRole] = useState({ key: "", name: "" });
  const editable = roles.filter((r) => r.key !== "super_admin");
  const groups = [...new Set(permissions.map((p) => p.group_key))];
  const toggle = (role: string, perm: string) => setM((cur) => {
    const s = new Set(cur[role]);
    if (s.has(perm)) s.delete(perm);
    else s.add(perm);
    return { ...cur, [role]: s };
  });
  async function save() {
    setBusy(true);
    let ok = true;
    for (const r of editable) ok = result(await saveRole({ key: r.key, name: r.name, permissions: [...m[r.key]] }), "") && ok;
    setBusy(false);
    if (ok) { result({ ok: true }); router.refresh(); }
  }
  return (
    <div className="pb-24">
      <PageTitle title={d.roles} subtitle={ar ? "المالك (Super Admin) يملك كل الصلاحيات دائماً ولا يمكن تعديل دوره." : "Super Admin always has every permission and cannot be edited."} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="p-3 text-start text-muted">{ar ? "الصلاحية" : "Permission"}</th>
              <th className="p-3 text-center"><span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" />{L(roles.find((r) => r.key === "super_admin")?.name, locale)}</span></th>
              {editable.map((r) => (
                <th key={r.key} className="p-3 text-center">
                  {L(r.name, locale)}
                  {!r.is_system && <button className="ms-1 text-danger" onClick={async () => { if (confirm(d.confirm_delete) && result(await deleteRole(r.key), d.delete)) router.refresh(); }}><Trash2 className="inline h-3.5 w-3.5" /></button>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => [
              <tr key={g} className="bg-subtle"><td colSpan={editable.length + 2} className="px-3 py-1.5 text-xs font-bold uppercase text-muted">{g}</td></tr>,
              ...permissions.filter((p) => p.group_key === g).map((p) => (
                <tr key={p.key} className="border-b border-line/60">
                  <td className="p-3"><p>{L(p.description, locale)}</p><p className="font-mono text-[11px] text-muted" dir="ltr">{p.key}</p></td>
                  <td className="p-3 text-center"><input type="checkbox" checked disabled className="h-4 w-4" /></td>
                  {editable.map((r) => (
                    <td key={r.key} className="p-3 text-center"><input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" checked={m[r.key]?.has(p.key) ?? false} onChange={() => toggle(r.key, p.key)} aria-label={`${r.key} ${p.key}`} /></td>
                  ))}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
      <form className="card mt-6 flex flex-wrap items-end gap-3 p-5" onSubmit={async (e) => {
        e.preventDefault();
        if (result(await saveRole({ key: newRole.key, name: { ar: newRole.name, en: newRole.name }, permissions: ["dashboard.view"], is_new: true }))) { setNewRole({ key: "", name: "" }); router.refresh(); }
      }}>
        <label><span className="label">{ar ? "رمز الدور" : "Role key"}</span><input className="input font-mono" dir="ltr" placeholder="marketing" value={newRole.key} onChange={(e) => setNewRole({ ...newRole, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") })} /></label>
        <label><span className="label">{ar ? "اسم الدور" : "Role name"}</span><input className="input" value={newRole.name} onChange={(e) => setNewRole({ ...newRole, name: e.target.value })} /></label>
        <button className="btn btn-outline" disabled={!newRole.key || !newRole.name}><Plus className="h-4 w-4" />{ar ? "دور جديد" : "New role"}</button>
      </form>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur lg:start-[var(--sb)]">
        <div className="mx-auto flex max-w-5xl justify-end px-4 py-3"><form onSubmit={(e) => { e.preventDefault(); save(); }}><SubmitButton busy={busy}>{d.save}</SubmitButton></form></div>
      </div>
    </div>
  );
}
