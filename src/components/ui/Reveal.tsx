/**
 * Scroll-reveal wrapper — a SERVER component (no client JS per element).
 * The shared <MotionRuntime> adds `.in-view`; CSS in motion.css animates it.
 * variant: up | down | start | end | scale | fade | clip | image
 * i: position in a sequence → staggered by the CMS "reveal speed" setting.
 */
type Variant = "up" | "down" | "start" | "end" | "scale" | "fade" | "clip" | "image";

export function Reveal({
  children, className = "", variant = "up", i = 0, delay, as: Tag = "div", style,
}: {
  children: React.ReactNode;
  className?: string;
  variant?: Variant;
  i?: number;
  /** @deprecated use `i` (stagger index); kept for older call sites (ms / 80). */
  delay?: number;
  as?: "div" | "li" | "article" | "section" | "figure" | "span";
  style?: React.CSSProperties;
}) {
  const index = delay != null ? Math.round(delay / 80) : i;
  return (
    <Tag data-anim={variant} className={className} style={{ ...style, ["--i" as string]: index }}>
      {children}
    </Tag>
  );
}
