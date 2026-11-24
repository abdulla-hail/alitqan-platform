# Moltaqa.net — reference audit (2026-11-24)

Studied live in the browser at 1440 px and 375 px (home, services mega-menu, mobile menu, a service detail page), plus DOM/CSS inspection.
Stack observed: Nuxt (Vue) + Bootstrap 4, **WOW.js `fadeInUp`** for reveals, font *Somar Sans*, many tracking scripts. Motion is modest; the premium feel comes from **composition, rounded panels, iconography and interaction density**, not heavy animation.

## What they do (by area)
| # | Area | Observation |
|---|---|---|
| 1 | Header | Two tiers: thin **utility bar** (email at one end, "follow us" + circular social icons at the other) and a white rounded main bar: logo · **centered pill-shaped nav group** (every item has a small icon; the active item is a filled brand-colour pill) · language pill (EN 🌐) · strong CTA button with icon ("احجز استشارة تقنية"). |
| 2 | Dropdowns | "Services" opens a **full-width mega panel** under the header: 4-column grid of services, each with an icon tile. |
| 3 | Mobile menu | Burger → a **floating rounded card** dropping from the header over a blurred backdrop; rows = icon tile + label + chevron, active row filled; language switch and CTA pinned at the bottom. |
| 4 | Hero | Large **rounded light panel**; centered headline with a **rotating highlighted word inside a pill** ("حلول رقمية / أنظمة متكاملة…"); centered paragraph; primary (download profile) + secondary (contact) buttons; below, a **journey collage**: photos linked by thin curved connector lines with step captions (idea → design → analysis → launch). |
| 5 | Rhythm | Every section starts with a **centered badge pill** (decorated with sparkles) + centered title + short intro. Alternating white / light-grey section backgrounds. |
| 6 | Services | A **tabbed explorer inside a big coloured panel**: a scrollable strip of service chips (icon + name) with arrows; the selected chip turns white; below, details: title, description, icon bullet list, illustration. Each service also has a full landing page. |
| 7 | Cards | Projects: device-mockup image on a soft panel, title, "project details →". Stats: white rounded cards with tinted icon circle, coloured number, label, description. |
| 8 | Stats | Three stat cards + a **dark rounded "customer satisfaction" bar** with overlapping avatars, % ring and a contact button. Numbers count up. |
| 9 | Steps | Service pages: 2-column cards, each with a **large coloured number block** on one side + title + text. |
| 10 | Buttons | Pill buttons, icon inside, solid brand colour / white outline; hover = colour darken + lift; FAQ open item gets an accent border. |
| 11–12 | Scroll | WOW `fadeInUp` on card wrappers; lazy-mounted sections; count-up numbers. |
| 13 | Imagery | Real team/office photography, device mockups, isometric 3D icons; **certificate logos on dark tiles** in a marquee; partners marquee. |
| 14 | Page transitions | Standard SPA navigation with a loader; no special transition. |
| 15 | Footer | Deep brand-colour rounded footer: **CTA strip on top** ("هل لديك فكرة مشروع؟" + button), then columns: about + social circles, contact (phone, email, address with icons), main links, legal links, commercial register + QR. |
| 16 | Responsive | Mobile keeps the rounded-panel language; floating **call + WhatsApp** buttons on every page. |

## What ALITQAN adopts (adapted, not copied)
- **Two-tier header** (utility bar from Settings → Contact/Social) + **pill nav with icons and a sliding active pill** + language pill + CTA. → `Header`, `NavClient`.
- **Mega menu for Services** generated from the database (categories → services, icons, excerpts) with a promo tile. → `MegaMenu`.
- **Mobile floating-card menu** with icon rows, an expandable services accordion, language + CTA, blurred overlay, focus trap, Esc/outside close. → `MobileNav`.
- **Badge-pill section headings** — ALITQAN's version uses the brand **rhombus** instead of sparkles. → `SectionHeading`.
- **Hero in a rounded panel** with centered headline, a **rotating pill** cycling through the real service categories, and a **journey collage** built from the homepage projects (real images from the CMS) linked by animated connector lines. → `Hero`.
- **Services explorer**: accessible tabs (arrow-key roving focus) inside a brand panel; details come from each service's excerpt/features in the CMS, with links to the service page and to request it. → `ServicesExplorer`.
- **Stat cards + dark satisfaction bar** (average rating computed from published testimonials). → `Stats`.
- **Projects showcase** with category filter pills and a swipeable card rail (homepage slider projects stay CMS-ordered). → `ProjectsShowcase`.
- **Numbered step cards**, **numbered FAQ accordion** with accent border, **technology tiles** marquee, **floating call/WhatsApp buttons**, **footer with CTA strip**.
- **Service pages as landing pages** (hero panel → overview → features → steps → technologies → FAQ → related → CTA).

## What ALITQAN deliberately does differently
- Identity: ALITQAN green + gold, rhombus/measure motifs, its own logo, copy and imagery — nothing of Moltaqa's brand, text or photos is reused.
- Motion is richer but restrained: CSS/IntersectionObserver reveals with stagger, count-ups, rotating word, drawn connector lines, View Transitions between pages, `prefers-reduced-motion` and the CMS motion settings respected everywhere.
- Lighter stack: no Bootstrap/WOW/jQuery; Server Components + small client islands.
