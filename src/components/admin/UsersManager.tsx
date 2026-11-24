"use client";
import { KeyRound, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { deleteUser, inviteUser, sendResetLink, updateUser } from "@/features/admin/user-actions";
import { L, Modal, PageTitle, SubmitButton, useAdmin, useResult } from "./ui";

interface U { id: string; email: string; full_name: string | null; role_key: string; is_active: boolean; last_seen_at: string | null; created_at: string }

export function UsersManager({ users, roles, meId, myRole }: { users: U[]; roles: { key: string; name: Record<string, string> }[]; meId: string; myRole: string }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const result = useResult();
  const router = useRouter();
  const [inv, setInv] = useState<{ email: string; full_name: string; role_key: string; password: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const roleName = (k: string) => L(roles.find((r) => r.key === k)?.name, locale) || k;
  const assignable = roles.filter((r) => r.key !== "super_admin" || myRole === "super_admin");
  const fmt = (s: string | null) => (s ? new Intl.DateTimeFormat(ar ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium" }).format(new Date(s)) : "—");
  return (
    <div>
      <PageTitle title={d.users} subtitle={ar ? "الصلاحيات تُفرض في قاعدة البيانات؛ لا يمكن لأي مستخدم تعديل دوره بنفسه." : "Permissions are enforced in the database; nobody can change their own role."}
        actions={<button className="btn btn-primary" onClick={() => setInv({ email: "", full_name: "", role_key: "editor", password: "" })}><Plus className="h-4 w-4" />{ar ? "إضافة مستخدم" : "Add user"}</button>} />
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="border-b border-line text-muted"><th className="p-3 text-start">{ar ? "المستخدم" : "User"}</th><th className="p-3 text-start">{ar ? "الدور" : "Role"}</th><th className="p-3 text-start">{d.status}</th><th className="p-3 text-start">{ar ? "آخر دخول" : "Last sign-in"}</th><th className="p-3" /></tr></thead>
          <tbody>
            {users.map((u) => {
              const self = u.id === meId;
              const locked = self || (u.role_key === "super_admin" && myRole !== "super_admin");
              return (
                <tr key={u.id} className="border-b border-line/60">
                  <td className="p-3"><p className="font-semibold">{u.full_name || "—"} {self && <span className="text-xs text-primary">({ar ? "أنت" : "you"})</span>}</p><p className="text-xs text-muted" dir="ltr">{u.email}</p></td>
                  <td className="p-3">
                    <select className="input min-h-0 py-1.5" value={u.role_key} disabled={locked} onChange={async (e) => { if (result(await updateUser(u.id, { role_key: e.target.value }))) router.refresh(); }}>
                      {(locked ? roles : assignable).map((r) => <option key={r.key} value={r.key}>{roleName(r.key)}</option>)}
                    </select>
                  </td>
                  <td className="p-3">{u.is_active ? <span className="rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-semibold text-success">{ar ? "مفعّل" : "Active"}</span> : <span className="rounded-full bg-danger/12 px-2.5 py-0.5 text-xs font-semibold text-danger">{ar ? "معطّل" : "Disabled"}</span>}</td>
                  <td className="p-3 text-xs text-muted">{fmt(u.last_seen_at)}</td>
                  <td className="p-3">
                    {!locked && (
                      <div className="flex justify-end gap-1">
                        <button className="btn btn-ghost btn-icon btn-sm" title={u.is_active ? (ar ? "تعطيل" : "Disable") : ar ? "تفعيل" : "Enable"} onClick={async () => { if (result(await updateUser(u.id, { is_active: !u.is_active }))) router.refresh(); }}>{u.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}</button>
                        <button className="btn btn-ghost btn-icon btn-sm" title={ar ? "إرسال رابط إعادة تعيين كلمة المرور" : "Send password reset link"} onClick={async () => result(await sendResetLink(u.id), ar ? "أُرسل الرابط" : "Link sent")}><KeyRound className="h-4 w-4" /></button>
                        <button className="btn btn-ghost btn-icon btn-sm text-danger" title={d.delete} onClick={async () => { if (confirm(d.confirm_delete) && result(await deleteUser(u.id), d.delete)) router.refresh(); }}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Modal open={!!inv} onClose={() => setInv(null)} title={ar ? "إضافة مستخدم" : "Add user"}
        footer={<form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!inv) return; setBusy(true); const ok = result(await inviteUser(inv)); setBusy(false); if (ok) { setInv(null); router.refresh(); } }}><button type="button" className="btn btn-ghost" onClick={() => setInv(null)}>{d.cancel}</button><SubmitButton busy={busy}>{d.save}</SubmitButton></form>}>
        {inv && (
          <div className="space-y-4">
            <label className="block"><span className="label">{ar ? "الاسم الكامل" : "Full name"}</span><input className="input" value={inv.full_name} onChange={(e) => setInv({ ...inv, full_name: e.target.value })} /></label>
            <label className="block"><span className="label">{d.email}</span><input className="input" dir="ltr" type="email" value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} /></label>
            <label className="block"><span className="label">{ar ? "الدور" : "Role"}</span><select className="input" value={inv.role_key} onChange={(e) => setInv({ ...inv, role_key: e.target.value })}>{assignable.map((r) => <option key={r.key} value={r.key}>{roleName(r.key)}</option>)}</select></label>
            <label className="block"><span className="label">{ar ? "كلمة مرور مؤقتة (اختياري)" : "Temporary password (optional)"}</span><input className="input" dir="ltr" type="password" autoComplete="new-password" minLength={10} value={inv.password} onChange={(e) => setInv({ ...inv, password: e.target.value })} /></label>
            <p className="text-xs text-muted">{ar ? "اترك كلمة المرور فارغة لإرسال دعوة بالبريد (يتطلب إعداد SMTP في Supabase). وإلا سلّم كلمة المرور للمستخدم بطريقة آمنة واطلب منه تغييرها." : "Leave the password empty to send an email invitation (requires SMTP in Supabase). Otherwise share the password securely and ask the user to change it."}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
