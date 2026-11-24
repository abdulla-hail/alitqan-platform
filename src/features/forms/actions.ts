"use server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/clients";
import { notifyAdmins } from "@/lib/email";
import { ATTACHMENT_RULES, issueFormToken, rateLimit, verifyFormToken, verifyTurnstile, visitorInfo } from "@/lib/forms/security";
import { isSupabaseConfigured } from "@/lib/env";

export type FormResult = { ok: true; reference?: string } | { ok: false; error: "validation" | "rate" | "generic" | "file"; fields?: string[] };

const text = (max: number, min = 0) => z.string().trim().min(min).max(max);
const optional = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const email = z.string().trim().toLowerCase().max(200).email();
const phone = z.string().trim().max(40).regex(/^[+\d\s()-]*$/).optional().transform((v) => (v ? v : null));
const guard = { token: z.string().max(200), website: z.string().max(0).optional(), turnstile: z.string().max(4000).optional(), locale: z.string().max(10).optional() };

function fieldsOf(err: z.ZodError) {
  return [...new Set(err.issues.map((i) => String(i.path[0])))];
}

async function antiSpam(token: string, turnstile: string | undefined, bucket: string, max: number) {
  const v = await visitorInfo();
  if (!verifyFormToken(token)) return { ok: false as const, v };
  if (!(await verifyTurnstile(turnstile, v.ip))) return { ok: false as const, v };
  if (!(await rateLimit(`${bucket}:${v.ipHash}`, max, 600))) return { ok: false as const, v, rate: true };
  return { ok: true as const, v };
}

/** Fresh anti-bot token for a form (fetched on mount so cached pages never share one). */
export async function getFormToken() {
  return issueFormToken();
}

const contactSchema = z.object({ ...guard, name: text(120, 2), email, phone, subject: optional(200), message: text(5000, 5) });

export async function submitContact(input: unknown): Promise<FormResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "generic" };
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation", fields: fieldsOf(parsed.error) };
  const d = parsed.data;
  if (d.website) return { ok: true }; // honeypot filled: silently drop
  const spam = await antiSpam(d.token, d.turnstile, "contact", 5);
  if (!spam.ok) return { ok: false, error: spam.rate ? "rate" : "generic" };
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("contact_messages")
    .insert({ name: d.name, email: d.email, phone: d.phone, subject: d.subject, message: d.message, locale: d.locale ?? null, ip_hash: spam.v.ipHash, user_agent: spam.v.userAgent })
    .select("id")
    .single();
  if (error) {
    console.error("contact insert failed", error.message);
    return { ok: false, error: "generic" };
  }
  const mail = await notifyAdmins("contact_message", { name: d.name, email: d.email, phone: d.phone ?? "", subject: d.subject ?? "", message: d.message }, d.email);
  await sb.from("contact_messages").update({ notification_status: mail.status }).eq("id", data.id);
  return { ok: true };
}

const fileMeta = z.object({ name: z.string().trim().min(1).max(200), type: z.string().max(120), size: z.number().int().positive() });

