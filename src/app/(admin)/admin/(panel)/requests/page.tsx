import Link from "next/link";
import { Download, Paperclip, Search } from "lucide-react";
import { REQUEST_STATUS } from "@/features/admin/inbox-labels";
import { getAdminDict, getAdminLocale } from "@/lib/admin-context";
import { can, requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

type SP = Promise<{ q?: string; status?: string; kind?: string; page?: string }>;

export default async function RequestsPage({ searchParams }: { searchParams: SP }) {
  const staff = await requirePage("inbox.view");
  const [d, locale, sb, sp] = await Promise.all([getAdminDict(), getAdminLocale(), createSessionClient(), searchParams]);
  const page = Math.max(1, Number(sp.page) || 1);
  const per = 25;
  let q = sb.from("project_requests").select("id,reference,kind,name,email,company,service_label,status,priority,followup_on,created_at,request_attachments(count)", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * per, page * per - 1);
  if (sp.status && REQUEST_STATUS[sp.status]) q = q.eq("status", sp.status);
  if (sp.kind === "project" || sp.kind === "quote") q = q.eq("kind", sp.kind);
  if (sp.q) {
    const s = sp.q.replace(/[%,()]/g, " ").trim().slice(0, 80);
    q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%,company.ilike.%${s}%,reference.ilike.%${s}%,description.ilike.%${s}%`);
  }
  const { data, count } = await q;
  const fmt = (s: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium" }).format(new Date(s));
  const qs = new URLSearchParams(Object.entries({ q: sp.q, status: sp.status, kind: sp.kind }).filter(([, v]) => v) as [string, string][]).toString();
  const pages = Math.ceil((count ?? 0) / per);
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-bold">{d.requests}</h1>
        {can(staff, "inbox.export") && (
          <div className="flex gap-2">
            <a href={`/admin/export?type=requests&format=csv&${qs}`} className="btn btn-outline"><Download className="h-4 w-4" />{d.export_csv}</a>
            <a href={`/admin/export?type=requests&format=xlsx&${qs}`} className="btn btn-outline"><Download className="h-4 w-4" />{d.export_xlsx}</a>
          </div>
        )}
      </div>
      <form className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
        <label className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input name="q" defaultValue={sp.q} placeholder={d.search} className="input ps-9" /></label>
        <select name="status" defaultValue={sp.status ?? ""} className="input">
          <option value="">{d.status}: {d.all}</option>
          {Object.entries(REQUEST_STATUS).map(([k, v]) => <option key={k} value={k}>{v[locale]}</option>)}
        </select>
        <select name="kind" defaultValue={sp.kind ?? ""} className="input">
          <option value="">{d.type}: {d.all}</option>
          <option value="project">{locale === "ar" ? "مشروع" : "Project"}</option>
          <option value="quote">{locale === "ar" ? "عرض سعر" : "Quote"}</option>
        </select>
        <button className="btn btn-primary">{d.search.replace("…", "")}</button>
      </form>
      {!data?.length ? (
        <div className="card p-12 text-center text-muted">{d.no_items}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b border-line text-muted"><th className="p-3 text-start">#</th><th className="p-3 text-start">{locale === "ar" ? "العميل" : "Client"}</th><th className="p-3 text-start">{locale === "ar" ? "الخدمة" : "Service"}</th><th className="p-3 text-start">{d.status}</th><th className="p-3 text-start">{d.followup}</th><th className="p-3 text-start">{d.created}</th></tr></thead>
            <tbody>
              {data.map((r) => {
                const st = REQUEST_STATUS[r.status];
                const files = (r.request_attachments as unknown as { count: number }[])?.[0]?.count ?? 0;
                return (
                  <tr key={r.id} className="border-b border-line/60 hover:bg-subtle">
                    <td className="p-3"><Link href={`/admin/requests/${r.id}`} className="font-mono text-xs text-primary" dir="ltr">{r.reference}</Link>{r.kind === "quote" && <span className="ms-2 rounded bg-secondary/15 px-1.5 text-[10px] font-bold text-secondary">QUOTE</span>}</td>
                    <td className="p-3"><Link href={`/admin/requests/${r.id}`} className="font-semibold hover:text-primary">{r.name}</Link><p className="text-xs text-muted" dir="ltr">{r.email}{r.company ? ` · ${r.company}` : ""}</p></td>
                    <td className="p-3">{r.service_label || "—"}{files > 0 && <Paperclip className="ms-1 inline h-3.5 w-3.5 text-muted" />}</td>
                    <td className="p-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st?.tone}`}>{st?.[locale] ?? r.status}</span>{r.priority === "high" && <span className="ms-1 text-xs font-bold text-danger">!</span>}</td>
                    <td className="p-3 text-xs">{r.followup_on ? fmt(r.followup_on) : "—"}</td>
                    <td className="p-3 text-xs text-muted">{fmt(r.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 && (
        <nav className="mt-4 flex flex-wrap gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <Link key={p} href={`/admin/requests?${qs}&page=${p}`} className={`btn btn-sm ${p === page ? "btn-primary" : "btn-outline"}`}>{p}</Link>
          ))}
        </nav>
      )}
      <p className="mt-3 text-xs text-muted">{d.total}: {count ?? 0}</p>
    </div>
  );
}
