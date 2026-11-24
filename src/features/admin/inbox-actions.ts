"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { guarded } from "@/lib/auth";
import { createSessionClient } from "@/lib/supabase/clients";

const REQ_STATUS = ["new", "reviewing", "contacted", "proposal_sent", "in_progress", "won", "lost", "archived"] as const;
const MSG_STATUS = ["new", "read", "replied", "archived"] as const;

export async function updateRequest(id: string, patch: { status?: string; priority?: string; followup_on?: string | null; assigned_to?: string | null }) {
  return guarded("inbox.manage", async () => {
    const p = z.object({
      status: z.enum(REQ_STATUS).optional(),
      priority: z.enum(["low", "normal", "high"]).optional(),
      followup_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      assigned_to: z.string().uuid().nullable().optional(),
    }).parse(patch);
    const sb = await createSessionClient();
    const { error } = await sb.from("project_requests").update(p).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
  });
}

export async function updateMessage(id: string, patch: { status?: string; followup_on?: string | null }) {
  return guarded("inbox.manage", async () => {
    const p = z.object({ status: z.enum(MSG_STATUS).optional(), followup_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional() }).parse(patch);
    const sb = await createSessionClient();
    const { error } = await sb.from("contact_messages").update(p).eq("id", id);
    if (error) throw new Error(error.message);
    revalidatePath("/admin", "layout");
  });
}

export async function addNote(target: { request?: string; message?: string }, body: string, followup?: string | null) {
  return guarded("inbox.manage", async (staff) => {
    const text = z.string().trim().min(1).max(4000).parse(body);
    const sb = await createSessionClient();
    const { data, error } = await sb
      .from("request_notes")
      .insert({ project_request_id: target.request ?? null, contact_message_id: target.message ?? null, body: text, followup_on: followup || null, author_id: staff.id })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    if (followup) {
      if (target.request) await sb.from("project_requests").update({ followup_on: followup }).eq("id", target.request);
      if (target.message) await sb.from("contact_messages").update({ followup_on: followup }).eq("id", target.message);
    }
    return data;
  });
}

export async function deleteNote(id: string) {
  return guarded("inbox.view", async () => {
    const sb = await createSessionClient();
    const { error, count } = await sb.from("request_notes").delete({ count: "exact" }).eq("id", id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("permission denied");
  });
}

export async function deleteInboxItem(kind: "request" | "message", id: string) {
  return guarded("inbox.delete", async () => {
    const sb = await createSessionClient();
    if (kind === "request") {
      const { data: files } = await sb.from("request_attachments").select("storage_path").eq("request_id", id);
      if (files?.length) await sb.storage.from("request-attachments").remove(files.map((f) => f.storage_path));
    }
    const { error, count } = await sb.from(kind === "request" ? "project_requests" : "contact_messages").delete({ count: "exact" }).eq("id", id);
    if (error) throw new Error(error.message);
    if (!count) throw new Error("permission denied");
    revalidatePath("/admin", "layout");
  });
}

/** Short-lived signed link to a private attachment (Storage RLS: inbox.view). */
export async function attachmentUrl(path: string) {
  return guarded("inbox.view", async () => {
    const sb = await createSessionClient();
    const { data, error } = await sb.storage.from("request-attachments").createSignedUrl(path, 120, { download: true });
    if (error || !data) throw new Error(error?.message ?? "not found");
    return data.signedUrl;
  });
}
