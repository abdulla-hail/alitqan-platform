import Link from "next/link";
import { ArrowLeft, ArrowRight, Star } from "lucide-react";
import { Icon } from "@/components/ui/Icon";
import { SmartImage } from "@/components/ui/SmartImage";
import { SocialLinks } from "./SocialLinks";
import { formatDate, pick } from "@/lib/i18n";
import type { SiteContext } from "@/services/site";
import type { BlogPost, Project, Service, TeamMember, Testimonial } from "@/types/content";

export function Arrow({ dir, className = "h-4 w-4" }: { dir: "rtl" | "ltr"; className?: string }) {
  const A = dir === "rtl" ? ArrowLeft : ArrowRight;
  return <A className={`${className} transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1`} aria-hidden />;
}

export function SectionHeading({ eyebrow, title, subtitle, align = "start", action }: { eyebrow?: string; title?: string; subtitle?: string; align?: "start" | "center"; action?: React.ReactNode }) {
  if (!eyebrow && !title && !subtitle) return null;
  return (
    <div className={`mb-12 flex flex-col gap-6 ${align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={align === "center" ? "max-w-2xl" : "max-w-3xl"}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h2 className="h-section mt-3">{title}</h2>}
        {subtitle && <p className="lead mt-4">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ServiceCard({ service, ctx, index }: { service: Service; ctx: SiteContext; index?: number }) {
  const { locale, defaultLocale, dir } = ctx;
  return (
    <Link href={`/${locale}/services/${service.slug}`} className="card card-hover spotlight group relative flex h-full flex-col p-6 sm:p-7">
      <div className="flex items-start justify-between">
        <span className="icon-tile"><Icon name={service.icon} className="h-5 w-5" /></span>
        {index != null && <span className="font-display text-sm text-muted tabular-nums">{String(index + 1).padStart(2, "0")}</span>}
      </div>
      <h3 className="mt-6 text-xl font-bold">{pick(service.title, locale, defaultLocale)}</h3>
      <p className="mt-3 flex-1 leading-relaxed text-muted">{pick(service.excerpt, locale, defaultLocale)}</p>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        {ctx.t("common.view_details")} <Arrow dir={dir} />
      </span>
    </Link>
  );
}

export function ProjectCard({ project, ctx, large = false, categoryName }: { project: Project; ctx: SiteContext; large?: boolean; categoryName?: string }) {
  const { locale, defaultLocale, dir } = ctx;
  const title = pick(project.title, locale, defaultLocale);
  return (
    <Link href={`/${locale}/projects/${project.slug}`} className="group block">
      <div className={`relative overflow-hidden rounded-brand bg-subtle ${large ? "aspect-[16/11]" : "aspect-[4/3]"}`}>
        <SmartImage src={project.cover_url} alt={title} className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" sizes="(min-width: 1024px) 50vw, 100vw" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/35 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{categoryName || pick(project.project_type, locale, defaultLocale)}</p>
          <h3 className="mt-1 text-xl font-bold transition-colors group-hover:text-primary">{title}</h3>
          <p className="mt-2 line-clamp-2 text-muted">{pick(project.excerpt, locale, defaultLocale)}</p>
        </div>
        <span className="mt-1 grid h-10 w-10 flex-none place-items-center rounded-full border border-line transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-on-primary">
          <Arrow dir={dir} />
        </span>
      </div>
    </Link>
  );
}

export function PostCard({ post, ctx }: { post: BlogPost; ctx: SiteContext }) {
  const { locale, defaultLocale } = ctx;
  const title = pick(post.title, locale, defaultLocale);
  return (
    <Link href={`/${locale}/blog/${post.slug}`} className="group flex h-full flex-col">
      <div className="relative aspect-[16/10] overflow-hidden rounded-brand bg-subtle">
        <SmartImage src={post.cover_url} alt={title} className="object-cover transition-transform duration-700 group-hover:scale-[1.04]" sizes="(min-width: 1024px) 33vw, 100vw" />
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-muted">
        {post.category && <span className="font-medium text-primary">{pick(post.category.name, locale, defaultLocale)}</span>}
        {post.category && <span className="rhombus scale-75" aria-hidden />}
        <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at, locale)}</time>
      </div>
      <h3 className="mt-2 text-lg font-bold leading-snug transition-colors group-hover:text-primary">{title}</h3>
      <p className="mt-2 line-clamp-2 text-muted">{pick(post.excerpt, locale, defaultLocale)}</p>
    </Link>
  );
}

export function TeamCard({ member, ctx }: { member: TeamMember; ctx: SiteContext }) {
  const { locale, defaultLocale } = ctx;
  const name = pick(member.name, locale, defaultLocale);
  const initials = name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("");
  return (
    <article className="card flex h-full flex-col p-6">
      <div className="relative aspect-square w-full overflow-hidden rounded-brand-sm bg-soft">
        {member.photo_url ? (
          <SmartImage src={member.photo_url} alt={name} className="object-cover" sizes="(min-width: 1024px) 25vw, 50vw" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-measure">
            <span className="font-display text-5xl font-bold text-primary">{initials}</span>
          </div>
        )}
      </div>
      <h3 className="mt-5 text-lg font-bold">{name}</h3>
      <p className="text-sm font-medium text-primary">{pick(member.job_title, locale, defaultLocale)}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{pick(member.bio, locale, defaultLocale)}</p>
      {!!member.skills?.length && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {member.skills.map((s) => <li key={s} className="chip text-xs">{s}</li>)}
        </ul>
      )}
      <SocialLinks social={member.social} className="mt-4" />
    </article>
  );
}

export function TestimonialCard({ item, ctx }: { item: Testimonial; ctx: SiteContext }) {
  const { locale, defaultLocale } = ctx;
  const name = pick(item.author_name, locale, defaultLocale);
  return (
    <figure className="card flex h-full flex-col p-7">
      <div className="flex gap-0.5 text-accent" aria-label={`${item.rating}/5`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < item.rating ? "fill-current" : "opacity-25"}`} aria-hidden />
        ))}
      </div>
      <blockquote className="mt-5 flex-1 text-lg leading-relaxed">“{pick(item.quote, locale, defaultLocale)}”</blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
        {item.avatar_url ? (
          <span className="relative h-11 w-11 overflow-hidden rounded-full"><SmartImage src={item.avatar_url} alt={name} className="object-cover" sizes="44px" /></span>
        ) : (
          <span className="grid h-11 w-11 place-items-center rounded-full bg-soft font-bold text-primary">{name.slice(0, 1)}</span>
        )}
        <span>
          <span className="block font-semibold">{name}</span>
          <span className="block text-sm text-muted">{pick(item.author_title, locale, defaultLocale)}</span>
        </span>
      </figcaption>
    </figure>
  );
}

