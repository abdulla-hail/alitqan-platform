import Link from "next/link";
import { notFound } from "next/navigation";
import { InboxDetail } from "@/components/admin/InboxDetail";
import { getAdminDict } from "@/lib/admin-context";
import { can, requirePage } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requirePage("inbox.view");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [sb, d] = await Promise.all([createSessionClient(), getAdminDict()]);
  const [{ data: item }, { data: notes }, { data: files }] = await Promise.all([
    sb.from("project_requests").select("*").eq("id", id).maybeSingle(),
    sb.from("request_notes").select("*").eq("project_request_id", id).order("created_at"),
    sb.from("request_attachments").select("*").eq("request_id", id),
  ]);
  if (!item) notFound();
  // Opening a new request marks it as being reviewed
  if (item.status === "new" && can(staff, "inbox.manage")) {
    await sb.from("project_requests").update({ status: "reviewing" }).eq("id", id);
    item.status = "reviewing";
  }
  const { data: people } = can(staff, "users.manage")
    ? await sb.from("profiles").select("id,email,full_name").eq("is_active", true)
    : { data: [{ id: staff.id, email: staff.email, full_name: staff.full_name }] };
  return (
    <div>
      <Link href="/admin/requests" className="mb-4 inline-block text-sm text-muted hover:text-primary">← {d.requests}</Link>
      <InboxDetail kind="request" item={item} notes={notes ?? []} attachments={files ?? []} staff={people ?? []} />
    </div>
  );
}
