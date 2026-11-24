import Link from "next/link";
import { Award, BadgeCheck, Gauge, Mail, MessageCircle, Plus, Rocket, Star, Users } from "lucide-react";
import { Arrow, PostCard, ProjectCard, SectionHeading, TeamCard } from "@/components/site/cards";
import { ContactDetails } from "@/components/site/ContactDetails";
import { CountUp } from "@/components/motion/CountUp";
import { Rotator } from "@/components/motion/Rotator";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/ui/Markdown";
import { Reveal } from "@/components/ui/Reveal";
import { SmartImage } from "@/components/ui/SmartImage";
import { HeroArt } from "./HeroArt";
import { ProjectsShowcase, type ShowcaseItem } from "./ProjectsShowcase";
import { ServicesExplorer } from "./ServicesExplorer";
import { HeroParticles } from "@/components/effects/HeroParticles";
import { localeHref, pick } from "@/lib/i18n";
import { prepareImage } from "@/lib/images";
import {
  getClients, getHomeProjects, getPosts, getProjectCategories, getProjects, getServiceCategories, getServices, getTeam, getTestimonials,
} from "@/services/content";
import type { SiteContext } from "@/services/site";
import type { Localized, PageSection, Project, TextItem } from "@/types/content";

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

function CtaButtons({ ctx, primary, secondary, center = false }: { ctx: SiteContext; primary?: [string, string]; secondary?: [string, string]; center?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 ${center ? "justify-center" : ""}`}>
      {primary?.[0] && primary[1] && (
        <Link href={primary[1]} className="btn btn-primary group min-h-12 rounded-pill px-6">
          <Rocket className="h-4 w-4" aria-hidden />{primary[0]}
        </Link>
      )}
      {secondary?.[0] && secondary[1] && (
        <Link href={secondary[1]} className="btn btn-outline group min-h-12 rounded-pill px-6">
          {secondary[0]} <Arrow dir={ctx.dir} />
        </Link>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ hero: rounded panel, rotating pill, journey collage */

async function Hero({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L, href, list, li } = useSection(section, ctx);
  const [categories, projects] = await Promise.all([getServiceCategories(), getHomeProjects(4)]);
  const words = categories.map((x) => pick(x.name, ctx.locale, ctx.defaultLocale)).filter(Boolean);
  const P = (v: Localized) => pick(v, ctx.locale, ctx.defaultLocale);
  const cards = projects.slice(0, 4);
  const offsets = ["lg:translate-y-10", "lg:-translate-y-4", "lg:translate-y-16", "lg:translate-y-0"];
  return (
    <section className="px-2 pt-3 sm:px-4" data-section="hero">
      <div className="panel-soft relative isolate overflow-hidden" data-hero-host>
        <div className="hero-dotgrid bg-measure bg-measure-fade pointer-events-none absolute inset-0 -z-10 opacity-60" data-parallax="slow" aria-hidden />
        <div className="hero-glow pointer-events-none absolute -top-40 start-[-10%] -z-10 h-[30rem] w-[30rem] rounded-full bg-primary/15 blur-3xl animate-glow" aria-hidden />
        <div className="hero-glow pointer-events-none absolute -bottom-40 end-[-10%] -z-10 h-[26rem] w-[26rem] rounded-full bg-accent/15 blur-3xl animate-glow [animation-delay:-4s]" aria-hidden />
        {/* interactive particle grid — settings: CMS → Hero effect (site_settings.hero_effect) */}
        <HeroParticles settings={ctx.settings.hero_effect} />

        <div className="container-x flex flex-col items-center pb-10 pt-14 text-center sm:pt-20">
          {L("eyebrow") && <p className="badge-pill hero-in">{L("eyebrow")}</p>}
          <h1 className="h-hero hero-in mt-7 max-w-5xl" style={{ ["--i" as string]: 1 }} data-hero-title>{L("title")}</h1>
          {words.length > 0 && (
            <p className="hero-in mt-6 flex flex-wrap items-center justify-center gap-3 text-lg font-semibold sm:text-xl" style={{ ["--i" as string]: 2 }}>
              <span className="text-muted">{ctx.t("hero.specialized")}</span>
              <Rotator words={words} className="inline-flex rounded-pill bg-primary px-4 py-1.5 text-on-primary shadow-[0_10px_30px_-12px_var(--color-primary)]" />
            </p>
          )}
          {L("subtitle") && <p className="lead hero-in mt-6" style={{ ["--i" as string]: 3 }}>{L("subtitle")}</p>}
          <div className="hero-in mt-9" style={{ ["--i" as string]: 4 }}>
            <CtaButtons ctx={ctx} center primary={[L("primary_label"), href("primary_href")]} secondary={[L("secondary_label"), href("secondary_href")]} />
          </div>
          {list("highlights").length > 0 && (
            <ul className="hero-in mt-8 flex flex-wrap justify-center gap-2" style={{ ["--i" as string]: 5 }}>
              {list("highlights").map((h, i) => (
                <li key={i} className="inline-flex items-center gap-2 rounded-pill border border-line bg-surface px-3.5 py-1.5 text-sm"><span className="rhombus scale-75" aria-hidden />{li(h, "text")}</li>
              ))}
            </ul>
          )}
        </div>

        {/* journey collage: real homepage projects linked by an animated connector */}
        {cards.length > 0 ? (
          <div className="container-x relative pb-14 lg:pb-24">
            <svg className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-40 w-full -translate-y-1/2 text-primary lg:block" viewBox="0 0 1200 160" preserveAspectRatio="none" aria-hidden>
              <path className="journey-line" d="M20 110 C 180 20, 300 150, 450 70 S 760 10, 900 120 S 1120 60, 1180 40" fill="none" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" />
            </svg>
            <ol className="relative grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-8">
              {cards.map((p, i) => (
                <Reveal as="li" key={p.id} i={i} variant="scale" className={`${offsets[i]} ${i > 1 ? "hidden sm:block" : ""}`}>
                  <Link href={p.slider_link ? localeHref(p.slider_link, ctx.locale) : `/${ctx.locale}/projects/${p.slug}`} className="lift group block overflow-hidden p-2">
                    <div className="img-zoom relative aspect-[4/3] overflow-hidden rounded-[calc(var(--radius)*0.9)] bg-subtle">
                      <SmartImage src={p.cover_url ?? p.thumbnail_url} alt={P(p.cover_alt ?? {}) || P(p.title)} priority={i < 2} className="object-cover" sizes="(min-width:1024px) 24vw, 45vw" />
                    </div>
                    <div className="flex items-center gap-2 px-2 pb-1 pt-3 text-start">
                      <span className="num grid h-7 w-7 flex-none place-items-center rounded-full bg-soft text-xs font-bold text-primary">{String(i + 1).padStart(2, "0")}</span>
                      <span className="truncate text-sm font-semibold">{P(p.title)}</span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </ol>
          </div>
        ) : c.image ? (
          <div className="container-x pb-14"><div className="relative mx-auto aspect-[16/8] max-w-5xl overflow-hidden rounded-[calc(var(--radius)*2)]"><SmartImage src={String(c.image)} alt="" priority className="object-cover" sizes="90vw" /></div></div>
        ) : (
          <div className="container-x pb-12"><div className="mx-auto max-w-md"><HeroArt /></div></div>
        )}
      </div>
    </section>
  );
}

function PageHeader({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L } = useSection(section, ctx);
  return (
    <section className="px-2 pt-3 sm:px-4" data-section="page_header">
      <div className="panel-soft relative isolate overflow-hidden">
        <div className="bg-measure bg-measure-fade pointer-events-none absolute inset-0 -z-10 opacity-60" data-parallax="slow" aria-hidden />
        <div className="pointer-events-none absolute -top-32 end-[-8%] -z-10 h-80 w-80 rounded-full bg-primary/15 blur-3xl animate-glow" aria-hidden />
        <div className="container-x flex flex-col items-center py-14 text-center sm:py-20">
          <nav aria-label="Breadcrumb" className="hero-in text-sm text-muted">
            <ol className="flex items-center gap-2">
              <li><Link href={`/${ctx.locale}`} className="hover:text-primary">{ctx.t("common.home")}</Link></li>
              <li aria-hidden className="rhombus scale-50" />
              <li aria-current="page" className="font-semibold text-fg">{L("eyebrow") || L("title")}</li>
            </ol>
          </nav>
          <h1 className="h-display hero-in mt-5 max-w-4xl" style={{ ["--i" as string]: 1 }}>{L("title")}</h1>
          {L("subtitle") && <p className="lead hero-in mt-5" style={{ ["--i" as string]: 2 }}>{L("subtitle")}</p>}
          <div className="hero-in mt-8" style={{ ["--i" as string]: 3 }}>
            <CtaButtons ctx={ctx} center primary={[ctx.t("common.start_project"), `/${ctx.locale}/request`]} secondary={[ctx.t("common.contact_us"), `/${ctx.locale}/contact`]} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ about: text + visual */

function About({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L, href, list, li } = useSection(section, ctx);
  return (
    <Shell section={section}>
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal variant="start">
            {L("eyebrow") && <p className="badge-pill">{L("eyebrow")}</p>}
            <h2 className="h-section mt-5">{L("title")}</h2>
          </Reveal>
          <Reveal i={1}><Markdown className="prose-brand mt-6 text-lg text-muted">{L("body")}</Markdown></Reveal>
          {list("highlights").length > 0 && (
            <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {list("highlights").map((h, i) => (
                <Reveal as="li" key={i} i={i + 2} className="lift flex gap-3 p-4">
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-soft text-primary"><BadgeCheck className="h-5 w-5" aria-hidden /></span>
                  <span><span className="block font-bold">{li(h, "title")}</span><span className="mt-1 block text-sm text-muted">{li(h, "text")}</span></span>
                </Reveal>
              ))}
            </ul>
          )}
          {L("link_label") && href("link_href") && (
            <Reveal i={4}><Link href={href("link_href")} className="btn btn-primary group mt-8 rounded-pill px-6">{L("link_label")} <Arrow dir={ctx.dir} /></Link></Reveal>
          )}
        </div>
        <Reveal variant="image" className="relative aspect-[5/4] overflow-hidden rounded-[calc(var(--radius)*2)] bg-subtle">
          {c.image ? <SmartImage src={String(c.image)} alt="" className="object-cover" /> : (
            <div className="panel-brand absolute inset-0 grid place-items-center"><div className="w-3/4"><HeroArt compact /></div></div>
          )}
        </Reveal>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ services: tabbed explorer */

async function Services({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, s, L, href } = useSection(section, ctx);
  const limit = Number(c.limit) || 8;
  let items = await getServices({ featured: Boolean(s.featured_only), limit });
  if (items.length < 3) items = await getServices({ limit });
  const cats = await getServiceCategories();
  const P = (v: Localized | undefined) => pick(v, ctx.locale, ctx.defaultLocale);
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} />
      <Reveal variant="up">
        <ServicesExplorer
          dir={ctx.dir}
          labels={{ details: ctx.t("services.details"), request: ctx.t("common.request_service"), prev: ctx.t("slider.prev"), next: ctx.t("slider.next") }}
          services={items.map((sv) => ({
            id: sv.id,
            title: P(sv.title),
            excerpt: P(sv.excerpt),
            category: P(cats.find((x) => x.id === sv.category_id)?.name),
            icon: sv.icon,
            image: sv.image_url,
            features: (sv.features ?? []).slice(0, 4).map((f: TextItem) => P(f.title)).filter(Boolean),
            href: `/${ctx.locale}/services/${sv.slug}`,
            requestHref: `/${ctx.locale}/request?service=${sv.slug}`,
          }))}
        />
      </Reveal>
      {L("link_label") && href("link_href") && (
        <div className="mt-8 flex justify-center"><Link href={href("link_href")} className="btn btn-outline group rounded-pill px-6">{L("link_label")} <Arrow dir={ctx.dir} /></Link></div>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------ features: icon cards */

function Features({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { s, L, list, li } = useSection(section, ctx);
  const items = list("items");
  const cols = String(s.columns ?? (items.length >= 4 ? "4" : items.length === 2 ? "2" : "3"));
  const grid = cols === "2" ? "md:grid-cols-2" : cols === "4" ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} />
      <div className={`grid grid-cols-1 gap-5 ${grid}`}>
        {items.map((it, i) => (
          <Reveal key={i} i={i % 4} variant="up" className="lift spotlight group relative overflow-hidden p-7">
            <span className="num absolute end-5 top-5 text-4xl font-bold text-primary/10">{String(i + 1).padStart(2, "0")}</span>
            <span className="icon-tile h-12 w-12 rounded-2xl"><Icon name={String(it.icon ?? "")} className="h-6 w-6" /></span>
            <h3 className="mt-6 text-xl font-bold">{li(it, "title")}</h3>
            <p className="mt-3 leading-relaxed text-muted">{li(it, "text")}</p>
          </Reveal>
        ))}
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ stats: cards + satisfaction bar */

async function Stats({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L, list, li } = useSection(section, ctx);
  const testimonials = await getTestimonials(20);
  const avg = testimonials.length ? testimonials.reduce((a, t) => a + (t.rating || 0), 0) / testimonials.length : 0;
  const icons = [Award, Users, Gauge, BadgeCheck];
  const items = list("items");
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} />
      <dl className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${items.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {items.map((it, i) => {
          const I = icons[i % icons.length];
          return (
            <Reveal key={i} i={i} variant="up" className="lift p-7 text-center">
              <span className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${i % 2 ? "bg-accent-soft text-accent" : "bg-soft text-primary"}`}><I className="h-6 w-6" aria-hidden /></span>
              <dd className={`num mt-5 text-4xl font-bold sm:text-5xl ${i % 2 ? "text-accent" : "text-primary"}`}><CountUp value={String(it.value ?? "")} /></dd>
              <dt className="mt-2 font-semibold">{li(it, "label")}</dt>
            </Reveal>
          );
        })}
      </dl>
      {avg > 0 && (
        <Reveal variant="up" className="ink mt-6 flex flex-col items-center justify-between gap-5 rounded-[calc(var(--radius)*1.6)] px-6 py-5 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3 rtl:space-x-reverse" aria-hidden>
              {testimonials.slice(0, 4).map((t) => (
                <span key={t.id} className="grid h-10 w-10 place-items-center rounded-full border-2 border-[color:var(--c-ink)] bg-primary text-sm font-bold text-on-primary">{pick(t.author_name, ctx.locale, ctx.defaultLocale).slice(0, 1)}</span>
              ))}
            </div>
            <div>
              <p className="font-bold">{ctx.t("stats.rating")}</p>
              <p className="flex items-center gap-1 text-sm text-muted"><Star className="h-4 w-4 fill-current text-accent" aria-hidden /><span className="num font-semibold text-fg">{avg.toFixed(1)}</span> / 5 · {testimonials.length}</p>
            </div>
          </div>
          <Link href={`/${ctx.locale}/contact`} className="btn btn-primary group rounded-pill px-6">{ctx.t("common.contact_us")} <Arrow dir={ctx.dir} /></Link>
        </Reveal>
      )}
    </Shell>
  );
}

