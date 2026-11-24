import { RenderSections } from "@/components/sections/Sections";
import { RequestForm } from "@/components/forms/RequestForm";
import { RequestServicePrefill } from "@/components/forms/RequestServicePrefill";
import { cmsPageMetadata, formStrings, type LocaleParams } from "@/features/site/page-helpers";
import { pick } from "@/lib/i18n";
import { getPage, getServiceCategories, getServices } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams) {
  const { locale } = await params;
  return cmsPageMetadata(locale, "request", "request");
}

export default async function RequestPage({ params }: LocaleParams) {
  const { locale } = await params;
  const [ctx, page, services, categories] = await Promise.all([getSiteContext(locale), getPage("request"), getServices(), getServiceCategories()]);
  const L = (v: Parameters<typeof pick>[0]) => pick(v, locale, ctx.defaultLocale);
  const forms = ctx.settings.forms ?? {};
  const strings = formStrings(ctx.t);
  const sections = page?.sections ?? [];
  return (
    <>
      <RenderSections sections={sections.filter((s) => s.type === "page_header")} ctx={ctx} />
      <section className="section">
        <div className="container-x max-w-4xl">
          <RequestServicePrefill>
            <RequestForm
              t={strings}
              locale={locale}
              privacyHref={`/${locale}/privacy`}
              services={services.map((s) => ({ value: s.slug, label: L(s.title), group: L(categories.find((c) => c.id === s.category_id)?.name) || "—" }))}
              budgets={(forms.budgets ?? []).map((b: Record<string, string>) => L(b))}
              timelines={(forms.timelines ?? []).map((b: Record<string, string>) => L(b))}
            />
          </RequestServicePrefill>
        </div>
      </section>
      <RenderSections sections={sections.filter((s) => s.type !== "page_header")} ctx={ctx} />
    </>
  );
}
