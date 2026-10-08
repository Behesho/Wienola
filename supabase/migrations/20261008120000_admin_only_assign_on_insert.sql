-- Only an admin may create an order that is pre-assigned to one specific
-- driver (assigned_driver_id). Everyone else must leave it empty.
drop policy if exists "Customers can create their own orders" on public.orders;
create policy "Customers can create their own orders"
  on public.orders
  for insert
  to authenticated
  with check (
    auth.uid() = customer_id
    and (assigned_driver_id is null or public.current_user_is_admin())
  );
