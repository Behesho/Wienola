import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import { supabase } from '../../../lib/supabase'
import {
  acceptOrder,
  fetchOpenOrders,
  fetchRejectedOrderIds,
  rejectOrder,
} from '../../../lib/orders'
import { acknowledgeNewOrders } from '../../../lib/orderNotifications'
import AvailableOrderCard from '../../../components/AvailableOrderCard/AvailableOrderCard'
import EarningsSummary from '../../../components/EarningsSummary/EarningsSummary'
import TodayBilanz from '../../../components/BilanzCard/TodayBilanz'
import type { Order } from '../../../types/order'
import './DriverHomePage.css'

function DriverHomePage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  // Orders being accepted stay in the list (even if a reload no longer
  // returns them) until their fly-away animation is done.
  const leavingRef = useRef(new Set<string>())

  useEffect(() => {
    if (!user) return
    let active = true

    async function reload() {
      const [openResult, rejectedResult] = await Promise.all([
        fetchOpenOrders(),
        fetchRejectedOrderIds(user!.id),
      ])
      if (!active) return

      if (openResult.error) {
        console.error('Failed to load open orders:', openResult.error.message)
        setLoading(false)
        return
      }

      const rejectedIds = new Set(
        (rejectedResult.data ?? []).map((row) => row.order_id),
      )
      const fresh = (openResult.data ?? []).filter((order) => !rejectedIds.has(order.id))
      setOrders((prev) => {
        const next = fresh.slice()
        prev.forEach((order, index) => {
          if (leavingRef.current.has(order.id) && !next.some((o) => o.id === order.id)) {
            next.splice(Math.min(index, next.length), 0, order)
          }
        })
        return next
      })
      setLoading(false)
    }

    reload()

    const channel = supabase
      .channel('driver-home-open-orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        reload,
      )
      .subscribe()

    // Once another driver takes an order it disappears from this driver's
    // view without a realtime event, so also refresh when the app is
    // brought back to the foreground and every 30 seconds.
    function reloadIfVisible() {
      if (document.visibilityState === 'visible') reload()
    }
    document.addEventListener('visibilitychange', reloadIfVisible)
    const poll = window.setInterval(reloadIfVisible, 30000)

    return () => {
      active = false
      supabase.removeChannel(channel)
      document.removeEventListener('visibilitychange', reloadIfVisible)
      window.clearInterval(poll)
    }
  }, [user])

  async function handleAccept(orderId: string): Promise<boolean> {
    if (!user) return false
    leavingRef.current.add(orderId)
    const { data, error } = await acceptOrder(orderId, user.id)
    acknowledgeNewOrders()

    if (error || !data) {
      leavingRef.current.delete(orderId)
      // Someone else was faster: show the message on the card for a moment,
      // then drop it from the list.
      window.setTimeout(() => {
        setOrders((prev) => prev.filter((order) => order.id !== orderId))
      }, 2500)
      return false
    }

    return true
  }

  function handleAccepted(orderId: string) {
    leavingRef.current.delete(orderId)
    setOrders((prev) => prev.filter((order) => order.id !== orderId))
  }

  async function handleReject(orderId: string) {
    if (!user) return
    setOrders((prev) => prev.filter((order) => order.id !== orderId))
    const { error } = await rejectOrder(orderId, user.id)
    if (error) console.error('Failed to reject order:', error.message)
  }

  return (
    <div className="driver-home-page">
      {user && <EarningsSummary driverId={user.id} />}

      <h1 className="driver-home-page__title">Neue Aufträge</h1>

      {loading ? (
        <p className="driver-home-page__empty">Lädt…</p>
      ) : orders.length === 0 ? (
        <p className="driver-home-page__empty">
          Aktuell keine neuen Aufträge verfügbar.
        </p>
      ) : (
        orders.map((order) => (
          <AvailableOrderCard
            key={order.id}
            order={order}
            onAccept={handleAccept}
            onAccepted={handleAccepted}
            onReject={handleReject}
          />
        ))
      )}

      <TodayBilanz />
    </div>
  )
}

export default DriverHomePage
