/**
 * Link that opens the phone's maps app with turn-by-turn directions to
 * `address` (no map is embedded in the app itself). Bikes get cycling
 * routes, everything else driving routes.
 */
export function navigationUrl(address: string, vehicle: string | null = null): string {
  const mode = vehicle === 'bike' ? 'bicycling' : 'driving'
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=${mode}`
}
