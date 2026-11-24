import Link from "next/link";
import { getAdminDict, getAdminLocale } from "@/lib/admin-context";
import { requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ entity?: string; page?: string }> }) {
  await requirePage("activity.view");
  const [d, locale, sb, sp] = await Promise.all([getAdminDict(), getAdminLocale(), createSessionClient(), searchParams]);
  const page = Math.max(1, Number(sp.page) || 1);
  const per = 50;
  let q = sb.from("activity_logs").select("*", { count: "exact" }).order("created_at", { ascending: false }).range((page - 1) * per, page * per - 1);
  if (sp.entity && /^[a-z_]+$/.test(sp.entity)) q = q.eq("entity_type", sp.entity);
  const { data, count } = await q;
  const fmt = (s: string) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(s));
  const entities = ["services", "projects", "blog_posts", "pages", "page_sections", "media", "brand_settings", "site_settings", "profiles", "project_requests", "contact_messages", "auth"];
  const pages = Math.ceil((count ?? 0) / per);
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">{d.activity}</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/activity" className={`chip ${!sp.entity ? "chip-active" : ""}`}>{d.all}</Link>
        {entities.map((e) => <Link key={e} href={`/admin/activity?entity=${e}`} className={`chip font-mono text-xs ${sp.entity === e ? "chip-active" : ""}`}>{e}</Link>)}
      </div>
      <ul className="space-y-2 md:hidden">
        {(data ?? []).map((a) => (
          <li key={a.id} className="card p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className={`rounded-sm px-1.5 py-0.5 font-mono text-xs ${a.action === "delete" ? "bg-danger/12 text-danger" : a.action === "insert" ? "bg-success/12 text-success" : "bg-subtle"}`}>{a.action}</span>
              <span className="text-xs text-muted">{fmt(a.created_at)}</span>
            </div>
            <p className="mt-2 font-medium">{a.summary || "—"}</p>
            <p className="mt-1 text-xs text-muted"><span className="font-mono">{a.entity_type}</span> · <span dir="ltr">{a.actor_email ?? "system"}</span></p>
          </li>
        ))}
      </ul>
      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-sm">
          <tbody>
            {(data ?? []).map((a) => (
              <tr key={a.id} className="border-b border-line/60">
                <td className="whitespace-nowrap p-3 text-xs text-muted">{fmt(a.created_at)}</td>
                <td className="p-3 text-xs" dir="ltr">{a.actor_email ?? "system"}</td>
                <td className="p-3"><span className={`rounded-sm px-1.5 py-0.5 font-mono text-xs ${a.action === "delete" ? "bg-danger/12 text-danger" : a.action === "insert" ? "bg-success/12 text-success" : "bg-subtle"}`}>{a.action}</span></td>
                <td className="p-3 font-mono text-xs">{a.entity_type}</td>
                <td className="p-3">{a.summary}{a.changes && <span className="ms-2 font-mono text-[11px] text-muted" dir="ltr">{(a.changes as string[]).join(", ")}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.length && <p className="p-10 text-center text-muted">{d.no_items}</p>}
      </div>
      {pages > 1 && (
        <nav className="mt-4 flex flex-wrap gap-1">
          {Array.from({ length: Math.min(pages, 30) }, (_, i) => i + 1).map((p) => <Link key={p} href={`/admin/activity?${sp.entity ? `entity=${sp.entity}&` : ""}page=${p}`} className={`btn btn-sm ${p === page ? "btn-primary" : "btn-outline"}`}>{p}</Link>)}
        </nav>
      )}
    </div>
  );
}
