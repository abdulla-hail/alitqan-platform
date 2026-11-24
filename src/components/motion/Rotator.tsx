"use client";
import { useEffect, useState } from "react";

/**
 * Rotating highlighted word (hero). Screen readers get the full list once
 * (sr-only); the animation is decorative and stops for reduced motion / motion off.
 */
export function Rotator({ words, interval = 2600, className = "" }: { words: string[]; interval?: number; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (words.length < 2) return;
    const root = document.documentElement;
    if (root.dataset.motion === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((x) => (x + 1) % words.length), interval);
    return () => window.clearInterval(t);
  }, [words.length, interval]);
  if (!words.length) return null;
  return (
    <span className={className}>
      <span className="rotator" aria-hidden>
        {words.map((w, k) => (
          <span key={w} data-state={k === i ? "in" : k === (i - 1 + words.length) % words.length ? "out" : "next"}>{w}</span>
        ))}
      </span>
      <span className="sr-only">{words.join("، ")}</span>
    </span>
  );
}
