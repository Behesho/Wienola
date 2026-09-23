-- Optional contact number for a profile. Nullable — nothing collects it
-- yet (Register/the order wizard don't have a phone field), but the
-- driver order-detail view needs somewhere to read it from once they do.
alter table public.profiles
  add column phone text;

-- Orders: one row per transport request created by a customer, optionally
-- claimed and fulfilled by a dienstleister (driver).
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  driver_id uuid references public.profiles (id) on delete set null,

  status text not null default 'open'
    check (status in ('open', 'accepted', 'picked_up', 'in_transit', 'delivered', 'completed')),

  -- What & how much
  transport_type text not null
    check (transport_type in ('moving', 'multiple', 'single', 'disposal', 'letter', 'courier', 'valuable', 'other')),
  description text,
  vehicle text
    check (vehicle in ('bike', 'car', 'van', 'truck')),
  photo_url text,
  length_cm integer,
  width_cm integer,
  height_cm integer,

  -- Route (plain text — no maps/geocoding)
  pickup_district text,
  pickup_custom_location text,
  pickup_street text,
  destination_district text,
  destination_custom_location text,
  destination_street text,

  -- Kompletter-Umzug specifics
  pickup_floor text,
  pickup_elevator boolean,
  destination_floor text,
  destination_elevator boolean,

  -- Schedule
  scheduled_date date,
  scheduled_time time,
  express boolean not null default false,

  -- Payment — not collected anywhere yet, so nullable until a pricing
  -- flow exists; the driver UI renders these conditionally.
  payer text
    check (payer in ('pickup', 'destination')),
  amount numeric(10, 2),
  payment_status text not null default 'unpaid'
    check (payment_status in ('paid', 'unpaid')),

  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index orders_status_idx on public.orders (status);
create index orders_customer_id_idx on public.orders (customer_id);
create index orders_driver_id_idx on public.orders (driver_id);

alter table public.orders enable row level security;

-- Customers: full visibility and control over their own orders only.
create policy "Customers can view their own orders"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = customer_id);

create policy "Customers can create their own orders"
  on public.orders
  for insert
  to authenticated
  with check (auth.uid() = customer_id);

-- Drivers: can see open (unclaimed) orders, and any order they hold.
create policy "Drivers can view open orders"
  on public.orders
  for select
  to authenticated
  using (status = 'open');

create policy "Drivers can view their own jobs"
  on public.orders
  for select
  to authenticated
  using (auth.uid() = driver_id);

-- Drivers: can claim an open, unassigned order (becoming its driver), or
-- update the status/timestamps of a job they already hold. Either way the
-- row must end up still assigned to them — nobody can hand an order to
-- someone else via this policy.
create policy "Drivers can accept or update their jobs"
  on public.orders
  for update
  to authenticated
  using (
    auth.uid() = driver_id
    or (status = 'open' and driver_id is null)
  )
  with check (auth.uid() = driver_id);

create trigger set_orders_updated_at
  before update on public.orders
  for each row
  execute function public.set_updated_at();

-- A driver needs to read their job's customer's name/phone (and vice
-- versa) even though profiles are otherwise private to their owner —
-- but only for the counterpart of an order that actually links them.
create policy "Drivers can view their order customers' profiles"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.customer_id = profiles.id
        and orders.driver_id = auth.uid()
    )
  );

create policy "Customers can view their order drivers' profiles"
  on public.profiles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.orders
      where orders.driver_id = profiles.id
        and orders.customer_id = auth.uid()
    )
  );

-- Required for the driver app's realtime "new order" notification —
-- without this, postgres_changes subscriptions on orders never fire.
alter publication supabase_realtime add table public.orders;
