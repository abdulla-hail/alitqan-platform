# إتقان · ALITQAN — Brand Identity

## 1. Reading the name
**إتقان** means doing a thing *precisely and completely*, to the standard of a master. In classical Arabic calligraphy, mastery is literally *measured*: every letter's proportions are set in **rhombic dots (نقطة)** made by the pen nib. The dot is the unit of precision. That is the core idea of the identity: **the measure behind the craft**.

## 2. Three explored directions
| | Direction | Idea | Why not / why |
|---|---|---|---|
| A | **The Measure (المقياس)** ✅ | The bowl of **ن** (the last letter of إتقان) holding the calligrapher's rhombus dot. Wordmarks are drawn as monoline geometric strokes; every dot, the hamza, and the Latin "A" crossbars are the same rhombus. | **Chosen.** Born from the name itself, ownable, works at 16 px, connects Arabic heritage with engineered precision. |
| B | Strata | Stacked hairline layers that converge into a solid block — "layer by layer to perfection". | Strong for an agency, but abstract and close to many "stack" marks in tech. |
| C | Square Kufic seal | The word إتقان built on a square grid as a seal/stamp. | Beautiful but heavy; illegible at small sizes and reads traditional rather than future-facing. |

## 3. Logo system (direction A)
All files are pure SVG paths (no fonts), generated from `src/lib/brand/logo-geometry.ts` by `node scripts/build-brand-assets.ts` into `public/brand/`.

| File | Use |
|---|---|
| `symbol-*.svg` | Independent symbol: app icon, favicon, social avatar, watermark |
| `arabic-*.svg` | Arabic wordmark إتقان |
| `latin-*.svg` | Latin wordmark ALITQAN |
| `horizontal-*.svg` | Primary lockup (header, documents) |
| `vertical-*.svg` | Stacked lockup (cover pages, square formats) |
| `icon.svg` | Favicon on brand tile |

Variants: `color` (light backgrounds), `color-dark` (dark backgrounds), `black`, `white` (single colour).

**On the website** the logo is rendered live from the same geometry, coloured by CSS variables, so changing brand colours in the CMS recolours the logo. If the brand name changes, switch *Brand Identity → Logo mode* to "Symbol + name text" or upload a new logo.

### Rules
- Clear space: at least the height of the rhombus dot × 2 on all sides.
- Minimum size: symbol 16 px; horizontal lockup 96 px wide.
- Never rotate, stretch, outline, add shadows, or recolour the dot and bowl in the same colour on brand-coloured backgrounds (use the single-colour variant instead).
- The dot may be used alone as a bullet, divider, or loading indicator.

## 4. Colour
| Token | Light | Dark | Role |
|---|---|---|---|
| `primary` | `#0B5D50` Mastery Green | `#3CC7A8` | Brand, primary actions |
| `secondary` | `#16324F` Ink Blue | `#9DB8D9` | Headings accents, secondary UI |
| `accent` | `#C9963B` Gilded | `#E2B565` | The dot, highlights, focus details |
| `background` | `#FAF8F4` Paper | `#0B1215` | Page |
| `surface` | `#FFFFFF` | `#121C20` | Cards |
| `foreground` | `#0E1A1F` Ink | `#ECE9E2` | Text |
| `muted` | `#5B6B70` | `#93A3A8` | Secondary text |
| `border` | `#E6E1D8` | `#22313A` | Hairlines |

Every value is a CSS variable injected from the `brand_settings` table; components never contain colour literals.

## 5. Typography
- Arabic display: **Alexandria** (geometric, matches the monoline marks). Arabic text: **IBM Plex Sans Arabic**.
- Latin display: **Sora**. Latin text: **Inter**.
All four are editable in the CMS (any Google Font family name).

## 6. Patterns & elements
- **Measure grid**: a faint dot grid (calligraphic measuring dots) used behind hero sections.
- **Rhombus bullet** for lists, step markers, and section indices (01, 02 …).
- **Hairline rules** (1 px, `border` token) separate content; no heavy boxes.

## 7. Iconography
Lucide icons, 1.5 px stroke, rounded joins, always inside a 40 px soft tile tinted with `primary` at 10 %. No light-bulbs, gears or computer clip-art.

## 8. Imagery
Real work screenshots on device-less frames, macro shots of materials (paper, ink, stone), and generous negative space. Illustrations use only the brand geometry (arcs, rhombi, hairlines).

## 9. Voice
Calm, exact, confident. Short sentences. Promise outcomes, not adjectives.
