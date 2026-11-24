-- ALITQAN platform · 0007 explicit API grants.
-- Newer Supabase projects no longer grant table privileges to the Data API roles by
-- default, so without these grants every PostgREST call fails with
-- "permission denied (42501)" — even for the service role. Privileges below are the
-- table-level gate; Row Level Security (0005) still decides which ROWS each role sees.
-- Idempotent: safe to run more than once.

grant usage on schema public to anon, authenticated, service_role;

-- Visitors: read-only, and only on tables that hold public website content.
grant select on
  public.languages, public.translations, public.site_settings, public.brand_settings,
  public.pages, public.page_sections, public.navigation_items,
  public.service_categories, public.services,
  public.project_categories, public.projects, public.project_images, public.project_services,
  public.team_members, public.blog_categories, public.blog_tags, public.blog_posts, public.blog_post_tags,
  public.testimonials, public.clients
to anon;

-- Signed-in users: DML on content/admin tables (RLS + has_permission decide what is allowed).
grant select, insert, update, delete on
  public.roles, public.permissions, public.role_permissions, public.profiles,
  public.languages, public.translations, public.site_settings, public.brand_settings, public.media,
  public.pages, public.page_sections, public.navigation_items,
  public.service_categories, public.services,
  public.project_categories, public.projects, public.project_images, public.project_services,
  public.team_members, public.blog_categories, public.blog_tags, public.blog_posts, public.blog_post_tags,
  public.testimonials, public.clients, public.notification_templates,
  public.contact_messages, public.project_requests, public.request_attachments, public.request_notes
to authenticated;
grant select on public.activity_logs to authenticated;          -- rows are written by triggers only
-- form_rate_limits: no access for anon/authenticated (service role only)

-- Server-side service role (bypasses RLS; used only after validation in server code).
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Functions referenced inside RLS policies run with the caller's privileges.
grant execute on function public.has_permission(text), public.is_staff(), public.is_super_admin(uuid) to anon, authenticated, service_role;
grant execute on function public.my_permissions(), public.log_event(text, text, text), public.media_usage(text) to authenticated, service_role;
grant execute on function public.bootstrap_owner(uuid), public.check_rate_limit(text, int, int) to service_role;
