export type VehicleType = 'bike' | 'car' | 'van' | 'truck'

export interface OrderFormData {
  photo: string | null
  length: number
  width: number
  height: number
  description: string
  vehicle: VehicleType | null
  pickup: string
  destination: string
  date: string
  time: string
  express: boolean
}

export const INITIAL_ORDER_DATA: OrderFormData = {
  photo: null,
  length: 60,
  width: 40,
  height: 40,
  description: '',
  vehicle: null,
  pickup: '',
  destination: '',
  date: '',
  time: '',
  express: false,
}

export const STEP_TITLES = [
  'Foto',
  'Maße',
  'Details',
  'Fahrzeug',
  'Strecke',
  'Termin',
] as const
