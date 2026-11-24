/** Social links from Settings → Social. Rendered as compact monogram chips (no third-party logo artwork). */
const MAP: Record<string, { short: string; label: string }> = {
  linkedin: { short: "in", label: "LinkedIn" },
  x: { short: "X", label: "X" },
  instagram: { short: "IG", label: "Instagram" },
  behance: { short: "Bē", label: "Behance" },
  dribbble: { short: "Dr", label: "Dribbble" },
  github: { short: "GH", label: "GitHub" },
  youtube: { short: "YT", label: "YouTube" },
  tiktok: { short: "TT", label: "TikTok" },
  facebook: { short: "f", label: "Facebook" },
  snapchat: { short: "SC", label: "Snapchat" },
  threads: { short: "@", label: "Threads" },
};

export function SocialLinks({ social, className = "" }: { social: Record<string, string>; className?: string }) {
  const entries = Object.entries(social ?? {}).filter(([k, v]) => MAP[k] && typeof v === "string" && /^https?:\/\//.test(v));
  if (!entries.length) return null;
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {entries.map(([k, v]) => (
        <li key={k}>
          <a
            href={v}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={MAP[k].label}
            title={MAP[k].label}
            dir="ltr"
            className="grid h-9 min-w-9 place-items-center rounded-full border border-line px-2 text-xs font-bold text-muted transition-colors hover:border-primary hover:text-primary"
          >
            {MAP[k].short}
          </a>
        </li>
      ))}
    </ul>
  );
}
