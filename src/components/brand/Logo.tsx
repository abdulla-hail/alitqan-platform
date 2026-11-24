import { SYMBOL, WORDMARK_AR, WORDMARK_EN } from "@/lib/brand/logo-geometry";
import { pick } from "@/lib/i18n";
import type { BrandSettings } from "@/types/content";

/** Brand symbol drawn from the master geometry, coloured by design tokens. */
export function BrandSymbol({ className = "h-9 w-9", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox={SYMBOL.viewBox} className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d={SYMBOL.bowl} fill="var(--color-primary)" />
      <path d={SYMBOL.dot} fill="var(--color-accent)" />
    </svg>
  );
}

function ArabicWordmark({ className }: { className?: string }) {
  const s = WORDMARK_AR;
  return (
    <svg viewBox={s.viewBox} className={className} aria-hidden>
      <g fill="none" stroke="var(--color-fg)" strokeWidth={s.strokeWidth} strokeLinecap="square" strokeLinejoin="miter">
        {[...s.strokes, ...s.loops].map((d) => <path key={d} d={d} />)}
      </g>
      <g fill="var(--color-accent)">
        {[...s.dots, s.hamza].map((d) => <path key={d} d={d} />)}
      </g>
    </svg>
  );
}

function LatinWordmark({ className }: { className?: string }) {
  const s = WORDMARK_EN;
  return (
    <svg viewBox={s.viewBox} className={className} aria-hidden>
      <g fill="none" stroke="var(--color-fg)" strokeWidth={s.strokeWidth} strokeLinejoin="miter" strokeMiterlimit={10}>
        {s.strokes.map((d) => <path key={d} d={d} />)}
      </g>
      <g fill="var(--color-accent)">{s.dots.map((d) => <path key={d} d={d} />)}</g>
    </svg>
  );
}

/**
 * Site logo. Mode comes from Brand Identity in the CMS:
 *  - builtin: the original ALITQAN marks (live SVG, recoloured by brand tokens)
 *  - symbol_text: symbol + brand name typed in the display font (use after renaming the brand)
 *  - uploaded: the logo files uploaded in the CMS (light/dark variants)
 */
export function Logo({ brand, locale, size = "md" }: { brand: BrandSettings | null; locale: string; size?: "sm" | "md" | "lg" }) {
  const name = pick(brand?.name, locale) || "ALITQAN";
  const h = size === "lg" ? "h-12" : size === "sm" ? "h-8" : "h-10";
  if (brand?.logo_mode === "uploaded" && brand.logo_url) {
    return (
      <span className="inline-flex items-center" aria-label={name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={brand.logo_url} alt={name} className={`${h} w-auto ${brand.logo_dark_url ? "dark:hidden" : ""}`} />
        {brand.logo_dark_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo_dark_url} alt={name} className={`${h} hidden w-auto dark:block`} />
        )}
      </span>
    );
  }
  if (brand?.logo_mode === "symbol_text") {
    return (
      <span className="inline-flex items-center gap-2.5" aria-label={name}>
        {brand.symbol_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.symbol_url} alt="" className={`${h} w-auto`} />
        ) : (
          <BrandSymbol className={`${h} w-auto`} />
        )}
        <span className="font-display text-xl font-bold tracking-tight">{name}</span>
      </span>
    );
  }
  const isAr = locale === "ar";
  return (
    <span className="inline-flex items-center gap-2" aria-label={name} role="img">
      <BrandSymbol className={`${h} w-auto`} />
      <span className="flex flex-col items-start gap-[3px]">
        {isAr ? (
          <>
            <ArabicWordmark className={size === "sm" ? "h-6 w-auto" : "h-7 w-auto"} />
            <LatinWordmark className="h-[9px] w-auto opacity-80" />
          </>
        ) : (
          <>
            <LatinWordmark className={size === "sm" ? "h-4 w-auto" : "h-5 w-auto"} />
            <ArabicWordmark className="h-[13px] w-auto opacity-80" />
          </>
        )}
      </span>
    </span>
  );
}
