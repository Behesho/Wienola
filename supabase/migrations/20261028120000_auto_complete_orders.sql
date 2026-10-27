-- Auto-complete: a job whose pickup was confirmed more than 2 hours ago and
-- that the driver never closed is marked as completed.

-- 1) Remember when the pickup was confirmed.
alter table public.orders add column if not exists picked_up_at timestamptz;

create or replace function public.set_picked_up_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'picked_up' and old.status is distinct from 'picked_up' then
    new.picked_up_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists set_orders_picked_up_at on public.orders;
create trigger set_orders_picked_up_at
  before update of status on public.orders
  for each row
  execute function public.set_picked_up_at();

-- 2) The rule itself. Older rows without picked_up_at fall back to their
--    last update, which is never earlier than the pickup.
create or replace function public.auto_complete_stale_orders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.orders
  set status = 'completed',
      completed_at = now()
  where status in ('picked_up', 'in_transit', 'delivered')
    and coalesce(picked_up_at, updated_at) < now() - interval '2 hours';

  get diagnostics affected = row_count;
  return affected;
end;
$$;

revoke all on function public.auto_complete_stale_orders() from public;
grant execute on function public.auto_complete_stale_orders() to authenticated;

-- 3) Run it every 10 minutes, even when nobody has the app open.
create extension if not exists pg_cron;

select cron.schedule(
  'auto-complete-orders',
  '*/10 * * * *',
  $$select public.auto_complete_stale_orders()$$
);