/* ------------------------------------------------------------------ projects: filterable showcase (or grid) */

async function Projects({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, s, L, href } = useSection(section, ctx);
  const L2 = (v: unknown) => pick(v as Localized, ctx.locale, ctx.defaultLocale);
  const action = L("link_label") && href("link_href") ? <Link href={href("link_href")} className="btn btn-outline group rounded-pill px-6">{L("link_label")} <Arrow dir={ctx.dir} /></Link> : null;
  const categories = await getProjectCategories();

  if (s.layout === "slider") {
    let items: Project[] = await getHomeProjects(12);
    if (!items.length) items = await getProjects({ featured: true, limit: 9 });
    if (!items.length) items = await getProjects({ limit: 9 });
    const showcase: ShowcaseItem[] = items.map((p) => ({
      id: p.id,
      href: p.slider_link ? localeHref(p.slider_link, ctx.locale) : `/${ctx.locale}/projects/${p.slug}`,
      target: p.link_target === "_blank" ? "_blank" : "_self",
      external: Boolean(p.slider_link && /^https?:/i.test(p.slider_link)),
      title: L2(p.title),
      excerpt: L2(p.excerpt),
      category: L2(categories.find((x) => x.id === p.category_id)?.name) || L2(p.project_type),
      categoryId: p.category_id,
      alt: L2(p.cover_alt) || L2(p.title),
      image: prepareImage(p.cover_url ?? p.thumbnail_url, "(min-width:1024px) 32vw, (min-width:640px) 46vw, 82vw", 1200, 900),
    }));
    return (
      <Shell section={section} className="overflow-hidden">
        <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} />
        <Reveal variant="fade">
          <ProjectsShowcase items={showcase} dir={ctx.dir} categories={categories.map((x) => ({ id: x.id, name: L2(x.name) }))}
            labels={{ all: ctx.t("common.all"), details: ctx.t("projects.details"), prev: ctx.t("slider.prev"), next: ctx.t("slider.next") }} />
        </Reveal>
        {action && <div className="mt-8 flex justify-center">{action}</div>}
      </Shell>
    );
  }

  const limit = Number(c.limit) || 6;
  let items = await getProjects({ featured: Boolean(s.featured_only), limit });
  if (!items.length && s.featured_only) items = await getProjects({ limit });
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p, i) => <Reveal key={p.id} i={i % 3} variant="up"><ProjectCard project={p} ctx={ctx} categoryName={L2(categories.find((x) => x.id === p.category_id)?.name)} /></Reveal>)}
      </div>
      {action && <div className="mt-10 flex justify-center">{action}</div>}
    </Shell>
  );
}

