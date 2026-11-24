"use client";
import { ArrowLeft, ArrowRight, ArrowUpLeft, ArrowUpRight, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PreparedImage } from "@/lib/images";

export interface Slide {
  id: string;
  href: string;
  target: "_self" | "_blank";
  external: boolean;
  title: string;
  excerpt: string;
  category: string;
  alt: string;
  image: PreparedImage | null;
  mobile: PreparedImage | null;
}

/**
 * Homepage projects carousel.
 * - Native scroll-snap track → perfect touch swipe & momentum on phones, no drag library.
 * - Centered slide with neighbours peeking; caption fades in on the active slide.
 * - Arrows, animated dots, "03 / 06" counter, autoplay with progress bar and a Pause/Play button
 *   (WCAG 2.2.2), paused on hover, focus, touch, hidden tab, off-screen and reduced motion.
 * - Keyboard: ←/→ (mirrored in RTL), Home/End when the carousel is focused.
 * - Only the first two images load eagerly; the rest are lazy.
 */
export function ProjectsSlider({
  slides, dir, labels, autoplay, interval,
}: {
  slides: Slide[];
  dir: "rtl" | "ltr";
  labels: { prev: string; next: string; pause: string; play: string; view: string; region: string; slide: string; of: string };
  autoplay: boolean;
  interval: number;
}) {
  const track = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLElement | null)[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [hold, setHold] = useState(false); // hover / focus / touch
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [announce, setAnnounce] = useState("");
  const resumeTimer = useRef<number>(0);
  const count = slides.length;

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(mq.matches);
      if (mq.matches || document.documentElement.dataset.motion === "off") setPlaying(false);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Which slide is centred
  useEffect(() => {
    const root = track.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setIndex(Number((e.target as HTMLElement).dataset.index));
      },
      { root, threshold: 0.6 },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [count]);

  // Only autoplay while the carousel is on screen and the tab is visible
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    const onVis = () => setVisible(document.visibilityState === "visible" && el.getBoundingClientRect().top < innerHeight);
    document.addEventListener("visibilitychange", onVis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const goTo = useCallback((i: number, user = false) => {
    const root = track.current;
    const el = items.current[(i + count) % count];
    if (!root || !el) return;
    const r = root.getBoundingClientRect();
    const s = el.getBoundingClientRect();
    // scrollLeft grows toward the visual left→right in both LTR and RTL; centre the slide.
    root.scrollBy({ left: s.left + s.width / 2 - (r.left + r.width / 2), behavior: reduced ? "auto" : "smooth" });
    if (user) setAnnounce(`${labels.slide} ${((i + count) % count) + 1} ${labels.of} ${count}`);
  }, [count, reduced, labels]);

  const running = playing && !hold && visible && !reduced && count > 1;
  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => goTo(index + 1 >= count ? 0 : index + 1), interval);
    return () => window.clearTimeout(t);
  }, [running, index, interval, count, goTo]);

  const pauseForTouch = () => {
    setHold(true);
    window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setHold(false), 7000);
  };

  if (!count) return null;
  const Prev = dir === "rtl" ? ArrowRight : ArrowLeft;
  const Next = dir === "rtl" ? ArrowLeft : ArrowRight;
  const Out = dir === "rtl" ? ArrowUpLeft : ArrowUpRight;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={labels.region}
      tabIndex={0}
      className="relative outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
      onKeyDown={(e) => {
        const fwd = dir === "rtl" ? "ArrowLeft" : "ArrowRight";
        const back = dir === "rtl" ? "ArrowRight" : "ArrowLeft";
        if (e.key === fwd) { e.preventDefault(); goTo(index + 1, true); }
        else if (e.key === back) { e.preventDefault(); goTo(index - 1, true); }
        else if (e.key === "Home") { e.preventDefault(); goTo(0, true); }
        else if (e.key === "End") { e.preventDefault(); goTo(count - 1, true); }
      }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHold(false)}
      onFocusCapture={() => setHold(true)}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setHold(false); }}
      onTouchStart={pauseForTouch}
      style={{ ["--slider-interval" as string]: `${interval}ms` }}
    >
      <div ref={track} className="slider-track flex gap-4 overflow-x-auto px-[7vw] pb-2 sm:gap-6 md:px-[14vw] lg:px-[18vw]">
        {slides.map((s, i) => {
          const active = i === index;
          return (
            <article
              key={s.id}
              ref={(el) => { items.current[i] = el; }}
              data-index={i}
              data-active={active}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} ${labels.of} ${count}: ${s.title}`}
              className="slider-slide relative w-[86vw] flex-none sm:w-[78vw] md:w-[72vw] lg:w-[64vw] 2xl:w-[58vw]"
            >
              <a
                href={s.href}
                target={s.target}
                rel={s.target === "_blank" || s.external ? "noopener noreferrer" : undefined}
                tabIndex={active ? 0 : -1}
                className="group block"
                onClick={(e) => { if (!active) { e.preventDefault(); goTo(i, true); } }}
              >
                <div className="slider-media img-zoom relative aspect-[4/5] overflow-hidden rounded-brand-lg bg-subtle sm:aspect-[16/10] lg:aspect-[16/9]">
                  {s.image && (
                    <picture>
                      {s.mobile && <source media="(max-width: 639px)" srcSet={s.mobile.srcSet ?? s.mobile.src} sizes="86vw" />}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={s.image.src}
                        srcSet={s.image.srcSet}
                        sizes={s.image.sizes ?? "(min-width:1024px) 64vw, 86vw"}
                        alt={s.alt || s.title}
                        loading={i < 2 ? "eager" : "lazy"}
                        decoding="async"
                        draggable={false}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </picture>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" aria-hidden />
                  <div className="slider-caption absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-white sm:p-8">
                    <div className="min-w-0">
                      {s.category && <span className="inline-flex rounded-pill bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">{s.category}</span>}
                      <h3 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">{s.title}</h3>
                      {s.excerpt && <p className="mt-2 line-clamp-2 max-w-xl text-sm text-white/80 sm:text-base">{s.excerpt}</p>}
                    </div>
                    <span className="hidden h-12 w-12 flex-none place-items-center rounded-full bg-white text-black transition-transform duration-300 group-hover:scale-110 sm:grid" aria-hidden>
                      <Out className="h-5 w-5" />
                    </span>
                  </div>
                </div>
                <span className="sr-only">{labels.view}</span>
              </a>
            </article>
          );
        })}
      </div>

      <div className="container-x mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="font-display text-sm tabular-nums" dir="ltr" aria-hidden>
            <span className="text-2xl font-bold text-fg">{pad(index + 1)}</span>
            <span className="text-muted"> / {pad(count)}</span>
          </p>
          {autoplay && !reduced && (
            <span className="relative hidden h-0.5 w-24 overflow-hidden rounded-sm bg-line sm:block" aria-hidden>
              {running && <span key={index} className="slider-progress absolute inset-0 bg-primary" />}
            </span>
          )}
        </div>
        <div className="order-3 flex w-full justify-center gap-2 sm:order-none sm:w-auto" role="group" aria-label={labels.region}>
          {slides.map((s, i) => (
            <button key={s.id} type="button" onClick={() => goTo(i, true)} aria-current={i === index} aria-label={`${labels.slide} ${i + 1} ${labels.of} ${count}`} className="grid h-6 place-items-center">
              <span className="slider-dot" aria-current={i === index} />
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {autoplay && !reduced && (
            <button type="button" onClick={() => setPlaying((p) => !p)} className="btn btn-ghost btn-icon" aria-label={playing ? labels.pause : labels.play}>
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          )}
          <button type="button" onClick={() => goTo(index - 1, true)} className="btn btn-outline btn-icon rounded-full" aria-label={labels.prev}><Prev className="h-4 w-4" /></button>
          <button type="button" onClick={() => goTo(index + 1, true)} className="btn btn-primary btn-icon rounded-full" aria-label={labels.next}><Next className="h-4 w-4" /></button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>
    </div>
  );
}
