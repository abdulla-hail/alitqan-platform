-- ALITQAN platform · 0008 experience upgrade. ADDITIVE ONLY: new columns with defaults,
-- one new table, default settings rows. No existing data is deleted.

-- 1) Homepage projects slider ---------------------------------------------------------------
alter table public.projects
  add column if not exists show_on_home boolean not null default false,
  add column if not exists home_position int not null default 0,
  add column if not exists slider_link text,
  add column if not exists link_target text not null default '_self',
  add column if not exists thumbnail_url text,
  add column if not exists mobile_image_url text,
  add column if not exists cover_alt jsonb not null default '{}';
do $$ begin
  alter table public.projects add constraint projects_link_target_chk check (link_target in ('_self', '_blank'));
exception when duplicate_object then null; end $$;
create index if not exists projects_home_idx on public.projects(show_on_home, home_position);

-- Start the slider with the projects already marked "featured" (only if nothing was chosen yet).
update public.projects set show_on_home = true, home_position = position
where is_featured and not exists (select 1 from public.projects where show_on_home);

-- 2) Custom fonts (WOFF2/WOFF uploaded to the media bucket) --------------------------------
create table if not exists public.custom_fonts (
  id uuid primary key default gen_random_uuid(),
  family text not null unique check (family ~ '^[A-Za-z0-9 ]{2,60}$'),
  script text not null default 'both' check (script in ('arabic', 'latin', 'both')),
  files jsonb not null default '[]', -- [{ "url": "...", "weight": 400, "style": "normal", "format": "woff2" }]
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
alter table public.custom_fonts enable row level security;
drop trigger if exists custom_fonts_audit on public.custom_fonts;
create trigger custom_fonts_audit before insert or update on public.custom_fonts for each row execute function public.tg_audit_fields();
drop trigger if exists custom_fonts_activity on public.custom_fonts;
create trigger custom_fonts_activity after insert or update or delete on public.custom_fonts for each row execute function public.tg_activity();

drop policy if exists custom_fonts_read on public.custom_fonts;
create policy custom_fonts_read on public.custom_fonts for select using (is_active or public.is_staff());
drop policy if exists custom_fonts_insert on public.custom_fonts;
create policy custom_fonts_insert on public.custom_fonts for insert to authenticated with check (public.has_permission('brand.manage'));
drop policy if exists custom_fonts_update on public.custom_fonts;
create policy custom_fonts_update on public.custom_fonts for update to authenticated using (public.has_permission('brand.manage')) with check (public.has_permission('brand.manage'));
drop policy if exists custom_fonts_delete on public.custom_fonts;
create policy custom_fonts_delete on public.custom_fonts for delete to authenticated using (public.has_permission('brand.manage'));

grant select on public.custom_fonts to anon;
grant select, insert, update, delete on public.custom_fonts to authenticated;
grant all on public.custom_fonts to service_role;

-- Allow font files in the media bucket (keeps every existing type)
update storage.buckets
set allowed_mime_types = (select array_agg(distinct t) from unnest(coalesce(allowed_mime_types, '{}') || array['font/woff2', 'font/woff']) t)
where id = 'media';

-- 3) Default Motion & Interaction settings (public: the site reads them) --------------------
insert into public.site_settings (key, value, is_public) values ('motion', jsonb_build_object(
  'enabled', true, 'level', 'balanced', 'duration_ms', 600, 'stagger_ms', 90,
  'hover', true, 'reveal', true, 'parallax', true, 'page_transitions', true,
  'slider_autoplay', true, 'slider_interval_ms', 6000, 'mobile', 'reduced'
), true) on conflict (key) do nothing;

-- 4) Homepage narrative: only applied when the home page still has the original seeded order,
--    so any arrangement made in the CMS is never overwritten.
do $$
declare pid uuid; types text[];
begin
  select id into pid from public.pages where slug = 'home';
  if pid is null then return; end if;
  select array_agg(type order by position) into types from public.page_sections where page_id = pid;
  if types is distinct from array['hero','about','services','features','stats','projects','process','tech','clients','testimonials','faq','cta'] then
    return;
  end if;
  update public.page_sections set position = case type
      when 'hero' then 0 when 'services' then 1 when 'projects' then 2 when 'about' then 3 when 'features' then 4
      when 'stats' then 5 when 'process' then 6 when 'tech' then 7 when 'testimonials' then 8 when 'clients' then 9
      when 'faq' then 10 when 'cta' then 11 end
  where page_id = pid;
  update public.page_sections set settings = settings || '{"layout":"slider"}'::jsonb where page_id = pid and type = 'projects';
  update public.page_sections set content = jsonb_set(content, '{items}', '[
    {"title":{"ar":"دراسة الفكرة","en":"Discover the idea"},"text":{"ar":"نفهم أهدافك وجمهورك وسوقك قبل أي قرار.","en":"We understand your goals, audience and market before any decision."}},
    {"title":{"ar":"التخطيط والتحليل","en":"Plan & analyse"},"text":{"ar":"نطاق واضح، أولويات، وخطة زمنية واقعية.","en":"Clear scope, priorities and a realistic timeline."}},
    {"title":{"ar":"التصميم","en":"Design"},"text":{"ar":"هوية وتجربة ونماذج أولية تُراجع معك.","en":"Identity, UX and prototypes reviewed with you."}},
    {"title":{"ar":"التطوير","en":"Build"},"text":{"ar":"تطوير على دفعات قصيرة مع عروض دورية.","en":"Short iterations with regular demos."}},
    {"title":{"ar":"الاختبار","en":"Test"},"text":{"ar":"اختبار الأداء والأمان والتجربة على كل الأجهزة.","en":"Performance, security and UX tested on every device."}},
    {"title":{"ar":"الإطلاق والدعم","en":"Launch & support"},"text":{"ar":"نشر، قياس، وتحسين مستمر بعد الإطلاق.","en":"Release, measure and keep improving after launch."}}
  ]'::jsonb) where page_id = pid and type = 'process';
end $$;

-- 5) New interface strings (slider controls etc.) — added only if missing, never overwritten
insert into public.translations (key, locale, value, group_key)
select v.key, v.locale, v.value, split_part(v.key, '.', 1)
from (values
  ('common.scroll','ar','انتقل للأسفل'), ('common.scroll','en','Scroll down'),
  ('projects.view','ar','عرض المشروع'), ('projects.view','en','View project'),
  ('slider.prev','ar','المشروع السابق'), ('slider.prev','en','Previous project'),
  ('slider.next','ar','المشروع التالي'), ('slider.next','en','Next project'),
  ('slider.pause','ar','إيقاف التشغيل التلقائي'), ('slider.pause','en','Pause autoplay'),
  ('slider.play','ar','تشغيل تلقائي'), ('slider.play','en','Play autoplay'),
  ('slider.region','ar','معرض المشاريع'), ('slider.region','en','Projects carousel'),
  ('slider.slide','ar','الشريحة'), ('slider.slide','en','Slide'),
  ('slider.of','ar','من'), ('slider.of','en','of')
) as v(key, locale, value)
where exists (select 1 from public.languages l where l.code = v.locale)
on conflict (key, locale) do nothing;
