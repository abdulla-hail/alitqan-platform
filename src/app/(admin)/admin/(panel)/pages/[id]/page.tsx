import { notFound } from "next/navigation";
import { PageBuilder } from "@/components/admin/PageBuilder";
import { publicUrl, RESOURCE_MAP } from "@/features/admin/resources";
import { getAdminLocale } from "@/lib/admin-context";
import { requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function PageBuilderRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePage("pages.manage");
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const sb = await createSessionClient();
  const [{ data: page }, { data: sections }, { data: def }] = await Promise.all([
    sb.from("pages").select("id,slug,title,status,kind").eq("id", id).maybeSingle(),
    sb.from("page_sections").select("*").eq("page_id", id).order("position"),
    sb.from("languages").select("code").eq("is_default", true).maybeSingle(),
  ]);
  if (!page) notFound();
  await getAdminLocale();
  const href = publicUrl(RESOURCE_MAP.pages, page, (def?.code as string) ?? "ar") ?? "/";
  return <PageBuilder page={page as never} sections={(sections ?? []) as never} publicHref={href} />;
}
