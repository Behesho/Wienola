import type { TransportType, VehicleType } from '../pages/Dashboard/NewOrder/types'

/**
 * Temporary switches for the order form. Nothing is deleted — the code for
 * every option stays in place, these flags only hide it.
 *
 * To bring things back:
 *   - an order type  → remove it from HIDDEN_TRANSPORT_TYPES
 *   - a vehicle      → remove it from HIDDEN_VEHICLES
 *   - the long flow (photo + size steps, per-type step order) →
 *     set SIMPLE_ORDER_FLOW to false
 */

/** Order types hidden from the "Was möchtest du versenden?" cards. */
export const HIDDEN_TRANSPORT_TYPES: TransportType[] = [
  'moving', // Kompletter Umzug
  'multiple', // Mehrere Gegenstände
  'disposal', // Entsorgung
]

/** Vehicles hidden from "Welches Fahrzeug benötigst du?". */
export const HIDDEN_VEHICLES: VehicleType[] = [
  'van', // Transporter
  'truck', // LKW
]

/**
 * true  → every order goes: type → "Was möchtest du transportieren?" →
 *         Fahrzeug → Strecke → Termin (no photo / size steps).
 * false → the original per-type flows (Umzug floors, photo, Maße, …).
 */
export const SIMPLE_ORDER_FLOW = true
