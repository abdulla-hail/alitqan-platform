-- ALITQAN platform · 0002 content model.
-- Translatable fields are jsonb maps keyed by language code: {"ar": "...", "en": "..."}
-- so new languages need no schema change.

create table public.languages (
  code text primary key check (code ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  name text not null,
  native_name text not null,
  dir text not null default 'ltr' check (dir in ('ltr','rtl')),
  is_enabled boolean not null default true,
  is_default boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
create unique index languages_one_default on public.languages(is_default) where is_default;

create table public.translations (
  id uuid primary key default gen_random_uuid(),
  key text not null check (key ~ '^[a-z0-9_.-]+$'),
  locale text not null references public.languages(code) on update cascade on delete cascade,
  value text not null default '',
  group_key text not null default 'common',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid,
  unique (key, locale)
);

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}',
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

create table public.brand_settings (
  id int primary key default 1 check (id = 1),
  name jsonb not null default '{}',
  tagline jsonb not null default '{}',
  description jsonb not null default '{}',
  logo_mode text not null default 'builtin' check (logo_mode in ('builtin','symbol_text','uploaded')),
  logo_url text, logo_dark_url text, logo_alt_url text, symbol_url text, favicon_url text, og_image_url text,
  colors jsonb not null default '{}',
  fonts jsonb not null default '{}',
  radius text not null default '14px',
  backgrounds jsonb not null default '{}',
  default_theme text not null default 'system' check (default_theme in ('light','dark','system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null unique,
  url text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  width int, height int,
  alt jsonb not null default '{}',
  folder text not null default 'general',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
create index media_folder_idx on public.media(folder, created_at desc);

-- Pages & page builder --------------------------------------------------------
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind text not null default 'custom' check (kind in ('system','custom','legal')),
  title jsonb not null default '{}',
  summary jsonb not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  seo jsonb not null default '{}',
  show_in_sitemap boolean not null default true,
  position int not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages(id) on delete cascade,
  type text not null check (type ~ '^[a-z_]+$'),
  label text,
  position int not null default 0,
  is_visible boolean not null default true,
  content jsonb not null default '{}',
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
create index page_sections_page_idx on public.page_sections(page_id, position);

create table public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  menu text not null check (menu in ('header','footer','footer_bottom')),
  parent_id uuid references public.navigation_items(id) on delete cascade,
  label jsonb not null default '{}',
  href text not null default '#',
  new_tab boolean not null default false,
  is_visible boolean not null default true,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
create index navigation_menu_idx on public.navigation_items(menu, parent_id, position);

-- Services --------------------------------------------------------------------
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null default '{}',
  description jsonb not null default '{}',
  icon text,
  is_visible boolean not null default true,
  position int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title jsonb not null default '{}',
  excerpt jsonb not null default '{}',
  body jsonb not null default '{}',
  icon text,
  image_url text,
  features jsonb not null default '[]',
  steps jsonb not null default '[]',
  faqs jsonb not null default '[]',
  technologies text[] not null default '{}',
  related_ids uuid[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_featured boolean not null default false,
  position int not null default 0,
  seo jsonb not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
create index services_category_idx on public.services(category_id, position);
create index services_status_idx on public.services(status, position);

-- Projects / portfolio ----------------------------------------------------------
create table public.project_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null default '{}',
  is_visible boolean not null default true,
  position int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.project_categories(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title jsonb not null default '{}',
  excerpt jsonb not null default '{}',
  body jsonb not null default '{}',
  challenge jsonb not null default '{}',
  solution jsonb not null default '{}',
  results jsonb not null default '{}',
  metrics jsonb not null default '[]',
  client_name jsonb not null default '{}',
  project_type jsonb not null default '{}',
  cover_url text,
  completed_on date,
  technologies text[] not null default '{}',
  live_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_featured boolean not null default false,
  position int not null default 0,
  seo jsonb not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
create index projects_status_idx on public.projects(status, position);
create index projects_category_idx on public.projects(category_id);

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  url text not null,
  alt jsonb not null default '{}',
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
create index project_images_project_idx on public.project_images(project_id, position);

create table public.project_services (
  project_id uuid not null references public.projects(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (project_id, service_id)
);

-- Team ------------------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  slug text unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null default '{}',
  job_title jsonb not null default '{}',
  bio jsonb not null default '{}',
  photo_url text,
  skills text[] not null default '{}',
  social jsonb not null default '{}',
  is_founder boolean not null default false,
  is_visible boolean not null default true,
  position int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

-- Blog ------------------------------------------------------------------------
create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null default '{}',
  description jsonb not null default '{}',
  position int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

create table public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id uuid references public.blog_categories(id) on delete set null,
  author_id uuid references public.team_members(id) on delete set null,
  title jsonb not null default '{}',
  excerpt jsonb not null default '{}',
  body jsonb not null default '{}',
  cover_url text,
  reading_minutes int,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_featured boolean not null default false,
  published_at timestamptz,
  seo jsonb not null default '{}',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
create index blog_posts_status_idx on public.blog_posts(status, published_at desc);
create index blog_posts_category_idx on public.blog_posts(category_id);

create table public.blog_post_tags (
  post_id uuid not null references public.blog_posts(id) on delete cascade,
  tag_id uuid not null references public.blog_tags(id) on delete cascade,
  primary key (post_id, tag_id)
);

-- Social proof -------------------------------------------------------------------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name jsonb not null default '{}',
  author_title jsonb not null default '{}',
  avatar_url text,
  quote jsonb not null default '{}',
  rating int not null default 5 check (rating between 1 and 5),
  is_visible boolean not null default true,
  position int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null default '{}',
  description jsonb not null default '{}',
  logo_url text,
  website text,
  is_visible boolean not null default true,
  position int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

create table public.notification_templates (
  key text primary key check (key in ('project_request','quote_request','contact_message')),
  subject jsonb not null default '{}',
  body jsonb not null default '{}',
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);

-- published_at bookkeeping
create or replace function public.tg_published_at() returns trigger language plpgsql as $$
begin
  if new.status = 'published' and new.published_at is null then new.published_at := now(); end if;
  return new;
end $$;
create trigger pages_published before insert or update on public.pages for each row execute function public.tg_published_at();
create trigger blog_posts_published before insert or update on public.blog_posts for each row execute function public.tg_published_at();

-- audit triggers for all content tables
do $$
declare t text;
begin
  foreach t in array array['languages','translations','site_settings','brand_settings','media','pages','page_sections',
    'navigation_items','service_categories','services','project_categories','projects','project_images','team_members',
    'blog_categories','blog_tags','blog_posts','testimonials','clients','notification_templates']
  loop
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.tg_audit_fields()', t || '_audit', t);
  end loop;
end $$;
