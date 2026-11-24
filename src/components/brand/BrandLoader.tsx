import { BrandSymbol } from "./Logo";

/** Branded loading state: the official mark with a soft pulse (static when reduced motion is on). */
export function BrandLoader({ label = "Loading…", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`grid place-items-center ${className}`} role="status" aria-live="polite">
      <div className="relative grid place-items-center">
        <span className="absolute h-24 w-24 rounded-full bg-primary/15 motion-safe:animate-ping" aria-hidden />
        <BrandSymbol className="relative h-16 w-16 motion-safe:animate-pulse" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