/** Editorial index row for services: number · title · excerpt · arrow (used instead of cards). */
export function ServiceRow({ service, ctx, index, category }: { service: Service; ctx: SiteContext; index: number; category?: string }) {
  const { locale, defaultLocale, dir } = ctx;
  const Out = dir === "rtl" ? ArrowLeft : ArrowRight;
  return (
    <Link href={`/${locale}/services/${service.slug}`} className="index-row group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 px-1 py-6 sm:gap-x-8 sm:px-4 lg:grid-cols-[4rem_minmax(0,1.1fr)_minmax(0,1fr)_auto] lg:py-8">
      <span className="num self-start pt-1.5 text-sm text-muted lg:self-center lg:pt-0">{String(index + 1).padStart(2, "0")}</span>
      <span className="min-w-0">
        {category && <span className="kicker mb-1 block">{category}</span>}
        <span className="block text-xl font-bold leading-snug transition-colors group-hover:text-primary sm:text-2xl lg:text-[1.75rem]">{pick(service.title, locale, defaultLocale)}</span>
      </span>
      <span className="index-arrow row-span-2 grid h-11 w-11 place-items-center self-center rounded-full border border-line lg:order-last lg:row-span-1">
        <Out className="h-4 w-4" aria-hidden />
      </span>
      <span className="col-start-2 text-sm leading-relaxed text-muted sm:text-base lg:col-start-auto">{pick(service.excerpt, locale, defaultLocale)}</span>
    </Link>
  );
}

/** Wide editorial post card (featured article). */
export function PostFeature({ post, ctx }: { post: BlogPost; ctx: SiteContext }) {
  const { locale, defaultLocale, dir } = ctx;
  const title = pick(post.title, locale, defaultLocale);
  return (
    <Link href={`/${locale}/blog/${post.slug}`} className="group grid grid-cols-1 items-center gap-6 md:grid-cols-2 lg:gap-12">
      <div className="img-zoom relative aspect-[16/10] overflow-hidden rounded-brand-lg bg-subtle">
        <SmartImage src={post.cover_url} alt={title} className="object-cover" sizes="(min-width:768px) 50vw, 100vw" />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {post.category && <span className="font-semibold text-primary">{pick(post.category.name, locale, defaultLocale)}</span>}
          {post.category && <span className="rhombus scale-75" aria-hidden />}
          <time dateTime={post.published_at ?? undefined}>{formatDate(post.published_at, locale)}</time>
        </div>
        <h3 className="mt-3 text-2xl font-bold leading-snug transition-colors group-hover:text-primary lg:text-4xl">{title}</h3>
        <p className="mt-4 line-clamp-3 text-lg leading-relaxed text-muted">{pick(post.excerpt, locale, defaultLocale)}</p>
        <span className="mt-6 inline-flex items-center gap-2 font-semibold text-primary">{ctx.t("common.read_more")} <Arrow dir={dir} /></span>
      </div>
    </Link>
  );
}
