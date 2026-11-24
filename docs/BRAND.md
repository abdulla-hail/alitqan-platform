# إتقان · ALITQAN — Brand Identity

## 1. The official mark (2026-11)
The official logo is the mark supplied by the owner (`brand-source/logo-reference.webp`): a sharp **A** whose crossbar is a sweeping **orbit**, with five **pixels** rising to the upper right — precision (the A) in motion (the orbit) building digital products (the pixels).

The mark is used **on its own**. No name, slogan or text is ever added to the symbol itself. Where the brand name must appear, it is set beside the mark as live text (CMS option "Show brand name next to the mark").

### Vector master
`src/lib/brand/mark.ts` is the single source of truth: a hand-traced **vector redraw** of the reference. It uses real SVG paths and gradients, with no embedded bitmap. Coordinates are kept in the reference image's pixel space, so it can be compared 1:1 with the artwork (`node scripts/brand-compare.ts out.png`).

| Shape | Path name |
|---|---|
| Front (left) leg with rounded apex | `legLeft` |
| Back leg, above / below the orbit | `legRightUpper`, `legRightLower` |
| Fold highlight | `legEdge` |
| Orbit + inner shading + trailing stroke | `orbit`, `orbitShade`, `tail` |
| Five pixels | `squares` (x, y, w, h, radius, tone) |

## 2. Logo package — `public/brand/`
Generated from the master by `node scripts/build-brand-assets.ts` (re-run after changing shapes or default colours).

| File | Use |
|---|---|
| `logo.svg` | **Official** full-colour mark. Colours read CSS variables (`--logo-*`) with the defaults as fallback |
| `logo-monochrome.svg` | One colour (`--logo-mono`, default `#0B2A7A`) — stamps, embossing, single-ink print |
| `logo-white.svg` | White — photos, brand-blue and dark backgrounds |
| `logo-dark.svg` | Tonal navy — quiet use on light backgrounds |
| `logo-light.svg` | Full colour lifted for dark backgrounds (what the site uses in dark mode) |
| `logo-icon.svg` | Mark in a square, optically centred box (avatars, square slots) |
| `favicon.svg` | Browser icon (tight padding so it reads at 16 px) |
| `app-icon.svg` | Mark on a white rounded tile |
| `logo.png`, `logo-white.png` | Transparent PNG, 2048 px wide |
| `logo-preview.png` | Preview sheet of every variant on its intended background |
| `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | PWA icons (maskable keeps the mark inside the 80 % safe zone) |
| `apple-touch-icon.png`, `favicon-32.png` | iOS home screen / legacy favicon |
| `badge-96.png` | Monochrome notification badge |
| `og-default.png` | Default social share image (1200 × 630) |

One-colour versions open a hairline gap between the two legs so the fold of the A stays readable without gradients.

## 3. Colour roles of the mark
| Variable | Default | Role |
|---|---|---|
| `--logo-dark` | `#020C4A` | Deepest navy — shadows, lower legs |
| `--logo-deep` | `#022A7C` | Secondary gradient — back leg, pixel shading |
| `--logo-primary` | `#0563EA` | Main blue |
| `--logo-bright` | `#00C8FD` | Cyan highlight |
| `--logo-mono` | `#0B2A7A` | One-colour version |

**Changing colours without code:** CMS → *Brand identity* → **Visual identity settings** → *Logo colours* → Save. The values are stored in `brand_settings.logo_system` and injected as the CSS variables above on every page. The inline logo, favicon and admin mark re-colour immediately. *Reset default colours* clears the overrides.

**In code / CSS:** override the variables anywhere, e.g. `.campaign { --logo-primary: #7C3AED; --logo-bright: #F472B6 }`.

## 4. Which version appears where
| Place | Version |
|---|---|
| Header (light theme) | CMS "Version on light backgrounds" (default: full colour) |
| Header (dark theme) | CMS "Version on dark backgrounds" (default: lifted colour) |
| Footer, auth side panel (dark ink surfaces) | Always the dark-background version |
| Admin sidebar, login, loading, 404 | Square mark |
| Favicon / PWA / Apple / share image | Files in `public/brand/` (or the CMS overrides) |

## 5. Replacing the logo
- **New colours:** CMS, as above.
- **Different logo file:** CMS → *Visual identity settings* → upload *Logo for light backgrounds* (and optionally *for dark backgrounds*), choose **Uploaded replacement logo**, Save. Uploaded logos are only ever rendered as `<img>`.
- **SVG safety:** uploaded SVGs are cleaned (comments, metadata, XML declarations removed) and **refused** if they contain scripts, event handlers, `javascript:`/data URLs, `foreignObject`, animation `set`, or any external reference. This runs in the browser before upload, and again on the server when the logo is saved (`src/lib/svg-safety.ts`).
- **Redrawing the official mark:** edit the paths in `src/lib/brand/mark.ts`, run `node scripts/brand-compare.ts check.png` to compare with the reference, then `node scripts/build-brand-assets.ts`.

## 6. Rules
- Clear space: at least the height of the large pixel on every side.
- Minimum size: 20 px tall on screen (favicon versions are tuned for 16 px).
- Never stretch, rotate, outline, add shadows, re-arrange the pixels or add text into the mark.
- On busy photos use `logo-white.svg`; on brand-blue backgrounds use white or mono-white.

## 7. Site colour
The site palette lives in CMS → *Brand identity* → *Colours* (`brand_settings.colors`). Migration `0012` only switched the palette to the blue identity if it was still the untouched seed palette. The previous palette is kept in `logo_system.previous_colors` and can be restored from the CMS. The fallback blue palette is in `src/lib/brand/theme.ts`.

## 8. Typography, patterns, voice
- Arabic display **Alexandria**, Arabic text **IBM Plex Sans Arabic**; Latin display **Sora**, Latin text **Inter**. All editable in CMS → Typography.
- Faint measure grid behind heroes; hairline rules; Lucide icons in soft tiles.
- Voice: calm, exact, confident. Short sentences. Promise outcomes, not adjectives.
