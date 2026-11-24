# Architecture & security model

## Request flow
- `src/proxy.ts` (Next 16 Proxy): `/` and un-prefixed paths → `/{saved locale | default language from DB}`; `/admin` & `/auth` → refresh the Supabase session cookie and optimistically redirect anonymous users to `/admin/login`.
- **Public site** `app/(site)/[locale]` — its own root layout sets `<html lang dir>` from the `languages` table, injects brand tokens (CSS variables) from `brand_settings`, loads the configured Google Fonts, and renders header/footer from `navigation_items`. Data is read with a cookie-less anon client, so pages are statically cached (ISR) and revalidated on every CMS save (`revalidatePath('/', 'layout')`).
- **CMS** `app/(admin)/admin` — separate root layout (Arabic RTL default, English toggle). `(panel)` pages call `requirePage(permission)`; every server action runs through `guarded(permission, …)` and uses the user's session client, so **RLS re-checks every write in the database**.

## Content model → UI
- `features/admin/resources.ts` declares each content type's fields once. A generic list (search, status filter, drag-and-drop order, visibility/featured toggles, duplicate, delete) and a generic tabbed editor render from it; the server re-validates input from the same definitions (`sanitize.ts`).
- `features/sections/registry.ts` declares the page-builder section types and their fields; `components/sections/Sections.tsx` renders them. New section type = registry entry + renderer.
- Translatable values are `{lang: text}` maps; the editor shows one tab per enabled language and flags missing translations; the site falls back to the default language.

## Brand system
- Logo geometry lives in `lib/brand/logo-geometry.ts` (pure SVG paths) → used both by the live `<Logo>` component (coloured with tokens) and by `scripts/build-brand-assets.ts` (static asset pack).
- Colours/fonts/radius are tokens (`--c-*`, `--f-*`, `--radius`) mapped into Tailwind's theme (`globals.css @theme inline`). Components never contain colour literals. Values are validated (hex / font-name regex) before being injected.
- Light/dark/system: inline script applies the visitor's saved preference before paint; the toggle stores it in `localStorage` (a per-visitor preference only — no site data lives in the browser).

## Security
- Secrets only in server env (`server-only` imports); the browser gets only the anon key.
- RLS on every table; permission helpers are `security definer` with fixed `search_path`; sensitive functions revoked from `anon`/`authenticated`.
- Public forms: Zod validation, honeypot, HMAC-signed timing token, optional Turnstile, per-IP (salted hash) rate limiting in Postgres, inserts with the service role only after all checks. Attachments: type/size allow-list enforced three times (client, signed-URL issuance, server re-check of the stored object) plus bucket limits; private bucket; staff download via 2-minute signed URLs.
- Markdown is rendered with raw HTML disabled; URLs are restricted to `http(s)`, `mailto`, `tel`, relative paths.
- Spreadsheet export neutralises formula injection.
- Auth: no public sign-up path grants access (new users are inactive viewers); owner bootstrap is token-gated and single-use at the SQL level; disabled users are also banned in Supabase Auth; login and reset are rate-limited and reveal nothing about account existence.
- Security headers + `noindex`/`no-store` for the CMS.

## Motion & interaction system
- Settings: `site_settings.motion` (CMS → Motion & interaction), sanitised/clamped by `lib/motion.ts`, emitted as `<html data-motion data-reveal data-hover data-parallax data-page-transitions data-mobile-motion style="--motion-dur --motion-stagger --motion-distance">`. All effects are CSS reading those attributes (`app/motion.css`).
- **Page transitions**: `app/(site)/[locale]/template.tsx` wraps pages in React 19.3 `<ViewTransition enter="page" exit="page">` (browser View Transitions API, no JS). Header anchored with `view-transition-name: site-header`.
- **Scroll reveal**: server components render `data-anim="up|down|start|end|scale|fade|clip|image"` + `--i` (stagger index) via `<Reveal>`; a single `<MotionRuntime>` IntersectionObserver adds `.in-view`. Hidden state only applies under `html.js[data-reveal=on]`, so no-JS, reduced-motion and "off" always show content.
- **Parallax / scroll progress**: CSS scroll-driven animations (`animation-timeline: view()/scroll()`), skipped where unsupported, on coarse pointers when mobile motion is "reduced", and on reduced motion.
- **motion (Framer Motion) 14.12.0** is used only for exit animations: mobile menu, nav dropdowns, admin drawer, modals and toasts (`LazyMotion` + `domAnimation`, `m.*`).
- **Projects slider**: native scroll-snap track (touch/momentum), server-prepared `srcset` (`lib/images.ts` → `getImageProps`) with a separate mobile image via `<picture>`, autoplay paused on hover/focus/touch/hidden tab/off-screen/reduced motion, WCAG pause button, keyboard (mirrored in RTL).
- **Typography**: `lib/brand/fonts.ts` catalog with real weights per family → one Google Fonts request with only enabled & existing weights; uploaded WOFF2/WOFF fonts (`custom_fonts`) are served by `@font-face`; separate admin font.

## Visual system v3 (Moltaqa-inspired)
- `src/app/site.css` holds the v3 primitives: `.panel`, `.panel-soft`, `.panel-brand`, `.lift`, `.badge-pill`, `.nav-pill(s)`, `.step-card`, `.faq-item`, `.rotator`, `.journey-line`, `.fab`, `.tab-chip`, `.scroll-x`.
- Header: `Header.tsx` (server) → `HeaderShell`, `NavLinks` (pill nav + `MegaPanel`, ≥1280px) and `MobileNav` (floating card, focus trap, <1280px) in `NavClient.tsx`.
- Client islands: `ServicesExplorer` (ARIA tabs), `ProjectsShowcase` (filter + snap rail), `Rotator` (respects reduced motion).
- See `docs/MOLTAQA_REFERENCE_AUDIT.md` for what was studied and adopted (no Moltaqa assets/text were copied).
