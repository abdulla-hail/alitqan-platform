-- ALITQAN platform · 0005 Row Level Security. Every table is locked down; access is
-- granted only through the policies below. Permissions are enforced HERE, not only in the UI.

do $$
declare t text;
begin
  foreach t in array array['roles','permissions','role_permissions','profiles','languages','translations','site_settings',
    'brand_settings','media','pages','page_sections','navigation_items','service_categories','services','project_categories',
    'projects','project_images','project_services','team_members','blog_categories','blog_tags','blog_posts','blog_post_tags',
    'testimonials','clients','notification_templates','contact_messages','project_requests','request_attachments',
    'request_notes','form_rate_limits','activity_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Helper: standard "permission writes" policies for a table ----------------------------
create or replace function public._grant_writes(tbl text, perm text) returns void language plpgsql as $$
begin
  execute format('create policy %I on public.%I for insert to authenticated with check (public.has_permission(%L))', tbl || '_insert', tbl, perm);
  execute format('create policy %I on public.%I for update to authenticated using (public.has_permission(%L)) with check (public.has_permission(%L))', tbl || '_update', tbl, perm, perm);
  execute format('create policy %I on public.%I for delete to authenticated using (public.has_permission(%L))', tbl || '_delete', tbl, perm);
end $$;

-- Public read policies ----------------------------------------------------------------
create policy languages_read on public.languages for select using (is_enabled or public.is_staff());
create policy translations_read on public.translations for select using (true);
create policy site_settings_read on public.site_settings for select using (is_public or public.has_permission('settings.manage'));
create policy brand_settings_read on public.brand_settings for select using (true);
create policy media_read on public.media for select to authenticated using (public.is_staff());
create policy pages_read on public.pages for select using (status = 'published' or public.is_staff());
create policy page_sections_read on public.page_sections for select using (
  public.is_staff() or (is_visible and exists (select 1 from public.pages p where p.id = page_id and p.status = 'published')));
create policy navigation_read on public.navigation_items for select using (is_visible or public.is_staff());
create policy service_categories_read on public.service_categories for select using (is_visible or public.is_staff());
create policy services_read on public.services for select using (status = 'published' or public.is_staff());
create policy project_categories_read on public.project_categories for select using (is_visible or public.is_staff());
create policy projects_read on public.projects for select using (status = 'published' or public.is_staff());
create policy project_images_read on public.project_images for select using (
  public.is_staff() or exists (select 1 from public.projects p where p.id = project_id and p.status = 'published'));
create policy project_services_read on public.project_services for select using (
  public.is_staff() or exists (select 1 from public.projects p where p.id = project_id and p.status = 'published'));
create policy team_read on public.team_members for select using (is_visible or public.is_staff());
create policy blog_categories_read on public.blog_categories for select using (true);
create policy blog_tags_read on public.blog_tags for select using (true);
create policy blog_posts_read on public.blog_posts for select using (
  (status = 'published' and published_at <= now()) or public.is_staff());
create policy blog_post_tags_read on public.blog_post_tags for select using (
  public.is_staff() or exists (select 1 from public.blog_posts b where b.id = post_id and b.status = 'published'));
create policy testimonials_read on public.testimonials for select using (is_visible or public.is_staff());
create policy clients_read on public.clients for select using (is_visible or public.is_staff());
create policy notification_templates_read on public.notification_templates for select to authenticated using (public.has_permission('settings.manage'));

-- Writes by permission -----------------------------------------------------------------
select public._grant_writes('languages', 'languages.manage');
select public._grant_writes('translations', 'languages.manage');
select public._grant_writes('site_settings', 'settings.manage');
select public._grant_writes('notification_templates', 'settings.manage');
select public._grant_writes('brand_settings', 'brand.manage');
select public._grant_writes('media', 'media.manage');
select public._grant_writes('pages', 'pages.manage');
select public._grant_writes('page_sections', 'pages.manage');
select public._grant_writes('navigation_items', 'navigation.manage');
select public._grant_writes('service_categories', 'services.manage');
select public._grant_writes('services', 'services.manage');
select public._grant_writes('project_categories', 'projects.manage');
select public._grant_writes('projects', 'projects.manage');
select public._grant_writes('project_images', 'projects.manage');
select public._grant_writes('project_services', 'projects.manage');
select public._grant_writes('team_members', 'team.manage');
select public._grant_writes('blog_categories', 'blog.manage');
select public._grant_writes('blog_tags', 'blog.manage');
select public._grant_writes('blog_posts', 'blog.manage');
select public._grant_writes('blog_post_tags', 'blog.manage');
select public._grant_writes('testimonials', 'testimonials.manage');
select public._grant_writes('clients', 'clients.manage');
drop function public._grant_writes(text, text);

-- Roles & permissions --------------------------------------------------------------
create policy roles_read on public.roles for select to authenticated using (public.is_staff());
create policy permissions_read on public.permissions for select to authenticated using (public.is_staff());
create policy role_permissions_read on public.role_permissions for select to authenticated using (public.is_staff());
create policy roles_write on public.roles for all to authenticated
  using (public.has_permission('roles.manage') and not is_system)
  with check (public.has_permission('roles.manage') and not is_system);
create policy role_permissions_write on public.role_permissions for all to authenticated
  using (public.has_permission('roles.manage') and role_key <> 'super_admin')
  with check (public.has_permission('roles.manage') and role_key <> 'super_admin');

-- Profiles ---------------------------------------------------------------------------
create policy profiles_read on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_permission('users.manage'));
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.has_permission('users.manage'))
  with check (id = auth.uid() or public.has_permission('users.manage'));
