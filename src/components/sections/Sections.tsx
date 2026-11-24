import Link from "next/link";
import { ArrowDown, Check, Plus } from "lucide-react";
import { Arrow, PostCard, ProjectCard, SectionHeading, ServiceCard, TeamCard, TestimonialCard } from "@/components/site/cards";
import { ContactDetails } from "@/components/site/ContactDetails";
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
import { getClients, getHomeProjects, getPosts, getProjectCategories, getProjects, getServices, getTeam, getTestimonials } from "@/services/content";
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
  const bgClass = bg === "muted" ? "bg-softer" : bg === "brand" ? "bg-primary text-on-primary" : bg === "measure" ? "relative overflow-hidden" : "";
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

function CtaButtons({ ctx, primary, secondary, inverse = false }: { ctx: SiteContext; primary?: [string, string]; secondary?: [string, string]; inverse?: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      {primary?.[0] && primary[1] && (
        <Link href={primary[1]} className={`btn group ${inverse ? "btn-accent" : "btn-primary"} min-h-12 px-6`}>
          {primary[0]} <Arrow dir={ctx.dir} />
        </Link>
      )}
      {secondary?.[0] && secondary[1] && (
        <Link href={secondary[1]} className={`btn min-h-12 px-6 ${inverse ? "border-white/30 text-current hover:bg-white/10" : "btn-outline"}`}>
          {secondary[0]}
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ sections */

function Hero({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L, href, list, li } = useSection(section, ctx);
  return (
    <section className="relative isolate overflow-hidden" data-section="hero">
      {/* layered technical background: measure grid, soft brand glows, drawn guide lines */}
      <div className="bg-measure bg-measure-fade pointer-events-none absolute inset-0 -z-10 opacity-80" data-parallax="slow" aria-hidden />
      <div className="pointer-events-none absolute -top-40 end-[-10%] -z-10 h-[34rem] w-[34rem] rounded-full bg-primary/20 blur-3xl animate-glow" aria-hidden />
      <div className="pointer-events-none absolute -bottom-48 start-[-12%] -z-10 h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-3xl animate-glow [animation-delay:-4s]" aria-hidden />
      <svg className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-line" aria-hidden preserveAspectRatio="none" viewBox="0 0 1440 800">
        <path className="draw-path" style={{ ["--len" as string]: 1700, ["--d" as string]: "0.2s" }} d="M-20 620 C 320 560, 520 700, 820 560 S 1300 420, 1460 470" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path className="draw-path" style={{ ["--len" as string]: 1700, ["--d" as string]: "0.5s" }} d="M-20 680 C 360 600, 600 760, 900 620 S 1320 500, 1460 540" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 8" />
      </svg>
      <div className="container-x relative grid min-h-[calc(100svh-var(--header-h))] grid-cols-1 items-center gap-10 pb-16 pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-12 lg:pb-24">
        <div className="lg:col-span-7">
          {L("eyebrow") && <p className="eyebrow hero-in" style={{ ["--i" as string]: 0 }}>{L("eyebrow")}</p>}
          <h1 className="h-display hero-in mt-5" style={{ ["--i" as string]: 1 }}>{L("title")}</h1>
          {L("subtitle") && <p className="lead hero-in mt-6 max-w-2xl" style={{ ["--i" as string]: 2 }}>{L("subtitle")}</p>}
          <div className="hero-in mt-9" style={{ ["--i" as string]: 3 }}>
            <CtaButtons ctx={ctx} primary={[L("primary_label"), href("primary_href")]} secondary={[L("secondary_label"), href("secondary_href")]} />
          </div>
          {list("highlights").length > 0 && (
            <ul className="hero-in mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted" style={{ ["--i" as string]: 4 }}>
              {list("highlights").map((h, i) => (
                <li key={i} className="inline-flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-soft text-primary"><Check className="h-3 w-3" aria-hidden /></span>
                  {li(h, "text")}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="hero-in relative mx-auto w-full max-w-md sm:max-w-lg lg:col-span-5 lg:max-w-none" style={{ ["--i" as string]: 2 }}>
          {c.image ? (
            <div className="relative aspect-[4/5] overflow-hidden rounded-brand-lg shadow-[var(--shadow-lg)]" data-parallax="slow">
              <SmartImage src={String(c.image)} alt="" priority className="object-cover" sizes="(min-width:1024px) 40vw, 90vw" />
            </div>
          ) : (
            <div data-parallax="slow"><HeroArt /></div>
          )}
        </div>
        <a href="#main-content-start" className="absolute bottom-6 start-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-muted transition-colors hover:text-primary lg:flex rtl:translate-x-1/2" aria-label={ctx.t("common.scroll")}>
          <span className="grid h-10 w-6 justify-center rounded-full border border-line pt-2"><ArrowDown className="h-3.5 w-3.5 animate-bounce motion-reduce:animate-none" /></span>
        </a>
      </div>
      <span id="main-content-start" aria-hidden />
    </section>
  );
}

function PageHeader({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L } = useSection(section, ctx);
  return (
    <section className="relative isolate overflow-hidden border-b border-line" data-section="page_header">
      <div className="bg-measure bg-measure-fade pointer-events-none absolute inset-0 -z-10 opacity-70" data-parallax="slow" aria-hidden />
      <div className="pointer-events-none absolute -top-32 end-[-8%] -z-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl animate-glow" aria-hidden />
      <div className="container-x relative py-16 sm:py-20 lg:py-28">
        {L("eyebrow") && <p className="eyebrow hero-in">{L("eyebrow")}</p>}
        <h1 className="h-display hero-in mt-4 max-w-4xl" style={{ ["--i" as string]: 1 }}>{L("title")}</h1>
        {L("subtitle") && <p className="lead hero-in mt-5 max-w-2xl" style={{ ["--i" as string]: 2 }}>{L("subtitle")}</p>}
      </div>
    </section>
  );
}

function About({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L, href, list, li } = useSection(section, ctx);
  return (
    <Shell section={section}>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal variant="start">
            {L("eyebrow") && <p className="eyebrow">{L("eyebrow")}</p>}
            <h2 className="h-section mt-3">{L("title")}</h2>
          </Reveal>
          {c.image ? (
            <Reveal variant="image" i={1} className="relative mt-8 aspect-[4/3] overflow-hidden rounded-brand">
              <SmartImage src={String(c.image)} alt="" className="object-cover" />
            </Reveal>
          ) : null}
        </div>
        <div className="lg:col-span-7">
          <Reveal i={1}><Markdown className="prose-brand text-lg text-fg/90">{L("body")}</Markdown></Reveal>
          {list("highlights").length > 0 && (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {list("highlights").map((h, i) => (
                <Reveal key={i} i={i + 2} className="border-s-2 border-accent ps-5">
                  <h3 className="font-bold">{li(h, "title")}</h3>
                  <p className="mt-1.5 text-muted">{li(h, "text")}</p>
                </Reveal>
              ))}
            </div>
          )}
          {L("link_label") && href("link_href") && (
            <Reveal i={4}>
              <Link href={href("link_href")} className="link-u group mt-10 inline-flex items-center gap-2 py-1 font-semibold text-primary after:!inset-x-0 after:!bottom-0">
                {L("link_label")} <Arrow dir={ctx.dir} />
              </Link>
            </Reveal>
          )}
        </div>
      </div>
    </Shell>
  );
}

async function Services({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, s, L, href } = useSection(section, ctx);
  const limit = Number(c.limit) || 6;
  let items = await getServices({ featured: Boolean(s.featured_only), limit });
  if (!items.length && s.featured_only) items = await getServices({ limit });
  return (
    <Shell section={section}>
      <Heading
        eyebrow={L("eyebrow")}
        title={L("title")}
        subtitle={L("subtitle")}
        action={L("link_label") && href("link_href") ? <Link href={href("link_href")} className="btn btn-outline group">{L("link_label")} <Arrow dir={ctx.dir} /></Link> : null}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {items.map((sv, i) => (
          <Reveal key={sv.id} i={i % 3} variant="up" className="h-full"><ServiceCard service={sv} ctx={ctx} index={i} /></Reveal>
        ))}
      </div>
    </Shell>
  );
}

function Features({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { s, L, list, li } = useSection(section, ctx);
  const cols = String(s.columns ?? "3");
  const grid = cols === "2" ? "sm:grid-cols-2" : cols === "4" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} />
      <div className={`grid grid-cols-1 gap-4 sm:gap-5 ${grid}`}>
        {list("items").map((it, i) => (
          <Reveal key={i} i={i % 4} variant="scale" className="group card card-hover spotlight p-7">
            <span className="icon-tile"><Icon name={String(it.icon ?? "")} className="h-5 w-5" /></span>
            <h3 className="mt-5 text-lg font-bold">{li(it, "title")}</h3>
            <p className="mt-2 leading-relaxed text-muted">{li(it, "text")}</p>
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}

function Stats({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L, list, li } = useSection(section, ctx);
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} />
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-brand border border-line bg-line lg:grid-cols-4">
        {list("items").map((it, i) => (
          <Reveal key={i} i={i} variant="fade" className="group relative bg-surface p-6 sm:p-8 lg:p-10">
            <dt className="text-sm text-muted">{li(it, "label")}</dt>
            <dd className="mt-3 font-display text-4xl font-bold text-primary tabular-nums sm:text-5xl" dir="ltr">
              <CountUp value={String(it.value ?? "")} />
            </dd>
            <span className="absolute inset-x-6 bottom-0 h-0.5 origin-left scale-x-0 rtl:origin-right bg-accent transition-transform duration-500 group-hover:scale-x-100" aria-hidden />
          </Reveal>
        ))}
      </dl>
    </Shell>
  );
}

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
    const slides: Slide[] = items.map((p) => {
      const external = Boolean(p.slider_link && /^https?:/i.test(p.slider_link));
      return {
        id: p.id,
        href: p.slider_link ? localeHref(p.slider_link, ctx.locale) : `/${ctx.locale}/projects/${p.slug}`,
        target: p.link_target === "_blank" ? "_blank" : "_self",
        external,
        title: L2(p.title),
        excerpt: L2(p.excerpt),
        category: L2(categories.find((x) => x.id === p.category_id)?.name) || L2(p.project_type),
        alt: L2(p.cover_alt) || L2(p.title),
        image: prepareImage(p.cover_url ?? p.thumbnail_url, "(min-width:1024px) 64vw, (min-width:640px) 78vw, 86vw"),
        mobile: prepareImage(p.mobile_image_url, "86vw", 900, 1125),
      };
    });
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

function Process({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L, list, li } = useSection(section, ctx);
  const items = list("items");
  const cols = items.length >= 6 ? "lg:grid-cols-6" : items.length === 5 ? "lg:grid-cols-5" : items.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3";
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} />
      <div className="relative">
        {/* connecting line (desktop: horizontal, mobile: vertical) drawn on reveal */}
        <span className="absolute inset-x-[4%] top-5 hidden h-px bg-primary/40 lg:block" data-draw aria-hidden />
        <span className="absolute bottom-6 start-5 top-6 w-px bg-line lg:hidden" aria-hidden />
        <ol className={`relative grid grid-cols-1 gap-8 sm:gap-10 lg:gap-6 ${cols}`}>
          {items.map((it, i) => (
            <Reveal as="li" key={i} i={i} variant="up" className="group relative ps-14 lg:ps-0">
              <span className="absolute start-0 top-0 grid h-10 w-10 place-items-center rounded-full border border-line bg-bg font-display text-sm font-bold text-primary tabular-nums transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary lg:relative">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-0 text-lg font-bold lg:mt-6">{li(it, "title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{li(it, "text")}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </Shell>
  );
}

function Tech({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L } = useSection(section, ctx);
  const items = Array.isArray(c.items) ? (c.items as string[]) : [];
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} align="center" />
      <ul className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2.5 sm:gap-3" dir="ltr">
        {items.map((t, i) => (
          <Reveal as="li" key={t} i={i % 8} variant="scale" className="chip px-4 py-2 text-sm transition-colors duration-300 hover:border-primary hover:text-primary">
            <span className="rhombus scale-75" aria-hidden />{t}
          </Reveal>
        ))}
      </ul>
    </Shell>
  );
}

async function Clients({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L } = useSection(section, ctx);
  const items = await getClients();
  if (!items.length) return null;
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} align="center" />
      <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-brand border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {items.map((cl, i) => {
          const name = pick(cl.name, ctx.locale, ctx.defaultLocale);
          const inner = cl.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cl.logo_url} alt={name} loading="lazy" className="max-h-10 w-auto opacity-60 grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0 dark:invert" />
          ) : (
            <span className="font-semibold text-muted">{name}</span>
          );
          return (
            <Reveal as="li" key={cl.id} i={i % 6} variant="fade" className="group grid h-24 place-items-center bg-surface p-5 sm:h-28">
              {cl.website ? <a href={cl.website} target="_blank" rel="noopener noreferrer" title={name}>{inner}</a> : inner}
            </Reveal>
          );
        })}
      </ul>
    </Shell>
  );
}

async function Testimonials({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L } = useSection(section, ctx);
  const items = await getTestimonials(Number(c.limit) || 6);
  if (!items.length) return null;
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {items.map((t, i) => <Reveal key={t.id} i={i} variant="up" className="h-full"><TestimonialCard item={t} ctx={ctx} /></Reveal>)}
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
                <p className="mt-3 leading-relaxed text-muted">{li(it, "answer")}</p>
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
  return (
    <Shell section={section}>
      <Heading
        eyebrow={L("eyebrow")}
        title={L("title")}
        action={L("link_label") && href("link_href") ? <Link href={href("link_href")} className="btn btn-outline group">{L("link_label")} <Arrow dir={ctx.dir} /></Link> : null}
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {items.map((p, i) => <Reveal key={p.id} i={i} variant="up"><PostCard post={p} ctx={ctx} /></Reveal>)}
      </div>
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

function Cta({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L, href } = useSection(section, ctx);
  const brandBg = (section.settings?.background ?? "brand") === "brand";
  return (
    <section className="section" data-section="cta">
      <div className="container-x">
        <Reveal variant="scale" className={`relative isolate overflow-hidden rounded-brand-lg px-6 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-24 ${brandBg ? "bg-primary text-on-primary" : "card"}`}>
          <div className="bg-measure pointer-events-none absolute inset-0 -z-10 opacity-25" aria-hidden />
          <div className="pointer-events-none absolute -top-24 start-1/3 -z-10 h-72 w-72 rounded-full bg-accent/35 blur-3xl animate-glow" aria-hidden />
          <svg className="pointer-events-none absolute -bottom-20 end-[-3rem] -z-10 h-72 w-72 opacity-25 animate-drift sm:h-96 sm:w-96" viewBox="0 0 64 64" aria-hidden>
            <path d="M8 30A24 22 0 0 0 56 30L48 30A16 12 0 0 1 16 30Z" fill="currentColor" />
            <path d="M32 7L40 15L32 23L24 15Z" fill="var(--color-accent)" />
          </svg>
          <div className="relative max-w-2xl">
            <h2 className="h-section">{L("title")}</h2>
            {L("subtitle") && <p className={`mt-4 text-lg leading-relaxed ${brandBg ? "opacity-85" : "text-muted"}`}>{L("subtitle")}</p>}
            <div className="mt-8">
              <CtaButtons ctx={ctx} inverse={brandBg} primary={[L("primary_label"), href("primary_href")]} secondary={[L("secondary_label"), href("secondary_href")]} />
            </div>
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
