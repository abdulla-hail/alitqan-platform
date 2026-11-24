"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft, ArrowRight, BookOpen, ChevronDown, FolderKanban, Headphones, Home, Info, LayoutGrid, Menu, Newspaper, Rocket, Users, X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import { ICONS } from "@/components/ui/Icon";

export interface NavLinkItem {
  label: string;
  href: string;
  newTab?: boolean;
  children?: NavLinkItem[];
}
export interface MegaData {
  categories: { name: string; href: string; icon: string | null; services: { title: string; href: string; icon: string | null; excerpt: string }[] }[];
  promo: { title: string; text: string; cta: string; href: string };
  allLabel: string;
  allHref: string;
}

const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Icon per destination (by path), so every nav item carries a consistent pictogram. */
function navIcon(href: string): LucideIcon {
  const seg = href.split("#")[0].split("/").filter(Boolean)[1] ?? "";
  return ({ "": Home, about: Info, services: LayoutGrid, projects: FolderKanban, blog: Newspaper, contact: Headphones, team: Users, request: Rocket } as Record<string, LucideIcon>)[seg] ?? BookOpen;
}
function matches(pathname: string, href: string, hash: string) {
  const [path, anchor] = href.split("#");
  if (anchor) return pathname === path && hash === `#${anchor}`;
  if (path.split("/").filter(Boolean).length <= 1) return pathname === path;
  return pathname === path || pathname.startsWith(`${path}/`);
}
function isActive(item: NavLinkItem, pathname: string, hash: string): boolean {
  return matches(pathname, item.href, hash) || Boolean(item.children?.some((c) => isActive(c, pathname, hash)));
}
const isServices = (href: string) => /^\/[^/]+\/services\/?$/.test(href);

function useHash(items: NavLinkItem[], pathname: string) {
  const [hash, setHash] = useState("");
  useEffect(() => {
    const ids = items.flatMap((i) => [i, ...(i.children ?? [])]).map((i) => i.href.split("#")).filter(([p, a]) => a && p === pathname).map(([, a]) => a);
    if (!ids.length) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setHash(`#${e.target.id}`)), { rootMargin: "-45% 0px -50% 0px" });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [items, pathname]);
  return hash;
}

/* ------------------------------------------------------------------ header shell (scroll state) */
export function HeaderShell({ children, utility }: { children: React.ReactNode; utility?: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <>
      {utility}
      <header className="site-header sticky top-0 z-40" data-scrolled={scrolled} style={{ viewTransitionName: "site-header" }}>
        {children}
      </header>
    </>
  );
}

