import { TypographyManager } from "@/components/admin/TypographyManager";
import { requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function TypographyPage() {
  await requirePage("brand.manage");
  const sb = await createSessionClient();
  const [{ data: brand }, { data: custom }] = await Promise.all([
    sb.from("brand_settings").select("fonts").eq("id", 1).maybeSingle(),
    sb.from("custom_fonts").select("id,family,script,files,is_active").order("family"),
  ]);
  return <TypographyManager fonts={brand?.fonts ?? {}} custom={(custom ?? []) as never} />;
}
