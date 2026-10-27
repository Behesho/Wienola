import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import { fetchDriverProfiles, type DriverProfile } from '../../../lib/admin'
import { STATUS_ADVANCE, STATUS_LABELS, type OrderStatus } from '../../../types/order'
import { useOrderActions, type ActionOrder } from './useOrderActions'
import './Admin.css'

/** Status buttons in the order detail view (Zugestellt / Storniert / …). */
const STATUS_BUTTONS: { status: OrderStatus; label: string }[] = [
  { status: 'accepted', label: 'Angenommen' },
  { status: 'picked_up', label: 'Abgeholt' },
  { status: 'in_transit', label: STATUS_LABELS.in_transit },
  { status: 'delivered', label: 'Zugestellt' },
  { status: 'completed', label: STATUS_LABELS.completed },
  { status: 'cancelled', label: STATUS_LABELS.cancelled },
]

interface AdminOrderBlockProps {
  order: ActionOrder
  onChanged: () => void
  onDeleted: () => void
}

/** The "Admin" block at the top of an order's detail view. */
function AdminOrderBlock({ order, onChanged, onDeleted }: AdminOrderBlockProps) {
  const { user } = useAuth()
  const adminId = user?.id ?? ''
  const [drivers, setDrivers] = useState<DriverProfile[]>([])
  const [selected, setSelected] = useState('')
  const actions = useOrderActions(order, adminId, drivers, onChanged, onDeleted)

  useEffect(() => {
    let active = true
    fetchDriverProfiles()
      .then((list) => {
        if (active) setDrivers(list.filter((driver) => driver.is_approved !== false))
      })
      .catch((error) => console.error('Failed to load drivers:', error))
    return () => {
      active = false
    }
  }, [])

  const free = order.status === 'open'
  const terminal = order.status === 'completed' || order.status === 'cancelled'
  const advance = STATUS_ADVANCE[order.status]
  const holder = order.driver_id
    ? drivers.find((driver) => driver.id === order.driver_id)?.full_name || 'Fahrer'
    : 'Frei'

  return (
    <section className="admin-block">
      <h2 className="admin-block__title">Admin</h2>
      <p className="admin-block__who">Bei: {holder}</p>

      {advance && order.driver_id && (
        <button
          type="button"
          className="admin-btn admin-btn--primary admin-btn--wide"
          onClick={actions.advance}
          disabled={actions.busy}
        >
          {advance.label}
        </button>
      )}

      <div className="status-row">
        {STATUS_BUTTONS.map(({ status, label }) => (
          <button
            key={status}
            type="button"
            className={`admin-btn${order.status === status ? ' admin-btn--current' : ''}${status === 'cancelled' ? ' admin-btn--danger' : ''}`}
            disabled={
              actions.busy ||
              order.status === status ||
              (status !== 'cancelled' && !order.driver_id)
            }
            onClick={() => actions.changeStatus(status)}
          >
            {label}
          </button>
        ))}
      </div>

      {!terminal && (
        <div className="admin-card__row">
          <select
            className="admin-select"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            aria-label="Fahrer wählen"
          >
            <option value="">Fahrer wählen…</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.full_name || driver.phone || driver.id.slice(0, 8)}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => actions.assign(selected)}
            disabled={!selected || actions.busy}
          >
            {free ? 'Zuweisen' : 'Übergeben'}
          </button>
        </div>
      )}

      <div className="admin-card__actions">
        {free && (
          <button type="button" className="admin-btn" onClick={actions.selfAccept} disabled={actions.busy}>
            Selbst annehmen
          </button>
        )}
        {order.driver_id && !free && !terminal && (
          <button type="button" className="admin-btn" onClick={actions.release} disabled={actions.busy}>
            Freigeben
          </button>
        )}
        {!terminal && (
          <button type="button" className="admin-btn admin-btn--danger" onClick={actions.cancel} disabled={actions.busy}>
            Stornieren
          </button>
        )}
        <button type="button" className="admin-btn admin-btn--danger" onClick={actions.remove} disabled={actions.busy}>
          Löschen
        </button>
      </div>
    </section>
  )
}

export default AdminOrderBlock
