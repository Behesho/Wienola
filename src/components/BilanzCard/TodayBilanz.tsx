import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { fetchCompletedJobs } from '../../lib/orders'
import { getPresetRange } from '../../lib/dateRangePresets'
import type { OrderWithCustomer } from '../../types/order'
import BilanzCard from './BilanzCard'

/** The driver's totals for today — the last card on their job pages. */
function TodayBilanz() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderWithCustomer[] | null>(null)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let active = true
    fetchCompletedJobs(userId, getPresetRange('today', '', '')).then(
      ({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Failed to load today totals:', error.message)
          return
        }
        setOrders(data ?? [])
      },
    )
    return () => {
      active = false
    }
  }, [userId])

  if (!orders) return null
  return <BilanzCard title="Heute" orders={orders} />
}

export default TodayBilanz
