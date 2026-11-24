/**
 * Social platforms — fully managed from CMS → Settings → Social (site_settings key "social").
 *
 * Stored as { items: SocialItem[] } (ordered). Older data in the previous fixed-key format
 * ({ linkedin: url, x: url, … }) is still read and converted on the fly, so nothing is lost.
 *
 * Icons: a built-in library of brand marks (Simple Icons, CC0 — single-colour paths drawn with
 * currentColor so they follow light/dark mode) plus generic icons; or a custom uploaded icon
 * (SVG files are sanitised on upload and re-checked on save; custom icons render as <img> only).
 */
import {
  siBehance, siBluesky, siDiscord, siDribbble, siFacebook, siFigma, siGithub, siGitlab, siInstagram, siLine,
  siLinktree, siMastodon, siMedium, siMessenger, siPinterest, siReddit, siSignal, siSnapchat, siSoundcloud,
  siSpotify, siSubstack, siTelegram, siThreads, siTiktok, siTumblr, siTwitch, siUpwork, siVimeo, siWechat,
  siWhatsapp, siX, siYoutube, siFiverr, siGooglemaps, siKick,
} from "simple-icons";

export type SocialPlace = "header" | "footer" | "contact";

export interface SocialPlatform {
  label: string;
  /** SVG path in a 24×24 box */
  path: string;
  /** official brand colour (used only as an accent in the CMS) */
  hex: string;
}

/** LinkedIn's mark is not in Simple Icons any more → a neutral "in" glyph drawn here. */
const LINKEDIN_PATH =
  "M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96zM3 9h4v12H3zm6.5 0h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.6c0-1.33-.02-3.05-1.86-3.05-1.86 0-2.15 1.45-2.15 2.95V21h-4z";
const GLOBE_PATH =
  "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 6h-2.95a15.6 15.6 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.9 8zM12 4.04A13.8 13.8 0 0 1 13.91 8h-3.82A13.8 13.8 0 0 1 12 4.04zM4.26 14a7.9 7.9 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4zm.84 2h2.95c.32 1.25.78 2.45 1.38 3.56A8.03 8.03 0 0 1 5.1 16zm2.95-8H5.1a8.03 8.03 0 0 1 4.33-3.56A15.6 15.6 0 0 0 8.05 8zM12 19.96A13.8 13.8 0 0 1 10.09 16h3.82A13.8 13.8 0 0 1 12 19.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.23 5.56A15.6 15.6 0 0 0 15.95 16h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a7.9 7.9 0 0 1 0 4z";
const MAIL_PATH = "M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.2V17h16V7.2l-8 5.3zM5.6 7l6.4 4.24L18.4 7z";
const LINK_PATH = "M10.6 13.4a1 1 0 0 1 0-1.4l3.4-3.4a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0zM8.46 18.54a3.5 3.5 0 0 1-4.95-4.95l2.83-2.83a1 1 0 0 1 1.41 1.42l-2.83 2.82a1.5 1.5 0 0 0 2.12 2.12l2.83-2.82a1 1 0 0 1 1.41 1.41zm9.9-7.07-2.83 2.83a1 1 0 0 1-1.41-1.42l2.83-2.82a1.5 1.5 0 0 0-2.12-2.12l-2.83 2.82a1 1 0 0 1-1.41-1.41l2.83-2.83a3.5 3.5 0 0 1 4.95 4.95z";

const si = (x: { title: string; path: string; hex: string }, label = x.title): SocialPlatform => ({ label, path: x.path, hex: `#${x.hex}` });

