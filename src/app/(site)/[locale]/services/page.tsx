import Link from "next/link";
import { RenderSections } from "@/components/sections/Sections";
import { ServiceRow } from "@/components/site/cards";
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
  const L = (v: Parameters<typeof pick>[0]) => pick(v, locale, ctx.defaultLocale);
  const sections = page?.sections ?? [];
  const grouped = categories.map((c) => ({ category: c, items: services.filter((s) => s.category_id === c.id) })).filter((g) => g.items.length);
  const uncategorised = services.filter((s) => !s.category_id || !categories.some((c) => c.id === s.category_id));
  let n = 0;
  return (
    <>
      <RenderSections sections={sections.filter((s) => s.type === "page_header")} ctx={ctx} />
      {grouped.length > 1 && (
        <nav className="sticky top-[calc(var(--header-h)+env(safe-area-inset-top))] z-30 border-y border-line bg-bg/90 backdrop-blur" aria-label={ctx.t("common.services")}>
          <ul className="container-x flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
            {grouped.map(({ category }, i) => (
              <li key={category.id}>
                <Link href={`#${category.slug}`} className="chip whitespace-nowrap transition-colors hover:border-primary hover:text-primary">
                  <span className="num text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>{L(category.name)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      {grouped.map(({ category, items }, gi) => (
        <section key={category.id} id={category.slug} className={`section scroll-mt-36 ${gi % 2 ? "bg-softer" : ""}`}>
          <div className="container-x grid grid-cols-1 gap-10 lg:grid-cols-12">
            <Reveal variant="up" className="lg:col-span-4">
              <div className="lg:sticky lg:top-40">
                <span className="icon-tile h-12 w-12"><Icon name={category.icon} className="h-6 w-6" /></span>
                <p className="kicker mt-6">{String(gi + 1).padStart(2, "0")} / {String(grouped.length).padStart(2, "0")}</p>
                <h2 className="h-section mt-2">{L(category.name)}</h2>
                <p className="lead mt-3">{L(category.description)}</p>
              </div>
            </Reveal>
            <div className="lg:col-span-8">
              {items.map((s, i) => <Reveal key={s.id} i={i} variant="up"><ServiceRow service={s} ctx={ctx} index={n++} /></Reveal>)}
            </div>
          </div>
        </section>
      ))}
      {uncategorised.length > 0 && (
        <section className="section">
          <div className="container-x">{uncategorised.map((s) => <ServiceRow key={s.id} service={s} ctx={ctx} index={n++} />)}</div>
        </section>
      )}
      <RenderSections sections={sections.filter((s) => s.type !== "page_header")} ctx={ctx} />
    </>
  );
}