/* ------------------------------------------------------------------ process: step cards with number blocks */

function Process({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L, list, li } = useSection(section, ctx);
  const items = list("items");
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} />
      <ol className={`grid grid-cols-1 gap-5 md:grid-cols-2 ${items.length >= 6 || items.length === 3 ? "xl:grid-cols-3" : ""}`}>
        {items.map((it, i) => (
          <Reveal as="li" key={i} i={i} variant={i % 2 ? "end" : "start"} className="lift step-card group">
            <span className="step-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
            <div className="p-5 sm:p-6">
              <h3 className="text-lg font-bold">{li(it, "title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{li(it, "text")}</p>
            </div>
          </Reveal>
        ))}
      </ol>
    </Shell>
  );
}

/* ------------------------------------------------------------------ technologies: dark tile marquee */

function Tech({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L } = useSection(section, ctx);
  const items = Array.isArray(c.items) ? (c.items as string[]) : [];
  if (!items.length) return null;
  const row = (dup: boolean) => (
    <ul className={`flex flex-none items-center gap-4 pe-4 ${dup ? "marquee-dup" : ""}`} aria-hidden={dup || undefined}>
      {items.map((t) => (
        <li key={t} className="ink grid h-24 min-w-40 place-items-center rounded-2xl px-6 text-lg font-bold tracking-tight shadow-[var(--shadow-md)] sm:h-28 sm:min-w-48 sm:text-xl">{t}</li>
      ))}
    </ul>
  );
  return (
    <section className="section overflow-hidden" data-section="tech">
      <div className="container-x"><Heading eyebrow={L("eyebrow")} title={L("title")} subtitle={L("subtitle")} /></div>
      <div className="marquee" style={{ ["--marquee-dur" as string]: `${Math.max(26, items.length * 4)}s` }}>
        <div className="marquee-track py-3">{row(false)}{row(true)}</div>
      </div>
    </section>
  );
}

