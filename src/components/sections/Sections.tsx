import Link from "next/link";
import { ArrowDown, Mail, MessageCircle, Plus } from "lucide-react";
import { Arrow, PostCard, PostFeature, ProjectCard, SectionHeading, ServiceRow, TeamCard } from "@/components/site/cards";
import { ContactDetails } from "@/components/site/ContactDetails";
import { BrandSymbol } from "@/components/brand/Logo";
import { CountUp } from "@/components/motion/CountUp";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { Reveal } from "@/components/ui/Reveal";
import { SmartImage } from "@/components/ui/SmartImage";
import { HeroArt } from "./HeroArt";
import { ProjectsSlider, type Slide } from "./ProjectsSlider";
import { localeHref, pick } from "@/lib/i18n";
import { prepareImage } from "@/lib/images";
import { sanitizeMotion } from "@/lib/motion";
import {
  getClients, getHomeProjects, getPosts, getProjectCategories, getProjects, getServiceCategories, getServices, getTeam, getTestimonials,
} from "@/services/content";
import type { SiteContext } from "@/services/site";
import type { Localized, PageSection, Project } from "@/types/content";

type Item = Record<string, unknown>;

function useSection(section: PageSection, ctx: SiteContext) {
  const c = section.content ?? {};
  const s = section.settings ?? {};
  const L = (name: string) => pick(c[name] as Localized, ctx.locale, ctx.defaultLocale);
  const href = (name: string) => (c[name] ? localeHref(String(c[name]), ctx.locale) : "");
  const list = (name: string) => (Array.isArray(c[name]) ? (c[name] as Item[]) : []);
  const li = (it: Item, name: string) => pick(it[name] as Localized, ctx.locale, ctx.defaultLocale);
  return { c, s, L, href, list, li };
}

function Shell({ section, children, className = "" }: { section: PageSection; children: React.ReactNode; className?: string }) {
  const bg = (section.settings?.background as string) ?? "default";
  const bgClass = bg === "muted" ? "bg-softer" : bg === "brand" ? "ink" : bg === "measure" ? "relative overflow-hidden" : "";
  return (
    <section id={`s-${section.id.slice(0, 8)}`} className={`section ${bgClass} ${className}`} data-section={section.type}>
      {bg === "measure" && <div className="bg-measure bg-measure-fade pointer-events-none absolute inset-0 opacity-70" data-parallax="slow" aria-hidden />}
      <div className="container-x relative">{children}</div>
    </section>
  );
}

function Heading(props: Parameters<typeof SectionHeading>[0]) {
  return (
    <Reveal variant="up">
      <SectionHeading {...props} />
    </Reveal>
  );
}

