import { RenderSections } from "@/components/sections/Sections";
import { ProjectCard } from "@/components/site/cards";
import { FilterableGrid } from "@/components/site/FilterableGrid";
import { cmsPageMetadata, type LocaleParams } from "@/features/site/page-helpers";
import { pick } from "@/lib/i18n";
import { getPage, getProjectCategories, getProjects } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams) {
  const { locale } = await params;
  return cmsPageMetadata(locale, "projects", "projects");
}

export default async function ProjectsPage({ params }: LocaleParams) {
  const { locale } = await params;
  const [ctx, page, categories, projects] = await Promise.all([getSiteContext(locale), getPage("projects"), getProjectCategories(), getProjects()]);
  const L = (v: Parameters<typeof pick>[0]) => pick(v, locale, ctx.defaultLocale);
  const catName = (id: string | null) => L(categories.find((c) => c.id === id)?.name);
  const sections = page?.sections ?? [];
  return (
    <>
      <RenderSections sections={sections.filter((s) => s.type === "page_header")} ctx={ctx} />
      <section className="section">
        <div className="container-x">
          <FilterableGrid
            className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3 md:[&>li:first-child]:col-span-2"
            categories={categories.filter((c) => projects.some((p) => p.category_id === c.id)).map((c) => ({ value: c.id, label: L(c.name) }))}
            labels={{ all: ctx.t("common.all"), search: ctx.t("projects.search_placeholder"), empty: ctx.t("projects.no_results") }}
            meta={projects.map((p) => ({
              category: p.category_id,
              haystack: [L(p.title), L(p.excerpt), L(p.project_type), L(p.client_name), ...p.technologies].join(" ").toLowerCase(),
            }))}
            cards={projects.map((p) => <ProjectCard key={p.id} project={p} ctx={ctx} categoryName={catName(p.category_id)} />)}
          />
        </div>
      </section>
      <RenderSections sections={sections.filter((s) => s.type !== "page_header")} ctx={ctx} />
    </>
  );
}
