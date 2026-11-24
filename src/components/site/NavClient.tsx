"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";

export interface NavLinkItem {
  label: string;
  href: string;
  newTab?: boolean;
  children?: NavLinkItem[];
}

const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

function matches(pathname: string, href: string, hash: string) {
  const [path, anchor] = href.split("#");
  if (anchor) return pathname === path && hash === `#${anchor}`;
  if (path.split("/").filter(Boolean).length <= 1) return pathname === path; // locale home
  return pathname === path || pathname.startsWith(`${path}/`);
}
function isActive(item: NavLinkItem, pathname: string, hash: string): boolean {
  return matches(pathname, item.href, hash) || Boolean(item.children?.some((c) => isActive(c, pathname, hash)));
}

/** Tracks #section links on the current page (scroll-spy). */
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

/* ------------------------------------------------------------------ header shell */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className="site-header sticky top-0 z-40 backdrop-blur-xl" data-scrolled={scrolled} style={{ viewTransitionName: "site-header" }}>
      {children}
    </header>
  );
}

/* ------------------------------------------------------------------ desktop navigation */
function Dropdown({ item, active, pathname, hash }: { item: NavLinkItem; active: boolean; pathname: string; hash: string }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const timer = useRef<number>(0);
  const reduce = useReducedMotion();
  useEffect(() => setOpen(false), [pathname]);
  const openSoon = () => { window.clearTimeout(timer.current); setOpen(true); };
  const closeSoon = () => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen(false), 140); };
  return (
    <li className="relative" onPointerEnter={(e) => e.pointerType === "mouse" && openSoon()} onPointerLeave={(e) => e.pointerType === "mouse" && closeSoon()}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) { setOpen(false); btn.current?.focus(); }
        if (e.key === "ArrowDown" && open) { e.preventDefault(); (menu.current?.querySelector("a") as HTMLElement | null)?.focus(); }
      }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <span className="flex items-center">
        <Link href={item.href} target={item.newTab ? "_blank" : undefined} data-nav-link aria-current={active ? "page" : undefined}
          className={`link-u relative inline-flex items-center rounded-full py-2 ps-3.5 pe-1 text-[0.95rem] font-medium transition-colors ${active ? "text-primary" : "text-fg/80 hover:text-fg"}`}>
          {item.label}
        </Link>
        <button ref={btn} type="button" aria-expanded={open} aria-haspopup="true" aria-label={item.label}
          onClick={() => setOpen((o) => !o)} className="grid h-8 w-7 place-items-center rounded-full text-muted hover:text-fg">
          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </span>
      <AnimatePresence>
        {open && (
          <m.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute start-0 top-full z-50 min-w-56 pt-2"
          >
            <ul ref={menu} className="card p-1.5 shadow-xl">
              {item.children!.map((c) => {
                const on = isActive(c, pathname, hash);
                return (
                  <li key={c.href + c.label}>
                    <Link href={c.href} target={c.newTab ? "_blank" : undefined} aria-current={on ? "page" : undefined}
                      className={`group/sub flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-subtle ${on ? "bg-soft font-semibold text-primary" : ""}`}>
                      <span className={`rhombus transition-transform duration-300 ${on ? "scale-100" : "scale-0 group-hover/sub:scale-75"}`} aria-hidden />
                      {c.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function NavLinks({ items, label }: { items: NavLinkItem[]; label: string }) {
  const pathname = usePathname();
  const hash = useHash(items, pathname);
  const list = useRef<HTMLUListElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);

  const moveTo = useCallback((el: HTMLElement | null) => {
    const ind = indicator.current;
    const ul = list.current;
    if (!ind || !ul) return;
    if (!el) { ind.style.setProperty("--o", "0"); return; }
    const a = el.getBoundingClientRect();
    const b = ul.getBoundingClientRect();
    ind.style.setProperty("--x", `${a.left - b.left + 12}px`);
    ind.style.setProperty("--w", `${Math.max(12, a.width - 24)}px`);
    ind.style.setProperty("--o", "1");
  }, []);
  const toActive = useCallback(() => moveTo(list.current?.querySelector<HTMLElement>("[data-nav-link][aria-current='page']") ?? null), [moveTo]);

  useIsoLayout(() => { toActive(); }, [pathname, hash, toActive]);
  useEffect(() => {
    const ro = new ResizeObserver(toActive);
    if (list.current) ro.observe(list.current);
    document.fonts?.ready.then(toActive);
    return () => ro.disconnect();
  }, [toActive]);

  return (
    <LazyMotion features={domAnimation} strict>
      <nav className="hidden flex-1 lg:block" aria-label={label}>
        <ul ref={list} className="relative flex items-center justify-center gap-0.5"
          onPointerOver={(e) => { const a = (e.target as HTMLElement).closest<HTMLElement>("[data-nav-link]"); if (a) moveTo(a); }}
          onPointerLeave={toActive} onFocus={(e) => { const a = (e.target as HTMLElement).closest<HTMLElement>("[data-nav-link]"); if (a) moveTo(a); }} onBlur={toActive}>
          {items.map((it) => {
            const active = isActive(it, pathname, hash);
            if (it.children?.length) return <Dropdown key={it.href + it.label} item={it} active={active} pathname={pathname} hash={hash} />;
            return (
              <li key={it.href + it.label}>
                <Link href={it.href} target={it.newTab ? "_blank" : undefined} data-nav-link aria-current={active ? "page" : undefined}
                  className={`link-u relative inline-flex items-center rounded-full px-3.5 py-2 text-[0.95rem] font-medium transition-colors ${active ? "text-primary" : "text-fg/80 hover:text-fg"}`}>
                  {it.label}
                </Link>
              </li>
            );
          })}
          <span ref={indicator} className="nav-indicator" aria-hidden />
        </ul>
      </nav>
    </LazyMotion>
  );
}

/* ------------------------------------------------------------------ mobile navigation */
export function MobileNav({ items, labels, ctaHref, dir, extra }: { items: NavLinkItem[]; labels: { menu: string; close: string; cta: string }; ctaHref: string; dir: "rtl" | "ltr"; extra?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const hash = useHash(items, pathname);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => panel.current?.querySelector<HTMLElement>("a,button")?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); }
      if (e.key === "Tab" && panel.current) {
        const f = [...panel.current.querySelectorAll<HTMLElement>("a,button,select,[tabindex]:not([tabindex='-1'])")];
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.clearTimeout(t); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const from = dir === "rtl" ? "-100%" : "100%";
  const list = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.05, delayChildren: reduce ? 0 : 0.12 } },
  };
  const row = { hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.2, 0.7, 0.2, 1] as const } } };

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="lg:hidden">
        <button ref={toggle} type="button" className="btn btn-ghost btn-icon" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? labels.close : labels.menu} onClick={() => setOpen((o) => !o)}>
          <Menu className="h-5 w-5" />
        </button>
        {mounted && createPortal(
          <AnimatePresence>
            {open && (
              <m.div key="mnav" className="fixed inset-0 z-[70] lg:hidden" initial="closed" animate="open" exit="closed">
                <m.div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" variants={{ open: { opacity: 1 }, closed: { opacity: 0 } }} transition={{ duration: 0.25 }} onClick={() => setOpen(false)} />
                <m.div
                  ref={panel}
                  id="mobile-nav"
                  role="dialog"
                  aria-modal="true"
                  aria-label={labels.menu}
                  dir={dir}
                  className="absolute inset-y-0 end-0 flex w-[min(88vw,400px)] flex-col bg-bg shadow-2xl"
                  style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
                  variants={{ open: { x: 0 }, closed: { x: reduce ? 0 : from } }}
                  transition={{ type: "tween", duration: reduce ? 0 : 0.38, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  <div className="flex h-16 items-center justify-between border-b border-line px-5">
                    <span className="text-sm font-semibold text-muted">{labels.menu}</span>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => { setOpen(false); toggle.current?.focus(); }} aria-label={labels.close}><X className="h-5 w-5" /></button>
                  </div>
                  <nav className="flex-1 overflow-y-auto px-4 py-5" aria-label={labels.menu}>
                    <m.ul className="space-y-1" variants={list} initial="hidden" animate="show">
                      {items.map((it) => {
                        const on = isActive(it, pathname, hash);
                        return (
                          <m.li key={it.href + it.label} variants={row}>
                            <Link href={it.href} target={it.newTab ? "_blank" : undefined} aria-current={matches(pathname, it.href, hash) ? "page" : undefined} onClick={() => setOpen(false)}
                              className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-lg font-semibold transition-colors ${on ? "bg-soft text-primary" : "hover:bg-subtle"}`}>
                              {it.label}
                              {on && <span className="rhombus" aria-hidden />}
                            </Link>
                            {!!it.children?.length && (
                              <ul className="ms-5 mt-1 space-y-0.5 border-s-2 border-line ps-3">
                                {it.children.map((c) => {
                                  const con = isActive(c, pathname, hash);
                                  return (
                                    <li key={c.href + c.label}>
                                      <Link href={c.href} aria-current={con ? "page" : undefined} onClick={() => setOpen(false)}
                                        className={`block rounded-lg px-3 py-2.5 ${con ? "font-semibold text-primary" : "text-muted hover:text-fg"}`}>{c.label}</Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </m.li>
                        );
                      })}
                    </m.ul>
                  </nav>
                  <m.div className="space-y-4 border-t border-line p-5" variants={row} initial="hidden" animate="show">
                    {extra}
                    <Link href={ctaHref} onClick={() => setOpen(false)} className="btn btn-primary w-full">{labels.cta}</Link>
                  </m.div>
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