async function Clients({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L } = useSection(section, ctx);
  const items = await getClients();
  if (!items.length) return null;
  const row = (dup: boolean) => (
    <ul className={`flex flex-none items-center gap-4 pe-4 ${dup ? "marquee-dup" : ""}`} aria-hidden={dup || undefined}>
      {items.map((cl) => {
        const name = pick(cl.name, ctx.locale, ctx.defaultLocale);
        const inner = cl.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cl.logo_url} alt={dup ? "" : name} loading="lazy" className="max-h-10 w-auto opacity-70 grayscale transition duration-500 hover:opacity-100 hover:grayscale-0 dark:invert" />
        ) : <span className="font-semibold text-muted">{name}</span>;
        return (
          <li key={cl.id} className="lift grid h-24 min-w-48 place-items-center px-8" title={name} dir="auto">
            {cl.website && !dup ? <a href={cl.website} target="_blank" rel="noopener noreferrer">{inner}</a> : inner}
          </li>
        );
      })}
    </ul>
  );
  return (
    <section className="section bg-softer" data-section="clients">
      <div className="container-x"><Heading eyebrow={L("eyebrow")} title={L("title")} /></div>
      <div className="marquee" style={{ ["--marquee-dur" as string]: `${Math.max(22, items.length * 5)}s` }}>
        <div className="marquee-track py-3">{row(false)}{row(true)}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ testimonials: card rail */

async function Testimonials({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { c, L } = useSection(section, ctx);
  const items = await getTestimonials(Number(c.limit) || 9);
  if (!items.length) return null;
  const P = (v: Localized) => pick(v, ctx.locale, ctx.defaultLocale);
  return (
    <Shell section={section}>
      <Heading eyebrow={L("eyebrow")} title={L("title")} />
      <ul className="scroll-x -mx-1 flex gap-5 px-1 pb-3">
        {items.map((t, i) => (
          <Reveal as="li" key={t.id} i={i % 3} variant="up" className="lift flex w-[85%] flex-none flex-col p-7 sm:w-[48%] lg:w-[32%]">
            <div className="flex items-center justify-between">
              <span className="quote-mark !text-5xl" aria-hidden>“</span>
              <span className="flex gap-0.5 text-accent" aria-label={`${t.rating}/5`}>
                {Array.from({ length: 5 }, (_, k) => <Star key={k} className={`h-4 w-4 ${k < t.rating ? "fill-current" : "opacity-25"}`} aria-hidden />)}
              </span>
            </div>
            <blockquote className="mt-3 flex-1 text-lg leading-relaxed">{P(t.quote)}</blockquote>
            <footer className="mt-6 flex items-center gap-3 border-t border-line pt-5">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-primary font-bold text-on-primary">{P(t.author_name).slice(0, 1)}</span>
              <span><span className="block font-bold">{P(t.author_name)}</span><span className="text-sm text-muted">{P(t.author_title)}</span></span>
            </footer>
          </Reveal>
        ))}
      </ul>
    </Shell>
  );
}

/* ------------------------------------------------------------------ FAQ: numbered accordion */

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
      <Heading eyebrow={L("eyebrow")} title={L("title")} />
      <div className="mx-auto max-w-4xl space-y-3">
        {items.map((it, i) => (
          <Reveal key={i} i={i} variant="up">
            <details className="faq-item group" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center gap-4 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                <span className="num grid h-9 w-9 flex-none place-items-center rounded-xl bg-soft text-sm font-bold text-primary transition-colors group-open:bg-primary group-open:text-on-primary">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 font-semibold sm:text-lg">{li(it, "question")}</span>
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full border border-line transition-all duration-300 group-open:rotate-45 group-open:border-primary group-open:text-primary">
                  <Plus className="h-4 w-4" aria-hidden />
                </span>
              </summary>
              <p className="px-4 pb-5 leading-relaxed text-muted sm:ps-[4.75rem] sm:pe-6">{li(it, "answer")}</p>
            </details>
          </Reveal>
        ))}
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
      <Heading eyebrow={L("eyebrow")} title={L("title")} />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {items.map((p, i) => <Reveal key={p.id} i={i} variant="up"><PostCard post={p} ctx={ctx} /></Reveal>)}
      </div>
      {L("link_label") && href("link_href") && <div className="mt-10 flex justify-center"><Link href={href("link_href")} className="btn btn-outline group rounded-pill px-6">{L("link_label")} <Arrow dir={ctx.dir} /></Link></div>}
    </Shell>
  );
}

