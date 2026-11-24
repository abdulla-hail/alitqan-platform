import Link from "next/link";
import { BarChart3, BookOpen, FolderKanban, Inbox, LayoutGrid, Mail, Palette, Plus, Users } from "lucide-react";
import { getAdminDict, getAdminLocale } from "@/lib/admin-context";
import { can, requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";
import { isEmailConfigured } from "@/lib/email";
import { CountUp } from "@/components/motion/CountUp";

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const staff = await requirePage("dashboard.view");
  const [d, locale, sb, sp] = await Promise.all([getAdminDict(), getAdminLocale(), createSessionClient(), searchParams]);
  const ar = locale === "ar";
  const count = async (table: string, filter?: [string, string]) => {
    let q = sb.from(table).select("id", { count: "exact", head: true });
    if (filter) q = q.eq(filter[0], filter[1]);
    return (await q).count ?? 0;
  };
  const inbox = can(staff, "inbox.view");
  const [projects, services, posts, published, drafts, messages, newMessages, requests, newRequests, team] = await Promise.all([
    count("projects"), count("services"), count("blog_posts"), count("blog_posts", ["status", "published"]), count("blog_posts", ["status", "draft"]),
    inbox ? count("contact_messages") : 0, inbox ? count("contact_messages", ["status", "new"]) : 0,
    inbox ? count("project_requests") : 0, inbox ? count("project_requests", ["status", "new"]) : 0, count("team_members"),
  ]);
  const { data: latest } = inbox
    ? await sb.from("project_requests").select("id,reference,name,kind,service_label,status,created_at").order("created_at", { ascending: false }).limit(6)
    : { data: [] };
  const { data: activity } = can(staff, "activity.view")
    ? await sb.from("activity_logs").select("id,actor_email,action,entity_type,summary,created_at").order("created_at", { ascending: false }).limit(10)
    : { data: [] };
  const fmt = (s: string) => new Intl.DateTimeFormat(ar ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(s));
  const stats = [
    { label: d.projects, value: projects, icon: FolderKanban, href: "/admin/r/projects" },
    { label: d.services, value: services, icon: LayoutGrid, href: "/admin/r/services" },
    { label: d.blog_posts, value: posts, icon: BookOpen, href: "/admin/r/blog_posts", sub: `${published} ${d.published} · ${drafts} ${d.draft}` },
    { label: d.team_members, value: team, icon: Users, href: "/admin/r/team_members" },
    ...(inbox
      ? [
          { label: d.requests, value: requests, icon: Inbox, href: "/admin/requests", sub: `${newRequests} ${d.new_items}`, hot: newRequests > 0 },
          { label: d.messages, value: messages, icon: Mail, href: "/admin/messages", sub: `${newMessages} ${d.new_items}`, hot: newMessages > 0 },
        ]
      : []),
  ];
  return (
    <div className="space-y-8">
      {sp.denied && <p className="rounded-lg bg-warning/15 px-4 py-3 text-sm text-warning">{d.denied}</p>}
      <div>
        <p className="text-muted">{d.welcome}</p>
        <h1 className="text-3xl font-bold">{staff.full_name || staff.email}</h1>
      </div>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s, i) => (
          <li key={s.label} data-anim="up" style={{ ["--i" as string]: i }}>
            <Link href={s.href} className={`group card card-hover spotlight block p-4 ${"hot" in s && s.hot ? "ring-2 ring-accent" : ""}`}>
              <s.icon className="h-5 w-5 text-primary" />
              <p className="mt-3 font-display text-3xl font-bold tabular-nums"><CountUp value={String(s.value)} /></p>
              <p className="text-sm text-muted">{s.label}</p>
              {"sub" in s && s.sub && <p className="mt-1 text-xs text-muted">{s.sub}</p>}
            </Link>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {inbox && (
          <section className="card p-5 lg:col-span-3" data-anim="up" style={{ ["--i" as string]: 2 }}>
            <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{d.requests}</h2><Link href="/admin/requests" className="text-sm text-primary">{d.all}</Link></div>
            {!latest?.length ? <p className="py-6 text-center text-sm text-muted">{d.no_items}</p> : (
              <ul className="divide-y divide-line">
                {latest.map((r) => (
                  <li key={r.id}>
                    <Link href={`/admin/requests/${r.id}`} className="flex items-center gap-3 py-3 hover:text-primary">
                      <span className={`h-2 w-2 flex-none rounded-full ${r.status === "new" ? "bg-accent" : "bg-line"}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{r.name}</span>
                        <span className="block truncate text-xs text-muted">{r.service_label || "—"} · <span dir="ltr">{r.reference}</span></span>
                      </span>
                      <span className="text-xs text-muted">{fmt(r.created_at)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
        <section className="card p-5 lg:col-span-2" data-anim="up" style={{ ["--i" as string]: 3 }}>
          <h2 className="mb-4 font-bold">{d.quick_links}</h2>
          <div className="grid grid-cols-1 gap-2">
            {can(staff, "projects.manage") && <Link href="/admin/r/projects/new" className="btn btn-outline justify-start"><Plus className="h-4 w-4" />{d.add} — {d.projects}</Link>}
            {can(staff, "blog.manage") && <Link href="/admin/r/blog_posts/new" className="btn btn-outline justify-start"><Plus className="h-4 w-4" />{d.add} — {d.blog_posts}</Link>}
            {can(staff, "pages.manage") && <Link href="/admin/r/pages" className="btn btn-outline justify-start"><LayoutGrid className="h-4 w-4" />{d.pages}</Link>}
            {can(staff, "brand.manage") && <Link href="/admin/brand" className="btn btn-outline justify-start"><Palette className="h-4 w-4" />{d.brand}</Link>}
          </div>
          <div className="mt-5 space-y-2 rounded-lg bg-subtle p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold"><BarChart3 className="h-4 w-4" />{ar ? "التحليلات والبريد" : "Analytics & email"}</p>
            <p className="text-muted">
              {isEmailConfigured() ? (ar ? "إشعارات البريد مفعّلة (Resend)." : "Email notifications configured (Resend).") : ar ? "إشعارات البريد غير مفعّلة: أضف RESEND_API_KEY وEMAIL_FROM." : "Email notifications off: set RESEND_API_KEY and EMAIL_FROM."}
            </p>
            <p className="text-muted">{ar ? "لعرض إحصائيات الزيارات فعّل Vercel Analytics أو أضف معرف Google Analytics من الإعدادات." : "For traffic stats enable Vercel Analytics or add a Google Analytics ID in Settings."}</p>
          </div>
        </section>
      </div>
      {!!activity?.length && (
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">{d.recent_activity}</h2><Link href="/admin/activity" className="text-sm text-primary">{d.all}</Link></div>
          <ul className="divide-y divide-line text-sm">
            {activity.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                <span className="rounded-sm bg-subtle px-1.5 py-0.5 font-mono text-xs">{a.action}</span>
                <span className="text-muted">{a.entity_type}</span>
                <span className="min-w-0 flex-1 truncate font-medium">{a.summary}</span>
                <span className="text-xs text-muted" dir="ltr">{a.actor_email}</span>
                <span className="text-xs text-muted">{fmt(a.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
