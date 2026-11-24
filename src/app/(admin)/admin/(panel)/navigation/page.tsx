import { NavigationManager } from "@/components/admin/NavigationManager";
import { requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function NavigationPage() {
  await requirePage("navigation.manage");
  const sb = await createSessionClient();
  const { data } = await sb.from("navigation_items").select("*").order("position");
  return <NavigationManager items={(data ?? []) as never} />;
}
