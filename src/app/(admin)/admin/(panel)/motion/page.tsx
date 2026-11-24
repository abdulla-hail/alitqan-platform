import { MotionManager } from "@/components/admin/MotionManager";
import { requirePage } from "@/lib/auth";
import { sanitizeMotion } from "@/lib/motion";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function MotionPage() {
  await requirePage("settings.manage");
  const sb = await createSessionClient();
  const { data } = await sb.from("site_settings").select("value").eq("key", "motion").maybeSingle();
  return <MotionManager initial={sanitizeMotion(data?.value)} />;
}
