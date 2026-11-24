import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { adminDict, type AdminLocale } from "@/lib/admin-i18n";
import { createSessionClient } from "@/lib/supabase/clients";
import type { Language } from "@/types/content";

export const getAdminLocale = cache(async (): Promise<AdminLocale> => {
  const c = (await cookies()).get("admin_locale")?.value;
  return c === "en" ? "en" : "ar";
});

export const getAdminDict = cache(async () => adminDict(await getAdminLocale()));

/** All languages (enabled or not) for content editors: every translatable field gets a tab per language. */
export const getContentLanguages = cache(async (): Promise<Language[]> => {
  const sb = await createSessionClient();
  const { data } = await sb.from("languages").select("*").order("position");
  return (data ?? []) as Language[];
});
