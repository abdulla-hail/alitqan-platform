"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, BookOpen, Building2, ChevronsLeft, ChevronsRight, ExternalLink, FileText, FolderKanban, GalleryHorizontalEnd, Gauge, Image as ImageIcon,
  Inbox, Languages, LayoutGrid, ListTree, LogOut, Mail, Menu, MessageSquareQuote, Palette, Settings, Shield, Sparkles, Tags, Type, UserCircle, Users, UsersRound, X,
} from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { BrandSymbol } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { signOut, setAdminLocale } from "@/features/admin/auth-actions";
import { useAdmin, useCan } from "./ui";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; perm?: string; badge?: number };
const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

function Sidebar({ mini, groups, activeHref, can }: { mini: boolean; groups: { title?: string; items: NavItem[] }[]; activeHref?: string; can: (p: string) => boolean }) {
  const list = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  useIso(() => {
    const el = list.current?.querySelector<HTMLElement>("[aria-current='page']");
    const b = bar.current;
    if (!b || !list.current) return;
    if (!el) { b.style.opacity = "0"; return; }
    const top = el.getBoundingClientRect().top - list.current.getBoundingClientRect().top + list.current.scrollTop;
    b.style.opacity = "1";
    b.style.transform = `translateY(${top + 6}px)`;
    b.style.height = `${el.offsetHeight - 12}px`;
  });
  return (
    <nav className="flex h-full flex-col" aria-label="Admin">
      <div className={`flex h-16 flex-none items-center gap-2.5 border-b border-line ${mini ? "justify-center px-2" : "px-5"}`}>
        <BrandSymbol className="h-8 w-8 flex-none" />
        {!mini && <span className="font-display text-lg font-bold">CMS</span>}
      </div>
      <div ref={list} className="relative flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 py-4">
        <span ref={bar} className="absolute start-1 top-0 w-1 rounded-full bg-primary opacity-0 transition-[transform,height,opacity] duration-500 ease-[cubic-bezier(.34,1.4,.64,1)]" aria-hidden />
        {groups.map((g, gi) => {
          const items = g.items.filter((i) => !i.perm || can(i.perm));
          if (!items.length) return null;
          return (
            <div key={gi}>
              {g.title && (mini ? <div className="mx-3 mb-2 h-px bg-line" /> : <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wide text-muted">{g.title}</p>)}
              <ul className="space-y-0.5">
                {items.map((i) => {
                  const on = i.href === activeHref;
                  return (
                    <li key={i.href}>
                      <Link
                        href={i.href}
                        aria-current={on ? "page" : undefined}
                        title={mini ? i.label : undefined}
                        className={`group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors duration-200 ${mini ? "justify-center px-2" : "px-3"} ${on ? "bg-soft text-primary" : "text-fg/75 hover:bg-subtle hover:text-fg"}`}
                      >
                        <i.icon className={`h-[18px] w-[18px] flex-none transition-transform duration-300 ${on ? "" : "group-hover:scale-110"}`} />
                        {!mini && <span className="flex-1 truncate">{i.label}</span>}
                        {!!i.badge && (
                          <span className={`rounded-full bg-accent px-1.5 text-[11px] font-bold text-on-accent ${mini ? "absolute -top-0.5 end-0.5" : ""}`}>{i.badge}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminShell({ children, user, counts }: { children: React.ReactNode; user: { email: string; name: string | null; role: string }; counts: { requests: number; messages: number } }) {
  const { d, locale } = useAdmin();
  const ar = locale === "ar";
  const can = useCan();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    try { setCollapsed(localStorage.getItem("cms_sidebar") === "collapsed"); } catch {}
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try { localStorage.setItem("cms_sidebar", c ? "open" : "collapsed"); } catch {}
      return !c;
    });
  };
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const groups: { title?: string; items: NavItem[] }[] = [
    { items: [{ href: "/admin", label: d.dashboard, icon: Gauge, perm: "dashboard.view" }] },
    {
      title: d.inbox,
      items: [
        { href: "/admin/requests", label: d.requests, icon: Inbox, perm: "inbox.view", badge: counts.requests },
        { href: "/admin/messages", label: d.messages, icon: Mail, perm: "inbox.view", badge: counts.messages },
      ],
    },
    {
      title: d.content,
      items: [
        { href: "/admin/r/pages", label: d.pages, icon: FileText, perm: "pages.manage" },
        { href: "/admin/r/services", label: d.services, icon: LayoutGrid, perm: "services.manage" },
        { href: "/admin/r/service_categories", label: d.service_categories, icon: Tags, perm: "services.manage" },
        { href: "/admin/r/projects", label: d.projects, icon: FolderKanban, perm: "projects.manage" },
        { href: "/admin/slider", label: ar ? "سلايدر المشاريع" : "Projects slider", icon: GalleryHorizontalEnd, perm: "projects.manage" },
        { href: "/admin/r/project_categories", label: d.project_categories, icon: Tags, perm: "projects.manage" },
        { href: "/admin/r/blog_posts", label: d.blog_posts, icon: BookOpen, perm: "blog.manage" },
        { href: "/admin/r/blog_categories", label: d.blog_categories, icon: Tags, perm: "blog.manage" },
        { href: "/admin/r/blog_tags", label: d.blog_tags, icon: Tags, perm: "blog.manage" },
        { href: "/admin/r/team_members", label: d.team_members, icon: UsersRound, perm: "team.manage" },
        { href: "/admin/r/clients", label: d.clients, icon: Building2, perm: "clients.manage" },
        { href: "/admin/r/testimonials", label: d.testimonials, icon: MessageSquareQuote, perm: "testimonials.manage" },
        { href: "/admin/media", label: d.media, icon: ImageIcon, perm: "media.manage" },
        { href: "/admin/navigation", label: d.navigation, icon: ListTree, perm: "navigation.manage" },
      ],
    },
    {
      title: d.system,
      items: [
        { href: "/admin/brand", label: d.brand, icon: Palette, perm: "brand.manage" },
        { href: "/admin/typography", label: ar ? "إدارة الخطوط" : "Typography", icon: Type, perm: "brand.manage" },
        { href: "/admin/motion", label: ar ? "الحركة والتفاعل" : "Motion & interaction", icon: Sparkles, perm: "settings.manage" },
        { href: "/admin/settings", label: d.settings, icon: Settings, perm: "settings.manage" },
        { href: "/admin/languages", label: d.languages, icon: Languages, perm: "languages.manage" },
        { href: "/admin/users", label: d.users, icon: Users, perm: "users.manage" },
        { href: "/admin/roles", label: d.roles, icon: Shield, perm: "roles.manage" },
        { href: "/admin/activity", label: d.activity, icon: Activity, perm: "activity.view" },
      ],
    },
  ];
  const all = groups.flatMap((g) => g.items);
  // most specific match wins (e.g. /admin/r/projects vs /admin/r/project_categories)
  const activeHref = all
    .filter((i) => (i.href === "/admin" ? pathname === "/admin" : pathname === i.href || pathname.startsWith(`${i.href}/`)) || (i.href === "/admin/r/pages" && pathname.startsWith("/admin/pages/")))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className="min-h-dvh bg-bg" style={{ ["--sb" as string]: collapsed ? "4.5rem" : "18rem" }}>
      <aside className="fixed inset-y-0 start-0 z-40 hidden border-e border-line bg-surface transition-[width] duration-300 ease-out lg:block" style={{ width: "var(--sb)" }}>
        <Sidebar mini={collapsed} groups={groups} activeHref={activeHref} can={can} />
        <button type="button" onClick={toggleCollapsed} className="absolute -end-3 top-20 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface text-muted shadow-sm transition-colors hover:text-primary"
          aria-label={collapsed ? (ar ? "توسيع القائمة" : "Expand sidebar") : ar ? "طي القائمة" : "Collapse sidebar"} aria-expanded={!collapsed}>
          {(collapsed ? !ar : ar) ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>
      <AnimatePresence>
        {open && (
          <m.div key="drawer" className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <m.aside
              className="absolute inset-y-0 start-0 w-[82vw] max-w-72 bg-surface shadow-2xl"
              style={{ paddingTop: "env(safe-area-inset-top)" }}
              initial={{ x: reduce ? 0 : ar ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: reduce ? 0 : ar ? "100%" : "-100%" }}
              transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
              role="dialog"
              aria-modal="true"
            >
              <button className="btn btn-ghost btn-icon absolute end-2 top-3 z-10" onClick={() => setOpen(false)} aria-label="Close"><X className="h-5 w-5" /></button>
              <Sidebar mini={false} groups={groups} activeHref={activeHref} can={can} />
            </m.aside>
          </m.div>
        )}
      </AnimatePresence>
      <div className="transition-[padding] duration-300 ease-out lg:ps-[var(--sb)]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-1 border-b border-line bg-surface/90 px-3 backdrop-blur sm:gap-2 sm:px-5" style={{ paddingTop: "env(safe-area-inset-top)" }}>
          <button className="btn btn-ghost btn-icon lg:hidden" onClick={() => setOpen(true)} aria-label="Menu" aria-expanded={open}><Menu className="h-5 w-5" /></button>
          <p className="truncate text-sm font-semibold text-muted">{all.find((i) => i.href === activeHref)?.label}</p>
          <div className="flex-1" />
          <a href="/" target="_blank" className="btn btn-ghost btn-sm hidden sm:inline-flex"><ExternalLink className="h-4 w-4" />{d.view_site}</a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAdminLocale(locale === "ar" ? "en" : "ar")} title={d.interface_language}>
            {locale === "ar" ? "EN" : "ع"}
          </button>
          <ThemeToggle labels={{ label: d.theme, light: "Light", dark: "Dark", system: "System" }} />
          <details className="group relative">
            <summary className="btn btn-ghost btn-sm list-none [&::-webkit-details-marker]:hidden">
              <UserCircle className="h-5 w-5" />
              <span className="hidden max-w-40 truncate sm:inline">{user.name || user.email}</span>
            </summary>
            <div className="card absolute end-0 top-full z-50 mt-2 w-60 origin-top p-2 shadow-xl animate-rise">
              <p className="truncate px-3 py-1.5 text-xs text-muted" dir="ltr">{user.email}</p>
              <p className="px-3 pb-2 text-xs font-semibold text-primary">{user.role}</p>
              <Link href="/admin/account" className="block rounded-lg px-3 py-2 text-sm hover:bg-subtle">{d.account}</Link>
              <form action={signOut}>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-danger hover:bg-subtle"><LogOut className="h-4 w-4" />{d.logout}</button>
              </form>
            </div>
          </details>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8" style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}>{children}</main>
      </div>
    </div>
  );
}
