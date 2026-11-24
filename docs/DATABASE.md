# Database

PostgreSQL on Supabase. Migrations in `database/migrations` (applied in order by `npm run db:migrate`, tracked in `public._migrations`). Every table has RLS enabled.

## Conventions
- `uuid` primary keys (`gen_random_uuid()`), except natural keys (`roles.key`, `permissions.key`, `languages.code`, `site_settings.key`, `notification_templates.key`) and the single-row `brand_settings (id = 1)`.
- Translatable fields are **jsonb maps** keyed by language code: `{"ar": "…", "en": "…"}`. Adding a language needs no schema change.
- `created_at, updated_at, created_by, updated_by` are maintained by the `tg_audit_fields` trigger (from `auth.uid()`).
- Publishable content has `status ∈ draft | published | archived` (+ `published_at` set on first publish); simple content has `is_visible`.
- Ordered content has `position`. Seeded rows carry `is_demo = true` (bulk-deletable).

## Tables
| Group | Tables |
|---|---|
| Access | `roles`, `permissions`, `role_permissions`, `profiles` (1:1 `auth.users`) |
| Site | `languages`, `translations` (UI strings key×locale), `site_settings` (key → jsonb), `brand_settings`, `navigation_items` (self-referencing tree, menus `header`/`footer`/`footer_bottom`) |
| Pages | `pages` (`kind` system/custom/legal, `seo` jsonb), `page_sections` (`type`, `position`, `is_visible`, `content`, `settings`) |
| Services | `service_categories`, `services` (features/steps/faqs jsonb, `technologies text[]`, `related_ids uuid[]`) |
| Portfolio | `project_categories`, `projects`, `project_images` (gallery), `project_services` (m:n) |
| Team | `team_members` (social jsonb, `is_founder`) |
| Blog | `blog_categories`, `blog_tags`, `blog_posts` (author → team_members), `blog_post_tags` (m:n) |
| Social proof | `testimonials`, `clients` |
| Media | `media` (Storage object registry: path, url, mime, size, dimensions, alt, folder) |
| Inbox | `contact_messages`, `project_requests` (`reference` REQ-YYYY-NNNN, kind project/quote, status pipeline, priority, assignee, follow-up), `request_attachments`, `request_notes` (internal, polymorphic to request or message) |
| Fonts | `custom_fonts` (family, script, files jsonb: url/weight/style/format, is_active) — read: active fonts public; write: `brand.manage` |
| Ops | `activity_logs` (trigger-written audit trail), `notification_templates`, `form_rate_limits` |

## Key functions
| Function | Purpose |
|---|---|
| `has_permission(perm)` | true if the caller's profile is active and its role grants `perm` (super_admin: always) — used by all policies |
| `is_staff()`, `is_super_admin()`, `my_permissions()` | helpers for policies and the UI |
| `handle_new_user()` | creates an **inactive viewer** profile for every new auth user; never grants super_admin |
| `tg_profiles_guard()` | blocks self role/activation changes, super_admin changes by non-owners, demoting the last owner |
| `bootstrap_owner(uuid)` | service-role only; works only while no active owner exists |
| `check_rate_limit(key, max, window)` | service-role only fixed-window limiter for public forms/login |
| `tg_activity()` / `log_event()` | audit log rows (with changed column names) |
| `media_usage(url)` | where a media file is referenced |

## Row Level Security summary
| Data | anon (visitors) | staff (active profile) | writes |
|---|---|---|---|
| Published pages/services/projects/posts, visible team/clients/testimonials/nav, languages, translations, brand, public settings | read | read all incl. drafts | by permission (`pages.manage`, `services.manage`, …) |
| `site_settings.notifications`, `notification_templates` | – | `settings.manage` | `settings.manage` |
| Inbox tables | **no access** (inserted server-side after validation) | `inbox.view` | update `inbox.manage`, delete `inbox.delete` |
| `profiles` | – | own row; all with `users.manage` | guarded by trigger |
| `activity_logs` | – | `activity.view` | triggers only |
| Storage `media` | public read | – | `media.manage` |
| Storage `request-attachments` (private, 10 MB, MIME allow-list) | signed upload URL only | signed download (`inbox.view`) | delete `inbox.delete` |

The test-suite `database/tests/rls.test.ts` applies all migrations + seed in PGlite and verifies these rules for anon, viewer, editor, admin, inactive and owner users.

## Migration history
| File | Purpose |
|---|---|
| 0001–0006 | schema, content model, inbox, activity log, RLS, storage |
| 0007_api_grants | explicit table/function grants for the API roles (new Supabase projects grant nothing by default) |
| 0008_experience | projects: show_on_home, home_position, slider_link, link_target, thumbnail_url, mobile_image_url, cover_alt · custom_fonts table · font MIME types in media bucket · default motion settings · new UI strings · guarded homepage re-order (only if untouched) |
| 0009_process_title | guarded copy fix for the 6-step process title |

All of 0007–0009 are additive and idempotent.
