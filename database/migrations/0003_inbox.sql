-- ALITQAN platform · 0003 inbox: contact messages, project / quote requests, attachments, notes
create sequence public.project_request_seq;

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 40),
  subject text check (char_length(subject) <= 200),
  message text not null check (char_length(message) between 5 and 5000),
  locale text,
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  followup_on date,
  ip_hash text,
  user_agent text,
  notification_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
create index contact_messages_status_idx on public.contact_messages(status, created_at desc);

create table public.project_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default ('REQ-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.project_request_seq')::text, 4, '0')),
  kind text not null default 'project' check (kind in ('project','quote')),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 200),
  phone text check (char_length(phone) <= 40),
  company text check (char_length(company) <= 160),
  service_id uuid references public.services(id) on delete set null,
  service_label text,
  description text not null check (char_length(description) between 10 and 8000),
  budget text check (char_length(budget) <= 80),
  timeline text check (char_length(timeline) <= 80),
  locale text,
  status text not null default 'new' check (status in ('new','reviewing','contacted','proposal_sent','in_progress','won','lost','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  assigned_to uuid references public.profiles(id) on delete set null,
  followup_on date,
  consent_at timestamptz not null,
  ip_hash text,
  user_agent text,
  notification_status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid, updated_by uuid
);
create index project_requests_status_idx on public.project_requests(status, created_at desc);

create table public.request_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.project_requests(id) on delete cascade,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  created_at timestamptz not null default now()
);

create table public.request_notes (
  id uuid primary key default gen_random_uuid(),
  project_request_id uuid references public.project_requests(id) on delete cascade,
  contact_message_id uuid references public.contact_messages(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  followup_on date,
  author_id uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check ((project_request_id is null) <> (contact_message_id is null))
);
create index request_notes_req_idx on public.request_notes(project_request_id, created_at);
create index request_notes_msg_idx on public.request_notes(contact_message_id, created_at);

create trigger contact_messages_audit before insert or update on public.contact_messages for each row execute function public.tg_audit_fields();
create trigger project_requests_audit before insert or update on public.project_requests for each row execute function public.tg_audit_fields();

-- Fixed-window rate limiter used by the public forms (called with the service role only).
create table public.form_rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits int not null default 0,
  primary key (key, window_start)
);

create or replace function public.check_rate_limit(p_key text, p_max int, p_window_seconds int) returns boolean
language plpgsql security definer set search_path = public as $$
declare w timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
        n int;
begin
  delete from public.form_rate_limits where window_start < now() - interval '1 day';
  insert into public.form_rate_limits(key, window_start, hits) values (p_key, w, 1)
  on conflict (key, window_start) do update set hits = form_rate_limits.hits + 1
  returning hits into n;
  return n <= p_max;
end $$;
