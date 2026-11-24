import { platformOf, socialFor, socialName, type SocialItem, type SocialPlace } from "@/lib/social";

/**
 * One social icon: a library brand mark drawn with currentColor (so it follows light/dark mode and
 * hover colours), or the custom uploaded icon (rendered as <img> only — never inlined).
 */
export function SocialIcon({ item, className = "h-4 w-4" }: { item: Pick<SocialItem, "platform" | "icon_url" | "label">; className?: string }) {
  if (item.icon_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.icon_url} alt="" className={`${className} object-contain`} loading="lazy" />;
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d={platformOf(item).path} />
    </svg>
  );
}

/** Ordered, enabled platforms for one place (header / footer / contact page). */
export function SocialList({
  social,
  place,
  className = "flex flex-wrap items-center gap-2",
  linkClassName = "social-dot",
  iconClassName = "h-3.5 w-3.5",
}: {
  social: unknown;
  place: SocialPlace;
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
}) {
  const items = socialFor(social, place);
  if (!items.length) return null;
  return (
    <ul className={className} data-social={place}>
      {items.map((s) => {
        const external = /^https?:/i.test(s.url);
        return (
          <li key={s.id}>
            <a
              href={s.url}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={linkClassName}
              aria-label={socialName(s)}
              title={socialName(s)}
              data-platform={s.platform}
            >
              <SocialIcon item={s} className={iconClassName} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
