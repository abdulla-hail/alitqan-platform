"use client";
import { useEffect } from "react";

/**
 * One tiny observer for the whole site: marks [data-anim] / [data-draw] elements
 * `.in-view` as they scroll in (server-rendered markup stays a Server Component),
 * and feeds the pointer position to `.spotlight` cards. Mounted once per layout.
 */
export function MotionRuntime() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const show = (el: Element) => el.classList.add("in-view");
    const selector = "[data-anim]:not(.in-view), [data-draw]:not(.in-view)";

    if (reduce || root.dataset.reveal === "off" || !("IntersectionObserver" in window)) {
      document.querySelectorAll(selector).forEach(show);
      const mo = new MutationObserver(() => document.querySelectorAll(selector).forEach(show));
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            show(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    const scan = () => document.querySelectorAll(selector).forEach((el) => io.observe(el));
    scan();
    // New content after client navigations / streaming
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    // Safety net: nothing may stay hidden (e.g. elements already above the fold after a jump)
    const safety = window.setTimeout(() => {
      document.querySelectorAll(selector).forEach((el) => {
        if (el.getBoundingClientRect().bottom < window.innerHeight) show(el);
      });
    }, 2500);

    // Spotlight cards (fine pointers only)
    const fine = matchMedia("(pointer: fine)").matches;
    const onMove = (ev: PointerEvent) => {
      const card = (ev.target as Element | null)?.closest?.(".spotlight") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${ev.clientX - r.left}px`);
      card.style.setProperty("--my", `${ev.clientY - r.top}px`);
    };
    if (fine && root.dataset.hover !== "off") document.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      io.disconnect();
      mo.disconnect();
      window.clearTimeout(safety);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);
  return null;
}
