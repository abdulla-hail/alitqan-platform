"use client";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Pref = "light" | "dark" | "system";
const ORDER: Pref[] = ["light", "dark", "system"];

function apply(pref: Pref) {
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  document.documentElement.setAttribute("data-theme-pref", pref);
}

/** Cross-fades between themes (View Transitions where supported, colour transitions otherwise). */
function applyAnimated(pref: Pref) {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || root.dataset.motion === "off";
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (reduce) return apply(pref);
  if (doc.startViewTransition) {
    root.classList.add("vt-theme");
    doc.startViewTransition(() => apply(pref)).finished.finally(() => root.classList.remove("vt-theme"));
  } else {
    root.classList.add("theme-anim");
    apply(pref);
    window.setTimeout(() => root.classList.remove("theme-anim"), 400);
  }
}

export function ThemeToggle({ labels, defaultTheme = "system" }: { labels: Record<Pref, string> & { label: string }; defaultTheme?: string }) {
  const [pref, setPref] = useState<Pref>(defaultTheme as Pref);

  useEffect(() => {
    const p = (document.documentElement.getAttribute("data-theme-pref") as Pref) || (defaultTheme as Pref);
    setPref(p);
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (document.documentElement.getAttribute("data-theme-pref") === "system") applyAnimated("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [defaultTheme]);

  const next = () => {
    const n = ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
    setPref(n);
    try {
      localStorage.setItem("theme", n);
    } catch {}
    applyAnimated(n);
  };
  const Icon = pref === "dark" ? Moon : pref === "light" ? Sun : Monitor;
  return (
    <button type="button" onClick={next} className="btn btn-ghost btn-icon" aria-label={`${labels.label}: ${labels[pref]}`} title={`${labels.label}: ${labels[pref]}`}>
      <Icon key={pref} className="h-[18px] w-[18px] animate-rise" aria-hidden />
    </button>
  );
}
