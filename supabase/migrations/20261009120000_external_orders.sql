-- Orders that arrive outside the app (e.g. by e-mail from abholance-wien.at)
-- and are entered by an admin: the real customer's name and e-mail are kept
-- on the order itself, because the order belongs to the admin's account.
alter table public.orders add column if not exists external_customer_name text;
alter table public.orders add column if not exists external_customer_email text;
alter table public.orders add column if not exists source text not null default 'app';
