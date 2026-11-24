"use client";
import { useEffect, useRef, useState } from "react";
import { getFormToken } from "@/features/forms/actions";
import { publicEnv } from "@/lib/env";

export function Field({ id, label, error, children, hint, required }: { id: string; label: string; error?: string; hint?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-danger" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-xs text-muted" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  );
}

/** Anti-bot plumbing shared by public forms: signed timing token, honeypot, optional Turnstile. */
export function useAntiBot() {
  const [token, setToken] = useState("");
  const [turnstile, setTurnstile] = useState("");
  const widget = useRef<HTMLDivElement>(null);
  const refresh = () => getFormToken().then(setToken).catch(() => setToken(""));
  useEffect(() => {
    refresh();
    if (!publicEnv.turnstileSiteKey || !widget.current) return;
    const w = window as unknown as { turnstile?: { render: (el: HTMLElement, o: object) => void }; onTurnstileLoad?: () => void };
    const render = () => w.turnstile?.render(widget.current!, { sitekey: publicEnv.turnstileSiteKey, callback: (t: string) => setTurnstile(t) });
    if (w.turnstile) render();
    else {
      w.onTurnstileLoad = render;
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);
  const Honeypot = (
    <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
      <label>
        Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
  const Widget = publicEnv.turnstileSiteKey ? <div ref={widget} className="min-h-[65px]" /> : null;
  return { token, turnstile, refresh, Honeypot, Widget };
}
