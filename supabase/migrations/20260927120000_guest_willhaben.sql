-- 1) E-mail on the profile, so a driver can reach guests (who have no login
--    e-mail) and registered customers alike.
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null and u.email is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, email, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.email, nullif(new.raw_user_meta_data ->> 'email', '')),
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')
  );
  return new;
end;
$$;

-- 2) New order type: Willhaben-Abholung.
alter table public.orders drop constraint if exists orders_transport_type_check;
alter table public.orders
  add constraint orders_transport_type_check
  check (transport_type in ('moving', 'multiple', 'single', 'disposal', 'letter', 'courier', 'valuable', 'other', 'willhaben'));
