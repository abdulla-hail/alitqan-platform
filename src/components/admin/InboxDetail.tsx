"use client";
import { CalendarClock, Download, Mail, MessageCircle, Phone, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { addNote, attachmentUrl, deleteInboxItem, deleteNote, updateMessage, updateRequest } from "@/features/admin/inbox-actions";
import { MESSAGE_STATUS, NOTIFY, PRIORITY, REQUEST_STATUS } from "@/features/admin/inbox-labels";
import { SubmitButton, useAdmin, useCan, useResult } from "./ui";

type Obj = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function InboxDetail({ kind, item, notes: initialNotes, attachments, staff }: { kind: "request" | "message"; item: Obj; notes: Obj[]; attachments: Obj[]; staff: { id: string; email: string; full_name: string | null }[] }) {
  const { d, locale } = useAdmin();
  const can = useCan();
  const result = useResult();
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [note, setNote] = useState("");
  const [followup, setFollowup] = useState("");
  const [busy, setBusy] = useState(false);
  const statuses = kind === "request" ? REQUEST_STATUS : MESSAGE_STATUS;
  const fmt = (s: string, time = true) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", time ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }).format(new Date(s));
  const update = async (patch: Obj) => {
    const res = kind === "request" ? await updateRequest(item.id, patch) : await updateMessage(item.id, patch);
    if (result(res)) router.refresh();
  };
  const wa = String(item.phone ?? "").replace(/[^\d]/g, "");
  const rows: [string, React.ReactNode][] =
    kind === "request"
      ? [
          [locale === "ar" ? "النوع" : "Type", item.kind === "quote" ? (locale === "ar" ? "طلب عرض سعر" : "Quote request") : locale === "ar" ? "طلب مشروع" : "Project request"],
          [locale === "ar" ? "الشركة" : "Company", item.company || "—"],
          [locale === "ar" ? "الخدمة" : "Service", item.service_label || "—"],
          [locale === "ar" ? "الميزانية" : "Budget", item.budget || "—"],
          [locale === "ar" ? "المدة" : "Timeline", item.timeline || "—"],
          [locale === "ar" ? "لغة الزائر" : "Visitor language", item.locale || "—"],
          [locale === "ar" ? "الموافقة على الخصوصية" : "Privacy consent", item.consent_at ? fmt(item.consent_at) : "—"],
          [locale === "ar" ? "الإشعار" : "Notification", NOTIFY[item.notification_status]?.[locale] ?? item.notification_status],
        ]
      : [
          [locale === "ar" ? "الموضوع" : "Subject", item.subject || "—"],
          [locale === "ar" ? "الإشعار" : "Notification", NOTIFY[item.notification_status]?.[locale] ?? item.notification_status],
        ];
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              {item.reference && <p className="font-mono text-sm text-primary" dir="ltr">{item.reference}</p>}
              <h1 className="text-2xl font-bold">{item.name}</h1>
              <p className="text-sm text-muted">{fmt(item.created_at)}</p>
            </div>
            <span className={`rounded-pill px-3 py-1 text-sm font-semibold ${statuses[item.status]?.tone}`}>{statuses[item.status]?.[locale]}</span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={`mailto:${item.email}`} className="btn btn-outline btn-sm"><Mail className="h-4 w-4" /><span dir="ltr">{item.email}</span></a>
            {item.phone && <a href={`tel:${item.phone}`} className="btn btn-outline btn-sm"><Phone className="h-4 w-4" /><span dir="ltr">{item.phone}</span></a>}
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm"><MessageCircle className="h-4 w-4" />WhatsApp</a>}
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {rows.map(([k, v]) => (<div key={k}><dt className="text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>))}
          </dl>
          <div className="mt-6 whitespace-pre-wrap rounded-lg bg-subtle p-4 leading-relaxed" dir="auto">{kind === "request" ? item.description : item.message}</div>
          {attachments.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 font-semibold">{d.attachments}</h2>
              <ul className="space-y-2">
                {attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 text-sm">
                    <span className="truncate" dir="ltr">{a.file_name} <span className="text-muted">({(a.size_bytes / 1024 / 1024).toFixed(2)} MB)</span></span>
                    <button className="btn btn-outline btn-sm" onClick={async () => { const res = await attachmentUrl(a.storage_path); if (result(res, "") && res.ok && res.data) window.open(res.data, "_blank", "noopener"); }}><Download className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-bold">{d.notes}</h2>
          <ol className="mb-5 space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg border border-line p-3">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
                  <span dir="ltr">{staff.find((s) => s.id === n.author_id)?.full_name || staff.find((s) => s.id === n.author_id)?.email || "—"} · {fmt(n.created_at)}</span>
                  <button onClick={async () => { if (confirm(d.confirm_delete) && result(await deleteNote(n.id), d.delete)) setNotes(notes.filter((x) => x.id !== n.id)); }} className="text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                {n.followup_on && <p className="mt-1 inline-flex items-center gap-1 text-xs text-primary"><CalendarClock className="h-3.5 w-3.5" />{fmt(n.followup_on, false)}</p>}
              </li>
            ))}
            {!notes.length && <li className="text-sm text-muted">{d.no_items}</li>}
          </ol>
          {can("inbox.manage") && (
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              const res = await addNote(kind === "request" ? { request: item.id } : { message: item.id }, note, followup || null);
              setBusy(false);
              if (result(res) && res.ok && res.data) { setNotes([...notes, res.data]); setNote(""); setFollowup(""); router.refresh(); }
            }}>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input" placeholder={d.add_note} required />
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm"><span className="label">{d.followup}</span><input type="date" value={followup} onChange={(e) => setFollowup(e.target.value)} className="input" dir="ltr" /></label>
                <SubmitButton busy={busy}>{d.add_note}</SubmitButton>
              </div>
            </form>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <section className="card space-y-4 p-5">
          <div>
            <label className="label">{d.status}</label>
            <select className="input" value={item.status} disabled={!can("inbox.manage")} onChange={(e) => update({ status: e.target.value })}>
              {Object.entries(statuses).map(([k, v]) => <option key={k} value={k}>{v[locale]}</option>)}
            </select>
          </div>
          {kind === "request" && (
            <>
              <div>
                <label className="label">{d.priority}</label>
                <select className="input" value={item.priority} disabled={!can("inbox.manage")} onChange={(e) => update({ priority: e.target.value })}>
                  {Object.entries(PRIORITY).map(([k, v]) => <option key={k} value={k}>{v[locale]}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{d.assigned}</label>
                <select className="input" value={item.assigned_to ?? ""} disabled={!can("inbox.manage")} onChange={(e) => update({ assigned_to: e.target.value || null })}>
                  <option value="">—</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name || s.email}</option>)}
                </select>
              </div>
            </>
          )}
          <div>
            <label className="label">{d.followup}</label>
            <input type="date" className="input" dir="ltr" defaultValue={item.followup_on ?? ""} disabled={!can("inbox.manage")} onBlur={(e) => e.target.value !== (item.followup_on ?? "") && update({ followup_on: e.target.value || null })} />
          </div>
        </section>
        {can("inbox.delete") && (
          <button className="btn btn-outline w-full text-danger" onClick={async () => {
            if (!confirm(d.confirm_delete)) return;
            if (result(await deleteInboxItem(kind, item.id), d.delete)) router.push(kind === "request" ? "/admin/requests" : "/admin/messages");
          }}><Trash2 className="h-4 w-4" />{d.delete}</button>
        )}
      </aside>
    </div>
  );
}
