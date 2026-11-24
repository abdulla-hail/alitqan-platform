-- ALITQAN platform · 0001 foundation: helpers, roles, permissions, profiles
-- gen_random_uuid() is built into PostgreSQL 13+

-- updated_at / created_by / updated_by maintained for every content table
create or replace function public.tg_audit_fields() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := coalesce(new.created_at, now());
    new.created_by := coalesce(new.created_by, auth.uid());
  end if;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

-- Roles & permissions ---------------------------------------------------------
create table public.roles (
  key text primary key check (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  name jsonb not null default '{}',
  description jsonb not null default '{}',
  is_system boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.permissions (
  key text primary key,
  group_key text not null,
  description jsonb not null default '{}',
  position int not null default 0
);

create table public.role_permissions (
  role_key text not null references public.roles(key) on update cascade on delete cascade,
  permission_key text not null references public.permissions(key) on update cascade on delete cascade,
  primary key (role_key, permission_key)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role_key text not null default 'viewer' references public.roles(key) on update cascade,
  is_active boolean not null default false,
  preferred_locale text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid,
  updated_by uuid
);
create index profiles_role_idx on public.profiles(role_key);
create trigger profiles_audit before insert or update on public.profiles
  for each row execute function public.tg_audit_fields();

-- Permission helpers (security definer so they can be used inside RLS policies) ---
create or replace function public.is_super_admin(uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = uid and p.is_active and p.role_key = 'super_admin');
$$;

create or replace function public.has_permission(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active
      and (p.role_key = 'super_admin'
           or exists (select 1 from public.role_permissions rp
                      where rp.role_key = p.role_key and rp.permission_key = perm))
  );
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_active);
$$;

create or replace function public.my_permissions() returns setof text
language sql stable security definer set search_path = public as $$
  select pm.key from public.permissions pm
  where public.is_super_admin()
     or exists (select 1 from public.profiles p join public.role_permissions rp on rp.role_key = p.role_key
                where p.id = auth.uid() and p.is_active and rp.permission_key = pm.key);
$$;

-- New auth users get an INACTIVE viewer profile. Only app_metadata (settable by the
-- service role, never by the user) may carry an initial role/activation.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  r text := coalesce(new.raw_app_meta_data->>'role', 'viewer');
begin
  if r = 'super_admin' or not exists (select 1 from public.roles where key = r) then r := 'viewer'; end if;
  insert into public.profiles (id, email, full_name, role_key, is_active)
  values (new.id, coalesce(new.email, ''),
          coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,''), '@', 1)),
          r, coalesce((new.raw_app_meta_data->>'active')::boolean, false))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Guard rails on profiles: only super admins touch super admins / grant super_admin,
-- users cannot change their own role or activation, and the last owner is protected.
create or replace function public.tg_profiles_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare actor uuid := auth.uid();
begin
  if actor is null then return coalesce(new, old); end if; -- service role / migrations
  if tg_op = 'DELETE' then
    if old.role_key = 'super_admin' and not public.is_super_admin(actor) then
      raise exception 'only a super admin can remove a super admin';
    end if;
    return old;
  end if;
  if old.id = actor and (new.role_key is distinct from old.role_key or new.is_active is distinct from old.is_active) then
    raise exception 'you cannot change your own role or activation';
  end if;
  if (old.role_key = 'super_admin' or new.role_key = 'super_admin')
     and (new.role_key is distinct from old.role_key or new.is_active is distinct from old.is_active)
     and not public.is_super_admin(actor) then
    raise exception 'only a super admin can grant or change the super admin role';
  end if;
  if old.role_key = 'super_admin' and old.is_active
     and (new.role_key <> 'super_admin' or not new.is_active)
     and (select count(*) from public.profiles where role_key = 'super_admin' and is_active) <= 1 then
    raise exception 'cannot demote or deactivate the last active super admin';
  end if;
  new.id := old.id; new.email := old.email; -- immutable from the client
  return new;
end $$;
create trigger profiles_guard before update or delete on public.profiles
  for each row execute function public.tg_profiles_guard();

-- Owner bootstrap: succeeds only while no active super admin exists. Executable by
-- the service role only (used by /admin/setup and scripts/create-owner.mjs).
create or replace function public.bootstrap_owner(target uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.profiles where role_key = 'super_admin' and is_active) then
    raise exception 'an owner already exists';
  end if;
  update public.profiles set role_key = 'super_admin', is_active = true where id = target;
  if not found then raise exception 'profile not found'; end if;
end $$;
revoke all on function public.bootstrap_owner(uuid) from public;
