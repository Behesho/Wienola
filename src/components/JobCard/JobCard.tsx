import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDateTime } from '../../lib/formatDate'
import { getOrderPrice } from '../../lib/pricing'
import {
  formatAmount,
  formatPlace,
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
  const [busy, setBusy] = useState(false)
  const amount = formatAmount(getOrderPrice(order))

  async function handleAction() {
    if (!onAction) return
    setBusy(true)
    await onAction()
    setBusy(false)
  }

  return (
    <div className="job-card">
      <div className="job-card__top">
        <span className="job-card__time">
          {formatDateTime(order.scheduled_date, order.scheduled_time, order.express)}
        </span>
        <span className="job-card__status">{STATUS_LABELS[order.status]}</span>
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
          {order.customer?.full_name || 'Kund_in'}
        </span>
        {amount && <span className="job-card__amount">{amount}</span>}
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
