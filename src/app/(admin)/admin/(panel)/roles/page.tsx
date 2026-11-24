import { RolesManager } from "@/components/admin/RolesManager";
import { requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function RolesPage() {
  await requirePage("roles.manage");
  const sb = await createSessionClient();
  const [{ data: roles }, { data: perms }, { data: rp }] = await Promise.all([
    sb.from("roles").select("key,name,is_system").order("position"),
    sb.from("permissions").select("*").order("position"),
    sb.from("role_permissions").select("*"),
  ]);
  const matrix: Record<string, string[]> = {};
  for (const r of rp ?? []) (matrix[r.role_key] ??= []).push(r.permission_key);
  return <RolesManager roles={(roles ?? []) as never} permissions={(perms ?? []) as never} matrix={matrix} />;
}