create policy profiles_delete on public.profiles for delete to authenticated
  using (public.has_permission('users.manage') and id <> auth.uid());

-- Inbox: never inserted by browsers directly (server validates, rate-limits, then inserts
-- with the service role). Staff read/update/delete by permission.
create policy contact_messages_read on public.contact_messages for select to authenticated using (public.has_permission('inbox.view'));
create policy contact_messages_update on public.contact_messages for update to authenticated
  using (public.has_permission('inbox.manage')) with check (public.has_permission('inbox.manage'));
create policy contact_messages_delete on public.contact_messages for delete to authenticated using (public.has_permission('inbox.delete'));
create policy project_requests_read on public.project_requests for select to authenticated using (public.has_permission('inbox.view'));
create policy project_requests_update on public.project_requests for update to authenticated
  using (public.has_permission('inbox.manage')) with check (public.has_permission('inbox.manage'));
create policy project_requests_delete on public.project_requests for delete to authenticated using (public.has_permission('inbox.delete'));
create policy request_attachments_read on public.request_attachments for select to authenticated using (public.has_permission('inbox.view'));
create policy request_attachments_delete on public.request_attachments for delete to authenticated using (public.has_permission('inbox.delete'));
create policy request_notes_read on public.request_notes for select to authenticated using (public.has_permission('inbox.view'));
create policy request_notes_insert on public.request_notes for insert to authenticated
  with check (public.has_permission('inbox.manage') and author_id = auth.uid());
create policy request_notes_delete on public.request_notes for delete to authenticated
  using (author_id = auth.uid() or public.has_permission('inbox.delete'));

-- Activity log: read-only for auditors; rows come only from triggers / log_event().
create policy activity_read on public.activity_logs for select to authenticated using (public.has_permission('activity.view'));

-- Sensitive functions: service role only.
revoke execute on function public.bootstrap_owner(uuid) from public, anon, authenticated;
revoke execute on function public.check_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.bootstrap_owner(uuid) to service_role;
grant execute on function public.check_rate_limit(text, int, int) to service_role;
revoke execute on function public.media_usage(text) from public, anon;
revoke execute on function public.log_event(text, text, text) from public, anon;
