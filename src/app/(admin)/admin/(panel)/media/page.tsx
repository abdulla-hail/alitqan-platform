import { MediaLibrary } from "@/components/admin/MediaLibrary";
import type { MediaRow } from "@/features/admin/media-actions";
import { requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function MediaPage() {
  await requirePage("media.manage");
  const sb = await createSessionClient();
  const { data } = await sb.from("media").select("*").order("created_at", { ascending: false }).limit(1000);
  return <MediaLibrary initial={(data ?? []) as MediaRow[]} />;
}
