"use client";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * Client-side category filter + search over server-rendered cards.
 * `cards[i]` corresponds to `meta[i]`.
 */
export function FilterableGrid({
  meta, cards, categories, labels, className,
}: {
  meta: { category: string | null; haystack: string }[];
  cards: React.ReactNode[];
  categories: { value: string; label: string }[];
  labels: { all: string; search: string; empty: string };
  className: string;
}) {
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return meta.map((m) => (cat === "all" || m.category === cat) && (!needle || m.haystack.includes(needle)));
  }, [meta, cat, q]);
  const count = visible.filter(Boolean).length;
  return (
    <div>
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist">
          {[{ value: "all", label: labels.all }, ...categories].map((c) => (
            <button key={c.value} type="button" role="tab" aria-selected={cat === c.value} onClick={() => setCat(c.value)} className={`chip cursor-pointer px-4 py-2 ${cat === c.value ? "chip-active" : "hover:border-primary"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <label className="relative block w-full md:w-72">
          <span className="sr-only">{labels.search}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={labels.search} className="input ps-9" />
        </label>
      </div>
      <p className="sr-only" aria-live="polite">{count}</p>
      {count === 0 ? (
        <p className="py-16 text-center text-muted">{labels.empty}</p>
      ) : (
        <ul className={className}>
          {cards.map((card, i) => (visible[i] ? <li key={i}>{card}</li> : null))}
        </ul>
      )}
    </div>
  );
}
