import "server-only";
import { serverEnv } from "@/lib/server-env";
import { createServiceClient } from "@/lib/supabase/clients";
import { publicEnv } from "@/lib/env";

export type EmailResult = { status: "sent" | "not_configured" | "disabled" | "no_recipients" | "failed"; detail?: string };

export function isEmailConfigured() {
  return Boolean(serverEnv.resendApiKey && serverEnv.emailFrom);
}

/** Sends through Resend's HTTP API. Returns an honest status; nothing is claimed as sent unless the API accepted it. */
export async function sendEmail(to: string[], subject: string, text: string, replyTo?: string): Promise<EmailResult> {
  if (!isEmailConfigured()) return { status: "not_configured" };
  if (!to.length) return { status: "no_recipients" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${serverEnv.resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: serverEnv.emailFrom, to, subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { status: "failed", detail: `${res.status} ${(await res.text()).slice(0, 200)}` };
    return { status: "sent" };
  } catch (e) {
    return { status: "failed", detail: e instanceof Error ? e.message : "unknown" };
  }
}

function render(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

/**
 * Admin notification from a CMS template (Settings → Notifications). Uses the
 * default language of the site for the email body.
 */
export async function notifyAdmins(templateKey: "project_request" | "quote_request" | "contact_message", vars: Record<string, string>, replyTo?: string): Promise<EmailResult> {
  if (!isEmailConfigured()) return { status: "not_configured" };
  const sb = createServiceClient();
  const [{ data: tpl }, { data: settings }, { data: lang }] = await Promise.all([
    sb.from("notification_templates").select("*").eq("key", templateKey).maybeSingle(),
    sb.from("site_settings").select("value").eq("key", "notifications").maybeSingle(),
    sb.from("languages").select("code").eq("is_default", true).maybeSingle(),
  ]);
  if (tpl && !tpl.is_enabled) return { status: "disabled" };
  const locale = lang?.code ?? "ar";
  const recipients = ((settings?.value?.recipients as string[]) ?? []).filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  const allVars = { ...vars, admin_url: `${publicEnv.siteUrl}/admin` };
  const subject = render(tpl?.subject?.[locale] ?? tpl?.subject?.en ?? `New ${templateKey}`, allVars);
  const body = render(tpl?.body?.[locale] ?? tpl?.body?.en ?? JSON.stringify(vars, null, 2), allVars);
  return sendEmail(recipients, subject, body, replyTo);
}
