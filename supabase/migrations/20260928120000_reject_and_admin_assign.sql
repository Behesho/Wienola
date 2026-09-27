-- 1) Per-driver rejection: hides an open order from just that one driver
--    ("Ablehnen"), without affecting any other driver's view of it.
create table if not exists public.order_rejections (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  driver_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (order_id, driver_id)
);

alter table public.order_rejections enable row level security;

drop policy if exists "Drivers can view their own rejections" on public.order_rejections;
create policy "Drivers can view their own rejections"
  on public.order_rejections
  for select
  to authenticated
  using (auth.uid() = driver_id);

drop policy if exists "Drivers can reject an order" on public.order_rejections;
create policy "Drivers can reject an order"
  on public.order_rejections
  for insert
  to authenticated
  with check (auth.uid() = driver_id);

-- 2) Admin: a boolean flag (independent of role) plus the ability to point
--    one open order at exactly one driver, so nobody else sees it.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Column-level privilege, on top of RLS: no authenticated user (via the
-- publishable key) can ever flip their own is_admin, no matter what a row
-- policy allows — only the SQL Editor (running as the table owner) can.
revoke update (is_admin) on public.profiles from authenticated;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false)
$$;

alter table public.orders add column if not exists assigned_driver_id uuid references public.profiles (id) on delete set null;
create index if not exists orders_assigned_driver_id_idx on public.orders (assigned_driver_id);

-- Open orders are visible to any driver, UNLESS an admin assigned them to
-- one specific driver — then only that driver sees (and can accept) it.
drop policy if exists "Drivers can view open orders" on public.orders;
create policy "Drivers can view open orders"
  on public.orders
  for select
  to authenticated
  using (
    status = 'open'
    and public.current_user_role() = 'dienstleister'
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
      and (assigned_driver_id is null or assigned_driver_id = auth.uid())
    )
  )
  with check (auth.uid() = driver_id);

drop policy if exists "Admins can view all orders" on public.orders;
create policy "Admins can view all orders"
  on public.orders
  for select
  to authenticated
  using (public.current_user_is_admin());

drop policy if exists "Admins can assign orders" on public.orders;
create policy "Admins can assign orders"
  on public.orders
  for update
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.current_user_is_admin());

-- 3) To actually use the admin page, mark one account as admin — replace
--    the e-mail below with the account you want to use, then run just this
--    statement (auth.uid() doesn't apply in the SQL Editor, so it's done by
--    e-mail instead):
--
-- update public.profiles p set is_admin = true
-- from auth.users u where u.id = p.id and u.email = 'YOUR_EMAIL_HERE';
