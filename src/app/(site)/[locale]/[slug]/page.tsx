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
        <header className="px-2 pt-3 sm:px-4">
          <div className="panel-soft relative isolate overflow-hidden">
            <div className="bg-measure bg-measure-fade pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden />
            <div className="container-x flex flex-col items-center py-14 text-center sm:py-20">
              <p className="badge-pill hero-in">{pick(ctx.brand?.name, locale, ctx.defaultLocale)}</p>
              <h1 className="h-display hero-in mt-5" style={{ ["--i" as string]: 1 }}>{pick(page.title, locale, ctx.defaultLocale)}</h1>
              {page.kind === "legal" && (
                <p className="hero-in mt-4 text-sm text-muted" style={{ ["--i" as string]: 2 }}>{formatDate(page.updated_at, locale)}</p>
              )}
            </div>
          </div>
        </header>
      )}
      <RenderSections sections={page.sections} ctx={ctx} />
    </>
  );
}
