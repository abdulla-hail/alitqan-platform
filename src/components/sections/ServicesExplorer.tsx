"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, LayoutGrid } from "lucide-react";
import { useRef, useState } from "react";
import { ICONS } from "@/components/ui/Icon";

export interface ExplorerService {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  icon: string | null;
  image: string | null;
  features: string[];
  href: string;
  requestHref: string;
}

/**
 * Services explorer: accessible tabs (roving focus with ←/→/Home/End, mirrored in RTL)
 * inside the brand panel. Details come from each service in the CMS.
 */
export function ServicesExplorer({ services, dir, labels }: { services: ExplorerService[]; dir: "rtl" | "ltr"; labels: { details: string; request: string; prev: string; next: string } }) {
  const [active, setActive] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const Go = dir === "rtl" ? ArrowLeft : ArrowRight;
  const Prev = dir === "rtl" ? ArrowRight : ArrowLeft;
  if (!services.length) return null;
  const s = services[active];
  const SI = (s.icon && ICONS[s.icon]) || LayoutGrid;

  const select = (i: number, focus = false) => {
    const n = (i + services.length) % services.length;
    setActive(n);
    const el = tabs.current[n];
    if (focus) el?.focus();
    el?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  };
  const scrollBy = (d: 1 | -1) => strip.current?.scrollBy({ left: (dir === "rtl" ? -d : d) * 320, behavior: "smooth" });

  return (
    <div className="panel-brand relative overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="bg-measure pointer-events-none absolute inset-0 opacity-20" aria-hidden />
      <div className="relative flex items-center gap-2">
        <button type="button" onClick={() => scrollBy(-1)} className="hidden h-10 w-10 flex-none place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:grid" aria-label={labels.prev}><Prev className="h-4 w-4" /></button>
        <div
          ref={strip}
          role="tablist"
          aria-orientation="horizontal"
          className="scroll-x flex flex-1 gap-3 py-1"
          onKeyDown={(e) => {
            const fwd = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
            const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
            if (e.key === fwd) { e.preventDefault(); select(active + 1, true); }
            else if (e.key === back) { e.preventDefault(); select(active - 1, true); }
            else if (e.key === "Home") { e.preventDefault(); select(0, true); }
            else if (e.key === "End") { e.preventDefault(); select(services.length - 1, true); }
          }}
        >
          {services.map((sv, i) => {
            const I = (sv.icon && ICONS[sv.icon]) || LayoutGrid;
            return (
              <button
                key={sv.id}
                ref={(el) => { tabs.current[i] = el; }}
                type="button"
                role="tab"
                id={`svc-tab-${sv.id}`}
                aria-selected={i === active}
                aria-controls="svc-panel"
                tabIndex={i === active ? 0 : -1}
                onClick={() => select(i)}
                className="tab-chip"
              >
                <span className="tab-chip-icon"><I className="h-5 w-5" aria-hidden /></span>
                <span className="text-sm font-bold leading-snug">{sv.title}</span>
              </button>
            );
          })}
        </div>
        <button type="button" onClick={() => scrollBy(1)} className="hidden h-10 w-10 flex-none place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 md:grid" aria-label={labels.next}><Go className="h-4 w-4" /></button>
      </div>

      <div id="svc-panel" role="tabpanel" aria-labelledby={`svc-tab-${s.id}`} key={s.id} className="relative mt-6 grid grid-cols-1 items-center gap-8 rounded-[calc(var(--radius)*1.4)] p-2 animate-rise sm:p-4 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7">
          {s.category && <p className="text-sm font-semibold text-[color:var(--c-accent)]">{s.category}</p>}
          <h3 className="mt-2 text-2xl font-bold text-white sm:text-3xl">{s.title}</h3>
          <p className="mt-4 text-lg leading-relaxed text-white/80">{s.excerpt}</p>
          {s.features.length > 0 && (
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {s.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-white/90"><CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[color:var(--c-accent)]" aria-hidden />{f}</li>
              ))}
            </ul>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={s.href} className="btn btn-accent group">{labels.details}<Go className="h-4 w-4" /></Link>
            <Link href={s.requestHref} className="btn border-white/30 text-white hover:bg-white/10">{labels.request}</Link>
          </div>
        </div>
        <div className="relative lg:col-span-5">
          <div className="relative mx-auto grid aspect-[4/3] w-full max-w-md place-items-center overflow-hidden rounded-[calc(var(--radius)*1.6)] bg-white/10 ring-1 ring-white/15">
            {s.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
              <>
                <div className="bg-measure absolute inset-0 opacity-30" aria-hidden />
                <span className="relative grid h-28 w-28 place-items-center rounded-[2rem] bg-white text-[color:var(--c-primary)] shadow-2xl animate-float"><SI className="h-12 w-12" aria-hidden /></span>
                <span className="absolute bottom-6 start-6 h-4 w-4 rotate-45 bg-[color:var(--c-accent)] animate-drift" aria-hidden />
                <span className="absolute end-8 top-8 h-3 w-3 rotate-45 bg-white/70 animate-drift [animation-delay:-3s]" aria-hidden />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
