import { supabase } from './supabase'
import type { OrderFormData } from '../pages/Dashboard/NewOrder/types'
import type { Order, OrderStatus, OrderWithCustomer, OrderWithDriver } from '../types/order'

const ACTIVE_STATUSES: OrderStatus[] = [
  'accepted',
  'picked_up',
  'in_transit',
  'delivered',
]

const CUSTOMER_SELECT = '*, customer:profiles!customer_id(full_name, phone)'
const DRIVER_SELECT = '*, driver:profiles!driver_id(full_name, phone)'

function toDbRow(customerId: string, data: OrderFormData) {
  return {
    customer_id: customerId,
    status: 'open' as const,
    transport_type: data.transportType!,
    description: data.description || null,
    vehicle: data.vehicle,
    photo_url: data.photo,
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
    contact_phone: data.contactPhone || null,  }
}

export async function insertOrder(customerId: string, data: OrderFormData) {
  return supabase
    .from('orders')
    .insert(toDbRow(customerId, data))
    .select()
    .single<Order>()
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
        `and(status.eq.cancelled,cancelled_at.gte.${from},cancelled_at.lte.${to})`,
    )
  }

  return query.returns<OrderWithCustomer[]>()
}

/** Cancels an order (customer: open/accepted; driver: their own job). */
export async function cancelOrder(orderId: string) {
  return supabase
    .from('orders')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
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
