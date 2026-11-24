import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { Arrow, ServiceRow } from "@/components/site/cards";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { SmartImage } from "@/components/ui/SmartImage";
import type { SlugParams } from "@/features/site/page-helpers";
import { pick } from "@/lib/i18n";
import { breadcrumbJsonLd, buildMetadata, JsonLd, siteUrl } from "@/lib/seo";
import { getService, getServiceCategories, getServices } from "@/services/content";
import { getSiteContext } from "@/services/site";

export const revalidate = 300;
export const dynamicParams = true;
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: SlugParams) {
  const { locale, slug } = await params;
  const [ctx, s] = await Promise.all([getSiteContext(locale), getService(slug)]);
  if (!s) return buildMetadata(ctx, { path: `services/${slug}`, noindex: true });
  return buildMetadata(ctx, { path: `services/${slug}`, title: s.title, description: s.excerpt, image: s.image_url, seo: s.seo });
}

export default async function ServiceDetail({ params }: SlugParams) {
  const { locale, slug } = await params;
  const [ctx, service, all, categories] = await Promise.all([getSiteContext(locale), getService(slug), getServices(), getServiceCategories()]);
  if (!service) notFound();
  const { t, defaultLocale, dir } = ctx;
  const L = (v: Parameters<typeof pick>[0]) => pick(v, locale, defaultLocale);
  const category = categories.find((c) => c.id === service.category_id);
  const related = [
    ...all.filter((s) => service.related_ids?.includes(s.id)),
    ...all.filter((s) => s.id !== service.id && s.category_id === service.category_id && !service.related_ids?.includes(s.id)),
  ].slice(0, 3);
  const base = siteUrl(ctx);
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", name: L(service.title), description: L(service.excerpt), provider: { "@type": "Organization", name: L(ctx.brand?.name) }, url: `${base}/${locale}/services/${slug}` }} />
      <JsonLd data={breadcrumbJsonLd([{ name: t("common.home"), url: `${base}/${locale}` }, { name: L(category?.name) || "Services", url: `${base}/${locale}/services` }, { name: L(service.title), url: `${base}/${locale}/services/${slug}` }])} />
      <section className="relative overflow-hidden border-b border-line">
        <div className="bg-measure bg-measure-fade pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div className="container-x relative grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-12 lg:py-24">
          <div className="lg:col-span-7">
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <Link href={`/${locale}/services`} className="hover:text-primary">{L(category?.name) || t("common.back")}</Link>
            </nav>
            <h1 className="h-display mt-4 animate-rise">{L(service.title)}</h1>
            <p className="lead mt-5 max-w-2xl animate-rise [animation-delay:100ms]">{L(service.excerpt)}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${locale}/request?service=${service.slug}`} className="btn btn-primary group">{t("common.request_service")} <Arrow dir={dir} /></Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-brand-lg bg-soft">
              {service.image_url ? <SmartImage src={service.image_url} alt={L(service.title)} priority className="object-cover" /> : <Icon name={service.icon} className="h-24 w-24 text-primary" />}
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-x grid grid-cols-1 gap-14 lg:grid-cols-12">
          <article className="lg:col-span-7"><Markdown>{L(service.body)}</Markdown></article>
          {!!service.technologies?.length && (
            <aside className="lg:col-span-4 lg:col-start-9">
              <div className="card sticky top-28 p-6">
                <h2 className="font-bold">{t("services.technologies")}</h2>
                <ul className="mt-4 flex flex-wrap gap-2" dir="ltr">
                  {service.technologies.map((x) => <li key={x} className="chip">{x}</li>)}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </section>

      {!!service.features?.length && (
        <section className="section bg-softer">
          <div className="container-x">
            <h2 className="h-section mb-10">{t("services.features")}</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {service.features.map((f, i) => (
                <div key={i} className="card p-6">
                  <span className="icon-tile"><Icon name={f.icon} className="h-5 w-5" /></span>
                  <h3 className="mt-4 font-bold">{L(f.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{L(f.text)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!!service.steps?.length && (
        <section className="section">
          <div className="container-x">
            <h2 className="h-section mb-10">{t("services.steps")}</h2>
            <ol className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {service.steps.map((st, i) => (
                <li key={i}>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-sm font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <span className="hairline flex-1" /><span className="rhombus" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{L(st.title)}</h3>
                  <p className="mt-2 text-muted">{L(st.text)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {!!service.faqs?.length && (
        <section className="section bg-softer">
          <div className="container-x grid grid-cols-1 gap-10 lg:grid-cols-12">
            <h2 className="h-section lg:col-span-4">{t("services.faq")}</h2>
            <div className="divide-y divide-line border-y border-line lg:col-span-8">
              {service.faqs.map((f, i) => (
                <details key={i} className="group py-5" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                    {L(f.question)}<Plus className="h-5 w-5 flex-none text-primary transition-transform group-open:rotate-45" aria-hidden />
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted">{L(f.answer)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container-x">
          <div className="card flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center lg:p-10">
            <div>
              <h2 className="text-2xl font-bold">{t("services.cta_title")}</h2>
              <p className="mt-2 text-muted">{t("services.cta_text")}</p>
            </div>
            <Link href={`/${locale}/request?service=${service.slug}`} className="btn btn-primary group">{t("common.request_service")} <Arrow dir={dir} /></Link>
          </div>
          {related.length > 0 && (
            <div className="mt-20">
              <h2 className="h-section mb-10">{t("services.related")}</h2>
              <div>{related.map((s, i) => <ServiceRow key={s.id} service={s} ctx={ctx} index={i} />)}</div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
