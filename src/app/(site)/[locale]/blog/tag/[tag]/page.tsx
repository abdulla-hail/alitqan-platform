import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/site/cards";
import { pick } from "@/lib/i18n";
import { buildMetadata } from "@/lib/seo";
import { getBlogTaxonomy, getPosts } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}
type P = { params: Promise<{ locale: string; tag: string }> };

export async function generateMetadata({ params }: P) {
  const { locale, tag } = await params;
  const [ctx, tax] = await Promise.all([getSiteContext(locale), getBlogTaxonomy()]);
  const t = tax.tags.find((x) => x.slug === tag);
  return buildMetadata(ctx, { path: `blog/tag/${tag}`, title: t ? `#${pick(t.name, locale)}` : tag, noindex: !t });
}

export default async function TagPage({ params }: P) {
  const { locale, tag } = await params;
  const [ctx, tax, posts] = await Promise.all([getSiteContext(locale), getBlogTaxonomy(), getPosts({ tag })]);
  const t = tax.tags.find((x) => x.slug === tag);
  if (!t) notFound();
  return (
    <section className="section">
      <div className="container-x">
        <Link href={`/${locale}/blog`} className="text-sm text-muted hover:text-primary">{ctx.t("common.back")}</Link>
        <h1 className="h-display mt-3">#{pick(t.name, locale, ctx.defaultLocale)}</h1>
        <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => <PostCard key={p.id} post={p} ctx={ctx} />)}
        </div>
        {!posts.length && <p className="py-16 text-center text-muted">{ctx.t("blog.no_posts")}</p>}
      </div>
    </section>
  );
}
