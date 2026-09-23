import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import { fetchMyOrders } from '../../lib/orders'
import { formatDateTime } from '../../lib/formatDate'
import {
  formatAmount,
  formatPlace,
  STATUS_LABELS,
  TRANSPORT_TYPE_LABELS,
  type OrderWithDriver,
} from '../../types/order'
import './OrdersPage.css'

function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderWithDriver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let active = true

    function reload() {
      fetchMyOrders(user!.id).then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Failed to load orders:', error.message)
        } else {
          setOrders(data ?? [])
        }
        setLoading(false)
      })
    }

    reload()

    const channel = supabase
      .channel('my-orders')
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

  return (
    <div className="orders-page">
      <h1 className="orders-page__title">Aufträge</h1>

      {loading ? (
        <p className="orders-page__empty-text">Lädt…</p>
      ) : orders.length === 0 ? (
        <div className="orders-page__empty">
          <p>Noch keine Aufträge vorhanden.</p>
        </div>
      ) : (
        orders.map((order) => (
          <div key={order.id} className="order-summary-card">
            <div className="order-summary-card__top">
              <span className="order-summary-card__type">
                {TRANSPORT_TYPE_LABELS[order.transport_type]}
              </span>
              <span className="order-summary-card__status">
                {STATUS_LABELS[order.status]}
              </span>
            </div>

            <div className="order-summary-card__route">
              <span>
                {formatPlace(order.pickup_district, order.pickup_custom_location)}
              </span>
              <span className="order-summary-card__arrow" aria-hidden="true">
                →
              </span>
              <span>
                {formatPlace(
                  order.destination_district,
                  order.destination_custom_location,
                )}
              </span>
            </div>

            <div className="order-summary-card__meta">
              <span>
                {formatDateTime(order.scheduled_date, order.scheduled_time, order.express)}
              </span>
              {formatAmount(order.amount) && (
                <span className="order-summary-card__amount">
                  {formatAmount(order.amount)}
                </span>
              )}
            </div>

            <p className="order-summary-card__driver">
              {order.driver?.full_name
                ? `Dienstleister: ${order.driver.full_name}`
                : 'Noch kein Dienstleister zugewiesen.'}
            </p>
          </div>
        ))
      )}
    </div>
  )
}

export default OrdersPage
