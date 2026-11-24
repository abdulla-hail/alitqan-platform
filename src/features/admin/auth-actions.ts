"use server";
import { timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServiceClient, createSessionClient } from "@/lib/supabase/clients";
import { serverEnv } from "@/lib/server-env";
import { publicEnv } from "@/lib/env";
import { rateLimit, visitorInfo } from "@/lib/forms/security";

export type AuthState = { error?: string; ok?: boolean; message?: string } | undefined;

const safeNext = (n: unknown) => (typeof n === "string" && /^\/admin(\/[\w\-/]*)?$/.test(n) ? n : "/admin");

export async function signIn(_: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(1).max(200) }).safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { error: "invalid_login" };
  const v = await visitorInfo();
  if (!(await rateLimit(`login:${v.ipHash}`, 10, 900))) return { error: "rate" };
  const sb = await createSessionClient();
  const { data, error } = await sb.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "invalid_login" };
  const { data: profile } = await sb.from("profiles").select("is_active").eq("id", data.user.id).maybeSingle();
  if (!profile?.is_active) {
    await sb.auth.signOut();
    return { error: "invalid_login" };
  }
  await sb.rpc("log_event", { p_action: "sign_in", p_entity: "auth", p_summary: parsed.data.email });
  await sb.from("profiles").update({ last_seen_at: new Date().toISOString() }).eq("id", data.user.id);
  redirect(safeNext(fd.get("next")));
}

export async function signOut() {
  const sb = await createSessionClient();
  await sb.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordReset(_: AuthState, fd: FormData): Promise<AuthState> {
  const email = z.string().trim().toLowerCase().email().max(200).safeParse(fd.get("email"));
  // Always the same answer: never reveal whether an account exists.
  if (!email.success) return { ok: true };
  const v = await visitorInfo();
  if (!(await rateLimit(`reset:${v.ipHash}`, 5, 3600))) return { ok: true };
  const sb = await createSessionClient();
  const origin = (await headers()).get("origin") ?? publicEnv.siteUrl;
  await sb.auth.resetPasswordForEmail(email.data, { redirectTo: `${origin}/auth/callback?next=/admin/reset-password` });
  return { ok: true };
}

export async function updatePassword(_: AuthState, fd: FormData): Promise<AuthState> {
  const pw = String(fd.get("password") ?? "");
  if (pw.length < 10 || pw !== String(fd.get("confirm") ?? "")) return { error: "weak_password" };
  const sb = await createSessionClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) return { error: "auth" };
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) return { error: error.message.includes("same") ? "same_password" : "weak_password" };
  return { ok: true };
}

export async function setAdminLocale(locale: string) {
  (await cookies()).set("admin_locale", locale === "en" ? "en" : "ar", { path: "/admin", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", httpOnly: true });
}

/**
 * One-time owner setup. Works only when: SETUP_TOKEN is configured, the supplied token
 * matches (constant-time), and no active super admin exists (enforced again in SQL).
 */
export async function createOwner(_: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = z
    .object({ token: z.string().min(1).max(200), email: z.string().trim().toLowerCase().email().max(200), name: z.string().trim().min(2).max(120), password: z.string().min(12).max(200) })
    .safeParse({ token: fd.get("token"), email: fd.get("email"), name: fd.get("name"), password: fd.get("password") });
  if (!parsed.success) return { error: "invalid" };
  if (!serverEnv.setupToken || !serverEnv.serviceRoleKey) return { error: "not_configured" };
  const v = await visitorInfo();
  if (!(await rateLimit(`setup:${v.ipHash}`, 5, 3600))) return { error: "rate" };
  const a = Buffer.from(parsed.data.token);
  const b = Buffer.from(serverEnv.setupToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { error: "bad_token" };
  const admin = createServiceClient();
  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role_key", "super_admin").eq("is_active", true);
  if (count) return { error: "exists" };
  const { data: created, error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.name },
  });
  if (error || !created.user) return { error: error?.message?.includes("already") ? "email_taken" : "generic" };
  const { error: bootErr } = await admin.rpc("bootstrap_owner", { target: created.user.id });
  if (bootErr) {
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: "exists" };
  }
  return { ok: true };
}
