import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Plus, Rocket } from "lucide-react";
import { Arrow, SectionHeading, ServiceCard } from "@/components/site/cards";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { Reveal } from "@/components/ui/Reveal";
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

/** Service landing page: hero panel → overview → features → steps → technologies → FAQ → related → CTA. */
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
  const requestHref = `/${locale}/request?service=${service.slug}`;
  const wa = typeof ctx.settings.contact?.whatsapp === "string" ? ctx.settings.contact.whatsapp.replace(/[^\d]/g, "") : "";
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Service", name: L(service.title), description: L(service.excerpt), provider: { "@type": "Organization", name: L(ctx.brand?.name) }, url: `${base}/${locale}/services/${slug}` }} />
      <JsonLd data={breadcrumbJsonLd([{ name: t("common.home"), url: `${base}/${locale}` }, { name: L(category?.name) || "Services", url: `${base}/${locale}/services` }, { name: L(service.title), url: `${base}/${locale}/services/${slug}` }])} />

      {/* hero panel */}
      <section className="px-2 pt-3 sm:px-4">
        <div className="panel-soft relative isolate overflow-hidden">
          <div className="bg-measure bg-measure-fade pointer-events-none absolute inset-0 -z-10 opacity-60" data-parallax="slow" aria-hidden />
          <div className="pointer-events-none absolute -top-32 start-[-10%] -z-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl animate-glow" aria-hidden />
          <div className="container-x grid grid-cols-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-12 lg:py-20">
            <div className="lg:col-span-7">
              <nav aria-label="Breadcrumb" className="hero-in text-sm text-muted">
                <ol className="flex flex-wrap items-center gap-2">
                  <li><Link href={`/${locale}`} className="hover:text-primary">{t("common.home")}</Link></li>
                  <li aria-hidden className="rhombus scale-50" />
                  <li><Link href={`/${locale}/services${category ? `#${category.slug}` : ""}`} className="hover:text-primary">{L(category?.name) || t("common.services")}</Link></li>
                </ol>
              </nav>
              <h1 className="h-display hero-in mt-5" style={{ ["--i" as string]: 1 }}>{L(service.title)}</h1>
              <p className="lead hero-in mt-5" style={{ ["--i" as string]: 2 }}>{L(service.excerpt)}</p>
              <div className="hero-in mt-8 flex flex-wrap gap-3" style={{ ["--i" as string]: 3 }}>
                <Link href={requestHref} className="btn btn-primary min-h-12 rounded-pill px-6"><Rocket className="h-4 w-4" aria-hidden />{t("common.request_service")}</Link>
                {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline min-h-12 rounded-pill px-6"><MessageCircle className="h-4 w-4" aria-hidden />{t("contact.whatsapp")}</a>}
              </div>
            </div>
            <div className="hero-in lg:col-span-5" style={{ ["--i" as string]: 2 }}>
              <div className="lift relative grid aspect-[4/3] place-items-center overflow-hidden p-0">
                {service.image_url ? <SmartImage src={service.image_url} alt={L(service.title)} priority className="object-cover" /> : (
                  <div className="panel-brand absolute inset-0 grid place-items-center">
                    <div className="bg-measure absolute inset-0 opacity-25" aria-hidden />
                    <span className="relative grid h-28 w-28 place-items-center rounded-4xl bg-white text-primary shadow-2xl animate-float"><Icon name={service.icon} className="h-12 w-12" /></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* overview + technologies */}
      <section className="section">
        <div className="container-x grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Reveal as="article" variant="up" className="lg:col-span-8"><Markdown>{L(service.body)}</Markdown></Reveal>
          {!!service.technologies?.length && (
            <aside className="lg:col-span-4">
              <div className="lift sticky top-28 p-6">
                <h2 className="font-bold">{t("services.technologies")}</h2>
                <ul className="mt-4 flex flex-wrap gap-2" dir="ltr">
                  {service.technologies.map((x) => <li key={x} className="ink rounded-xl px-3 py-1.5 text-sm font-semibold">{x}</li>)}
                </ul>
                <Link href={requestHref} className="btn btn-primary group mt-6 w-full rounded-pill">{t("common.request_service")} <Arrow dir={dir} /></Link>
              </div>
            </aside>
          )}
        </div>
      </section>

      {!!service.features?.length && (
        <section className="section bg-softer">
          <div className="container-x">
            <Reveal variant="up"><SectionHeading eyebrow={L(service.title)} title={t("services.features")} /></Reveal>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {service.features.map((f, i) => (
                <Reveal key={i} i={i} variant="up" className="lift spotlight group p-6">
                  <span className="icon-tile h-12 w-12 rounded-2xl"><Icon name={f.icon} className="h-6 w-6" /></span>
                  <h3 className="mt-5 text-lg font-bold">{L(f.title)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{L(f.text)}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {!!service.steps?.length && (
        <section className="section">
          <div className="container-x">
            <Reveal variant="up"><SectionHeading eyebrow={t("services.steps")} title={t("services.steps")} /></Reveal>
            <ol className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {service.steps.map((st, i) => (
                <Reveal as="li" key={i} i={i} variant={i % 2 ? "end" : "start"} className="lift step-card group">
                  <span className="step-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                  <div className="p-5 sm:p-6">
                    <h3 className="text-lg font-bold">{L(st.title)}</h3>
                    <p className="mt-2 text-muted">{L(st.text)}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>
      )}

      {!!service.faqs?.length && (
        <section className="section bg-softer">
          <div className="container-x">
            <Reveal variant="up"><SectionHeading eyebrow={t("services.faq")} title={t("services.faq")} /></Reveal>
            <div className="mx-auto max-w-4xl space-y-3">
              {service.faqs.map((f, i) => (
                <Reveal key={i} i={i} variant="up">
                  <details className="faq-item group" open={i === 0}>
                    <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                      <span className="num grid h-9 w-9 flex-none place-items-center rounded-xl bg-soft text-sm font-bold text-primary group-open:bg-primary group-open:text-on-primary">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1 font-semibold sm:text-lg">{L(f.question)}</span>
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line transition-transform duration-300 group-open:rotate-45"><Plus className="h-4 w-4" aria-hidden /></span>
                    </summary>
                    <p className="px-4 pb-5 leading-relaxed text-muted sm:ps-[4.75rem]">{L(f.answer)}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container-x">
          {related.length > 0 && (
            <div className="mb-16">
              <Reveal variant="up"><SectionHeading eyebrow={L(category?.name)} title={t("services.related")} /></Reveal>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                {related.map((s, i) => <Reveal key={s.id} i={i} variant="up" className="h-full"><ServiceCard service={s} ctx={ctx} /></Reveal>)}
              </div>
            </div>
          )}
          <Reveal variant="scale" className="panel-brand relative overflow-hidden p-8 text-center sm:p-12">
            <div className="bg-measure absolute inset-0 opacity-20" aria-hidden />
            <h2 className="relative text-2xl font-bold sm:text-3xl">{t("services.cta_title")}</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-white/80">{t("services.cta_text")}</p>
            <Link href={requestHref} className="btn btn-accent relative mt-8 min-h-12 rounded-pill px-6"><Rocket className="h-4 w-4" aria-hidden />{t("common.request_service")}</Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
