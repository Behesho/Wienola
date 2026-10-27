import { usePoll } from '../../../hooks/usePoll'
import {
  fetchAllOrders,
  fetchDriverProfiles,
  fetchOrderIdsRejectedBy,
  type AdminOrder,
  type DriverProfile,
} from '../../../lib/admin'

export interface AdminData {
  orders: AdminOrder[]
  /** Drivers that may take orders (not waiting for approval). */
  drivers: DriverProfile[]
  /** Orders the admin rejected himself. */
  rejected: Set<string>
}

export const RUNNING_STATUSES = ['accepted', 'picked_up', 'in_transit'] as const

export function isRunning(order: Pick<AdminOrder, 'status'>): boolean {
  return (RUNNING_STATUSES as readonly string[]).includes(order.status)
}

/** Orders + drivers + the admin's own rejections, refreshed every 10 s. */
export function useAdminData(adminId: string) {
  return usePoll<AdminData>(async () => {
    const [orders, profiles, rejected] = await Promise.all([
      fetchAllOrders(),
      fetchDriverProfiles(),
      fetchOrderIdsRejectedBy(adminId),
    ])
    return {
      orders,
      drivers: profiles.filter((driver) => driver.is_approved !== false),
      rejected: new Set(rejected),
    }
  })
}