function RichText({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L } = useSection(section, ctx);
  return (
    <Shell section={section}>
      <Reveal as="article" variant="fade" className="panel mx-auto max-w-3xl p-6 sm:p-10">
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
        <Reveal variant="image" className={`relative aspect-[4/3] overflow-hidden rounded-[calc(var(--radius)*2)] bg-subtle ${imageFirst ? "" : "lg:order-2"}`}>
          {c.image ? <SmartImage src={String(c.image)} alt="" className="object-cover" /> : <HeroArt compact />}
        </Reveal>
        <div>
          <Reveal variant={imageFirst ? "end" : "start"}>
            {L("eyebrow") && <p className="badge-pill">{L("eyebrow")}</p>}
            <h2 className="h-section mt-5">{L("title")}</h2>
          </Reveal>
          <Reveal i={1}><Markdown className="prose-brand mt-6 text-muted">{L("body")}</Markdown></Reveal>
          {L("link_label") && href("link_href") && (
            <Reveal i={2}><Link href={href("link_href")} className="btn btn-primary group mt-8 rounded-pill px-6">{L("link_label")} <Arrow dir={ctx.dir} /></Link></Reveal>
          )}
        </div>
      </div>
    </Shell>
  );
}

/* ------------------------------------------------------------------ CTA: brand panel with quick channels */

