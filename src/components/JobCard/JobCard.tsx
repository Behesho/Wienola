import { useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { formatDateTime } from '../../lib/formatDate'
import { getOrderPrice } from '../../lib/pricing'
import { CheckIcon } from '../../pages/Dashboard/NewOrder/icons'
import {
  customerCode,
  customerDisplayName,
  formatAmount,
  formatPlace,
  PAYMENT_METHOD_LABELS,
  paymentMethodOf,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  type OrderWithCustomer,
} from '../../types/order'
import './JobCard.css'

interface JobCardProps {
  order: OrderWithCustomer
  actionLabel?: string
  onAction?: () => Promise<void>
}

function JobCard({ order, actionLabel, onAction }: JobCardProps) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const method = paymentMethodOf(order)
  const code = customerCode(order)

  // The whole card opens the order; the route link and the action button
  // keep their own behaviour.
  function handleCardClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('button, a')) return
    navigate(`/dashboard/jobs/${order.id}`)
  }
  const amount = formatAmount(getOrderPrice(order))

  async function handleAction() {
    if (!onAction) return
    setBusy(true)
    await onAction()
    setBusy(false)
  }

  return (
    <div
      className={`job-card job-card--clickable${order.status === 'cancelled' ? ' job-card--cancelled' : ''}${order.status === 'completed' ? ' job-card--completed' : ''}`}
      onClick={handleCardClick}
    >
      <div className="job-card__top">
        <span className="job-card__time">
          {formatDateTime(order.scheduled_date, order.scheduled_time, order.express)}
        </span>
        <span
          className={`job-card__status${order.status === 'cancelled' ? ' job-card__status--cancelled' : ''}`}
        >
          {order.status === 'completed' && <CheckIcon className="job-card__status-check" />}
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      <Link to={`/dashboard/jobs/${order.id}`} className="job-card__route">
        <span>{formatPlace(order.pickup_district, order.pickup_custom_location)}</span>
        <span className="job-card__arrow" aria-hidden="true">
          →
        </span>
        <span>
          {formatPlace(order.destination_district, order.destination_custom_location)}
        </span>
      </Link>

      <div className="job-card__meta">
        <span className="job-card__customer">
          {customerDisplayName(order)}
          {code && ` · ${code}`}
        </span>
        {amount && <span className="job-card__amount">{amount}</span>}
        {method && (
          <span className="job-card__method">{PAYMENT_METHOD_LABELS[method]}</span>
        )}
        <span
          className={`job-card__badge${order.payment_status === 'paid' ? ' job-card__badge--paid' : ''}`}
        >
          {PAYMENT_STATUS_LABELS[order.payment_status]}
        </span>
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          className="job-card__action"
          onClick={handleAction}
          disabled={busy}
        >
          {busy ? 'Wird aktualisiert…' : actionLabel}
        </button>
      )}
    </div>
  )
}

export default JobCard
