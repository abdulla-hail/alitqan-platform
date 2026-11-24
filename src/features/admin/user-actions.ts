"use server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { guarded } from "@/lib/auth";
import { createServiceClient, createSessionClient } from "@/lib/supabase/clients";
import { publicEnv } from "@/lib/env";

/**
 * User administration. Role/activation changes go through the SESSION client so the
 * database guard (tg_profiles_guard + RLS) decides; the service client is used only
 * for Auth admin operations (invite/create/ban/delete) after the permission check.
 */
async function assertCanTouch(targetId: string, actorId: string, actorRole: string) {
  if (targetId === actorId) throw new Error("you cannot change your own role or activation");
  const sb = await createSessionClient();
  const { data } = await sb.from("profiles").select("role_key").eq("id", targetId).single();
  if (!data) throw new Error("not found");
  if (data.role_key === "super_admin" && actorRole !== "super_admin") throw new Error("only a super admin can grant or change the super admin role");
}

const roleKey = z.string().regex(/^[a-z][a-z0-9_]{1,40}$/);

export async function inviteUser(input: { email: string; full_name: string; role_key: string; password?: string }) {
  return guarded("users.manage", async (staff) => {
    const p = z.object({ email: z.string().trim().toLowerCase().email().max(200), full_name: z.string().trim().min(2).max(120), role_key: roleKey, password: z.string().min(10).max(200).optional().or(z.literal("")) }).parse(input);
    if (p.role_key === "super_admin" && staff.role_key !== "super_admin") throw new Error("only a super admin can grant or change the super admin role");
    const admin = createServiceClient();
    const { data: role } = await admin.from("roles").select("key").eq("key", p.role_key).maybeSingle();
    if (!role) throw new Error("invalid input: role");
    // super_admin is never granted through app_metadata (the DB trigger ignores it); it is set below by an existing super admin.
    const meta = { role: p.role_key === "super_admin" ? "admin" : p.role_key, active: true };
    let userId: string;
    if (p.password) {
      const { data, error } = await admin.auth.admin.createUser({ email: p.email, password: p.password, email_confirm: true, user_metadata: { full_name: p.full_name }, app_metadata: meta });
      if (error || !data.user) throw new Error(error?.message.includes("already") ? "duplicate key" : (error?.message ?? "error"));
      userId = data.user.id;
    } else {
      const origin = (await headers()).get("origin") ?? publicEnv.siteUrl;
      const { data, error } = await admin.auth.admin.inviteUserByEmail(p.email, { data: { full_name: p.full_name }, redirectTo: `${origin}/auth/callback?next=/admin/reset-password` });
      if (error || !data.user) throw new Error(error?.message.includes("already") ? "duplicate key" : (error?.message ?? "error"));
      userId = data.user.id;
      await admin.auth.admin.updateUserById(userId, { app_metadata: meta });
      await admin.from("profiles").update({ role_key: meta.role, is_active: true, full_name: p.full_name }).eq("id", userId);
    }
    if (p.role_key === "super_admin") {
      const sb = await createSessionClient();
      const { error } = await sb.from("profiles").update({ role_key: "super_admin" }).eq("id", userId);
      if (error) throw new Error(error.message);
    }
    revalidatePath("/admin/users");
  });
}

export async function updateUser(id: string, patch: { role_key?: string; is_active?: boolean; full_name?: string }) {
  return guarded("users.manage", async (staff) => {
    const p = z.object({ role_key: roleKey.optional(), is_active: z.boolean().optional(), full_name: z.string().trim().min(1).max(120).optional() }).parse(patch);
    if (p.role_key !== undefined || p.is_active !== undefined) await assertCanTouch(id, staff.id, staff.role_key);
    const sb = await createSessionClient();
    const { error, count } = await sb.from("profiles").update(p, { count: "exact" }).eq("id", id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("permission denied");
    if (p.is_active !== undefined) {
      // Block/unblock at the Auth level too, so an inactive account cannot obtain sessions.
      await createServiceClient().auth.admin.updateUserById(id, { ban_duration: p.is_active ? "none" : "876000h" });
    }
    revalidatePath("/admin/users");
  });
}

export async function sendResetLink(id: string) {
  return guarded("users.manage", async () => {
    const admin = createServiceClient();
    const { data } = await admin.auth.admin.getUserById(id);
    if (!data.user?.email) throw new Error("not found");
    const origin = (await headers()).get("origin") ?? publicEnv.siteUrl;
    const sb = await createSessionClient();
    const { error } = await sb.auth.resetPasswordForEmail(data.user.email, { redirectTo: `${origin}/auth/callback?next=/admin/reset-password` });
    if (error) throw new Error(error.message);
  });
}

export async function deleteUser(id: string) {
  return guarded("users.manage", async (staff) => {
    await assertCanTouch(id, staff.id, staff.role_key);
    const sb = await createSessionClient();
    const { error, count } = await sb.from("profiles").delete({ count: "exact" }).eq("id", id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("permission denied");
    await createServiceClient().auth.admin.deleteUser(id);
    revalidatePath("/admin/users");
  });
}

/* ------------------------------------------------------------------ roles */
export async function saveRole(input: { key: string; name: Record<string, string>; description?: Record<string, string>; permissions: string[]; is_new?: boolean }) {
  return guarded("roles.manage", async () => {
    const key = roleKey.parse(input.key);
    if (key === "super_admin") throw new Error("invalid input: super_admin is fixed");
    const sb = await createSessionClient();
    const name = Object.fromEntries(Object.entries(input.name ?? {}).map(([k, v]) => [k.slice(0, 10), String(v).slice(0, 60)]));
    if (input.is_new) {
      const { error } = await sb.from("roles").insert({ key, name, description: input.description ?? {}, is_system: false, position: 10 });
      if (error) throw new Error(error.message);
    } else {
      const { data: r } = await sb.from("roles").select("is_system").eq("key", key).single();
      if (r && !r.is_system) await sb.from("roles").update({ name }).eq("key", key);
    }
    const { data: all } = await sb.from("permissions").select("key");
    const valid = new Set((all ?? []).map((p) => p.key));
    const wanted = [...new Set(input.permissions.filter((p) => valid.has(p)))];
    const { error: delErr } = await sb.from("role_permissions").delete().eq("role_key", key);
    if (delErr) throw new Error(delErr.message);
    if (wanted.length) {
      const { error } = await sb.from("role_permissions").insert(wanted.map((p) => ({ role_key: key, permission_key: p })));
      if (error) throw new Error(error.message);
    }
    revalidatePath("/admin", "layout");
  });
}

export async function deleteRole(key: string) {
  return guarded("roles.manage", async () => {
    const sb = await createSessionClient();
    const { count } = await sb.from("profiles").select("id", { count: "exact", head: true }).eq("role_key", key);
    if (count) throw new Error("invalid input: role in use");
    const { error, count: deleted } = await sb.from("roles").delete({ count: "exact" }).eq("key", key);
    if (error) throw new Error(error.message);
    if (!deleted) throw new Error("permission denied");
  });
}

/* ------------------------------------------------------------------ own account */
export async function updateOwnProfile(input: { full_name: string }) {
  return guarded(undefined, async (staff) => {
    const sb = await createSessionClient();
    const { error } = await sb.from("profiles").update({ full_name: z.string().trim().min(1).max(120).parse(input.full_name) }).eq("id", staff.id);
    if (error) throw new Error(error.message);
  });
}
