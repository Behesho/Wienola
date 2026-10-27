import { supabase } from './supabase'
import type { AvailabilityRow } from './availability'
import type { Order, OrderStatus } from '../types/order'

// Everything here is only allowed for admins — the real protection is the
// row level security in the database, not this file.

const ADMIN_SELECT =
  '*, customer:profiles!customer_id(full_name, phone, email), driver:profiles!driver_id(full_name, phone)'

export interface AdminOrder extends Order {
  customer: { full_name: string | null; phone: string | null; email: string | null } | null
  driver: { full_name: string | null; phone: string | null } | null
}

export interface DriverProfile {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  /** Missing until the admin SQL has been run — treated as approved. */
  is_approved?: boolean
  is_admin?: boolean
}

export interface AdminUser {
  id: string
  email: string | null
  full_name: string | null
  role: string
  is_admin: boolean
  is_approved: boolean
  banned: boolean
  created_at: string
  last_sign_in_at: string | null
}

/** Result of a call whose backing SQL may not be installed yet. */
export interface MaybeMissing<T> {
  data: T
  /** true when the table / function does not exist in the database yet */
  missing: boolean
}

function isMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  // PostgREST: undefined table / function / column in the schema cache.
  return ['PGRST200', 'PGRST202', 'PGRST204', 'PGRST205', '42P01', '42883'].includes(
    error.code ?? '',
  )
}

export async function fetchAllOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(ADMIN_SELECT)
    .order('created_at', { ascending: false })
    .limit(1000)
    .returns<AdminOrder[]>()
  if (error) throw error
  return data ?? []
}

export async function fetchOrderIdsRejectedBy(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('order_rejections')
    .select('order_id')
    .eq('driver_id', userId)
    .returns<{ order_id: string }[]>()
  return (data ?? []).map((row) => row.order_id)
}

export async function fetchDriverProfiles(): Promise<DriverProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'dienstleister')
    .returns<DriverProfile[]>()
  if (error) throw error
  return (data ?? []).sort((a, b) =>
    (a.full_name ?? '').localeCompare(b.full_name ?? '', 'de'),
  )
}

export async function fetchAvailability(
  fromDay: string,
  toDay: string,
): Promise<MaybeMissing<AvailabilityRow[]>> {
  const { data, error } = await supabase
    .from('driver_availability')
    .select('*')
    .gte('day', fromDay)
    .lte('day', toDay)
    .returns<AvailabilityRow[]>()
  if (error) return { data: [], missing: isMissing(error) }
  return { data: data ?? [], missing: false }
}

export async function fetchUsers(): Promise<MaybeMissing<AdminUser[]>> {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) return { data: [], missing: isMissing(error) }
  return { data: (data ?? []) as AdminUser[], missing: false }
}

// ------------------------------------------------------------------ actions

export interface ActionResult {
  ok: boolean
  /** The SQL for this action is not installed yet. */
  missing?: boolean
}

async function update(orderId: string, patch: Record<string, unknown>): Promise<ActionResult> {
  const { data, error } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', orderId)
    .select('id')
  if (error) {
    console.error('Admin update failed:', error.message)
    return { ok: false, missing: isMissing(error) }
  }
  // Row level security answers "not allowed" with an empty result.
  return { ok: (data ?? []).length > 0 }
}

/**
 * Gives an order to a driver. A free order becomes accepted at once; one that
 * is already on the road keeps its status (hand-over).
 */
export function assignOrder(order: Pick<Order, 'id' | 'status'>, driverId: string) {
  const free = order.status === 'open'
  return update(order.id, {
    driver_id: driverId,
    assigned_driver_id: null,
    ...(free ? { status: 'accepted', accepted_at: new Date().toISOString() } : {}),
  })
}

/** Takes the order away from its driver — it is free again. */
export function releaseOrder(orderId: string) {
  return update(orderId, { driver_id: null, status: 'open', accepted_at: null })
}

export function setOrderStatus(orderId: string, status: OrderStatus) {
  return update(orderId, {
    status,
    ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
  })
}

export async function deleteOrder(orderId: string): Promise<ActionResult> {
  const { data, error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .select('id')
  if (error) {
    console.error('Admin delete failed:', error.message)
    return { ok: false, missing: isMissing(error) }
  }
  return { ok: (data ?? []).length > 0 }
}

export async function sendNudge(message: string, driverId: string | null): Promise<ActionResult> {
  const { error } = await supabase
    .from('driver_nudges')
    .insert({ message, driver_id: driverId })
  if (error) {
    console.error('Nudge failed:', error.message)
    return { ok: false, missing: isMissing(error) }
  }
  return { ok: true }
}

export async function setApproved(userId: string, approved: boolean): Promise<ActionResult> {
  const { error } = await supabase.rpc('admin_set_approved', {
    p_target: userId,
    p_approved: approved,
  })
  if (error) {
    console.error('Approve failed:', error.message)
    return { ok: false, missing: isMissing(error) }
  }
  return { ok: true }
}

export async function setBanned(userId: string, banned: boolean): Promise<ActionResult> {
  const { error } = await supabase.rpc('admin_set_banned', {
    p_target: userId,
    p_banned: banned,
  })
  if (error) {
    console.error('Ban failed:', error.message)
    return { ok: false, missing: isMissing(error) }
  }
  return { ok: true }
}

/** "vor 5 Min", "vor 3 Std", or the date. */
export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000))
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `vor ${hours} Std`
  const days = Math.round(hours / 24)
  if (days < 7) return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`
  return new Date(iso).toLocaleDateString('de-AT')
}
