-- 1) Storniert: new order status + timestamp.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders
  add constraint orders_status_check
  check (status in ('open', 'accepted', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled'));

alter table public.orders add column if not exists cancelled_at timestamptz;

-- 2) Role lookup that bypasses RLS (avoids policy recursion between
--    orders and profiles).
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- 3) Open orders are for drivers only — customers must not see other
--    customers' open orders, and only drivers may claim one.
drop policy if exists "Drivers can view open orders" on public.orders;
create policy "Drivers can view open orders"
  on public.orders
  for select
  to authenticated
  using (status = 'open' and public.current_user_role() = 'dienstleister');

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
    )
  )
  with check (auth.uid() = driver_id);

-- 4) Customers can cancel their own order while it is open or accepted.
drop policy if exists "Customers can cancel their own orders" on public.orders;
create policy "Customers can cancel their own orders"
  on public.orders
  for update
  to authenticated
  using (auth.uid() = customer_id and status in ('open', 'accepted'))
  with check (auth.uid() = customer_id and status = 'cancelled');

-- 5) Notifications (shown under the bell in the app).
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  order_id uuid references public.orders (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists "Users can view their notifications" on public.notifications;
create policy "Users can view their notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can mark their notifications read" on public.notifications;
create policy "Users can mark their notifications read"
  on public.notifications
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.notifications;

-- 6) Whenever an order changes status, tell the person on the other side.
create or replace function public.notify_order_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  route text;
  driver_name text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  route :=
    coalesce(case when new.pickup_district = 'other' then new.pickup_custom_location else new.pickup_district end, '?')
    || ' → ' ||
    coalesce(case when new.destination_district = 'other' then new.destination_custom_location else new.destination_district end, '?');

  select coalesce(full_name, 'Ein Dienstleister') into driver_name
  from public.profiles where id = new.driver_id;

  if new.status = 'cancelled' then
    if auth.uid() = new.customer_id then
      if new.driver_id is not null then
        insert into public.notifications (user_id, order_id, type, title, body)
        values (new.driver_id, new.id, 'cancelled', 'Auftrag storniert',
                'Der Kunde hat den Auftrag (' || route || ') storniert.');
      end if;
    else
      insert into public.notifications (user_id, order_id, type, title, body)
      values (new.customer_id, new.id, 'cancelled', 'Auftrag storniert',
              'Der Dienstleister hat deinen Auftrag (' || route || ') storniert.');
    end if;
  elsif new.status = 'accepted' then
    insert into public.notifications (user_id, order_id, type, title, body)
    values (new.customer_id, new.id, 'accepted', 'Auftrag angenommen',
            coalesce(driver_name, 'Ein Dienstleister') || ' hat deinen Auftrag (' || route || ') angenommen.');
  elsif new.status = 'picked_up' then
    insert into public.notifications (user_id, order_id, type, title, body)
    values (new.customer_id, new.id, 'picked_up', 'Abholung bestätigt',
            'Dein Auftrag (' || route || ') wurde abgeholt.');
  elsif new.status = 'in_transit' then
    insert into public.notifications (user_id, order_id, type, title, body)
    values (new.customer_id, new.id, 'in_transit', 'Unterwegs',
            'Dein Auftrag (' || route || ') ist unterwegs.');
  elsif new.status = 'delivered' then
    insert into public.notifications (user_id, order_id, type, title, body)
    values (new.customer_id, new.id, 'delivered', 'Zugestellt',
            'Dein Auftrag (' || route || ') wurde zugestellt.');
  elsif new.status = 'completed' then
    insert into public.notifications (user_id, order_id, type, title, body)
    values (new.customer_id, new.id, 'completed', 'Auftrag abgeschlossen',
            'Dein Auftrag (' || route || ') ist abgeschlossen.');
  end if;

  return new;
end;
$$;

drop trigger if exists notify_order_status_change on public.orders;
create trigger notify_order_status_change
  after update of status on public.orders
  for each row
  execute function public.notify_order_status_change();
