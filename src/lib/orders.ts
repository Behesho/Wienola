import { supabase } from './supabase'
import { getOrderPrice } from './pricing'
import type {
  AddressValue,
  OrderFormData,
  TransportType,
} from '../pages/Dashboard/NewOrder/types'
import type { Order, OrderStatus, OrderWithCustomer, OrderWithDriver } from '../types/order'

const ACTIVE_STATUSES: OrderStatus[] = [
  'accepted',
  'picked_up',
  'in_transit',
  'delivered',
]

const CUSTOMER_SELECT = '*, customer:profiles!customer_id(full_name, phone, email)'
const DRIVER_SELECT = '*, driver:profiles!driver_id(full_name, phone)'

/** Guests have no profile yet — this fills it in from what they typed on the route step. */
export async function updateProfile(
  userId: string,
  patch: { full_name?: string; phone?: string; email?: string },
) {
  return supabase.from('profiles').update(patch).eq('id', userId)
}

function toDbRow(customerId: string, data: OrderFormData) {
  return {
    customer_id: customerId,
    status: 'open' as const,
    transport_type: data.transportType!,
    description: data.description || null,
    vehicle: data.vehicle,
    photo_url: data.photo ?? data.slip,
    length_cm: data.length,
    width_cm: data.width,
    height_cm: data.height,
    pickup_district: data.pickup.district || null,
    pickup_custom_location: data.pickup.customLocation || null,
    pickup_street: data.pickup.street || null,
    pickup_house_number: data.pickup.houseNumber || null,
    pickup_stock: data.pickup.stock || null,
    pickup_unit: data.pickup.unit || null,
    destination_district: data.destination.district || null,
    destination_custom_location: data.destination.customLocation || null,
    destination_street: data.destination.street || null,
    destination_house_number: data.destination.houseNumber || null,
    destination_stock: data.destination.stock || null,
    destination_unit: data.destination.unit || null,
    pickup_floor: data.pickupFloor || null,
    pickup_elevator:
      data.pickupElevator === null ? null : data.pickupElevator === 'yes',
    destination_floor: data.destinationFloor || null,
    destination_elevator:
      data.destinationElevator === null
        ? null
        : data.destinationElevator === 'yes',
    scheduled_date: data.express ? null : data.date || null,
    scheduled_time: data.express ? null : data.time || null,
    express: data.express,
    payer: data.payer,
    contact_phone: data.contactPhone || null,
    // Zone price (bike/car only) — never entered by the customer.
    amount: getOrderPrice({
      vehicle: data.vehicle,
      source: 'app',
      amount: null,
      pickup_district: data.pickup.district || null,
      pickup_custom_location: data.pickup.customLocation || null,
      destination_district: data.destination.district || null,
      destination_custom_location: data.destination.customLocation || null,
    }),
  }
}

/**
 * `assignedDriverId` (admins only — enforced by RLS) shows the order to
 * exactly that one driver instead of all of them.
 */
export async function insertOrder(
  customerId: string,
  data: OrderFormData,
  assignedDriverId: string | null = null,
) {
  return supabase
    .from('orders')
    .insert({ ...toDbRow(customerId, data), assigned_driver_id: assignedDriverId })
    .select()
    .single<Order>()
}

export interface ExternalOrderInput {
  transportType: TransportType
  description: string
  name: string
  phone: string
  email: string
  pickup: AddressValue
  destination: AddressValue
  express: boolean
  date: string
  time: string
  payer: 'pickup' | 'destination' | 'cash' | 'card' | null
  amount: string
  assignedDriverId: string | null
}

/**
 * An admin enters an order that reached them outside the app (e.g. the
 * abholance-wien.at mail). It is filed under the admin's own account, with
 * the real customer's details on the order itself.
 */
export async function insertExternalOrder(adminId: string, input: ExternalOrderInput) {
  return supabase
    .from('orders')
    .insert({
      customer_id: adminId,
      status: 'open',
      source: 'abholance-mail',
      transport_type: input.transportType,
      description: input.description || null,
      vehicle: null,
      pickup_district: input.pickup.district || null,
      pickup_custom_location: input.pickup.customLocation || null,
      pickup_street: input.pickup.street || null,
      pickup_house_number: input.pickup.houseNumber || null,
      pickup_stock: input.pickup.stock || null,
      pickup_unit: input.pickup.unit || null,
      destination_district: input.destination.district || null,
      destination_custom_location: input.destination.customLocation || null,
      destination_street: input.destination.street || null,
      destination_house_number: input.destination.houseNumber || null,
      destination_stock: input.destination.stock || null,
      destination_unit: input.destination.unit || null,
      scheduled_date: input.express ? null : input.date || null,
      scheduled_time: input.express ? null : input.time || null,
      express: input.express,
      payer: input.payer,
      amount: input.amount ? Number(input.amount) : null,
      contact_phone: input.phone || null,
      external_customer_name: input.name || null,
      external_customer_email: input.email || null,
      assigned_driver_id: input.assignedDriverId,
    })
    .select()
    .single<Order>()
}

