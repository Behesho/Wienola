import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import {
  assignOrderToDriver,
  fetchDrivers,
  fetchOpenOrdersForAdmin,
  type DriverOption,
  type OrderWithAssignment,
} from '../../../lib/orders'
import { formatDateTime } from '../../../lib/formatDate'
import { formatPlace, TRANSPORT_TYPE_LABELS } from '../../../types/order'
import SelectField from '../../../components/SelectField/SelectField'
import './AdminOrdersPage.css'

function AssignRow({
  order,
  drivers,
  onAssign,
}: {
  order: OrderWithAssignment
  drivers: DriverOption[]
  onAssign: (orderId: string, driverId: string | null) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)

  async function handleChange(value: string) {
    setSaving(true)
    await onAssign(order.id, value || null)
    setSaving(false)
  }

  return (
    <div className="admin-order-card">
      <div className="admin-order-card__top">
        <span className="admin-order-card__type">
          {TRANSPORT_TYPE_LABELS[order.transport_type]}
        </span>
        <span className="admin-order-card__time">
          {formatDateTime(order.scheduled_date, order.scheduled_time, order.express)}
        </span>
      </div>

      <div className="admin-order-card__route">
        <span>{formatPlace(order.pickup_district, order.pickup_custom_location)}</span>
        <span aria-hidden="true">→</span>
        <span>
          {formatPlace(order.destination_district, order.destination_custom_location)}
        </span>
      </div>

      <SelectField
        label="Nur diesem Dienstleister zeigen"
        placeholder="Allen Dienstleistern zeigen"
        value={order.assigned_driver_id ?? ''}
        onChange={handleChange}
      >
        {drivers.map((driver) => (
          <option key={driver.id} value={driver.id}>
            {driver.full_name || driver.phone || driver.id.slice(0, 8)}
          </option>
        ))}
      </SelectField>

      {order.assigned_driver_id && (
        <div className="admin-order-card__assigned">
          <span>Zugewiesen an: {order.assigned?.full_name || 'Dienstleister'}</span>
          <button type="button" onClick={() => handleChange('')} disabled={saving}>
            Zurücksetzen
          </button>
        </div>
      )}
    </div>
  )
}

function AdminOrdersPage() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<OrderWithAssignment[]>([])
  const [drivers, setDrivers] = useState<DriverOption[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.is_admin) return
    let active = true

    Promise.all([fetchOpenOrdersForAdmin(), fetchDrivers()]).then(
      ([ordersResult, driversResult]) => {
        if (!active) return
        if (ordersResult.error) {
          console.error('Failed to load orders:', ordersResult.error.message)
        } else {
          setOrders(ordersResult.data ?? [])
        }
        if (driversResult.error) {
          console.error('Failed to load drivers:', driversResult.error.message)
        } else {
          setDrivers(driversResult.data ?? [])
        }
        setLoading(false)
      },
    )

    return () => {
      active = false
    }
  }, [profile?.is_admin])

  async function handleAssign(orderId: string, driverId: string | null) {
    const { data, error } = await assignOrderToDriver(orderId, driverId)
    if (error) {
      console.error('Failed to assign order:', error.message)
      return
    }
    if (data) {
      setOrders((prev) => prev.map((order) => (order.id === orderId ? data : order)))
    }
  }

  // Real protection is the RLS policy — this is just so a non-admin doesn't
  // land on a page that renders nothing useful for them.
  if (!profile?.is_admin) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="admin-orders-page">
      <h1 className="admin-orders-page__title">Offene Aufträge zuweisen</h1>

      {loading ? (
        <p className="admin-orders-page__empty">Lädt…</p>
      ) : orders.length === 0 ? (
        <p className="admin-orders-page__empty">Keine offenen Aufträge.</p>
      ) : (
        orders.map((order) => (
          <AssignRow
            key={order.id}
            order={order}
            drivers={drivers}
            onAssign={handleAssign}
          />
        ))
      )}
    </div>
  )
}

export default AdminOrdersPage
