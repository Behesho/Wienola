export type VehicleType = 'bike' | 'car' | 'van' | 'truck'

export type TransportType =
  | 'moving'
  | 'multiple'
  | 'single'
  | 'disposal'
  | 'letter'
  | 'courier'
  | 'valuable'
  | 'other'

export type ElevatorAnswer = 'yes' | 'no' | null

export interface AddressValue {
  district: string
  customLocation: string
  street: string
  houseNumber: string
  /** Stock (floor) — optional. */
  stock: string
  /** Wohnung / Tür — optional. */
  unit: string
}

export const EMPTY_ADDRESS: AddressValue = {
  district: '',
  customLocation: '',
  street: '',
  houseNumber: '',
  stock: '',
  unit: '',
}

export type PayerChoice = 'pickup' | 'destination'

export interface OrderFormData {
  transportType: TransportType | null
  photo: string | null
  length: number
  width: number
  height: number
  description: string
  vehicle: VehicleType | null
  pickup: AddressValue
  destination: AddressValue
  date: string
  time: string
  express: boolean
  payer: PayerChoice | null
  pickupFloor: string
  pickupElevator: ElevatorAnswer
  destinationFloor: string
  destinationElevator: ElevatorAnswer
  contactPhone: string
}

export const INITIAL_ORDER_DATA: OrderFormData = {
  transportType: null,
  photo: null,
  length: 60,
  width: 40,
  height: 40,
  description: '',
  vehicle: null,
  pickup: { ...EMPTY_ADDRESS },
  destination: { ...EMPTY_ADDRESS },
  date: '',
  time: '',
  express: false,
  payer: null,
  pickupFloor: '',
  pickupElevator: null,
  destinationFloor: '',
  destinationElevator: null,
  contactPhone: '',
}

export type StepKey =
  | 'type'
  | 'photo'
  | 'dimensions'
  | 'moving'
  | 'details'
  | 'vehicle'
  | 'route'
  | 'contact'
  | 'schedule'

export const STEP_LABELS: Record<StepKey, string> = {
  type: 'Art',
  photo: 'Foto',
  dimensions: 'Maße',
  moving: 'Umzug',
  details: 'Details',
  vehicle: 'Fahrzeug',
  route: 'Strecke',
  contact: 'Kontakt',
  schedule: 'Termin',
}

/**
 * The step sequence depends on the selected transport type — some
 * categories skip photo/dimensions entirely, "Kompletter Umzug" swaps
 * the details step for floor/elevator questions. Every flow ends with
 * contact (phone + price) then schedule.
 */
export function getStepSequence(type: TransportType | null): StepKey[] {
  if (type === 'moving') {
    return ['type', 'moving', 'vehicle', 'route', 'contact', 'schedule']
  }
  if (type === 'multiple' || type === 'single' || type === 'other') {
    return [
      'type',
      'photo',
      'dimensions',
      'details',
      'vehicle',
      'route',
      'contact',
      'schedule',
    ]
  }
  if (type === null) {
    return ['type']
  }
  // letter, courier, valuable, disposal
  return ['type', 'details', 'vehicle', 'route', 'contact', 'schedule']
}

export function isAddressComplete(address: AddressValue) {
  const hasLocation =
    address.district === 'other'
      ? address.customLocation.trim().length > 0
      : address.district.trim().length > 0
  return (
    hasLocation &&
    address.street.trim().length > 0 &&
    address.houseNumber.trim().length > 0
  )
}