function Cta({ section, ctx }: { section: PageSection; ctx: SiteContext }) {
  const { L, href } = useSection(section, ctx);
  const contact = ctx.settings.contact ?? {};
  const wa = typeof contact.whatsapp === "string" ? contact.whatsapp.replace(/[^\d]/g, "") : "";
  return (
    <section className="section" data-section="cta">
      <div className="container-x">
        <Reveal variant="scale" className="panel-brand relative isolate overflow-hidden px-6 py-14 text-center sm:px-12 sm:py-16 lg:py-20">
          <div className="bg-measure pointer-events-none absolute inset-0 -z-10 opacity-25" aria-hidden />
          <div className="pointer-events-none absolute -top-24 start-1/4 -z-10 h-72 w-72 rounded-full bg-white/10 blur-3xl animate-glow" aria-hidden />
          <span className="pointer-events-none absolute bottom-10 end-10 -z-10 h-6 w-6 rotate-45 bg-[color:var(--c-accent)] animate-drift" aria-hidden />
          <span className="pointer-events-none absolute start-12 top-12 -z-10 h-4 w-4 rotate-45 bg-white/40 animate-drift [animation-delay:-3s]" aria-hidden />
          <h2 className="h-display mx-auto max-w-3xl">{L("title")}</h2>
          {L("subtitle") && <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">{L("subtitle")}</p>}
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            {L("primary_label") && href("primary_href") && <Link href={href("primary_href")} className="btn btn-accent group min-h-12 rounded-pill px-6"><Rocket className="h-4 w-4" />{L("primary_label")}</Link>}
            {L("secondary_label") && href("secondary_href") && <Link href={href("secondary_href")} className="btn min-h-12 rounded-pill border-white/30 px-6 text-white hover:bg-white/10">{L("secondary_label")}</Link>}
          </div>
          {(contact.email || wa) && (
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/80">
              {contact.email && <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4" /><span dir="ltr">{contact.email}</span></a>}
              {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white"><MessageCircle className="h-4 w-4" />{ctx.t("contact.whatsapp")}</a>}
            </div>
          )}
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
