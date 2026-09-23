import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import { supabase } from '../../../lib/supabase'
import { acceptOrder, fetchOpenOrders } from '../../../lib/orders'
import { acknowledgeNewOrders } from '../../../lib/orderNotifications'
import AvailableOrderCard from '../../../components/AvailableOrderCard/AvailableOrderCard'
import EarningsSummary from '../../../components/EarningsSummary/EarningsSummary'
import type { Order } from '../../../types/order'
import './DriverHomePage.css'

function DriverHomePage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    function reload() {
      fetchOpenOrders().then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Failed to load open orders:', error.message)
        } else {
          setOrders(data ?? [])
        }
        setLoading(false)
      })
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

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  async function handleAccept(orderId: string): Promise<boolean> {
    if (!user) return false
    const { data, error } = await acceptOrder(orderId, user.id)
    acknowledgeNewOrders()

    if (error || !data) return false

    setOrders((prev) => prev.filter((order) => order.id !== orderId))
    return true
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
          <AvailableOrderCard key={order.id} order={order} onAccept={handleAccept} />
        ))
      )}
    </div>
  )
}

export default DriverHomePage
