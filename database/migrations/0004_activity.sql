-- ALITQAN platform · 0004 activity log, written by triggers so the UI cannot skip it
create table public.activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  actor_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text,
  changes jsonb,
  created_at timestamptz not null default now()
);
create index activity_logs_created_idx on public.activity_logs(created_at desc);
create index activity_logs_entity_idx on public.activity_logs(entity_type, entity_id);

create or replace function public.tg_activity() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  rec jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  label text;
  changed jsonb;
begin
  if auth.uid() is null then  -- system / service-role operations are not staff activity
    return case when tg_op = 'DELETE' then old else new end;
  end if;
  label := coalesce(rec->'title'->>'ar', rec->'title'->>'en', rec->'name'->>'ar', rec->'name'->>'en',
                    rec->>'name', rec->>'reference', rec->>'key', rec->>'slug', rec->>'file_name', rec->>'email',
                    rec->>'role_key', rec->>'type');
  if tg_op = 'UPDATE' then
    select jsonb_agg(k) into changed from jsonb_object_keys(to_jsonb(new)) k
    where k not in ('updated_at','updated_by','created_at','created_by')
      and to_jsonb(new)->k is distinct from to_jsonb(old)->k;
    if changed is null then return new; end if;
  end if;
  insert into public.activity_logs(actor_id, actor_email, action, entity_type, entity_id, summary, changes)
  values (auth.uid(), (select email from public.profiles where id = auth.uid()), lower(tg_op), tg_table_name,
          coalesce(rec->>'id', rec->>'key', rec->>'code', rec->>'role_key'), left(label, 200), changed);
  return case when tg_op = 'DELETE' then old else new end;
end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','roles','role_permissions','languages','site_settings','brand_settings','media','pages','page_sections',
    'navigation_items','service_categories','services','project_categories','projects','team_members','blog_categories','blog_tags',
    'blog_posts','testimonials','clients','notification_templates','contact_messages','project_requests','request_notes']
  loop
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.tg_activity()', t || '_activity', t);
  end loop;
end $$;

-- explicit events from the app (sign-in, exports …)
create or replace function public.log_event(p_action text, p_entity text, p_summary text default null) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'not allowed'; end if;
  insert into public.activity_logs(actor_id, actor_email, action, entity_type, summary)
  values (auth.uid(), (select email from public.profiles where id = auth.uid()), left(p_action, 40), left(p_entity, 60), left(p_summary, 200));
end $$;

-- Where is a media file used? (scans content tables for the URL)
create or replace function public.media_usage(p_url text) returns table(entity text, id text)
language sql stable security definer set search_path = public as $$
  select 'services', s.id::text from services s where to_jsonb(s)::text like '%' || p_url || '%'
  union all select 'projects', p.id::text from projects p where to_jsonb(p)::text like '%' || p_url || '%'
  union all select 'project_images', pi.project_id::text from project_images pi where pi.url = p_url
  union all select 'page_sections', ps.page_id::text from page_sections ps where ps.content::text like '%' || p_url || '%'
  union all select 'pages', pg.id::text from pages pg where pg.seo::text like '%' || p_url || '%'
  union all select 'blog_posts', b.id::text from blog_posts b where to_jsonb(b)::text like '%' || p_url || '%'
  union all select 'team_members', t.id::text from team_members t where t.photo_url = p_url
  union all select 'testimonials', te.id::text from testimonials te where te.avatar_url = p_url
  union all select 'clients', c.id::text from clients c where c.logo_url = p_url
  union all select 'brand_settings', '1' from brand_settings bs where to_jsonb(bs)::text like '%' || p_url || '%'
  union all select 'site_settings', ss.key from site_settings ss where ss.value::text like '%' || p_url || '%';
$$;
