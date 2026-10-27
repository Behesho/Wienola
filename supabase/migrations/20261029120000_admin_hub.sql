-- =========================================================================
-- ADMIN HUB — run this whole file once in the Supabase SQL editor.
-- It is idempotent: running it again changes nothing.
-- =========================================================================

-- 0) SECURITY FIX ----------------------------------------------------------
-- Until now any signed-in user could set is_admin / role on their own
-- profile (a column-level REVOKE does nothing while the table-level UPDATE
-- grant exists). From now on a user may change only their name, phone and
-- e-mail. role / is_admin / is_approved are set by SQL or admin functions.
revoke update on public.profiles from authenticated, anon;
grant update (full_name, phone, email) on public.profiles to authenticated;

-- 1) Approval of new drivers ------------------------------------------------
-- Existing accounts stay approved (default true). New driver sign-ups start
-- unapproved until an admin presses "Freischalten".
alter table public.profiles add column if not exists is_approved boolean not null default true;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role text := coalesce(new.raw_user_meta_data ->> 'role', 'customer');
begin
  insert into public.profiles (id, full_name, phone, email, role, is_approved)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.email, nullif(new.raw_user_meta_data ->> 'email', '')),
    new_role,
    new_role <> 'dienstleister'
  );
  return new;
end;
$$;

create or replace function public.current_user_is_approved()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_approved from public.profiles where id = auth.uid()), false)
$$;

-- Unapproved drivers can neither see nor take open orders.
drop policy if exists "Drivers can view open orders" on public.orders;
create policy "Drivers can view open orders"
  on public.orders
  for select
  to authenticated
  using (
    status = 'open'
    and public.current_user_role() = 'dienstleister'
    and public.current_user_is_approved()
    and (assigned_driver_id is null or assigned_driver_id = auth.uid())
  );

drop policy if exists "Drivers can accept or update their jobs" on public.orders;
create policy "Drivers can accept or update their jobs"
  on public.orders
  for update
  to authenticated
  using (
    auth.uid() = driver_id
    or (
      status = 'open'
      and driver_id is null
      and public.current_user_role() = 'dienstleister'
      and public.current_user_is_approved()
      and (assigned_driver_id is null or assigned_driver_id = auth.uid())
    )
  )
  with check (auth.uid() = driver_id);

-- 2) Orders: admin may delete, a driver may give an accepted job back -------
drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders
  for delete
  to authenticated
  using (public.current_user_is_admin());

grant delete on public.orders to authenticated;

drop policy if exists "Drivers can give back an accepted order" on public.orders;
create policy "Drivers can give back an accepted order"
  on public.orders
  for update
  to authenticated
  using (auth.uid() = driver_id and status = 'accepted')
  with check (status = 'open' and driver_id is null);

-- 3) Messages from the admin to drivers ("Erinnerung") ----------------------
create table if not exists public.driver_nudges (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.profiles (id) on delete cascade, -- null = all drivers
  sender_id uuid default auth.uid() references public.profiles (id) on delete set null,
  message text not null check (char_length(message) between 1 and 300),
  created_at timestamptz not null default now()
);

alter table public.driver_nudges enable row level security;

drop policy if exists "Admins can send nudges" on public.driver_nudges;
create policy "Admins can send nudges"
  on public.driver_nudges
  for insert
  to authenticated
  with check (public.current_user_is_admin());

drop policy if exists "Admins can read all nudges" on public.driver_nudges;
create policy "Admins can read all nudges"
  on public.driver_nudges
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "Drivers can read their nudges" on public.driver_nudges;
create policy "Drivers can read their nudges"
  on public.driver_nudges
  for select
  to authenticated
  using (driver_id is null or driver_id = auth.uid());

do $$
begin
  alter publication supabase_realtime add table public.driver_nudges;
exception when duplicate_object then null;
end $$;

