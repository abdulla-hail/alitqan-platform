/**
 * Motion & Interaction settings (site_settings key "motion"). Shared by the server
 * (sanitising, <html> attributes) and the client (slider, counters).
 * Every value is clamped to a safe range: nothing here can hide content or block
 * navigation — reveals always end visible and reduced-motion users always get the calm path.
 */
export type MotionLevel = "off" | "calm" | "balanced" | "rich";
export interface MotionSettings {
  enabled: boolean;
  level: Exclude<MotionLevel, "off">;
  duration_ms: number;
  stagger_ms: number;
  hover: boolean;
  reveal: boolean;
  parallax: boolean;
  page_transitions: boolean;
  slider_autoplay: boolean;
  slider_interval_ms: number;
  mobile: "full" | "reduced";
}

export const MOTION_DEFAULTS: MotionSettings = {
  enabled: true,
  level: "balanced",
  duration_ms: 600,
  stagger_ms: 90,
  hover: true,
  reveal: true,
  parallax: true,
  page_transitions: true,
  slider_autoplay: true,
  slider_interval_ms: 6000,
  mobile: "reduced",
};

const clamp = (v: unknown, min: number, max: number, fb: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fb;
};
const bool = (v: unknown, fb: boolean) => (typeof v === "boolean" ? v : fb);

export function sanitizeMotion(input: unknown): MotionSettings {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const d = MOTION_DEFAULTS;
  return {
    enabled: bool(o.enabled, d.enabled),
    level: o.level === "calm" || o.level === "rich" || o.level === "balanced" ? o.level : d.level,
    duration_ms: clamp(o.duration_ms, 200, 1200, d.duration_ms),
    stagger_ms: clamp(o.stagger_ms, 0, 250, d.stagger_ms),
    hover: bool(o.hover, d.hover),
    reveal: bool(o.reveal, d.reveal),
    parallax: bool(o.parallax, d.parallax),
    page_transitions: bool(o.page_transitions, d.page_transitions),
    slider_autoplay: bool(o.slider_autoplay, d.slider_autoplay),
    slider_interval_ms: clamp(o.slider_interval_ms, 3000, 15000, d.slider_interval_ms),
    mobile: o.mobile === "full" ? "full" : "reduced",
  };
}

/** Attributes for <html>: CSS reads them, so motion is configured without client JS. */
export function motionHtmlAttrs(input: unknown) {
  const m = sanitizeMotion(input);
  const level: MotionLevel = m.enabled ? m.level : "off";
  const scale = level === "calm" ? 0.7 : level === "rich" ? 1.15 : 1;
  const distance = level === "calm" ? 8 : level === "rich" ? 28 : 18;
  return {
    "data-motion": level,
    "data-reveal": m.enabled && m.reveal ? "on" : "off",
    "data-hover": m.enabled && m.hover ? "on" : "off",
    "data-parallax": m.enabled && m.parallax && level !== "calm" ? "on" : "off",
    "data-page-transitions": m.enabled && m.page_transitions ? "on" : "off",
    "data-mobile-motion": m.mobile,
    style: {
      "--motion-dur": `${Math.round(m.duration_ms * scale)}ms`,
      "--motion-stagger": `${m.stagger_ms}ms`,
      "--motion-distance": `${distance}px`,
    } as React.CSSProperties,
  };
}
