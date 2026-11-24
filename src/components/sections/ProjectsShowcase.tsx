"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { PreparedImage } from "@/lib/images";

export interface ShowcaseItem {
  id: string;
  href: string;
  target: "_self" | "_blank";
  external: boolean;
  title: string;
  excerpt: string;
  category: string;
  categoryId: string | null;
  alt: string;
  image: PreparedImage | null;
}

/** Category filter pills + swipeable rail of project cards (native scroll-snap, arrows, keyboard). */
export function ProjectsShowcase({ items, categories, dir, labels }: { items: ShowcaseItem[]; categories: { id: string; name: string }[]; dir: "rtl" | "ltr"; labels: { all: string; details: string; prev: string; next: string } }) {
  const [cat, setCat] = useState("all");
  const rail = useRef<HTMLUListElement>(null);
  const shown = useMemo(() => items.filter((p) => cat === "all" || p.categoryId === cat), [items, cat]);
  const usedCats = categories.filter((c) => items.some((p) => p.categoryId === c.id));
  const Go = dir === "rtl" ? ArrowLeft : ArrowRight;
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;
  const scroll = (d: 1 | -1) => {
    const el = rail.current;
    if (!el) return;
    const card = el.querySelector("li");
    el.scrollBy({ left: (dir === "rtl" ? -d : d) * ((card?.clientWidth ?? 320) + 20), behavior: "smooth" });
  };
  return (
    <div>
      {usedCats.length > 1 && (
        <div className="scroll-x mb-8 flex justify-start gap-2 md:justify-center" role="tablist" aria-label={labels.all}>
          {[{ id: "all", name: labels.all }, ...usedCats].map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} onClick={() => { setCat(c.id); rail.current?.scrollTo({ left: 0 }); }}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-300 ${cat === c.id ? "border-primary bg-primary text-on-primary shadow-[0_8px_20px_-10px_var(--color-primary)]" : "border-line bg-surface hover:border-primary hover:text-primary"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}
      <div className="relative">
        <ul ref={rail} className="scroll-x -mx-1 flex gap-5 px-1 pb-4" aria-live="polite">
          {shown.map((p, i) => (
            <li key={p.id} className="w-[82%] flex-none sm:w-[46%] lg:w-[31.5%] animate-rise" style={{ animationDelay: `${Math.min(i, 4) * 60}ms` }}>
              <a href={p.href} target={p.target} rel={p.target === "_blank" || p.external ? "noopener noreferrer" : undefined} className="lift group flex h-full flex-col overflow-hidden">
                <div className="relative m-3 mb-0 overflow-hidden rounded-[calc(var(--radius)*1.1)] bg-soft">
                  <div className="img-zoom relative aspect-[4/3]">
                    {p.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image.src} srcSet={p.image.srcSet} sizes={p.image.sizes ?? "(min-width:1024px) 32vw, 80vw"} alt={p.alt} loading={i < 3 ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                  </div>
                  {p.category && <span className="absolute start-3 top-3 rounded-full bg-surface/90 px-3 py-1 text-xs font-semibold text-fg backdrop-blur">{p.category}</span>}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-bold leading-snug transition-colors group-hover:text-primary">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{p.excerpt}</p>}
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">{labels.details}<Go className="h-4 w-4 transition-transform group-hover:-translate-x-1 ltr:group-hover:translate-x-1" aria-hidden /></span>
                </div>
              </a>
            </li>
          ))}
        </ul>
        {shown.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            <button type="button" onClick={() => scroll(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-line bg-surface transition-colors hover:border-primary hover:text-primary" aria-label={labels.prev}><Back className="h-4 w-4" /></button>
            <button type="button" onClick={() => scroll(1)} className="grid h-11 w-11 place-items-center rounded-full bg-primary text-on-primary transition-transform hover:scale-105" aria-label={labels.next}><Go className="h-4 w-4" /></button>
          </div>
        )}
      </div>
    </div>
  );
}