/** Step 1 of attachments: validate metadata and issue short-lived signed upload URLs (private bucket). */
export async function prepareUploads(input: unknown): Promise<{ ok: true; uploads: { path: string; token: string }[] } | { ok: false; error: "file" | "generic" | "rate" }> {
  const parsed = z.object({ token: z.string(), files: z.array(fileMeta).max(ATTACHMENT_RULES.maxFiles) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "file" };
  if (!verifyFormToken(parsed.data.token, 0)) return { ok: false, error: "generic" };
  for (const f of parsed.data.files) {
    if (!ATTACHMENT_RULES.types[f.type] || f.size > ATTACHMENT_RULES.maxBytes) return { ok: false, error: "file" };
  }
  const v = await visitorInfo();
  if (!(await rateLimit(`upload:${v.ipHash}`, 20, 600))) return { ok: false, error: "rate" };
  const sb = createServiceClient();
  const batch = randomUUID();
  const uploads: { path: string; token: string }[] = [];
  for (const f of parsed.data.files) {
    const ext = ATTACHMENT_RULES.types[f.type];
    const base = f.name.replace(/\.[^.]+$/, "").normalize("NFKD").replace(/[^\w-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "file";
    const path = `pending/${batch}/${base}.${ext}`;
    const { data, error } = await sb.storage.from("request-attachments").createSignedUploadUrl(path);
    if (error || !data) return { ok: false, error: "generic" };
    uploads.push({ path, token: data.token });
  }
  return { ok: true, uploads };
}

const requestSchema = z.object({
  ...guard,
  kind: z.enum(["project", "quote"]),
  name: text(120, 2),
  email,
  phone,
  company: optional(160),
  service: z.string().max(120).optional(),
  description: text(8000, 10),
  budget: optional(80),
  timeline: optional(80),
  consent: z.literal(true),
  attachments: z.array(z.object({ path: z.string().regex(/^pending\/[0-9a-f-]{36}\/[\w-]+\.\w{2,5}$/), name: z.string().max(200) })).max(ATTACHMENT_RULES.maxFiles).default([]),
});

export async function submitRequest(input: unknown): Promise<FormResult> {
  if (!isSupabaseConfigured()) return { ok: false, error: "generic" };
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "validation", fields: fieldsOf(parsed.error) };
  const d = parsed.data;
  if (d.website) return { ok: true, reference: "—" };
  const spam = await antiSpam(d.token, d.turnstile, "request", 4);
  if (!spam.ok) return { ok: false, error: spam.rate ? "rate" : "generic" };
  const sb = createServiceClient();

  let serviceId: string | null = null;
  let serviceLabel: string | null = null;
  if (d.service) {
    const { data: svc } = await sb.from("services").select("id,title").eq("slug", d.service).maybeSingle();
    if (svc) {
      serviceId = svc.id;
      serviceLabel = svc.title?.[d.locale ?? "ar"] ?? svc.title?.en ?? d.service;
    } else serviceLabel = d.service.slice(0, 120);
  }

  // Verify every attachment really exists in storage and re-check its type/size server-side.
  const verified: { path: string; name: string; type: string; size: number }[] = [];
  for (const a of d.attachments) {
    const folder = a.path.split("/").slice(0, 2).join("/");
    const file = a.path.split("/")[2];
    const { data: listed } = await sb.storage.from("request-attachments").list(folder, { search: file });
    const obj = listed?.find((o) => o.name === file);
    const size = Number(obj?.metadata?.size ?? 0);
    const type = String(obj?.metadata?.mimetype ?? "");
    if (!obj || !ATTACHMENT_RULES.types[type] || size > ATTACHMENT_RULES.maxBytes) return { ok: false, error: "file" };
    verified.push({ path: a.path, name: a.name, type, size });
  }

  const { data: req, error } = await sb
    .from("project_requests")
    .insert({
      kind: d.kind, name: d.name, email: d.email, phone: d.phone, company: d.company, service_id: serviceId, service_label: serviceLabel,
      description: d.description, budget: d.budget, timeline: d.timeline, locale: d.locale ?? null, consent_at: new Date().toISOString(),
      ip_hash: spam.v.ipHash, user_agent: spam.v.userAgent,
    })
    .select("id,reference")
    .single();
  if (error || !req) {
    console.error("request insert failed", error?.message);
    return { ok: false, error: "generic" };
  }
  for (const f of verified) {
    const target = `${req.id}/${f.path.split("/")[2]}`;
    const moved = await sb.storage.from("request-attachments").move(f.path, target);
    await sb.from("request_attachments").insert({ request_id: req.id, storage_path: moved.error ? f.path : target, file_name: f.name, mime_type: f.type, size_bytes: f.size });
  }
  const mail = await notifyAdmins(d.kind === "quote" ? "quote_request" : "project_request", {
    reference: req.reference, name: d.name, email: d.email, phone: d.phone ?? "", company: d.company ?? "", service: serviceLabel ?? "",
    budget: d.budget ?? "", timeline: d.timeline ?? "", description: d.description,
  }, d.email);
  await sb.from("project_requests").update({ notification_status: mail.status }).eq("id", req.id);
  return { ok: true, reference: req.reference };
}
