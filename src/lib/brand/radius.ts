/** Global Border Radius setting (stored in brand_settings.radius as "<n>px"). */
export const RADIUS_DEFAULT = 14;
export const RADIUS_MIN = 0;
export const RADIUS_MAX = 40;

/** Parse a stored radius ("14px", "0.5rem", 12) into whole px within the allowed range. */
export function radiusPx(v: unknown): number {
  const m = /^(\d+(?:\.\d+)?)(px|rem)?$/.exec(String(v ?? "").trim());
  if (!m) return RADIUS_DEFAULT;
  const n = Number(m[1]) * (m[2] === "rem" ? 16 : 1);
  return Math.round(Math.min(RADIUS_MAX, Math.max(RADIUS_MIN, n)));
}

/** Normalised CSS value written to the database and to --global-border-radius. */
export const radiusValue = (v: unknown) => `${radiusPx(v)}px`;