/** The icon library offered in the CMS (key → platform). Order = order in the picker. */
export const SOCIAL_LIBRARY: Record<string, SocialPlatform> = {
  instagram: si(siInstagram),
  x: si(siX, "X"),
  facebook: si(siFacebook),
  linkedin: { label: "LinkedIn", path: LINKEDIN_PATH, hex: "#0A66C2" },
  tiktok: si(siTiktok, "TikTok"),
  snapchat: si(siSnapchat),
  youtube: si(siYoutube, "YouTube"),
  whatsapp: si(siWhatsapp, "WhatsApp"),
  telegram: si(siTelegram),
  threads: si(siThreads),
  behance: si(siBehance),
  dribbble: si(siDribbble),
  github: si(siGithub, "GitHub"),
  gitlab: si(siGitlab, "GitLab"),
  pinterest: si(siPinterest),
  reddit: si(siReddit),
  discord: si(siDiscord),
  twitch: si(siTwitch),
  kick: si(siKick),
  medium: si(siMedium),
  substack: si(siSubstack),
  vimeo: si(siVimeo),
  spotify: si(siSpotify),
  soundcloud: si(siSoundcloud, "SoundCloud"),
  tumblr: si(siTumblr),
  mastodon: si(siMastodon),
  bluesky: si(siBluesky),
  messenger: si(siMessenger),
  signal: si(siSignal),
  wechat: si(siWechat, "WeChat"),
  line: si(siLine, "LINE"),
  figma: si(siFigma),
  upwork: si(siUpwork),
  fiverr: si(siFiverr),
  linktree: si(siLinktree),
  googlemaps: si(siGooglemaps, "Google Maps"),
  website: { label: "Website", path: GLOBE_PATH, hex: "#2563EB" },
  email: { label: "Email", path: MAIL_PATH, hex: "#64748B" },
  link: { label: "Link", path: LINK_PATH, hex: "#64748B" },
};

export interface SocialItem {
  id: string;
  /** library key; unknown keys fall back to the generic link icon */
  platform: string;
  /** optional display name (defaults to the platform's name) */
  label: string;
  url: string;
  /** optional custom icon (uploaded to the media library) — overrides the library icon */
  icon_url: string;
  enabled: boolean;
  header: boolean;
  footer: boolean;
  contact: boolean;
}

export const SOCIAL_MAX = 30;

const URL_OK = /^(https?:\/\/|mailto:|tel:)/i;
const clean = (v: unknown, max: number) => String(v ?? "").replace(/[<>"`]/g, "").trim().slice(0, max);
const bool = (v: unknown, fb: boolean) => (typeof v === "boolean" ? v : fb);

/** Normalises stored data (new list format or the legacy key→url map) into ordered items. */
export function normalizeSocial(value: unknown): SocialItem[] {
  const o = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  if (Array.isArray(o.items)) {
    return (o.items as unknown[]).slice(0, SOCIAL_MAX).map((raw, i) => {
      const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const platform = clean(r.platform, 40).toLowerCase().replace(/[^a-z0-9_-]/g, "") || "link";
      return {
        id: clean(r.id, 40).replace(/[^a-zA-Z0-9_-]/g, "") || `s${i}`,
        platform,
        label: clean(r.label, 40),
        url: clean(r.url, 500),
        icon_url: clean(r.icon_url, 500),
        enabled: bool(r.enabled, true),
        header: bool(r.header, true),
        footer: bool(r.footer, true),
        contact: bool(r.contact, true),
      };
    });
  }
  // legacy: { linkedin: "https://…", … } → items in stored order
  return Object.entries(o)
    .filter(([, v]) => typeof v === "string" && v.trim())
    .slice(0, SOCIAL_MAX)
    .map(([k, v], i) => ({ id: `legacy-${k}-${i}`, platform: k.toLowerCase(), label: "", url: String(v).trim(), icon_url: "", enabled: true, header: true, footer: true, contact: true }));
}

/** Items to render in one place: enabled, shown there, with a safe link. */
export function socialFor(value: unknown, place: SocialPlace): SocialItem[] {
  return normalizeSocial(value).filter((s) => s.enabled && s[place] && URL_OK.test(s.url));
}

export const platformOf = (s: Pick<SocialItem, "platform">) => SOCIAL_LIBRARY[s.platform] ?? SOCIAL_LIBRARY.link;
export const socialName = (s: Pick<SocialItem, "platform" | "label">) => s.label || platformOf(s).label;

/** All public profile URLs (for Organization.sameAs). */
export const socialUrls = (value: unknown) => normalizeSocial(value).filter((s) => s.enabled && /^https?:\/\//i.test(s.url)).map((s) => s.url);