-- 4) Driver availability ----------------------------------------------------
create table if not exists public.driver_availability (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  day date not null,
  available boolean not null,
  start_hour smallint check (start_hour between 0 and 23),
  end_hour smallint check (end_hour between 1 and 24),
  created_at timestamptz not null default now(),
  check (
    (start_hour is null and end_hour is null)
    or (start_hour is not null and end_hour is not null and start_hour < end_hour)
  )
);

create index if not exists driver_availability_driver_day_idx
  on public.driver_availability (driver_id, day);

alter table public.driver_availability enable row level security;

drop policy if exists "Admins can read all availability" on public.driver_availability;
create policy "Admins can read all availability"
  on public.driver_availability
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "Admins can delete availability" on public.driver_availability;
create policy "Admins can delete availability"
  on public.driver_availability
  for delete
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "Drivers can read their availability" on public.driver_availability;
create policy "Drivers can read their availability"
  on public.driver_availability
  for select
  to authenticated
  using (driver_id = auth.uid());

drop policy if exists "Drivers can add their availability" on public.driver_availability;
create policy "Drivers can add their availability"
  on public.driver_availability
  for insert
  to authenticated
  with check (
    driver_id = auth.uid()
    and day between current_date - 1 and current_date + 14
  );

drop policy if exists "Drivers can delete their availability" on public.driver_availability;
create policy "Drivers can delete their availability"
  on public.driver_availability
  for delete
  to authenticated
  using (driver_id = auth.uid() and day between current_date - 1 and current_date + 14);

-- 5) Admin functions (the only way to read auth data / ban) -----------------
create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  is_admin boolean,
  is_approved boolean,
  banned boolean,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'admins only';
  end if;

  return query
    select p.id,
           u.email::text,
           p.full_name,
           p.role,
           p.is_admin,
           p.is_approved,
           (u.banned_until is not null and u.banned_until > now()),
           u.created_at,
           u.last_sign_in_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by u.created_at desc;
end;
$$;

create or replace function public.admin_set_approved(p_target uuid, p_approved boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'admins only';
  end if;

  update public.profiles
  set is_approved = p_approved
  where id = p_target
    and id <> auth.uid()
    and not is_admin;
end;
$$;

create or replace function public.admin_set_banned(p_target uuid, p_banned boolean)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'admins only';
  end if;

  if p_target = auth.uid()
     or exists (select 1 from public.profiles where id = p_target and is_admin) then
    raise exception 'admins and yourself cannot be blocked';
  end if;

  update auth.users
  set banned_until = case when p_banned then now() + interval '100 years' else null end
  where id = p_target;

  -- Log the user out at once.
  if p_banned then
    delete from auth.sessions where user_id = p_target;
  end if;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
revoke all on function public.admin_set_approved(uuid, boolean) from public, anon;
revoke all on function public.admin_set_banned(uuid, boolean) from public, anon;
grant execute on function public.admin_list_users() to authenticated;
grant execute on function public.admin_set_approved(uuid, boolean) to authenticated;
grant execute on function public.admin_set_banned(uuid, boolean) to authenticated;

-- 6) A driver is told when an admin hands him an order ----------------------
create or replace function public.notify_driver_assigned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  route text;
begin
  if new.driver_id is null
     or new.driver_id is not distinct from old.driver_id
     or auth.uid() is not distinct from new.driver_id then
    return new;
  end if;

  route :=
    coalesce(case when new.pickup_district = 'other' then new.pickup_custom_location else new.pickup_district end, '?')
    || ' → ' ||
    coalesce(case when new.destination_district = 'other' then new.destination_custom_location else new.destination_district end, '?');

  insert into public.notifications (user_id, order_id, type, title, body)
  values (new.driver_id, new.id, 'assigned', 'Neuer Auftrag zugewiesen',
          'Dir wurde ein Auftrag (' || route || ') zugewiesen.');
  return new;
end;
$$;

drop trigger if exists notify_driver_assigned on public.orders;
create trigger notify_driver_assigned
  after update of driver_id on public.orders
  for each row
  execute function public.notify_driver_assigned();
