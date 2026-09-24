-- 1) Save the phone number entered at registration into profiles.phone.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'customer')
  );
  return new;
end;
$$;

-- 2) Address details: house number is separate from the street; Stock and
--    Wohnung/Tür are optional.
alter table public.orders
  add column if not exists pickup_house_number text,
  add column if not exists pickup_stock text,
  add column if not exists pickup_unit text,
  add column if not exists destination_house_number text,
  add column if not exists destination_stock text,
  add column if not exists destination_unit text;
