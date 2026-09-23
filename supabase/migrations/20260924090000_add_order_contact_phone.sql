-- Phone number is now collected per-order in the wizard's Kontakt step
-- (not just once on the profile), so the driver always has a number to
-- call regardless of whether the customer's profile has one set.
alter table public.orders
  add column contact_phone text;
