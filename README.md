# إتقان · ALITQAN — Digital Company Platform

منصة رقمية متكاملة لعلامة **إتقان**: موقع تعريفي ثنائي اللغة (عربي/إنجليزي، RTL/LTR، فاتح/داكن)، لوحة تحكم CMS شاملة، هوية بصرية أصلية، وقاعدة بيانات حقيقية بصلاحيات مفروضة على مستوى PostgreSQL.

A complete platform for the ALITQAN brand: bilingual marketing site, full CMS, original identity, and a real database with permissions enforced in PostgreSQL (RLS).

| | |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide |
| Backend | Supabase: PostgreSQL + Row Level Security, Auth, Storage |
| Hosting | Vercel + Supabase Cloud |
| Tests | Vitest + PGlite (migrations & RLS run in-process, no Docker) |

## Quick start
```bash
npm install
cp .env.example .env.local      # fill in your Supabase keys (see docs/SETUP.md)
npm run db:migrate              # create schema, RLS, storage buckets
npm run db:seed                 # sample content (all editable / deletable)
npm run dev                     # http://localhost:3000  → /ar
```
Then open `/admin/setup` (with `SETUP_TOKEN` set) to create the owner account.

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | TypeScript |
| `npm test` | Database/RLS tests (PGlite) + unit tests |
| `npm run check` | typecheck + tests + production build |
| `npm run db:migrate` | Apply `database/migrations/*.sql` (tracked, each once) |
| `npm run db:seed` | Apply `database/seed/seed.sql` (idempotent) |
| `npm run create-owner -- --email you@x.com --name "Name"` | CLI alternative to `/admin/setup` |
| `node database/seed/build-seed.ts` | Regenerate `seed.sql` from `seed-data.ts` |
| `node scripts/build-brand-assets.ts` | Regenerate the logo package (SVG/PNG/PWA icons) in `public/brand/` |

## Documentation
- [docs/SETUP.md](docs/SETUP.md) — Supabase, local environment, owner account, running
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel deployment & production checklist
- [docs/CMS_GUIDE.md](docs/CMS_GUIDE.md) — دليل إدارة المحتوى والهوية والمستخدمين (للمستخدم غير التقني)
- [docs/DATABASE.md](docs/DATABASE.md) — schema, relations, RLS, functions
- [docs/BRAND.md](docs/BRAND.md) — identity directions, logo system, colours, typography
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — structure, data flow, security model

## Project structure
```
src/
  app/(site)/[locale]/…   public website (ISR, one root layout per language/direction)
  app/(admin)/admin/…     CMS (dynamic, auth-protected)
  app/auth/callback       Supabase email-link handler
  components/             site, sections (page builder renderers), admin, brand, ui, forms
  features/               admin actions & resource definitions, page-builder registry, forms
  services/               data access for public pages (site context, content)
  lib/                    supabase clients, auth/permissions, i18n, SEO, brand tokens, email
  types/                  content types
  proxy.ts                locale redirect + session refresh (Next 16 "proxy")
database/migrations       SQL migrations (schema, RLS, storage)
database/seed             seed data (TypeScript) → seed.sql
database/tests            PGlite RLS test-suite
public/brand              official logo package (SVG/PNG/icons)   public/demo  generated demo artwork
```
