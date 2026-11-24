"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Animated statistic. Renders the FINAL value on the server (correct for SEO,
 * no-JS and screen readers); animates only the leading number when it scrolls in.
 * Values like "120+", "98%", "−40%", "2.3×" keep their prefix/suffix.
 */
export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [text, setText] = useState(value);
  useEffect(() => {
    const el = ref.current;
    const m = value.match(/^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/);
    const root = document.documentElement;
    if (!el || !m || root.dataset.motion === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, pre, num, post] = m;
    const target = parseFloat(num.replace(",", "."));
    const decimals = (num.split(/[.,]/)[1] ?? "").length;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const dur = Math.min(2200, parseInt(getComputedStyle(root).getPropertyValue("--motion-dur")) * 2.6 || 1500);
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setText(`${pre}${(target * eased).toFixed(decimals)}${post}`);
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      setText(`${pre}${(0).toFixed(decimals)}${post}`);
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return (
    <span ref={ref} className={className}>
      <span aria-hidden>{text}</span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
