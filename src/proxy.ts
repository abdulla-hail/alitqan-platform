import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_PATTERN } from "@/lib/i18n";
import { isSupabaseConfigured, publicEnv } from "@/lib/env";

const PUBLIC_ADMIN_PATHS = ["/admin/login", "/admin/setup", "/admin/forgot-password", "/admin/reset-password"];

async function defaultLocale(): Promise<string> {
  if (!isSupabaseConfigured()) return "ar";
  try {
    const res = await fetch(`${publicEnv.supabaseUrl}/rest/v1/languages?select=code&is_default=eq.true&is_enabled=eq.true&limit=1`, {
      headers: { apikey: publicEnv.supabaseAnonKey, Authorization: `Bearer ${publicEnv.supabaseAnonKey}` },
      signal: AbortSignal.timeout(2500),
    });
    const rows = (await res.json()) as { code: string }[];
    return rows[0]?.code ?? "ar";
  } catch {
    return "ar";
  }
}

/** Refreshes the Supabase session cookie (admin area) and does an optimistic auth redirect. */
async function adminProxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return response;
  const supabase = createServerClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (!data.user && path.startsWith("/admin") && !PUBLIC_ADMIN_PATHS.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = path === "/admin" ? "" : `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/auth")) return adminProxy(request);
  if (pathname.startsWith("/api")) return NextResponse.next();

  const first = pathname.split("/")[1] ?? "";
  // The CMS is not localized by URL: /ar/admin/setup → /admin/setup
  const adminUnderLocale = pathname.match(/^\/[^/]+(\/admin(?:\/.*)?)$/);
  if (LOCALE_PATTERN.test(first) && adminUnderLocale) {
    const url = request.nextUrl.clone();
    url.pathname = adminUnderLocale[1];
    return NextResponse.redirect(url);
  }
  if (LOCALE_PATTERN.test(first)) return NextResponse.next();

  // No locale prefix → the visitor's saved choice, else the default language set in the CMS.
  const saved = request.cookies.get("locale")?.value;
  const locale = saved && LOCALE_PATTERN.test(saved) ? saved : await defaultLocale();
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
