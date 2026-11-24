import Link from "next/link";
import { notFound } from "next/navigation";
import { PostCard } from "@/components/site/cards";
import { Markdown } from "@/components/ui/Markdown";
import { SmartImage } from "@/components/ui/SmartImage";
import type { SlugParams } from "@/features/site/page-helpers";
import { formatDate, pick } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata, JsonLd, siteUrl } from "@/lib/seo";
import { getPost, getPosts } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: SlugParams) {
  const { locale, slug } = await params;
  const [ctx, post] = await Promise.all([getSiteContext(locale), getPost(slug)]);
  if (!post) return buildMetadata(ctx, { path: `blog/${slug}`, noindex: true });
  return buildMetadata(ctx, { path: `blog/${slug}`, title: post.title, description: post.excerpt, image: post.cover_url, seo: post.seo, type: "article", publishedTime: post.published_at });
}

export default async function PostPage({ params }: SlugParams) {
  const { locale, slug } = await params;
  const [ctx, post, all] = await Promise.all([getSiteContext(locale), getPost(slug), getPosts({ limit: 12 })]);
  if (!post) notFound();
  const { t, defaultLocale } = ctx;
  const L = (v: Parameters<typeof pick>[0]) => pick(v, locale, defaultLocale);
  const tagIds = new Set((post.blog_post_tags ?? []).map((x) => x.tag?.id));
  const related = all
    .filter((p) => p.id !== post.id)
    .map((p) => ({ p, score: (p.category_id === post.category_id ? 2 : 0) + (p.blog_post_tags ?? []).filter((x) => tagIds.has(x.tag?.id)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.p);
  const base = siteUrl(ctx);
  const minutes = post.reading_minutes ?? Math.max(1, Math.round(L(post.body).split(/\s+/).length / 200));
  return (
    <article>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BlogPosting", headline: L(post.title), description: L(post.excerpt), datePublished: post.published_at, dateModified: post.updated_at, author: post.author ? { "@type": "Person", name: L(post.author.name) } : undefined, image: post.cover_url ? (post.cover_url.startsWith("http") ? post.cover_url : `${base}${post.cover_url}`) : undefined, mainEntityOfPage: `${base}/${locale}/blog/${slug}`, inLanguage: locale }} />
      <JsonLd data={breadcrumbJsonLd([{ name: t("common.home"), url: `${base}/${locale}` }, { name: "Blog", url: `${base}/${locale}/blog` }, { name: L(post.title), url: `${base}/${locale}/blog/${slug}` }])} />
      <header className="container-x max-w-4xl pb-10 pt-14 text-center lg:pt-20">
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted">
          {post.category && <Link href={`/${locale}/blog`} className="font-semibold text-primary">{L(post.category.name)}</Link>}
          <span className="rhombus scale-75" aria-hidden />
          <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at, locale)}</time>
          <span className="rhombus scale-75" aria-hidden />
          <span>{minutes} {t("blog.min_read")}</span>
        </div>
        <h1 className="h-display mt-5 animate-rise">{L(post.title)}</h1>
        <p className="lead mx-auto mt-5 max-w-2xl">{L(post.excerpt)}</p>
        {post.author && (
          <p className="mt-6 text-sm">{t("blog.by")} <span className="font-semibold">{L(post.author.name)}</span> · <span className="text-muted">{L(post.author.job_title)}</span></p>
        )}
      </header>
      {post.cover_url && (
        <div className="container-x max-w-5xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-brand-lg bg-subtle">
            <SmartImage src={post.cover_url} alt={L(post.title)} priority className="object-cover" sizes="(min-width:1024px) 1024px, 100vw" />
          </div>
        </div>
      )}
      <div className="container-x max-w-3xl py-14">
        <Markdown>{L(post.body)}</Markdown>
        {!!post.blog_post_tags?.length && (
          <ul className="mt-12 flex flex-wrap gap-2 border-t border-line pt-6">
            {post.blog_post_tags.map((x) => x.tag && (
              <li key={x.tag.id}><Link href={`/${locale}/blog/tag/${x.tag.slug}`} className="chip hover:border-primary">#{L(x.tag.name)}</Link></li>
            ))}
          </ul>
        )}
      </div>
      {related.length > 0 && (
        <section className="section bg-softer">
          <div className="container-x">
            <h2 className="h-section mb-10">{t("blog.related")}</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">{related.map((p) => <PostCard key={p.id} post={p} ctx={ctx} />)}</div>
          </div>
        </section>
      )}
    </article>
  );
}
