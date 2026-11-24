import Link from "next/link";
import { RenderSections } from "@/components/sections/Sections";
import { ServiceCard } from "@/components/site/cards";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { cmsPageMetadata, type LocaleParams } from "@/features/site/page-helpers";
import { pick } from "@/lib/i18n";
import { getPage, getServiceCategories, getServices } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams) {
  const { locale } = await params;
  return cmsPageMetadata(locale, "services", "services");
}

export default async function ServicesPage({ params }: LocaleParams) {
  const { locale } = await params;
  const [ctx, page, categories, services] = await Promise.all([getSiteContext(locale), getPage("services"), getServiceCategories(), getServices()]);
  const sections = page?.sections ?? [];
  const header = sections.filter((s) => s.type === "page_header");
  const rest = sections.filter((s) => s.type !== "page_header");
  const grouped = categories
    .map((c) => ({ category: c, items: services.filter((s) => s.category_id === c.id) }))
    .filter((g) => g.items.length);
  const uncategorised = services.filter((s) => !s.category_id || !categories.some((c) => c.id === s.category_id));
  return (
    <>
      <RenderSections sections={header} ctx={ctx} />
      {grouped.length > 1 && (
        <nav className="sticky top-[72px] z-30 border-b border-line bg-bg/85 backdrop-blur" aria-label={ctx.t("common.all")}>
          <ul className="container-x flex gap-2 overflow-x-auto py-3">
            {grouped.map(({ category }) => (
              <li key={category.id}>
                <Link href={`#${category.slug}`} className="chip whitespace-nowrap hover:border-primary">
                  {pick(category.name, locale, ctx.defaultLocale)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {grouped.map(({ category, items }, gi) => (
        <section key={category.id} id={category.slug} className={`section scroll-mt-32 ${gi % 2 ? "bg-softer" : ""}`}>
          <div className="container-x">
            <div className="mb-10 flex items-start gap-4">
              <span className="icon-tile h-12 w-12"><Icon name={category.icon} className="h-6 w-6" /></span>
              <div>
                <h2 className="h-section">{pick(category.name, locale, ctx.defaultLocale)}</h2>
                <p className="lead mt-2">{pick(category.description, locale, ctx.defaultLocale)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s, i) => <Reveal key={s.id} delay={(i % 3) * 70}><ServiceCard service={s} ctx={ctx} /></Reveal>)}
            </div>
          </div>
        </section>
      ))}
      {uncategorised.length > 0 && (
        <section className="section">
          <div className="container-x grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {uncategorised.map((s) => <ServiceCard key={s.id} service={s} ctx={ctx} />)}
          </div>
        </section>
      )}
      <RenderSections sections={rest} ctx={ctx} />
    </>
  );
}
