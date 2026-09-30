-- New order type: Billa Click & Collect.
alter table public.orders drop constraint if exists orders_transport_type_check;
alter table public.orders
  add constraint orders_transport_type_check
  check (transport_type in ('moving', 'multiple', 'single', 'disposal', 'letter', 'courier', 'valuable', 'other', 'willhaben', 'billa'));
