/**
 * Extracts a clean absolute origin from an env value. Tolerates stray text such as
 * "1. https://example.com" or a missing protocol ("example.com"), which otherwise make
 * `new URL()` throw and break every page's metadata, robots.txt and the sitemap.
 */
export function normalizeSiteUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const found = raw.match(/https?:\/\/[^\s"'<>]+/i)?.[0] ?? (/^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(raw.trim()) ? `https://${raw.trim()}` : null);
  if (!found) return null;
  try {
    const u = new URL(found);
    return u.origin;
  } catch {
    return null;
  }
}

/** Public (browser-safe) configuration. Server secrets live in lib/server-env.ts. */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  siteUrl:
    normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeSiteUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    "http://localhost:3000",
  turnstileSiteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
};

export function isSupabaseConfigured() {
  return Boolean(publicEnv.supabaseUrl && publicEnv.supabaseAnonKey);
}
