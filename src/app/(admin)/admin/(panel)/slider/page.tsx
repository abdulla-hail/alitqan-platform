import { SliderManager, type SliderProject } from "@/components/admin/SliderManager";
import { requirePage } from "@/lib/auth";
import { sanitizeMotion } from "@/lib/motion";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function SliderPage() {
  await requirePage("projects.manage");
  const sb = await createSessionClient();
  const [{ data }, { data: motion }] = await Promise.all([
    sb.from("projects")
      .select("id,slug,title,excerpt,cover_url,thumbnail_url,mobile_image_url,cover_alt,status,show_on_home,home_position,link_target,slider_link,category:project_categories(name)")
      .neq("status", "archived")
      .order("position"),
    sb.from("site_settings").select("value").eq("key", "motion").maybeSingle(),
  ]);
  const projects = ((data ?? []) as unknown as (SliderProject & { category: { name: Record<string, string> } | null })[]).map((p) => ({ ...p, category: p.category?.name ?? null }));
  const m = sanitizeMotion(motion?.value);
  return <SliderManager projects={projects} autoplay={m.enabled && m.slider_autoplay} interval={m.slider_interval_ms} />;
}
