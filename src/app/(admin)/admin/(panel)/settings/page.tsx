import { SettingsManager } from "@/components/admin/SettingsManager";
import { requirePage } from "@/lib/auth";
import { isEmailConfigured } from "@/lib/email";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function SettingsPage() {
  await requirePage("settings.manage");
  const sb = await createSessionClient();
  const [{ data: rows }, { data: templates }] = await Promise.all([
    sb.from("site_settings").select("key,value"),
    sb.from("notification_templates").select("*").order("key"),
  ]);
  const settings = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]));
  return <SettingsManager settings={settings} templates={templates ?? []} emailConfigured={isEmailConfigured()} />;
}
