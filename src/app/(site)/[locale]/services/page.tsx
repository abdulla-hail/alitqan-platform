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

/** Services: sticky category pills + one card grid per category (all data from the CMS). */
export default async function ServicesPage({ params }: LocaleParams) {
  const { locale } = await params;
  const [ctx, page, categories, services] = await Promise.all([getSiteContext(locale), getPage("services"), getServiceCategories(), getServices()]);
  const L = (v: Parameters<typeof pick>[0]) => pick(v, locale, ctx.defaultLocale);
  const sections = page?.sections ?? [];
  const grouped = categories.map((c) => ({ category: c, items: services.filter((s) => s.category_id === c.id) })).filter((g) => g.items.length);
  const uncategorised = services.filter((s) => !s.category_id || !categories.some((c) => c.id === s.category_id));
  return (
    <>
      <RenderSections sections={sections.filter((s) => s.type === "page_header")} ctx={ctx} />
      {grouped.length > 1 && (
        <nav className="sticky top-[calc(var(--header-h)+env(safe-area-inset-top))] z-30 mt-6 bg-bg/85 py-3 backdrop-blur" aria-label={ctx.t("common.services")}>
          <ul className="container-x scroll-x flex justify-start gap-2 md:justify-center">
            {grouped.map(({ category }) => (
              <li key={category.id}>
                <Link href={`#${category.slug}`} className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold transition-colors hover:border-primary hover:text-primary">
                  <Icon name={category.icon} className="h-4 w-4 text-primary" />{L(category.name)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {grouped.map(({ category, items }, gi) => (
        <section key={category.id} id={category.slug} className={`section scroll-mt-40 ${gi % 2 ? "bg-softer" : ""}`}>
          <div className="container-x">
            <Reveal variant="up" className="mb-10 flex flex-col items-center text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-on-primary shadow-[0_12px_30px_-14px_var(--color-primary)]"><Icon name={category.icon} className="h-7 w-7" /></span>
              <h2 className="h-section mt-5">{L(category.name)}</h2>
              <p className="lead mt-3">{L(category.description)}</p>
            </Reveal>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s, i) => <Reveal key={s.id} i={i % 3} variant="up" className="h-full"><ServiceCard service={s} ctx={ctx} index={i} /></Reveal>)}
            </div>
          </div>
        </section>
      ))}
      {uncategorised.length > 0 && (
        <section className="section">
          <div className="container-x grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {uncategorised.map((s, i) => <ServiceCard key={s.id} service={s} ctx={ctx} index={i} />)}
          </div>
        </section>
      )}
      <RenderSections sections={sections.filter((s) => s.type !== "page_header")} ctx={ctx} />
    </>
  );
}
