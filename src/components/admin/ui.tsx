"use client";
import { CheckCircle2, Inbox, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from "motion/react";
import type { AdminDict } from "@/lib/admin-i18n";
import { errorText } from "@/lib/admin-i18n";

/* ---------------------------------------------------------------- admin context */
interface AdminUi {
  d: AdminDict;
  locale: "ar" | "en";
  languages: { code: string; native_name: string; dir: "rtl" | "ltr"; is_default: boolean }[];
  permissions: string[];
  role: string;
  toast: (msg: string, kind?: "ok" | "error") => void;
}
const Ctx = createContext<AdminUi | null>(null);
export const useAdmin = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdmin outside provider");
  return c;
};
export function useCan() {
  const { permissions, role } = useAdmin();
  return (p: string) => role === "super_admin" || permissions.includes(p);
}

export function AdminProvider({ children, ...value }: Omit<AdminUi, "toast"> & { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: "ok" | "error" }[]>([]);
  const reduce = useReducedMotion();
  const toast = useCallback((msg: string, kind: "ok" | "error" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === "error" ? 6000 : 3800);
  }, []);
  return (
    <Ctx.Provider value={{ ...value, toast }}>
      <LazyMotion features={domAnimation} strict>
        {children}
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] mx-auto flex w-[min(92vw,420px)] flex-col gap-2" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} role="status" aria-live="polite">
          <AnimatePresence initial={false}>
            {toasts.map((t) => (
              <m.div
                key={t.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
                transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
                className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-xl ${t.kind === "ok" ? "bg-fg text-bg" : "bg-danger text-white"}`}
              >
                {t.kind === "ok" ? <CheckCircle2 className="h-4 w-4 flex-none" /> : <XCircle className="h-4 w-4 flex-none" />}
                <span className="flex-1">{t.msg}</span>
                <button type="button" onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))} aria-label="Close" className="opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </LazyMotion>
    </Ctx.Provider>
  );
}

/** Runs a server action result through toasts. Returns true on success. */
export function useResult() {
  const { d, toast } = useAdmin();
  return (res: { ok: boolean; error?: string; message?: string }, okMsg?: string) => {
    if (res.ok) {
      if (okMsg !== "") toast(okMsg ?? d.saved);
      return true;
    }
    toast(errorText(d, res.error ?? "generic"), "error");
    return false;
  };
}

/* ---------------------------------------------------------------- primitives */
export function Switch({ checked, onChange, label, disabled, description }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean; description?: string }) {
  return (
    <label className={`inline-flex items-start gap-3 ${disabled ? "opacity-50" : "cursor-pointer"}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 flex-none rounded-full transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${checked ? "bg-primary" : "bg-line"}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ease-[cubic-bezier(.34,1.4,.64,1)] ${checked ? "start-[22px]" : "start-0.5"}`} />
      </button>
      {(label || description) && (
        <span>
          {label && <span className="block text-sm font-medium">{label}</span>}
          {description && <span className="block text-xs text-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}

/**
 * Accessible animated dialog: portal, overlay fade, scale-in panel, focus moved in and
 * trapped, Escape closes, overlay click closes (unless `dismissable` is false, e.g. a
 * form with unsaved edits), focus restored to the opener on close.
 */
export function Modal({ open, onClose, title, children, wide = false, footer, dismissable = true }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean; footer?: React.ReactNode; dismissable?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => (ref.current?.querySelector<HTMLElement>("[autofocus],input,select,textarea,button:not([data-close])") ?? ref.current)?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key === "Tab" && ref.current) {
        const f = [...ref.current.querySelectorAll<HTMLElement>("a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex='-1'])")].filter((el) => el.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      (opener.current as HTMLElement | null)?.focus?.();
    };
  }, [open, onClose]);
  if (!mounted) return null;
  return createPortal(
    <LazyMotion features={domAnimation} strict>
      <AnimatePresence>
        {open && (
          <m.div
            key="modal"
            className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onMouseDown={(e) => dismissable && e.target === e.currentTarget && onClose()}
            style={{ background: "color-mix(in oklab, black 45%, transparent)", backdropFilter: "blur(3px)" }}
          >
            <m.div
              ref={ref}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.2, 0.7, 0.2, 1] }}
              className={`card flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-b-none shadow-2xl outline-none sm:rounded-b-[var(--radius)] ${wide ? "max-w-5xl" : "max-w-2xl"}`}
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <h2 className="text-lg font-bold">{title}</h2>
                <button type="button" data-close className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-5">{children}</div>
              {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>}
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </LazyMotion>,
    document.body,
  );
}

export function Tabs({ tabs, value, onChange }: { tabs: { value: string; label: string; badge?: React.ReactNode }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={`relative -mb-px inline-flex items-center gap-1.5 whitespace-nowrap px-3.5 py-2.5 text-sm font-semibold transition-colors ${value === t.value ? "text-primary" : "text-muted hover:text-fg"}`}
        >
          {t.label}
          {t.badge}
          <span className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary transition-transform duration-300 ${value === t.value ? "scale-x-100" : "scale-x-0"}`} aria-hidden />
        </button>
      ))}
    </div>
  );
}

/** Submit button with a real loading state (spinner, aria-busy, no double submit). */
export function SubmitButton({ busy, children, className = "btn btn-primary", disabled }: { busy: boolean; children: React.ReactNode; className?: string; disabled?: boolean }) {
  return (
    <button type="submit" className={className} disabled={busy || disabled} data-loading={busy} aria-busy={busy}>
      <span className="inline-flex items-center gap-2">{children}</span>
    </button>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-anim="up">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function StatusBadge({ status, d }: { status: string; d: AdminDict }) {
  const map: Record<string, string> = {
    published: "bg-success/12 text-success",
    draft: "bg-warning/15 text-warning",
    archived: "bg-muted/15 text-muted",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? "bg-subtle text-muted"}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {(d as Record<string, string>)[status] ?? status}
    </span>
  );
}

export function Empty({ children, icon: I = Inbox, action }: { children: React.ReactNode; icon?: React.ComponentType<{ className?: string }>; action?: React.ReactNode }) {
  return (
    <div className="panel grid place-items-center gap-3 border-dashed p-12 text-center text-muted" data-anim="fade">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-soft text-primary"><I className="h-6 w-6" /></span>
      <div>{children}</div>
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export const L = (obj: unknown, locale: string) => {
  if (!obj || typeof obj !== "object") return typeof obj === "string" ? obj : "";
  const o = obj as Record<string, string>;
  return o[locale] || o.ar || o.en || Object.values(o).find(Boolean) || "";
};
