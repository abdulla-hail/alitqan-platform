import { notFound } from "next/navigation";
import { ResourceList } from "@/components/admin/ResourceList";
import { RESOURCE_MAP } from "@/features/admin/resources";
import { requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function ResourceIndex({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const def = RESOURCE_MAP[resource];
  if (!def) notFound();
  await requirePage(def.permission);
  const sb = await createSessionClient();
  const hasSlug = def.fields.some((f) => f.name === "slug");
  const cols = ["id", hasSlug ? "slug" : null, def.titleField, def.subtitleField, def.imageField, def.status ? "status" : null, def.visibility ? "is_visible" : null, def.sortable ? "position" : null]
    .filter(Boolean)
    .join(",");
  const extra = ["services", "projects", "blog_posts"].includes(def.key) ? ",is_featured,is_demo" : ["team_members", "testimonials", "clients", "service_categories", "project_categories", "blog_categories", "blog_tags"].includes(def.key) ? ",is_demo" : def.key === "pages" ? ",kind" : "";
  const { data } = await sb.from(def.table).select(cols + extra).order(def.orderBy.column, { ascending: def.orderBy.ascending, nullsFirst: false }).limit(1000);
  return <ResourceList resourceKey={resource} rows={(data ?? []) as unknown as (Record<string, unknown> & { id: string })[]} />;
}
