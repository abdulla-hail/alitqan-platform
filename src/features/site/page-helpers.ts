import "server-only";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getPage } from "@/services/content";
import { getSiteContext } from "@/services/site";

/** Metadata for a CMS page record (title, summary, per-language SEO overrides). */
export async function cmsPageMetadata(locale: string, slug: string, path: string): Promise<Metadata> {
  try {
    const [ctx, page] = await Promise.all([getSiteContext(locale), getPage(slug)]);
    if (!page) return buildMetadata(ctx, { path, noindex: true });
    return buildMetadata(ctx, { path, title: slug === "home" ? undefined : page.title, description: page.summary, seo: page.seo });
  } catch {
    return {};
  }
}

export type LocaleParams = { params: Promise<{ locale: string }> };
export type SlugParams = { params: Promise<{ locale: string; slug: string }> };

/** UI strings passed to client-side forms (always complete, with fallbacks). */
export const FORM_KEYS = [
  "form.name", "form.email", "form.phone", "form.company", "form.subject", "form.message", "form.kind", "form.kind_project", "form.kind_quote",
  "form.service", "form.service_other", "form.description", "form.description_hint", "form.budget", "form.timeline", "form.attachments",
  "form.attachments_hint", "form.consent", "form.privacy_link", "form.select", "form.submit", "form.submit_request", "form.sending",
  "form.success_title", "form.success_text", "form.reference", "form.message_sent", "form.error_generic", "form.error_rate",
  "form.error_validation", "form.error_file", "form.required", "form.invalid_email",
];
export function formStrings(t: (k: string) => string) {
  return Object.fromEntries(FORM_KEYS.map((k) => [k, t(k)]));
}
