import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/clients";

export interface Staff {
  id: string;
  email: string;
  full_name: string | null;
  role_key: string;
  is_active: boolean;
  permissions: Set<string>;
}

/** Signed-in, ACTIVE staff member with resolved permissions (from the DB, not the client). */
export const getStaff = cache(async (): Promise<Staff | null> => {
  const sb = await createSessionClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const [{ data: profile }, { data: perms }] = await Promise.all([
    sb.from("profiles").select("id,email,full_name,role_key,is_active").eq("id", auth.user.id).maybeSingle(),
    sb.rpc("my_permissions"),
  ]);
  if (!profile || !profile.is_active) return null;
  return { ...profile, permissions: new Set(((perms as unknown[] | null) ?? []).map((p) => (typeof p === "string" ? p : String(Object.values(p as object)[0])))) };
});

export function can(staff: Staff | null, perm: string) {
  return Boolean(staff && (staff.role_key === "super_admin" || staff.permissions.has(perm)));
}

/** For admin pages: redirect to login / dashboard when not allowed. */
export async function requirePage(perm?: string) {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  if (perm && !can(staff, perm)) redirect("/admin?denied=1");
  return staff;
}

export class PermissionError extends Error {
  constructor(public perm: string) {
    super(`Missing permission: ${perm}`);
  }
}

/** For server actions: throws unless allowed. RLS enforces the same rule again in the DB. */
export async function requireAction(perm?: string) {
  const staff = await getStaff();
  if (!staff) throw new PermissionError("auth");
  if (perm && !can(staff, perm)) throw new PermissionError(perm);
  return staff;
}

export type ActionResult<T = unknown> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

/** Wraps a server action body: permission errors and DB errors become safe messages. */
export async function guarded<T>(perm: string | undefined, fn: (staff: Staff) => Promise<T>): Promise<ActionResult<T>> {
  try {
    const staff = await requireAction(perm);
    const data = await fn(staff);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof PermissionError) return { ok: false, error: e.perm === "auth" ? "auth" : "forbidden" };
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[admin action]", msg);
    if (/duplicate key|unique/i.test(msg)) return { ok: false, error: "duplicate" };
    if (/row-level security|permission denied/i.test(msg)) return { ok: false, error: "forbidden" };
    if (/check constraint|invalid input|violates/i.test(msg)) return { ok: false, error: "invalid" };
    if (/super admin|own role|last active/i.test(msg)) return { ok: false, error: msg };
    return { ok: false, error: "generic" };
  }
}
