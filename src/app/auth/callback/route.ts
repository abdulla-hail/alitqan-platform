import { NextResponse, type NextRequest } from "next/server";
import { createSessionClient } from "@/lib/supabase/clients";

/** Supabase email links (password recovery, invitations) land here and exchange the code for a session. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/admin";
  const safe = /^\/admin(\/[\w\-/]*)?$/.test(next) ? next : "/admin";
  if (code) {
    const sb = await createSessionClient();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(safe, url.origin));
  }
  return NextResponse.redirect(new URL("/admin/login?error=link", url.origin));
}
