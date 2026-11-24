# UI/UX audit — 2026-11-24

Audited in the browser (local + production https://alitqan-platform.vercel.app) at 320–1920 px, Arabic and English, light and dark.

## Critical (fix first)
1. **Production SEO is broken.** `NEXT_PUBLIC_SITE_URL` on Vercel contains `1. https://alitqan-platform.vercel.app`. `new URL()` throws, so every page falls back to the generic title "ALITQAN" with no description/OG/canonical, and robots.txt + sitemap.xml publish invalid URLs (`1. https://…`). → Code now extracts the real URL defensively; **the env value should still be corrected in Vercel** (owner action).

## Design (high)
2. **Template feel / monotony.** Almost every section is "eyebrow + title + grid of bordered cards" (services, why-us, team, testimonials, posts). Same card, same rhythm, 12 sections in a row → reads as generated.
3. **Hero lacks a point of view.** Generic split layout with decorative abstract art; no proof of capability above the fold.
4. **No contrast rhythm.** The whole page is paper-coloured; nothing anchors the eye. Footer is a plain light block with no closing call to action.
5. **Arabic typography.** Display line-height 1.08 is Latin-tuned: Arabic ascenders/dots and stacked lines feel cramped; mixed Arabic/Latin headings need different leading.
6. **Services are hard to scan** as identical cards; categories don't read as a structured offer.
7. **Trust layer is weak:** technologies and client names are buried mid-page as chips/greyed boxes.

## UX (medium)
8. Blog/Projects listings: no featured item; every item has equal weight.
9. Contact page: details and form have equal weight; no quick channels (WhatsApp/email) at the top.
10. Admin tables (requests, messages, users, activity) require horizontal scrolling on phones.
11. Admin login is a bare card; no brand presence.

## Already solid (kept)
Responsive overflow (0 issues at 108 page×width checks), motion system & reduced-motion, slider, header/nav accessibility, forms security, RLS.

## Plan
Creative direction **"Measured editorial"**: typography-led, Arabic-first, built on the brand's *measure* idea (rulers, indices, hairlines) with a dark **ink stage** that frames the hero, the closing CTA and the footer. Each section gets its own composition: index list (services), bento (why us), marquee (technologies/clients), featured quote (testimonials), featured-first grids (projects/blog).
