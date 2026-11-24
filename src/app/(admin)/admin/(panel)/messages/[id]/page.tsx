import Link from "next/link";
import { notFound } from "next/navigation";
import { InboxDetail } from "@/components/admin/InboxDetail";
import { getAdminDict } from "@/lib/admin-context";
import { can, requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function MessageDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requirePage("inbox.view");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [sb, d] = await Promise.all([createSessionClient(), getAdminDict()]);
  const [{ data: item }, { data: notes }] = await Promise.all([
    sb.from("contact_messages").select("*").eq("id", id).maybeSingle(),
    sb.from("request_notes").select("*").eq("contact_message_id", id).order("created_at"),
  ]);
  if (!item) notFound();
  if (item.status === "new" && can(staff, "inbox.manage")) {
    await sb.from("contact_messages").update({ status: "read" }).eq("id", id);
    item.status = "read";
  }
  return (
    <div>
      <Link href="/admin/messages" className="mb-4 inline-block text-sm text-muted hover:text-primary">← {d.messages}</Link>
      <InboxDetail kind="message" item={item} notes={notes ?? []} attachments={[]} staff={[{ id: staff.id, email: staff.email, full_name: staff.full_name }]} />
    </div>
  );
}
