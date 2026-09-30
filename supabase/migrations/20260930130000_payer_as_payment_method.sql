-- "Wer bezahlt?" (who pays: pickup/destination) is now "Zahlungsart" (how:
-- cash/card). The column keeps its name and old rows keep their old values
-- for display — only new orders use 'cash'/'card' going forward.
alter table public.orders drop constraint if exists orders_payer_check;
alter table public.orders
  add constraint orders_payer_check
  check (payer in ('pickup', 'destination', 'cash', 'card'));
