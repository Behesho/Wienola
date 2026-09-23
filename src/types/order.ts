import type { TransportType, VehicleType } from '../pages/Dashboard/NewOrder/types'

export type OrderStatus =
  | 'open'
  | 'accepted'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'completed'

export type PaymentStatus = 'paid' | 'unpaid'
export type Payer = 'pickup' | 'destination'

/** Row shape of public.orders, as returned by Supabase. */
export interface Order {
  id: string
  customer_id: string
  driver_id: string | null
  status: OrderStatus
  transport_type: TransportType
  description: string | null
  vehicle: VehicleType | null
  photo_url: string | null
  length_cm: number | null
  width_cm: number | null
  height_cm: number | null
  pickup_district: string | null
  pickup_custom_location: string | null
  pickup_street: string | null
  destination_district: string | null
  destination_custom_location: string | null
  destination_street: string | null
  pickup_floor: string | null
  pickup_elevator: boolean | null
  destination_floor: string | null
  destination_elevator: boolean | null
  scheduled_date: string | null
  scheduled_time: string | null
  express: boolean
  payer: Payer | null
  amount: number | null
  payment_status: PaymentStatus
  created_at: string
  accepted_at: string | null
  completed_at: string | null
  updated_at: string
}

/** Order joined with the customer's profile, for driver-facing views. */
export interface OrderWithCustomer extends Order {
  customer: {
    full_name: string | null
    phone: string | null
  } | null
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  open: 'Offen',
  accepted: 'Angenommen',
  picked_up: 'Abholung',
  in_transit: 'Unterwegs',
  delivered: 'Zugestellt',
  completed: 'Erledigt',
}

/** Button label to advance OUT of this status, and the status it leads to. */
export const STATUS_ADVANCE: Partial<
  Record<OrderStatus, { label: string; next: OrderStatus }>
> = {
  accepted: { label: 'Abholung bestätigen', next: 'picked_up' },
  picked_up: { label: 'Transport starten', next: 'in_transit' },
  in_transit: { label: 'Zustellung bestätigen', next: 'delivered' },
  delivered: { label: 'Auftrag abschließen', next: 'completed' },
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Bezahlt',
  unpaid: 'Nicht bezahlt',
}

export const PAYER_LABELS: Record<Payer, string> = {
  pickup: 'Abholadresse',
  destination: 'Zustelladresse',
}

export const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
  moving: 'Kompletter Umzug',
  multiple: 'Mehrere Gegenstände',
  single: 'Einzelstück',
  disposal: 'Entsorgung',
  letter: 'Brief',
  courier: 'Kurier',
  valuable: 'Werttransport',
  other: 'Sonstiges',
}

export const VEHICLE_LABELS: Record<VehicleType, string> = {
  bike: 'Fahrrad',
  car: 'PKW',
  van: 'Transporter',
  truck: 'LKW',
}

export function formatPlace(
  district: string | null,
  customLocation: string | null,
): string {
  return (district === 'other' ? customLocation : district) || '–'
}

export function formatAddress(
  district: string | null,
  customLocation: string | null,
  street: string | null,
): string {
  const place = district === 'other' ? customLocation : district
  return [street, place].filter(Boolean).join('\n')
}

export function formatAmount(amount: number | null): string | null {
  if (amount === null) return null
  return `€ ${amount.toFixed(2).replace('.', ',')}`
}