function CtaButtons({ ctx, primary, secondary }: { ctx: SiteContext; primary?: [string, string]; secondary?: [string, string] }) {
  return (
    <div className="flex flex-wrap gap-3">
      {primary?.[0] && primary[1] && (
        <Link href={primary[1]} className="btn btn-primary group min-h-12 px-6">
          {primary[0]} <Arrow dir={ctx.dir} />
        </Link>
      )}
      {secondary?.[0] && secondary[1] && (
        <Link href={secondary[1]} className="btn btn-outline min-h-12 px-6 !bg-transparent">
          {secondary[0]}
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ hero: ink stage + capabilities index */

async function Hero({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L, href, list, li } = useSection(section, ctx);
  const categories = await getServiceCategories();
  return (
    <section className="px-2 pt-2 sm:px-4 sm:pt-4" data-section="hero">
      <div className="ink stage">
        {c.image ? (
          <div className="absolute inset-0 -z-10 opacity-25" aria-hidden><SmartImage src={String(c.image)} alt="" priority className="object-cover" sizes="100vw" /></div>
        ) : null}
        <div className="bg-measure pointer-events-none absolute inset-0 -z-10 opacity-40 [mask-image:radial-gradient(ellipse_at_70%_20%,#000,transparent_70%)]" data-parallax="slow" aria-hidden />
        <div className="pointer-events-none absolute -top-40 end-[-10%] -z-10 h-[36rem] w-[36rem] rounded-full bg-primary/25 blur-3xl animate-glow" aria-hidden />
        <div className="pointer-events-none absolute -bottom-56 start-[-15%] -z-10 h-[30rem] w-[30rem] rounded-full bg-accent/15 blur-3xl animate-glow [animation-delay:-4s]" aria-hidden />
        <BrandSymbol className="pointer-events-none absolute -bottom-24 end-[-6rem] -z-10 h-[26rem] w-[26rem] opacity-[0.07] sm:h-[34rem] sm:w-[34rem]" />

        <div className="container-x relative grid min-h-[calc(100svh-var(--header-h)-1rem)] grid-cols-1 content-center gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:gap-10 lg:py-24">
          <div className="lg:col-span-8">
            {L("eyebrow") && <p className="eyebrow hero-in !text-primary">{L("eyebrow")}</p>}
            <h1 className="h-hero hero-in mt-6 max-w-[16ch]" style={{ ["--i" as string]: 1 }}>{L("title")}</h1>
            {L("subtitle") && <p className="lead hero-in mt-7 text-lg sm:text-xl" style={{ ["--i" as string]: 2 }}>{L("subtitle")}</p>}
            <div className="hero-in mt-10" style={{ ["--i" as string]: 3 }}>
              <CtaButtons ctx={ctx} primary={[L("primary_label"), href("primary_href")]} secondary={[L("secondary_label"), href("secondary_href")]} />
            </div>
          </div>

          {categories.length > 0 && (
            <nav className="hero-in self-end lg:col-span-4" style={{ ["--i" as string]: 4 }} aria-label={ctx.t("common.services")}>
              <p className="kicker mb-3">{ctx.t("common.services")}</p>
              <ol className="border-t border-line">
                {categories.map((cat, i) => (
                  <li key={cat.id} className="border-b border-line">
                    <Link href={`/${ctx.locale}/services#${cat.slug}`} className="group flex items-center gap-4 py-3.5 transition-colors hover:text-primary">
                      <span className="num w-6 text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
                      <span className="flex-1 font-semibold">{pick(cat.name, ctx.locale, ctx.defaultLocale)}</span>
                      <Arrow dir={ctx.dir} className="h-4 w-4 opacity-40 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>

        <div className="container-x relative pb-6">
          {list("highlights").length > 0 && (
            <ul className="hero-in mb-5 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted" style={{ ["--i" as string]: 5 }}>
              {list("highlights").map((h, i) => (
                <li key={i} className="inline-flex items-center gap-2"><span className="rhombus scale-75" aria-hidden />{li(h, "text")}</li>
              ))}
            </ul>
          )}
          <div className="ruler text-on-ink" aria-hidden />
          <a href="#after-hero" className="absolute bottom-10 end-4 hidden h-11 w-11 place-items-center rounded-full border border-line text-muted transition-colors hover:border-primary hover:text-primary lg:grid" aria-label={ctx.t("common.scroll")}>
            <ArrowDown className="h-4 w-4 animate-bounce motion-reduce:animate-none" />
          </a>
        </div>
      </div>
      <span id="after-hero" aria-hidden />
    </section>
  );
}

function PageHeader({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L } = useSection(section, ctx);
  return (
    <section className="relative isolate overflow-hidden" data-section="page_header">
      <div className="bg-measure bg-measure-fade pointer-events-none absolute inset-0 -z-10 opacity-60" data-parallax="slow" aria-hidden />
      <div className="pointer-events-none absolute -top-32 end-[-8%] -z-10 h-80 w-80 rounded-full bg-primary/12 blur-3xl animate-glow" aria-hidden />
      <div className="container-x relative pb-12 pt-14 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-28">
        <nav aria-label="Breadcrumb" className="hero-in mb-6 text-sm text-muted">
          <Link href={`/${ctx.locale}`} className="hover:text-primary">{ctx.t("common.home")}</Link>
          <span className="mx-2 opacity-50">/</span>
          <span className="text-fg">{L("eyebrow") || L("title")}</span>
        </nav>
        <h1 className="h-display hero-in max-w-4xl" style={{ ["--i" as string]: 1 }}>{L("title")}</h1>
        {L("subtitle") && <p className="lead hero-in mt-5" style={{ ["--i" as string]: 2 }}>{L("subtitle")}</p>}
        <div className="ruler hero-in mt-12 text-fg" style={{ ["--i" as string]: 3 }} aria-hidden />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ about: statement typography */

function About({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L, href, list, li } = useSection(section, ctx);
  return (
    <Shell section={section}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <Reveal variant="start">{L("eyebrow") && <p className="eyebrow">{L("eyebrow")}</p>}</Reveal>
          {c.image ? (
            <Reveal variant="image" i={1} className="relative mt-8 hidden aspect-[3/4] overflow-hidden rounded-brand lg:block">
              <SmartImage src={String(c.image)} alt="" className="object-cover" sizes="30vw" />
            </Reveal>
          ) : null}
        </div>
        <div className="lg:col-span-8">
          <Reveal variant="up"><h2 className="h-display">{L("title")}</h2></Reveal>
          <Reveal i={1}><Markdown className="prose-brand mt-8 text-lg text-muted">{L("body")}</Markdown></Reveal>
          {list("highlights").length > 0 && (
            <dl className="mt-12 grid grid-cols-1 border-t border-line sm:grid-cols-2">
              {list("highlights").map((h, i) => (
                <Reveal key={i} i={i + 2} className="border-b border-line py-6 sm:pe-8 sm:[&:nth-child(odd)]:border-e sm:[&:nth-child(even)]:ps-8">
                  <dt className="flex items-center gap-2 font-bold"><span className="rhombus" aria-hidden />{li(h, "title")}</dt>
                  <dd className="mt-2 text-muted">{li(h, "text")}</dd>
                </Reveal>
              ))}
            </dl>
          )}
          {L("link_label") && href("link_href") && (
            <Reveal i={4}>
              <Link href={href("link_href")} className="btn btn-outline group mt-10">{L("link_label")} <Arrow dir={ctx.dir} /></Link>
            </Reveal>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ services: editorial index */

async function Services({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, s, L, href } = useSection(section, ctx);
  const limit = Number(c.limit) || 6;
  let items = await getServices({ featured: Boolean(s.featured_only), limit });
  if (!items.length && s.featured_only) items = await getServices({ limit });
  const cats = await getServiceCategories();
  const catName = (id: string | null) => pick(cats.find((x) => x.id === id)?.name, ctx.locale, ctx.defaultLocale);
  return (
    <Shell section={section}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Reveal variant="up" className="lg:sticky lg:top-28">
            {L("eyebrow") && <p className="eyebrow">{L("eyebrow")}</p>}
            <h2 className="h-section mt-3">{L("title")}</h2>
            {L("subtitle") && <p className="lead mt-4">{L("subtitle")}</p>}
            {L("link_label") && href("link_href") && (
              <Link href={href("link_href")} className="btn btn-outline group mt-8">{L("link_label")} <Arrow dir={ctx.dir} /></Link>
            )}
          </Reveal>
        </div>
        <div className="lg:col-span-8">
          {items.map((sv, i) => (
            <Reveal key={sv.id} i={i} variant="up"><ServiceRow service={sv} ctx={ctx} index={i} category={catName(sv.category_id)} /></Reveal>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ features: bento (statement cell + hairline cells) */

function Features({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L, list, li } = useSection(section, ctx);
  const items = list("items");
  if (!items.length) return null;
  const [first, ...rest] = items;
  const pair = items.length === 2;
  const cols = rest.length >= 4 ? "lg:grid-cols-4" : rest.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  const cell = (it: Item, i: number, big = false) => (
    <Reveal key={i} i={i} variant="fade" className={`group relative p-7 sm:p-9 ${big ? "ink" : ""}`}>
      <div className={big && !pair ? "grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-end lg:gap-12" : ""}>
        <div>
          <span className={`icon-tile ${big ? "!bg-white/10 !text-primary" : ""}`}><Icon name={String(it.icon ?? "")} className="h-5 w-5" /></span>
          <h3 className={`mt-6 font-bold ${big ? "text-2xl sm:text-3xl lg:text-4xl" : "text-lg"}`}>{li(it, "title")}</h3>
        </div>
        <p className={`leading-relaxed ${big ? "text-lg text-muted" : "mt-3 text-muted"} ${big && pair ? "mt-3" : ""}`}>{li(it, "text")}</p>
      </div>
    </Reveal>
  );
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} />
      {pair ? (
        <div className="hairline-grid grid-cols-1 md:grid-cols-2">{items.map((it, i) => cell(it, i, i === 0))}</div>
      ) : (
        <div className="hairline-grid grid-cols-1">
          {cell(first, 0, true)}
          <div className={`grid grid-cols-1 gap-px bg-line sm:grid-cols-2 ${cols}`}>
            {rest.map((it, i) => <div key={i} className="bg-bg">{cell(it, i + 1)}</div>)}
          </div>
        </div>
      )}
    </Shell>
  );
}

function Stats({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L, list, li } = useSection(section, ctx);
  return (
    <Shell section={section}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
        <Reveal variant="up" className="lg:col-span-4">
          {L("eyebrow") && <p className="eyebrow">{L("eyebrow")}</p>}
          <h2 className="h-section mt-3">{L("title")}</h2>
        </Reveal>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 lg:col-span-8 lg:grid-cols-4">
          {list("items").map((it, i) => (
            <Reveal key={i} i={i} variant="up" className="border-t-2 border-primary pt-5">
              <dd className="num text-4xl font-bold sm:text-5xl lg:text-6xl"><CountUp value={String(it.value ?? "")} /></dd>
              <dt className="mt-2 text-sm text-muted">{li(it, "label")}</dt>
            </Reveal>
          ))}
        </dl>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ projects: slider or featured-first grid */

async function Projects({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, s, L, href } = useSection(section, ctx);
  const limit = Number(c.limit) || 4;
  const L2 = (v: unknown) => pick(v as Localized, ctx.locale, ctx.defaultLocale);
  const action = L("link_label") && href("link_href") ? <Link href={href("link_href")} className="btn btn-outline group">{L("link_label")} <Arrow dir={ctx.dir} /></Link> : null;

  if (s.layout === "slider") {
    let items: Project[] = await getHomeProjects(12);
    if (!items.length) items = await getProjects({ featured: true, limit: 8 });
    if (!items.length) items = await getProjects({ limit: 8 });
    const categories = await getProjectCategories();
    const motion = sanitizeMotion(ctx.settings.motion);
    const slides: Slide[] = items.map((p) => ({
      id: p.id,
      href: p.slider_link ? localeHref(p.slider_link, ctx.locale) : `/${ctx.locale}/projects/${p.slug}`,
      target: p.link_target === "_blank" ? "_blank" : "_self",
      external: Boolean(p.slider_link && /^https?:/i.test(p.slider_link)),
      title: L2(p.title),
      excerpt: L2(p.excerpt),
      category: L2(categories.find((x) => x.id === p.category_id)?.name) || L2(p.project_type),
      alt: L2(p.cover_alt) || L2(p.title),
      image: prepareImage(p.cover_url ?? p.thumbnail_url, "(min-width:1024px) 64vw, (min-width:640px) 78vw, 86vw"),
      mobile: prepareImage(p.mobile_image_url, "86vw", 900, 1125),
    }));
    return (
      <section className="section overflow-hidden" data-section="projects">
        <div className="container-x"><Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} action={action} /></div>
        <Reveal variant="fade">
          <ProjectsSlider
            slides={slides}
            dir={ctx.dir}
            autoplay={motion.enabled && motion.slider_autoplay}
            interval={motion.slider_interval_ms}
            labels={{
              prev: ctx.t("slider.prev"), next: ctx.t("slider.next"), pause: ctx.t("slider.pause"), play: ctx.t("slider.play"),
              view: ctx.t("projects.view"), region: L("title") || ctx.t("slider.region"), slide: ctx.t("slider.slide"), of: ctx.t("slider.of"),
            }}
          />
        </Reveal>
      </section>
    );
  }

  let items = await getProjects({ featured: Boolean(s.featured_only), limit });
  if (!items.length && s.featured_only) items = await getProjects({ limit });
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} action={action} />
      <div className="grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2">
        {items.map((p, i) => (
          <Reveal key={p.id} i={i % 2} variant="up" className={i % 2 === 1 ? "md:mt-16" : ""}>
            <ProjectCard project={p} ctx={ctx} large />
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ process: numbered columns on a ruler */

function Process({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L, list, li } = useSection(section, ctx);
  const items = list("items");
  const cols = items.length >= 6 ? "lg:grid-cols-6" : items.length === 5 ? "lg:grid-cols-5" : items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} />
      <ol className={`relative grid grid-cols-1 sm:grid-cols-2 ${cols} lg:border-t lg:border-line`}>
        <span className="absolute inset-x-0 -top-px hidden h-0.5 bg-primary lg:block" data-draw aria-hidden />
        {items.map((it, i) => (
          <Reveal as="li" key={i} i={i} variant="up" className="group relative border-t border-line py-7 sm:pe-6 lg:border-t-0 lg:pt-8">
            <span className="absolute -top-[5px] start-0 hidden h-2.5 w-2.5 rotate-45 bg-accent lg:block" aria-hidden />
            <span className="num block text-5xl font-bold text-transparent [-webkit-text-stroke:1px_var(--color-muted)] transition-colors duration-500 group-hover:text-primary group-hover:[-webkit-text-stroke:1px_transparent] lg:text-6xl">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-5 text-lg font-bold">{li(it, "title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{li(it, "text")}</p>
          </Reveal>
        ))}
      </ol>
    </Shell>
  );
}

/* ------------------------------------------------------------------ technologies: marquee */

function Tech({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L } = useSection(section, ctx);
  const items = Array.isArray(c.items) ? (c.items as string[]) : [];
  if (!items.length) return null;
  const row = (dup: boolean) => (
    <ul className={`flex flex-none items-center ${dup ? "marquee-dup" : ""}`} aria-hidden={dup || undefined}>
      {items.map((t) => (
        <li key={t} className="flex items-center gap-6 whitespace-nowrap px-6 font-display text-2xl font-semibold text-fg/70 sm:text-3xl">
          {t}<span className="rhombus" aria-hidden />
        </li>
      ))}
    </ul>
  );
  return (
    <section className="border-y border-line py-12 sm:py-16" data-section="tech">
      <div className="container-x mb-8 flex flex-wrap items-end justify-between gap-4">
        <Reveal variant="up">
          {L("eyebrow") && <p className="eyebrow">{L("eyebrow")}</p>}
          {L("title") && <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{L("title")}</h2>}
        </Reveal>
        {L("subtitle") && <p className="max-w-md text-muted">{L("subtitle")}</p>}
      </div>
      <div className="marquee" style={{ ["--marquee-dur" as string]: `${Math.max(24, items.length * 4)}s` }}>
        <div className="marquee-track">{row(false)}{row(true)}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ clients: logo marquee */

async function Clients({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L } = useSection(section, ctx);
  const items = await getClients();
  if (!items.length) return null;
  const row = (dup: boolean) => (
    <ul className={`flex flex-none items-center ${dup ? "marquee-dup" : ""}`} aria-hidden={dup || undefined}>
      {items.map((cl) => {
        const name = pick(cl.name, ctx.locale, ctx.defaultLocale);
        const inner = cl.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cl.logo_url} alt={dup ? "" : name} loading="lazy" className="h-9 w-auto opacity-55 grayscale transition duration-500 hover:opacity-100 hover:grayscale-0 dark:invert" />
        ) : <span className="font-semibold text-muted">{name}</span>;
        return (
          <li key={cl.id} className="flex h-20 items-center whitespace-nowrap px-8 sm:px-12" title={name} dir="auto">
            {cl.website && !dup ? <a href={cl.website} target="_blank" rel="noopener noreferrer">{inner}</a> : inner}
          </li>
        );
      })}
    </ul>
  );
  return (
    <section className="py-14 sm:py-20" data-section="clients">
      <div className="container-x mb-6 text-center">
        <Reveal variant="fade">{L("title") && <p className="kicker">{L("title")}</p>}</Reveal>
      </div>
      <div className="marquee" style={{ ["--marquee-dur" as string]: `${Math.max(20, items.length * 5)}s` }}>
        <div className="marquee-track">{row(false)}{row(true)}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ testimonials: featured quote */

async function Testimonials({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L } = useSection(section, ctx);
  const items = await getTestimonials(Number(c.limit) || 6);
  if (!items.length) return null;
  const [lead, ...rest] = items;
  const P = (v: Localized) => pick(v, ctx.locale, ctx.defaultLocale);
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} />
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
        <Reveal as="figure" variant="up" className="lg:col-span-7">
          <span className="quote-mark block" aria-hidden>“</span>
          <blockquote className="mt-2 text-2xl font-semibold leading-relaxed sm:text-3xl">{P(lead.quote)}</blockquote>
          <figcaption className="mt-8 flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary font-bold text-on-primary">{P(lead.author_name).slice(0, 1)}</span>
            <span><span className="block font-bold">{P(lead.author_name)}</span><span className="text-sm text-muted">{P(lead.author_title)}</span></span>
          </figcaption>
        </Reveal>
        {rest.length > 0 && (
          <div className="divide-y divide-line border-y border-line lg:col-span-5">
            {rest.map((t, i) => (
              <Reveal as="figure" key={t.id} i={i + 1} variant="fade" className="py-6">
                <blockquote className="leading-relaxed">“{P(t.quote)}”</blockquote>
                <figcaption className="mt-3 text-sm"><span className="font-semibold">{P(t.author_name)}</span> <span className="text-muted">— {P(t.author_title)}</span></figcaption>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

export function Faq({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L, list, li } = useSection(section, ctx);
  const items = list("items");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({ "@type": "Question", name: li(it, "question"), acceptedAnswer: { "@type": "Answer", text: li(it, "answer") } })),
  };
  return (
    <Shell section={section}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <Reveal variant="start" className="lg:col-span-4">
          {L("eyebrow") && <p className="eyebrow">{L("eyebrow")}</p>}
          <h2 className="h-section mt-3">{L("title")}</h2>
        </Reveal>
        <div className="divide-y divide-line border-y border-line lg:col-span-8">
          {items.map((it, i) => (
            <Reveal key={i} i={i} variant="fade">
              <details className="group py-5" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-lg font-semibold transition-colors hover:text-primary [&::-webkit-details-marker]:hidden">
                  {li(it, "question")}
                  <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line transition-all duration-300 group-open:rotate-45 group-open:border-primary group-open:bg-primary group-open:text-on-primary">
                    <Plus className="h-4 w-4" aria-hidden />
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl leading-relaxed text-muted">{li(it, "answer")}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    </Shell>
  );
}

async function Team({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, s, L } = useSection(section, ctx);
  const items = await getTeam({ foundersOnly: Boolean(s.founders_only), limit: Number(c.limit) || undefined });
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((m, i) => <Reveal key={m.id} i={i % 4} variant="up" className="h-full"><TeamCard member={m} ctx={ctx} /></Reveal>)}
      </div>
    </Shell>
  );
}

async function Posts({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L, href } = useSection(section, ctx);
  const items = await getPosts({ limit: Number(c.limit) || 3 });
  if (!items.length) return null;
  const [lead, ...rest] = items;
  return (
    <Shell section={section}>
      <Heading
        eyebrow={L("eyebrow")}
        title={L("title")}
        action={L("link_label") && href("link_href") ? <Link href={href("link_href")} className="btn btn-outline group">{L("link_label")} <Arrow dir={ctx.dir} /></Link> : null}
      />
      <Reveal variant="up"><PostFeature post={lead} ctx={ctx} /></Reveal>
      {rest.length > 0 && (
        <div className="mt-14 grid grid-cols-1 gap-8 border-t border-line pt-10 md:grid-cols-2">
          {rest.map((p, i) => <Reveal key={p.id} i={i} variant="up"><PostCard post={p} ctx={ctx} /></Reveal>)}
        </div>
      )}
    </Shell>
  );
}

function RichText({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L } = useSection(section, ctx);
  return (
    <Shell section={section}>
      <Reveal as="article" variant="fade" className="mx-auto max-w-3xl">
        {L("title") && <h2 className="h-section mb-8">{L("title")}</h2>}
        <Markdown>{L("body")}</Markdown>
      </Reveal>
    </Shell>
  );
}

function ImageText({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, s, L, href } = useSection(section, ctx);
  const imageFirst = s.image_side === "start";
  return (
    <Shell section={section}>
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal variant="image" className={`relative aspect-[4/3] overflow-hidden rounded-brand-lg bg-subtle ${imageFirst ? "" : "lg:order-2"}`}>
          {c.image ? <SmartImage src={String(c.image)} alt="" className="object-cover" /> : <HeroArt compact />}
        </Reveal>
        <div>
          <Reveal variant={imageFirst ? "end" : "start"}>
            {L("eyebrow") && <p className="eyebrow">{L("eyebrow")}</p>}
            <h2 className="h-section mt-3">{L("title")}</h2>
          </Reveal>
          <Reveal i={1}><Markdown className="prose-brand mt-6 text-muted">{L("body")}</Markdown></Reveal>
          {L("link_label") && href("link_href") && (
            <Reveal i={2}><Link href={href("link_href")} className="btn btn-primary group mt-8">{L("link_label")} <Arrow dir={ctx.dir} /></Link></Reveal>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ CTA: ink stage with quick channels */

function Cta({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L, href } = useSection(section, ctx);
  const contact = ctx.settings.contact ?? {};
  const wa = typeof contact.whatsapp === "string" ? contact.whatsapp.replace(/[^\d]/g, "") : "";
  return (
    <section className="section" data-section="cta">
      <div className="container-x">
        <Reveal variant="scale" className="ink stage px-6 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          <div className="bg-measure pointer-events-none absolute inset-0 -z-10 opacity-30" aria-hidden />
          <div className="pointer-events-none absolute -top-24 start-1/3 -z-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-glow" aria-hidden />
          <BrandSymbol className="pointer-events-none absolute -bottom-16 end-[-2rem] -z-10 h-64 w-64 opacity-[0.08] animate-drift sm:h-80 sm:w-80" />
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <h2 className="h-display">{L("title")}</h2>
              {L("subtitle") && <p className="lead mt-5 text-lg">{L("subtitle")}</p>}
              <div className="mt-9"><CtaButtons ctx={ctx} primary={[L("primary_label"), href("primary_href")]} secondary={[L("secondary_label"), href("secondary_href")]} /></div>
            </div>
            {(contact.email || wa) && (
              <ul className="space-y-3 border-t border-line pt-6 lg:col-span-4 lg:col-start-9 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
                {contact.email && (
                  <li><a href={`mailto:${contact.email}`} className="group flex items-center gap-3 hover:text-primary"><span className="icon-tile !bg-white/10"><Mail className="h-5 w-5" /></span><span dir="ltr" className="font-semibold">{contact.email}</span></a></li>
                )}
                {wa && (
                  <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 hover:text-primary"><span className="icon-tile !bg-white/10"><MessageCircle className="h-5 w-5" /></span><span className="font-semibold">{ctx.t("contact.whatsapp")}</span></a></li>
                )}
              </ul>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ContactInfo({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L } = useSection(section, ctx);
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} />
      <Reveal variant="up"><ContactDetails ctx={ctx} /></Reveal>
    </Shell>
  );
}

const RENDERERS: Record<string, (p: { section: PageSection; ctx: SiteContext }) => React.ReactNode | Promise<React.ReactNode>> = {
  hero: Hero,
  page_header: PageHeader,
  about: About,
  services: Services,
  features: Features,
  stats: Stats,
  projects: Projects,
  process: Process,
  tech: Tech,
  clients: Clients,
  testimonials: Testimonials,
  faq: Faq,
  team: Team,
  posts: Posts,
  rich_text: RichText,
  image_text: ImageText,
  cta: Cta,
  contact_info: ContactInfo,
};

export function RenderSections({ sections, ctx, skip = [] }: { sections?: PageSection[]; ctx: SiteContext; skip?: string[] }) {
  return (
    <>
      {(sections ?? [])
        .filter((s) => s.is_visible && !skip.includes(s.type))
        .map((s) => {
          const R = RENDERERS[s.type];
          return R ? <R key={s.id} section={s} ctx={ctx} /> : null;
        })}
    </>
  );
}
