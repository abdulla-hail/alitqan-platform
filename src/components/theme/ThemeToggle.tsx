"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Mode = "light" | "dark";

function apply(mode: Mode) {
  const root = document.documentElement;
  root.setAttribute("data-theme", mode);
  root.style.colorScheme = mode;
}

/** Cross-fades between themes (View Transitions where supported, colour transitions otherwise). */
function applyAnimated(mode: Mode) {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || root.dataset.motion === "off";
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (reduce) return apply(mode);
  if (doc.startViewTransition) {
    root.classList.add("vt-theme");
    doc.startViewTransition(() => apply(mode)).finished.finally(() => root.classList.remove("vt-theme"));
  } else {
    root.classList.add("theme-anim");
    apply(mode);
    window.setTimeout(() => root.classList.remove("theme-anim"), 400);
  }
}

/**
 * One icon, two modes: sun while light is active, moon while dark is active.
 * A click switches straight to the other mode and remembers it (localStorage "theme").
 */
export function ThemeToggle({ labels, className = "" }: { labels: { label: string; light: string; dark: string }; defaultTheme?: string; className?: string }) {
  const [mode, setMode] = useState<Mode>("light");

  useEffect(() => {
    setMode(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  }, []);

  const toggle = () => {
    const n: Mode = mode === "dark" ? "light" : "dark";
    setMode(n);
    try {
      localStorage.setItem("theme", n);
    } catch {}
    applyAnimated(n);
  };
  const Icon = mode === "dark" ? Moon : Sun;
  const target = mode === "dark" ? labels.light : labels.dark;
  return (
    <button
      type="button"
      onClick={toggle}
      className={`btn btn-ghost btn-icon ${className}`}
      aria-label={`${labels.label}: ${mode === "dark" ? labels.dark : labels.light} — ${target}`}
      title={target}
      aria-pressed={mode === "dark"}
      data-theme-toggle={mode}
    >
      <Icon key={mode} className="h-[18px] w-[18px] animate-rise" aria-hidden />
    </button>
  );
}
