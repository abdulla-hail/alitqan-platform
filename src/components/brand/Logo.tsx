import { useId } from "react";
import { liftForDark, MARK_DEFAULT_COLORS, MARK_SQUARE_VIEWBOX, MARK_VIEWBOX, markMarkup, type MarkColors, type MarkVariant } from "@/lib/brand/mark";
import { safeColor } from "@/lib/brand/theme";
import { pick } from "@/lib/i18n";
import type { BrandSettings, LogoSystem } from "@/types/content";

/** Resolved mark colours from the CMS (falls back to the official defaults). */
export function markColors(sys?: LogoSystem | null): MarkColors {
  const c = sys?.colors ?? {};
  return {
    dark: safeColor(c.dark, MARK_DEFAULT_COLORS.dark),
    deep: safeColor(c.deep, MARK_DEFAULT_COLORS.deep),
    primary: safeColor(c.primary, MARK_DEFAULT_COLORS.primary),
    bright: safeColor(c.bright, MARK_DEFAULT_COLORS.bright),
  };
}

/**
 * The official ALITQAN mark as inline vector SVG.
 *  - "color" reads the --logo-* CSS variables (set from the CMS in brandCss), so it re-colours live.
 *  - "light" is the colour mark lifted for dark backgrounds; "white"/"mono" are one-colour versions.
 * Pass `colors` to override the CSS variables (CMS preview before saving).
 */
export function BrandMark({
  className = "h-9 w-auto",
  variant = "color",
  colors,
  square = false,
  title,
}: {
  className?: string;
  variant?: MarkVariant;
  colors?: MarkColors & { mono?: string };
  square?: boolean;
  title?: string;
}) {
  const idp = "bm" + useId().replace(/[^a-zA-Z0-9]/g, "");
  const html = markMarkup({
    idp,
    variant,
    colors: variant === "light" ? liftForDark(colors ?? MARK_DEFAULT_COLORS) : colors,
    mono: colors?.mono,
  });
  return (
    <svg
      viewBox={square ? MARK_SQUARE_VIEWBOX : MARK_VIEWBOX}
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      // markup is generated from constant geometry + validated hex colours only (never user SVG)
      dangerouslySetInnerHTML={{ __html: (title ? `<title>${title.replace(/[<>&"]/g, "")}</title>` : "") + html }}
    />
  );
}

/** The standalone symbol (admin, auth, 404, loading): the official mark, square-boxed. */
export function BrandSymbol({ className = "h-9 w-9", title, surface = "auto", sys = null }: { className?: string; title?: string; surface?: "auto" | "light" | "dark"; sys?: LogoSystem | null }) {
  return <MarkPair className={className} title={title} surface={surface} sys={sys} square />;
}

function MarkPair({
  className,
  title,
  surface,
  sys,
  square,
  colors,
}: {
  className: string;
  title?: string;
  surface: "auto" | "light" | "dark";
  sys: LogoSystem | null;
  square?: boolean;
  colors?: MarkColors & { mono?: string };
}) {
  const onLight = (sys?.on_light ?? "color") as MarkVariant;
  const onDark = (sys?.on_dark ?? "light") as MarkVariant;
  // "color"/"mono" follow the live CSS variables; the lifted "light" version is computed from the CMS colours.
  const one = (v: MarkVariant, extra = "") => (
    <BrandMark className={`${className} ${extra}`.trim()} variant={v} colors={v === "light" ? colors ?? markColors(sys) : colors} square={square} title={title} />
  );
  if (surface === "light") return one(onLight);
  if (surface === "dark") return one(onDark);
  if (onLight === onDark) return one(onLight);
  return (
    <>
      {one(onLight, "dark:hidden")}
      {one(onDark, "hidden dark:block")}
    </>
  );
}

/**
 * Site logo. Mode comes from Brand Identity in the CMS:
 *  - mark (default): the official vector mark, coloured from the CMS, switching variant per background
 *  - symbol_text: mark (or uploaded symbol) + brand name typed in the display font
 *  - uploaded: uploaded logo files (light / dark variants), rendered as <img> only — never inlined
 * `surface` forces the variant for a known background (e.g. "dark" inside ink sections).
 */
export function Logo({
  brand,
  locale,
  size = "md",
  surface = "auto",
  previewColors,
  context = "other",
}: {
  brand: BrandSettings | null;
  locale: string;
  size?: "sm" | "md" | "lg";
  surface?: "auto" | "light" | "dark";
  previewColors?: MarkColors & { mono?: string };
  /** "header": the CMS "show company name beside the logo in the header" setting applies */
  context?: "header" | "other";
}) {
  const sys = brand?.logo_system ?? null;
  const brandName = pick(brand?.name, locale) || "ALITQAN";
  // header name: Arabic in the Arabic UI, English in the English UI; empty → brand name
  const headerName = (sys?.header_name?.[locale] || "").trim() || brandName;
  const inHeaderWithName = context === "header" && Boolean(sys?.show_name);
  const name = inHeaderWithName ? headerName : brandName;
  const h = size === "lg" ? "h-16" : size === "sm" ? "h-10" : "h-12 sm:h-[3.25rem]";
  const nameEl = (
    <span className="min-w-0 max-w-[8.5rem] truncate font-display text-[1.05rem] font-bold leading-tight tracking-tight sm:max-w-[13rem] sm:text-xl 2xl:max-w-[20rem]" data-logo-name>
      {name}
    </span>
  );
  if (brand?.logo_mode === "uploaded" && brand.logo_url) {
    const forced = surface === "dark" && brand.logo_dark_url ? brand.logo_dark_url : brand.logo_url;
    const swap = surface === "auto" && brand.logo_dark_url;
    return (
      <span className="inline-flex min-w-0 items-center gap-2.5" aria-label={name}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={forced} alt={name} className={`${h} w-auto ${swap ? "dark:hidden" : ""}`} />
        {swap && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo_dark_url!} alt={name} className={`${h} hidden w-auto dark:block`} />
        )}
        {inHeaderWithName && nameEl}
      </span>
    );
  }
  const showName = brand?.logo_mode === "symbol_text" || inHeaderWithName;
  const mark =
    brand?.logo_mode === "symbol_text" && brand.symbol_url ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={brand.symbol_url} alt="" className={`${h} w-auto`} />
    ) : (
      <MarkPair className={`${h} w-auto`} surface={surface} sys={sys} colors={previewColors} />
    );
  return (
    <span className="inline-flex min-w-0 items-center gap-2 sm:gap-2.5" aria-label={name} role="img">
      {mark}
      {showName ? nameEl : <span className="sr-only">{name}</span>}
    </span>
  );
}
