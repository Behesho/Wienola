-- "Rückweg" choice and the payment method (cash / card). "Wer bezahlt?"
-- (pickup / destination) stays in the existing payer column.
alter table public.orders add column if not exists return_trip boolean not null default false;
alter table public.orders add column if not exists payment_method text
  check (payment_method in ('cash', 'card'));
