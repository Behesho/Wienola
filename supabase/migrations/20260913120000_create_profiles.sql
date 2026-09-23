-- Profiles table: one row per auth user, holding app-level profile data.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null check (role in ('customer', 'dienstleister')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security: every user can only see/change their own profile.
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keep updated_at current on every change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- Automatically create a profile row whenever a new auth user is created.
-- full_name/role come from the metadata passed to supabase.auth.signUp()
-- (options.data). Runs as SECURITY DEFINER so it can write to profiles
-- regardless of whether the new user already has an active session yet
-- (e.g. when email confirmation is required) — this never involves the
-- service_role key, it's a narrowly-scoped database trigger.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
