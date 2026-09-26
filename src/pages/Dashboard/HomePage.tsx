import { useEffect, useState } from 'react'
import DashboardSection from '../../components/DashboardSection/DashboardSection'
import PriceCalculator from '../../components/PriceCalculator/PriceCalculator'
import PriceList from '../../components/PriceCalculator/PriceList'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import { fetchMyOrders } from '../../lib/orders'
import {
  formatPlace,
  STATUS_LABELS,
  TRANSPORT_TYPE_LABELS,
  type OrderWithDriver,
} from '../../types/order'
import './HomePage.css'

const RECENT_LIMIT = 5

function HomePage() {
  const { user, profile } = useAuth()
  const [orders, setOrders] = useState<OrderWithDriver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true

    function reload() {
      fetchMyOrders(user!.id).then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Failed to load recent orders:', error.message)
        } else {
          setOrders(data ?? [])
        }
        setLoading(false)
      })
    }

    reload()

    const channel = supabase
      .channel('home-recent-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `customer_id=eq.${user.id}`,
        },
        reload,
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [user])

  const recentOrders = orders.slice(0, RECENT_LIMIT)

  return (
    <div className="home-page">
      <h1 className="home-page__title">
        Hallo{profile?.full_name ? `, ${profile.full_name}` : ''}
      </h1>

      <DashboardSection title="Preisrechner">
        <PriceCalculator />
      </DashboardSection>

      <DashboardSection title="Preisliste">
        <PriceList />
      </DashboardSection>

      <DashboardSection title="Letzte Aufträge">
        {loading ? (
          <p>Lädt…</p>
        ) : recentOrders.length === 0 ? (
          <p>Noch keine Aufträge vorhanden.</p>
        ) : (
          <ul className="home-page__history">
            {recentOrders.map((order) => (
              <li key={order.id} className="home-page__history-item">
                <div className="home-page__history-row">
                  <span className="home-page__history-type">
                    {TRANSPORT_TYPE_LABELS[order.transport_type]}
                  </span>
                  <span
                    className={`home-page__history-status${order.status === 'cancelled' ? ' home-page__history-status--cancelled' : ''}`}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <span className="home-page__history-route">
                  {formatPlace(order.pickup_district, order.pickup_custom_location)}
                  {' → '}
                  {formatPlace(
                    order.destination_district,
                    order.destination_custom_location,
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  )
}

export default HomePage
