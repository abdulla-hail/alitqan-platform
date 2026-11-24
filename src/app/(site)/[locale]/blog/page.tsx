import Link from "next/link";
import { RenderSections } from "@/components/sections/Sections";
import { PostCard, PostFeature } from "@/components/site/cards";
import { Reveal } from "@/components/ui/Reveal";
import { FilterableGrid } from "@/components/site/FilterableGrid";
import { cmsPageMetadata, type LocaleParams } from "@/features/site/page-helpers";
import { pick } from "@/lib/i18n";
import { getBlogTaxonomy, getPage, getPosts } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;

export async function generateMetadata({ params }: LocaleParams) {
  const { locale } = await params;
  return cmsPageMetadata(locale, "blog", "blog");
}

export default async function BlogPage({ params }: LocaleParams) {
  const { locale } = await params;
  const [ctx, page, posts, tax] = await Promise.all([getSiteContext(locale), getPage("blog"), getPosts(), getBlogTaxonomy()]);
  const L = (v: Parameters<typeof pick>[0]) => pick(v, locale, ctx.defaultLocale);
  const usedTags = tax.tags.filter((tg) => posts.some((p) => p.blog_post_tags?.some((x) => x.tag?.id === tg.id)));
  return (
    <>
      <RenderSections sections={(page?.sections ?? []).filter((s) => s.type === "page_header")} ctx={ctx} />
      <section className="section">
        <div className="container-x">
          {posts.length === 0 ? (
            <p className="py-16 text-center text-muted">{ctx.t("blog.no_posts")}</p>
          ) : (
            <>
            <Reveal variant="up" className="mb-16 border-b border-line pb-16"><PostFeature post={posts[0]} ctx={ctx} /></Reveal>
            {posts.length > 1 && <FilterableGrid
              className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3"
              categories={tax.categories.filter((c) => posts.some((p) => p.category_id === c.id)).map((c) => ({ value: c.id, label: L(c.name) }))}
              labels={{ all: ctx.t("common.all"), search: ctx.t("common.search"), empty: ctx.t("blog.no_posts") }}
              meta={posts.slice(1).map((p) => ({ category: p.category_id, haystack: [L(p.title), L(p.excerpt)].join(" ").toLowerCase() }))}
              cards={posts.slice(1).map((p) => <PostCard key={p.id} post={p} ctx={ctx} />)}
            />}
            </>
          )}
          {usedTags.length > 0 && (
            <div className="mt-16 border-t border-line pt-8">
              <h2 className="text-sm font-semibold text-muted">{ctx.t("blog.tags")}</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {usedTags.map((tg) => (
                  <li key={tg.id}><Link href={`/${locale}/blog/tag/${tg.slug}`} className="chip hover:border-primary">#{L(tg.name)}</Link></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
