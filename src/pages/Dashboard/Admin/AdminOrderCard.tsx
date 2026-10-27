import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDateTime } from '../../../lib/formatDate'
import { getOrderPrice } from '../../../lib/pricing'
import { timeAgo, type AdminOrder, type DriverProfile } from '../../../lib/admin'
import {
  customerDisplayName,
  formatAmount,
  formatPlace,
  PAYMENT_METHOD_LABELS,
  paymentMethodOf,
  STATUS_ADVANCE,
  STATUS_LABELS,
  TRANSPORT_TYPE_LABELS,
} from '../../../types/order'
import { useOrderActions } from './useOrderActions'
import './Admin.css'

interface AdminOrderCardProps {
  order: AdminOrder
  adminId: string
  drivers: DriverProfile[]
  onChanged: () => void
}

/** One order as the admin sees it: who has it plus every control. */
function AdminOrderCard({ order, adminId, drivers, onChanged }: AdminOrderCardProps) {
  const navigate = useNavigate()
  const [selected, setSelected] = useState('')
  const actions = useOrderActions(order, adminId, drivers, onChanged)

  const free = order.status === 'open'
  const terminal = order.status === 'completed' || order.status === 'cancelled'
  const advance = STATUS_ADVANCE[order.status]
  const amount = formatAmount(getOrderPrice(order))
  const method = paymentMethodOf(order)
  const driverLabel = order.driver_id
    ? order.driver?.full_name || 'Fahrer'
    : 'Frei'

  function open() {
    navigate(`/dashboard/jobs/${order.id}`)
  }

  // Tapping the card opens it; its own buttons and the select do not.
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button, select, a, option')) return
    open()
  }

  return (
    <div
      className={`admin-card${free ? ' admin-card--new' : ''}${order.status === 'cancelled' ? ' admin-card--cancelled' : ''}`}
      onClick={handleClick}
    >
      <div className="admin-card__top">
        <div className="admin-card__customer">
          <span className="admin-card__name">{customerDisplayName(order)}</span>
          <span className="admin-card__ago">
            {TRANSPORT_TYPE_LABELS[order.transport_type]} · {timeAgo(order.created_at)}
          </span>
        </div>
        <span
          className={`admin-card__driver${order.driver_id ? '' : ' admin-card__driver--free'}`}
        >
          {driverLabel}
        </span>
      </div>

      <div className="admin-card__line">
        <span>
          {formatDateTime(order.scheduled_date, order.scheduled_time, order.express)}
        </span>
        <span className={`admin-status admin-status--${order.status}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <div className="admin-card__line">
        <span>{formatPlace(order.pickup_district, order.pickup_custom_location)}</span>
        <span className="admin-card__arrow" aria-hidden="true">
          →
        </span>
        <span>
          {formatPlace(order.destination_district, order.destination_custom_location)}
        </span>
      </div>

      {(amount || method) && (
        <div className="admin-card__line">
          {amount && <span className="admin-amount">{amount}</span>}
          {method && <span className="admin-pill">{PAYMENT_METHOD_LABELS[method]}</span>}
          {order.return_trip && <span className="admin-pill">Rückweg</span>}
        </div>
      )}

      {advance && order.driver_id && (
        <button
          type="button"
          className="admin-btn admin-btn--primary admin-card__next"
          onClick={actions.advance}
          disabled={actions.busy}
        >
          {advance.label}
        </button>
      )}

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
          <button
            type="button"
            className="admin-btn"
            onClick={actions.selfAccept}
            disabled={actions.busy}
          >
            Selbst annehmen
          </button>
        )}
        {free && (
          <button
            type="button"
            className="admin-btn"
            onClick={actions.reject}
            disabled={actions.busy}
          >
            Ablehnen
          </button>
        )}
        {order.driver_id && !free && !terminal && (
          <button
            type="button"
            className="admin-btn"
            onClick={actions.release}
            disabled={actions.busy}
          >
            Freigeben
          </button>
        )}
        {!terminal && (
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={actions.cancel}
            disabled={actions.busy}
          >
            Stornieren
          </button>
        )}
        <button
          type="button"
          className="admin-btn admin-btn--danger"
          onClick={actions.remove}
          disabled={actions.busy}
        >
          Löschen
        </button>
        <button type="button" className="admin-btn" onClick={open}>
          Ansehen
        </button>
      </div>
    </div>
  )
}

export default AdminOrderCard
