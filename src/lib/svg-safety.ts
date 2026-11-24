/**
 * Strict SVG sanitiser for uploaded logos/icons.
 *
 * Uploaded SVGs are only ever displayed through <img> (where scripts never run), but the
 * file itself is publicly reachable, so anything executable is refused before upload and
 * re-checked on the server when a logo URL is saved.
 *
 * Strategy: strip harmless noise (comments, XML declarations, editor metadata), then
 * REJECT — rather than try to repair — anything that can execute or load external content.
 */

export type SvgCheck = { ok: true; svg: string } | { ok: false; reason: string };

const MAX_BYTES = 512 * 1024;

const FORBIDDEN: [RegExp, string][] = [
  [/<!DOCTYPE|<!ENTITY/i, "doctype/entities"],
  [/<\s*script\b/i, "script element"],
  [/<\s*(foreignObject|iframe|embed|object|audio|video|canvas|handler|listener|set|animate\w*)\b/i, "active element"],
  [/\son[a-z]+\s*=/i, "event handler attribute"],
  [/(?:java|vb)script\s*:/i, "script URL"],
  [/data\s*:\s*(?!image\/(?:png|jpe?g|webp|gif);base64,)/i, "data URL"],
  [/(?:xlink:)?href\s*=\s*["']\s*(?!#)/i, "external reference"],
  [/@import|url\(\s*["']?\s*(?!#)/i, "external CSS reference"],
  [/<\?xml-stylesheet/i, "stylesheet processing instruction"],
];

export function sanitizeSvg(input: string): SvgCheck {
  if (typeof input !== "string" || !input.trim()) return { ok: false, reason: "empty file" };
  if (input.length > MAX_BYTES) return { ok: false, reason: "file too large" };
  const svg = input
    .replace(/^﻿/, "")
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, "")
    .replace(/<sodipodi:namedview[\s\S]*?(?:\/>|<\/sodipodi:namedview>)/gi, "")
    .trim();
  if (!/^<svg[\s>]/i.test(svg) || !/<\/svg>\s*$/i.test(svg)) return { ok: false, reason: "not an SVG document" };
  // decode numeric entities so encoded payloads (e.g. &#106;avascript:) are caught too
  const decoded = svg.replace(/&#x([0-9a-f]+);?/gi, (_, h) => String.fromCharCode(parseInt(h, 16))).replace(/&#(\d+);?/g, (_, d) => String.fromCharCode(Number(d)));
  for (const [re, reason] of FORBIDDEN) if (re.test(decoded)) return { ok: false, reason };
  return { ok: true, svg };
}

export const isSafeSvg = (s: string) => sanitizeSvg(s).ok;
