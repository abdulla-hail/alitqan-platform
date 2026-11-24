import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Arrow, ProjectCard } from "@/components/site/cards";
import { Markdown } from "@/components/ui/Markdown";
import { SmartImage } from "@/components/ui/SmartImage";
import type { SlugParams } from "@/features/site/page-helpers";
import { formatDate, pick } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata, JsonLd, siteUrl } from "@/lib/seo";
import { getProject, getProjectCategories, getProjects, getServicesByIds } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: SlugParams) {
  const { locale, slug } = await params;
  const [ctx, p] = await Promise.all([getSiteContext(locale), getProject(slug)]);
  if (!p) return buildMetadata(ctx, { path: `projects/${slug}`, noindex: true });
  return buildMetadata(ctx, { path: `projects/${slug}`, title: p.title, description: p.excerpt, image: p.cover_url, seo: p.seo });
}

export default async function ProjectDetail({ params }: SlugParams) {
  const { locale, slug } = await params;
  const [ctx, project, all, categories] = await Promise.all([getSiteContext(locale), getProject(slug), getProjects(), getProjectCategories()]);
  if (!project) notFound();
  const { t, defaultLocale, dir } = ctx;
  const L = (v: Parameters<typeof pick>[0]) => pick(v, locale, defaultLocale);
  const services = await getServicesByIds((project.project_services ?? []).map((s) => s.service_id));
  const category = categories.find((c) => c.id === project.category_id);
  const similar = all.filter((p) => p.id !== project.id && p.category_id === project.category_id).concat(all.filter((p) => p.id !== project.id && p.category_id !== project.category_id)).slice(0, 3);
  const base = siteUrl(ctx);
  const facts = [
    [t("projects.client"), L(project.client_name)],
    [t("projects.type"), L(project.project_type) || L(category?.name)],
    [t("projects.completed"), formatDate(project.completed_on, locale, { year: "numeric", month: "long" })],
  ].filter(([, v]) => v);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CreativeWork", name: L(project.title), description: L(project.excerpt), image: project.cover_url ? (project.cover_url.startsWith("http") ? project.cover_url : `${base}${project.cover_url}`) : undefined, dateCreated: project.completed_on ?? undefined, creator: { "@type": "Organization", name: L(ctx.brand?.name) } }} />
      <JsonLd data={breadcrumbJsonLd([{ name: t("common.home"), url: `${base}/${locale}` }, { name: L(category?.name) || "Projects", url: `${base}/${locale}/projects` }, { name: L(project.title), url: `${base}/${locale}/projects/${slug}` }])} />
      <section className="container-x pb-10 pt-14 lg:pt-20">
        <Link href={`/${locale}/projects`} className="text-sm text-muted hover:text-primary">{L(category?.name) || t("common.back")}</Link>
        <h1 className="h-display mt-4 max-w-4xl animate-rise">{L(project.title)}</h1>
        <p className="lead mt-5 max-w-3xl animate-rise [animation-delay:100ms]">{L(project.excerpt)}</p>
        <dl className="mt-10 grid grid-cols-2 gap-6 border-y border-line py-6 md:grid-cols-4">
          {facts.map(([k, v]) => (
            <div key={k}><dt className="text-sm text-muted">{k}</dt><dd className="mt-1 font-semibold">{v}</dd></div>
          ))}
          {project.live_url && /^https?:/.test(project.live_url) && (
            <div>
              <dt className="text-sm text-muted">{t("projects.visit")}</dt>
              <dd className="mt-1"><a href={project.live_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-primary">{new URL(project.live_url).hostname}<ExternalLink className="h-4 w-4" /></a></dd>
            </div>
          )}
        </dl>
      </section>
      <div className="container-x">
        <div className="relative aspect-[16/9] overflow-hidden rounded-brand-lg bg-subtle">
          <SmartImage src={project.cover_url} alt={L(project.title)} priority className="object-cover" sizes="100vw" />
        </div>
      </div>

      <section className="section">
        <div className="container-x grid grid-cols-1 gap-14 lg:grid-cols-12">
          <div className="space-y-14 lg:col-span-8">
            <Markdown>{L(project.body)}</Markdown>
            {[["projects.challenge", project.challenge], ["projects.solution", project.solution], ["projects.results", project.results]].map(([k, v]) =>
              L(v as never) ? (
                <div key={k as string}>
                  <h2 className="eyebrow">{t(k as string)}</h2>
                  <Markdown className="prose-brand mt-4 text-lg">{L(v as never)}</Markdown>
                </div>
              ) : null,
            )}
            {!!project.metrics?.length && (
              <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-brand border border-line bg-line sm:grid-cols-3">
                {project.metrics.map((m, i) => (
                  <div key={i} className="bg-surface p-6">
                    <dt className="text-sm text-muted">{L(m.label)}</dt>
                    <dd className="mt-2 font-display text-3xl font-bold text-primary" dir="ltr">{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <aside className="space-y-6 lg:col-span-4">
            {services.length > 0 && (
              <div className="card p-6">
                <h2 className="font-bold">{t("projects.services")}</h2>
                <ul className="mt-4 space-y-2">
                  {services.map((s) => (
                    <li key={s.id}><Link href={`/${locale}/services/${s.slug}`} className="group inline-flex items-center gap-2 text-primary hover:underline">{L(s.title)} <Arrow dir={dir} className="h-3.5 w-3.5" /></Link></li>
                  ))}
                </ul>
              </div>
            )}
            {!!project.technologies?.length && (
              <div className="card p-6">
                <h2 className="font-bold">{t("projects.technologies")}</h2>
                <ul className="mt-4 flex flex-wrap gap-2" dir="ltr">{project.technologies.map((x) => <li key={x} className="chip">{x}</li>)}</ul>
              </div>
            )}
          </aside>
        </div>
      </section>

      {!!project.project_images?.length && (
        <section className="section bg-softer">
          <div className="container-x">
            <h2 className="h-section mb-10">{t("projects.gallery")}</h2>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {project.project_images.map((img, i) => (
                <figure key={img.id} className={`relative overflow-hidden rounded-brand bg-subtle ${i === 0 ? "aspect-[16/9] md:col-span-2" : "aspect-[4/3]"}`}>
                  <SmartImage src={img.url} alt={L(img.alt) || L(project.title)} className="object-cover" />
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="section">
          <div className="container-x">
            <h2 className="h-section mb-10">{t("projects.similar")}</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">{similar.map((p) => <ProjectCard key={p.id} project={p} ctx={ctx} />)}</div>
          </div>
        </section>
      )}
    </>
  );
}
