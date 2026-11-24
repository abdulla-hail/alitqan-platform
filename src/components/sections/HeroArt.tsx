/**
 * Hero illustration built only from brand geometry: nested ن-bowls (arcs), the
 * calligraphic rhombus, and hairline measure lines. Animated with CSS only.
 */
export function HeroArt({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative mx-auto ${compact ? "h-full w-full" : "aspect-square w-full max-w-[520px]"}`} aria-hidden>
      <svg viewBox="0 0 400 400" className="h-full w-full">
        <defs>
          <linearGradient id="ha-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-primary)" />
            <stop offset="1" stopColor="var(--color-secondary)" />
          </linearGradient>
        </defs>
        {/* measure lines */}
        {[80, 140, 200, 260, 320].map((y) => (
          <line key={y} x1="20" x2="380" y1={y} y2={y} stroke="var(--color-line)" strokeDasharray="2 6" />
        ))}
        <line x1="200" x2="200" y1="20" y2="380" stroke="var(--color-line)" strokeDasharray="2 6" />
        {/* concentric bowls */}
        <path d="M40 190A160 150 0 0 0 360 190L326 190A126 112 0 0 1 74 190Z" fill="url(#ha-g)" />
        <path d="M96 190A104 96 0 0 0 304 190L288 190A88 76 0 0 1 112 190Z" fill="var(--color-accent)" opacity="0.9" />
        <path d="M140 190A60 54 0 0 0 260 190" fill="none" stroke="var(--color-fg)" strokeWidth="2" opacity="0.35" />
        {/* the measuring dot */}
        <g className="origin-center animate-float" style={{ transformBox: "fill-box" }}>
          <path d="M200 52L246 98L200 144L154 98Z" fill="var(--color-accent)" />
          <path d="M200 76L222 98L200 120L178 98Z" fill="var(--color-bg)" opacity="0.6" />
        </g>
        {/* small orbiting dots */}
        <path d="M330 60L340 70L330 80L320 70Z" fill="var(--color-primary)" />
        <path d="M70 300L78 308L70 316L62 308Z" fill="var(--color-primary)" opacity="0.6" />
        <path d="M352 300L358 306L352 312L346 306Z" fill="var(--color-accent)" />
        {/* dimension marks */}
        <g stroke="var(--color-muted)" strokeWidth="1.2" opacity="0.7">
          <line x1="40" y1="372" x2="360" y2="372" />
          <line x1="40" y1="366" x2="40" y2="378" />
          <line x1="360" y1="366" x2="360" y2="378" />
        </g>
      </svg>
    </div>
  );
}