/** Asks the send-invoice Edge Function to e-mail the customer their Rechnung. */
export async function sendInvoiceEmail(orderId: string) {
  return supabase.functions.invoke('send-invoice', { body: { orderId } })
}

export async function fetchMyOrders(customerId: string) {
  return supabase
    .from('orders')
    .select(DRIVER_SELECT)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .returns<OrderWithDriver[]>()
}

export async function fetchOpenOrders() {
  return supabase
    .from('orders')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .returns<Order[]>()
}

/**
 * Just the ids of open orders — used to poll for new arrivals as a fallback
 * to the realtime subscription, whose WebSocket can drop silently on some
 * mobile browsers/networks (seen on iOS Chrome) without ever reconnecting.
 */
export async function fetchOpenOrderIds() {
  return supabase.from('orders').select('id').eq('status', 'open').returns<{ id: string }[]>()
}

/** Ids of orders this driver has already declined — filtered out of their list. */
export async function fetchRejectedOrderIds(driverId: string) {
  return supabase
    .from('order_rejections')
    .select('order_id')
    .eq('driver_id', driverId)
    .returns<{ order_id: string }[]>()
}

/** Declines an open order — hides it from this driver only, others still see it. */
export async function rejectOrder(orderId: string, driverId: string) {
  return supabase
    .from('order_rejections')
    .insert({ order_id: orderId, driver_id: driverId })
}

// --- Admin: assign an open order to exactly one driver ---------------------

export interface DriverOption {
  id: string
  full_name: string | null
  phone: string | null
}

export async function fetchDrivers() {
  return supabase
    .from('profiles')
    .select('id, full_name, phone')
    .eq('role', 'dienstleister')
    .order('full_name')
    .returns<DriverOption[]>()
}

const ADMIN_ORDER_SELECT = '*, assigned:profiles!assigned_driver_id(full_name)'

export interface OrderWithAssignment extends Order {
  assigned: { full_name: string | null } | null
}

export async function fetchOpenOrdersForAdmin() {
  return supabase
    .from('orders')
    .select(ADMIN_ORDER_SELECT)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .returns<OrderWithAssignment[]>()
}

/** Pass `null` to unassign — the order becomes visible to every driver again. */
export async function assignOrderToDriver(orderId: string, driverId: string | null) {
  return supabase
    .from('orders')
    .update({ assigned_driver_id: driverId })
    .eq('id', orderId)
    .select(ADMIN_ORDER_SELECT)
    .maybeSingle<OrderWithAssignment>()
}

export async function fetchMyJobs(driverId: string) {
  return supabase
    .from('orders')
    .select(CUSTOMER_SELECT)
    .eq('driver_id', driverId)
    .in('status', ACTIVE_STATUSES)
    .order('scheduled_date', { ascending: true, nullsFirst: true })
    .order('scheduled_time', { ascending: true, nullsFirst: true })
    .returns<OrderWithCustomer[]>()
}

export interface DateRange {
  from: string // ISO date, inclusive
  to: string // ISO date, inclusive
}

/** The driver's finished jobs: completed ones plus cancelled ones. */
export async function fetchCompletedJobs(driverId: string, range?: DateRange) {
  let query = supabase
    .from('orders')
    .select(CUSTOMER_SELECT)
    .eq('driver_id', driverId)
    .in('status', ['completed', 'cancelled'])
    .order('updated_at', { ascending: false })

  if (range) {
    const from = `${range.from}T00:00:00`
    const to = `${range.to}T23:59:59`
    query = query.or(
      `and(status.eq.completed,completed_at.gte.${from},completed_at.lte.${to}),` +
        `and(status.eq.cancelled,updated_at.gte.${from},updated_at.lte.${to})`,
    )
  }

  return query.returns<OrderWithCustomer[]>()
}

/** Cancels an order (customer: open/accepted; driver: their own job). */
export async function cancelOrder(orderId: string) {
  return supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId)
    .select()
    .maybeSingle<Order>()
}

export async function fetchOrderById(orderId: string) {
  return supabase
    .from('orders')
    .select(CUSTOMER_SELECT)
    .eq('id', orderId)
    .maybeSingle<OrderWithCustomer>()
}

/** Claims an open order. Fails (no row returned) if someone already took it. */
export async function acceptOrder(orderId: string, driverId: string) {
  return supabase
    .from('orders')
    .update({ driver_id: driverId, status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('status', 'open')
    .is('driver_id', null)
    .select()
    .maybeSingle<Order>()
}

export async function advanceOrderStatus(
  orderId: string,
  driverId: string,
  nextStatus: OrderStatus,
) {
  const patch: Record<string, unknown> = { status: nextStatus }
  if (nextStatus === 'completed') {
    patch.completed_at = new Date().toISOString()
  }

  return supabase
    .from('orders')
    .update(patch)
    .eq('id', orderId)
    .eq('driver_id', driverId)
    .select()
    .maybeSingle<Order>()
}
