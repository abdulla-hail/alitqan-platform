import { LanguagesManager } from "@/components/admin/LanguagesManager";
import { requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function LanguagesPage() {
  await requirePage("languages.manage");
  const sb = await createSessionClient();
  const [{ data: languages }, { data: translations }] = await Promise.all([
    sb.from("languages").select("*").order("position"),
    sb.from("translations").select("key,locale,value").limit(10000),
  ]);
  return <LanguagesManager languages={(languages ?? []) as never} translations={translations ?? []} />;
}
