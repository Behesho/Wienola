import { supabase } from './supabase'
import type { OrderFormData } from '../pages/Dashboard/NewOrder/types'
import type { Order, OrderStatus, OrderWithCustomer } from '../types/order'

const ACTIVE_STATUSES: OrderStatus[] = [
  'accepted',
  'picked_up',
  'in_transit',
  'delivered',
]

const CUSTOMER_SELECT = '*, customer:profiles!customer_id(full_name, phone)'

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
    destination_district: data.destination.district || null,
    destination_custom_location: data.destination.customLocation || null,
    destination_street: data.destination.street || null,
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
    contact_phone: data.contactPhone || null,
    amount: data.amount ? Number(data.amount) : null,
  }
}

export async function insertOrder(customerId: string, data: OrderFormData) {
  return supabase
    .from('orders')
    .insert(toDbRow(customerId, data))
    .select()
    .single<Order>()
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

export async function fetchCompletedJobs(driverId: string, range?: DateRange) {
  let query = supabase
    .from('orders')
    .select(CUSTOMER_SELECT)
    .eq('driver_id', driverId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (range) {
    query = query
      .gte('completed_at', `${range.from}T00:00:00`)
      .lte('completed_at', `${range.to}T23:59:59`)
  }

  return query.returns<OrderWithCustomer[]>()
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
