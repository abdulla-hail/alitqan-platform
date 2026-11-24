import { UsersManager } from "@/components/admin/UsersManager";
import { requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function UsersPage() {
  const staff = await requirePage("users.manage");
  const sb = await createSessionClient();
  const [{ data: users }, { data: roles }] = await Promise.all([
    sb.from("profiles").select("id,email,full_name,role_key,is_active,last_seen_at,created_at").order("created_at"),
    sb.from("roles").select("key,name").order("position"),
  ]);
  return <UsersManager users={(users ?? []) as never} roles={(roles ?? []) as never} meId={staff.id} myRole={staff.role_key} />;
}
