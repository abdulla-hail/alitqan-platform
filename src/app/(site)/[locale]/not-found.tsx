import { NotFoundView } from "@/components/site/NotFoundView";
import { getLanguages, getSiteContext } from "@/services/site";

/** Localized 404: strings for every enabled language; the client view picks by URL. */
export default async function NotFound() {
  let strings: Record<string, { title: string; text: string; home: string }> = {};
  try {
    const langs = await getLanguages();
    const ctxs = await Promise.all(langs.map((l) => getSiteContext(l.code)));
    strings = Object.fromEntries(ctxs.map((c) => [c.locale, { title: c.t("error.404_title"), text: c.t("error.404_text"), home: c.t("error.go_home") }]));
  } catch {
    strings = { en: { title: "Page not found", text: "", home: "Home" } };
  }
  return <NotFoundView strings={strings} />;
}