/* ------------------------------------------------------------------ mega menu (services) */
function MegaPanel({ mega, dir, onNavigate }: { mega: MegaData; dir: "rtl" | "ltr"; onNavigate: () => void }) {
  const Go = dir === "rtl" ? ArrowLeft : ArrowRight;
  return (
    <div className="container-x">
      <div className="panel grid grid-cols-12 gap-6 p-6 shadow-[var(--shadow-lg)]">
        <div className="col-span-9 grid grid-cols-2 gap-x-6 gap-y-6 xl:grid-cols-4">
          {mega.categories.map((cat) => {
            const CI = (cat.icon && ICONS[cat.icon]) || LayoutGrid;
            return (
              <div key={cat.href}>
                <Link href={cat.href} onClick={onNavigate} className="group/cat flex items-center gap-2 text-sm font-bold text-primary">
                  <CI className="h-4 w-4" aria-hidden />{cat.name}
                </Link>
                <ul className="mt-3 space-y-1">
                  {cat.services.map((s) => {
                    const SI = (s.icon && ICONS[s.icon]) || LayoutGrid;
                    return (
                      <li key={s.href}>
                        <Link href={s.href} onClick={onNavigate} className="group/item flex items-start gap-3 rounded-xl p-2 transition-colors hover:bg-subtle">
                          <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-soft text-primary transition-colors group-hover/item:bg-primary group-hover/item:text-on-primary"><SI className="h-4 w-4" aria-hidden /></span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold leading-snug">{s.title}</span>
                            <span className="line-clamp-1 text-xs text-muted">{s.excerpt}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="panel-brand col-span-3 flex flex-col justify-between p-6">
          <div>
            <p className="text-lg font-bold leading-snug">{mega.promo.title}</p>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">{mega.promo.text}</p>
          </div>
          <div className="mt-6 space-y-2">
            <Link href={mega.promo.href} onClick={onNavigate} className="btn btn-accent group w-full">{mega.promo.cta}<Go className="h-4 w-4" /></Link>
            <Link href={mega.allHref} onClick={onNavigate} className="btn w-full border-white/30 text-white hover:bg-white/10">{mega.allLabel}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ desktop navigation */
export function NavLinks({ items, label, mega, dir }: { items: NavLinkItem[]; label: string; mega?: MegaData; dir: "rtl" | "ltr" }) {
  const pathname = usePathname();
  const hash = useHash(items, pathname);
  const list = useRef<HTMLUListElement>(null);
  const bg = useRef<HTMLLIElement>(null);
  const [megaTop, setMegaTop] = useState(72);
  const [open, setOpen] = useState<string | null>(null);
  const timer = useRef<number>(0);
  const reduce = useReducedMotion();
  useEffect(() => setOpen(null), [pathname]);

  const moveTo = useCallback((el: HTMLElement | null) => {
    const b = bg.current, ul = list.current;
    if (!b || !ul) return;
    if (!el) { b.style.setProperty("--o", "0"); return; }
    const a = el.getBoundingClientRect(), u = ul.getBoundingClientRect();
    b.style.setProperty("--x", `${a.left - u.left}px`);
    b.style.setProperty("--w", `${a.width}px`);
    b.style.setProperty("--o", "1");
    if (!b.dataset.ready) {
      // first placement: no slide-in from the edge
      b.style.transition = "none";
      void b.offsetWidth;
      requestAnimationFrame(() => { b.style.transition = ""; b.dataset.ready = "1"; });
    }
  }, []);
  const toActive = useCallback(() => moveTo(list.current?.querySelector<HTMLElement>(".nav-pill[data-active='true']") ?? null), [moveTo]);
  useIsoLayout(() => { toActive(); }, [pathname, hash, toActive]);
  useEffect(() => {
    const ro = new ResizeObserver(toActive);
    if (list.current) ro.observe(list.current);
    document.fonts?.ready.then(toActive);
    return () => ro.disconnect();
  }, [toActive]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const openSoon = (k: string) => {
    window.clearTimeout(timer.current);
    const h = document.querySelector(".site-header")?.getBoundingClientRect().bottom;
    if (h) setMegaTop(Math.round(h));
    setOpen(k);
  };
  const closeSoon = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(null), 160); };

  return (
    <LazyMotion features={domAnimation} strict>
      <nav className="hidden min-w-0 flex-1 justify-center xl:flex" aria-label={label} onPointerLeave={(e) => e.pointerType === "mouse" && closeSoon()}>
        <ul ref={list} className="nav-pills">
          <li ref={bg} className="nav-pill-bg" aria-hidden role="presentation" />
          {items.map((it) => {
            const active = isActive(it, pathname, hash);
            const I = navIcon(it.href);
            const hasMega = Boolean(mega && isServices(it.href) && mega.categories.length);
            const hasDrop = hasMega || Boolean(it.children?.length);
            const key = it.href + it.label;
            return (
              <li key={key} onPointerEnter={(e) => { if (e.pointerType !== "mouse") return; if (hasDrop) openSoon(key); else closeSoon(); }}>
                <span className="flex items-center">
                  <Link href={it.href} target={it.newTab ? "_blank" : undefined} className="nav-pill" data-active={active} aria-current={matches(pathname, it.href, hash) ? "page" : undefined}
                    onFocus={(e) => moveTo(e.currentTarget)} onBlur={toActive}>
                    <I aria-hidden />{it.label}
                    {hasDrop && (
                      <ChevronDown aria-hidden className={`!h-3.5 !w-3.5 transition-transform duration-300 ${open === key ? "rotate-180" : ""}`} />
                    )}
                  </Link>
                  {hasDrop && (
                    <button type="button" className="sr-only focus:not-sr-only focus:rounded-full focus:px-2" aria-expanded={open === key} aria-label={it.label} onClick={() => (open === key ? setOpen(null) : openSoon(key))}>▾</button>
                  )}
                </span>
                <AnimatePresence>
                  {open === key && hasDrop && (
                    <m.div
                      key="drop"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      transition={{ duration: 0.24, ease: [0.2, 0.7, 0.2, 1] }}
                      className={hasMega ? "fixed inset-x-0 z-50 pt-2" : "absolute top-full z-50 pt-3"}
                      style={hasMega ? { top: megaTop } : undefined}
                      onPointerEnter={() => openSoon(key)}
                    >
                      {hasMega ? (
                        <MegaPanel mega={mega!} dir={dir} onNavigate={() => setOpen(null)} />
                      ) : (
                        <ul className="panel min-w-56 p-2 shadow-[var(--shadow-lg)]">
                          {it.children!.map((c) => {
                            const on = isActive(c, pathname, hash);
                            const CI = navIcon(c.href);
                            return (
                              <li key={c.href + c.label}>
                                <Link href={c.href} aria-current={on ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-subtle ${on ? "bg-soft text-primary" : ""}`}>
                                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-soft text-primary"><CI className="h-4 w-4" aria-hidden /></span>{c.label}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </m.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </nav>
    </LazyMotion>
  );
}

/* ------------------------------------------------------------------ mobile navigation: floating card */
export function MobileNav({ items, labels, ctaHref, dir, extra, mega }: { items: NavLinkItem[]; labels: { menu: string; close: string; cta: string }; ctaHref: string; dir: "rtl" | "ltr"; extra?: React.ReactNode; mega?: MegaData }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const hash = useHash(items, pathname);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => setMounted(true), []);
  useEffect(() => { setOpen(false); setExpanded(null); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => panel.current?.querySelector<HTMLElement>("a,button")?.focus(), 80);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); }
      if (e.key === "Tab" && panel.current) {
        const f = [...panel.current.querySelectorAll<HTMLElement>("a,button,select,[tabindex]:not([tabindex='-1'])")].filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.clearTimeout(t); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const list = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.045, delayChildren: reduce ? 0 : 0.08 } } };
  const row = { hidden: reduce ? { opacity: 0 } : { opacity: 0, x: dir === "rtl" ? 16 : -16 }, show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.2, 0.7, 0.2, 1] as const } } };
  const Chevron = dir === "rtl" ? ArrowLeft : ArrowRight;

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="xl:hidden">
        <button ref={toggle} type="button" className="grid h-11 w-11 place-items-center rounded-2xl border border-line bg-surface transition-colors hover:border-primary hover:text-primary" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? labels.close : labels.menu} onClick={() => setOpen((o) => !o)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {mounted && createPortal(
          <AnimatePresence>
            {open && (
              <m.div key="mnav" className="fixed inset-0 z-[70] xl:hidden" initial="closed" animate="open" exit="closed">
                <m.div className="absolute inset-0 bg-black/35 backdrop-blur-sm" variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }} transition={{ duration: 0.25 }} onClick={() => setOpen(false)} />
                <m.div
                  ref={panel}
                  id="mobile-nav"
                  role="dialog"
                  aria-modal="true"
                  aria-label={labels.menu}
                  dir={dir}
                  className="panel absolute inset-x-3 flex max-h-[calc(100dvh-var(--header-h)-2rem-env(safe-area-inset-top))] flex-col overflow-hidden shadow-2xl"
                  style={{ top: "calc(var(--header-h) + env(safe-area-inset-top) + 0.5rem)" }}
                  variants={{ open: { opacity: 1, y: 0, scale: 1 }, closed: { opacity: 0, y: reduce ? 0 : -14, scale: reduce ? 1 : 0.98 } }}
                  transition={{ duration: reduce ? 0 : 0.28, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  <div className="flex items-center justify-between border-b border-line px-4 py-3">
                    <span className="text-sm font-semibold text-muted">{labels.menu}</span>
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-xl hover:bg-subtle" onClick={() => { setOpen(false); toggle.current?.focus(); }} aria-label={labels.close}><X className="h-5 w-5" /></button>
                  </div>
                  <nav className="flex-1 overflow-y-auto p-3" aria-label={labels.menu}>
                    <m.ul className="space-y-1" variants={list} initial="hidden" animate="show">
                      {items.map((it) => {
                        const on = isActive(it, pathname, hash);
                        const I = navIcon(it.href);
                        const sub = mega && isServices(it.href) && mega.categories.length
                          ? mega.categories.map((c) => ({ label: c.name, href: c.href, children: c.services.map((s) => ({ label: s.title, href: s.href })) }))
                          : it.children ?? [];
                        const key = it.href + it.label;
                        const isOpen = expanded === key;
                        return (
                          <m.li key={key} variants={row}>
                            <div className="flex items-center gap-1">
                              <Link href={it.href} target={it.newTab ? "_blank" : undefined} aria-current={matches(pathname, it.href, hash) ? "page" : undefined} onClick={() => setOpen(false)}
                                className={`flex flex-1 items-center gap-3 rounded-2xl p-2.5 text-[1.05rem] font-semibold transition-colors ${on ? "bg-primary text-on-primary" : "hover:bg-subtle"}`}>
                                <span className={`grid h-9 w-9 place-items-center rounded-xl ${on ? "bg-white/15" : "bg-soft text-primary"}`}><I className="h-[18px] w-[18px]" aria-hidden /></span>
                                <span className="flex-1">{it.label}</span>
                                {!sub.length && <Chevron className="h-4 w-4 opacity-40" aria-hidden />}
                              </Link>
                              {sub.length > 0 && (
                                <button type="button" onClick={() => setExpanded(isOpen ? null : key)} aria-expanded={isOpen} aria-label={it.label}
                                  className="grid h-11 w-11 place-items-center rounded-xl border border-line transition-colors hover:border-primary">
                                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                                </button>
                              )}
                            </div>
                            <AnimatePresence initial={false}>
                              {isOpen && (
                                <m.ul key="sub" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: reduce ? 0 : 0.28 }} className="overflow-hidden">
                                  {sub.map((c) => (
                                    <li key={c.href + c.label} className="ms-6 border-s-2 border-line ps-3 pt-1">
                                      <Link href={c.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-2 text-sm font-semibold text-primary">{c.label}</Link>
                                      {"children" in c && Array.isArray(c.children) && c.children.length > 0 && (
                                        <ul className="mb-1">
                                          {c.children.map((g) => (
                                            <li key={g.href}><Link href={g.href} onClick={() => setOpen(false)} className="block rounded-lg px-2 py-1.5 text-sm text-muted hover:text-fg">{g.label}</Link></li>
                                          ))}
                                        </ul>
                                      )}
                                    </li>
                                  ))}
                                </m.ul>
                              )}
                            </AnimatePresence>
                          </m.li>
                        );
                      })}
                    </m.ul>
                  </nav>
                  <div className="space-y-3 border-t border-line p-3" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
                    {extra}
                    <Link href={ctaHref} onClick={() => setOpen(false)} className="btn btn-primary w-full"><Rocket className="h-4 w-4" />{labels.cta}</Link>
                  </div>
                </m.div>
              </m.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
      </div>
    </LazyMotion>
  );
}
