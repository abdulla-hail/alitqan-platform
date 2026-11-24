import Link from "next/link";
import { Download, Search } from "lucide-react";
import { MESSAGE_STATUS } from "@/features/admin/inbox-labels";
import { getAdminDict, getAdminLocale } from "@/lib/admin-context";
import { can, requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string }> }) {
  const staff = await requirePage("inbox.view");
  const [d, locale, sb, sp] = await Promise.all([getAdminDict(), getAdminLocale(), createSessionClient(), searchParams]);
  const page = Math.max(1, Number(sp.page) || 1);
  const per = 25;
  let q = sb.from("contact_messages").select("id,name,email,subject,message,status,created_at", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * per, page * per - 1);
  if (sp.status && MESSAGE_STATUS[sp.status]) q = q.eq("status", sp.status);
  if (sp.q) {
    const s = sp.q.replace(/[%,()]/g, " ").trim().slice(0, 80);
    q = q.or(`name.ilike.%${s}%,email.ilike.%${s}%,subject.ilike.%${s}%,message.ilike.%${s}%`);
  }
  const { data, count } = await q;
  const fmt = (s: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(s));
  const qs = new URLSearchParams(Object.entries({ q: sp.q, status: sp.status }).filter(([, v]) => v) as [string, string][]).toString();
  const pages = Math.ceil((count ?? 0) / per);
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-bold">{d.messages}</h1>
        {can(staff, "inbox.export") && (
          <div className="flex gap-2">
            <a href={`/admin/export?type=messages&format=csv&${qs}`} className="btn btn-outline"><Download className="h-4 w-4" />{d.export_csv}</a>
            <a href={`/admin/export?type=messages&format=xlsx&${qs}`} className="btn btn-outline"><Download className="h-4 w-4" />{d.export_xlsx}</a>
          </div>
        )}
      </div>
      <form className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative"><Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /><input name="q" defaultValue={sp.q} placeholder={d.search} className="input ps-9" /></label>
        <select name="status" defaultValue={sp.status ?? ""} className="input">
          <option value="">{d.status}: {d.all}</option>
          {Object.entries(MESSAGE_STATUS).map(([k, v]) => <option key={k} value={k}>{v[locale]}</option>)}
        </select>
        <button className="btn btn-primary">{d.search.replace("…", "")}</button>
      </form>
      {!data?.length ? (
        <div className="card p-12 text-center text-muted">{d.no_items}</div>
      ) : (
        <ul className="space-y-2">
          {data.map((m) => (
            <li key={m.id}>
              <Link href={`/admin/messages/${m.id}`} className={`card card-hover flex items-start gap-3 p-4 ${m.status === "new" ? "border-s-4 border-s-accent" : ""}`}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{m.name} <span className="text-xs font-normal text-muted" dir="ltr">{m.email}</span></p>
                  <p className="truncate text-sm">{m.subject || m.message}</p>
                </div>
                <div className="text-end">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${MESSAGE_STATUS[m.status]?.tone}`}>{MESSAGE_STATUS[m.status]?.[locale]}</span>
                  <p className="mt-1 text-xs text-muted">{fmt(m.created_at)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav className="mt-4 flex flex-wrap gap-1">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => <Link key={p} href={`/admin/messages?${qs}&page=${p}`} className={`btn btn-sm ${p === page ? "btn-primary" : "btn-outline"}`}>{p}</Link>)}
        </nav>
      )}
    </div>
  );
}
