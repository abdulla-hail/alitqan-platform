import { notFound } from "next/navigation";
import { ResourceForm } from "@/components/admin/ResourceForm";
import { loadRecord, loadRelations } from "@/features/admin/loaders";
import { RESOURCE_MAP } from "@/features/admin/resources";
import { getAdminLocale } from "@/lib/admin-context";
import { requirePage } from "@/lib/auth";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function ResourceEdit({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  const def = RESOURCE_MAP[resource];
  if (!def) notFound();
  await requirePage(def.permission);
  const locale = await getAdminLocale();
  const isNew = id === "new";
  if (!isNew && !UUID.test(id)) notFound();
  const record = isNew ? null : await loadRecord(def, id);
  if (!isNew && !record) notFound();
  const { relations, joined } = await loadRelations(def, isNew ? null : id, locale);
  const merged = record ? { ...record, ...joined } : null;
  return <ResourceForm key={id} resourceKey={resource} record={merged} relations={relations} />;
}
