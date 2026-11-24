import { notFound } from "next/navigation";
import { RenderSections } from "@/components/sections/Sections";
import { cmsPageMetadata, type SlugParams } from "@/features/site/page-helpers";
import { formatDate, pick } from "@/lib/i18n";
import { getPage } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

// Pages that have their own dedicated routes are not served here.
const RESERVED = new Set(["home", "about", "services", "projects", "team", "blog", "contact", "request"]);

export async function generateMetadata({ params }: SlugParams) {
  const { locale, slug } = await params;
  return cmsPageMetadata(locale, slug, slug);
}

/** Custom pages built in the CMS page builder, and legal pages. */
export default async function CmsPage({ params }: SlugParams) {
  const { locale, slug } = await params;
  if (RESERVED.has(slug)) notFound();
  const [ctx, page] = await Promise.all([getSiteContext(locale), getPage(slug)]);
  if (!page) notFound();
  const hasHeader = page.sections?.some((s) => s.type === "page_header" || s.type === "hero");
  return (
    <>
      {!hasHeader && (
        <header className="relative overflow-hidden border-b border-line">
          <div className="bg-measure bg-measure-fade pointer-events-none absolute inset-0 opacity-70" aria-hidden />
          <div className="container-x relative py-16 lg:py-20">
            <h1 className="h-display">{pick(page.title, locale, ctx.defaultLocale)}</h1>
            {page.kind === "legal" && (
              <p className="mt-4 text-sm text-muted">{formatDate(page.updated_at, locale)}</p>
            )}
          </div>
        </header>
      )}
      <RenderSections sections={page.sections} ctx={ctx} />
    </>
  );
}
