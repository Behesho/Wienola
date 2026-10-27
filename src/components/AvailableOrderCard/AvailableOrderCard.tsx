import { useRef, useState, type MouseEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BikeIcon,
  CarIcon,
  TruckIcon,
  VanIcon,
} from '../../pages/Dashboard/NewOrder/icons'
import { formatDateTime } from '../../lib/formatDate'
import { getOrderPrice } from '../../lib/pricing'
import { flyTo } from '../../lib/flyTo'
import {
  customerCode,
  formatAmount,
  formatPlace,
  PAYMENT_METHOD_LABELS,
  paymentMethodOf,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
  TRANSPORT_TYPE_LABELS,
  VEHICLE_LABELS,
  type Order,
} from '../../types/order'
import './AvailableOrderCard.css'

const VEHICLE_ICONS = {
  bike: BikeIcon,
  car: CarIcon,
  van: VanIcon,
  truck: TruckIcon,
} as const

interface AvailableOrderCardProps {
  order: Order
  onAccept: (orderId: string) => Promise<boolean>
  /** Called once the "fly to Meine Jobs" animation has finished. */
  onAccepted: (orderId: string) => void
  onReject: (orderId: string) => Promise<void>
}

function AvailableOrderCard({
  order,
  onAccept,
  onAccepted,
  onReject,
}: AvailableOrderCardProps) {
  const navigate = useNavigate()
  const cardRef = useRef<HTMLDivElement>(null)
  const [accepting, setAccepting] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [failed, setFailed] = useState(false)
  const VehicleIcon = order.vehicle ? VEHICLE_ICONS[order.vehicle] : null
  const amount = formatAmount(getOrderPrice(order))
  const busy = accepting || rejecting
  const method = paymentMethodOf(order)
  // The customer's profile is only readable once the order is accepted, so
  // before that the card shows the number (and the name of imported orders).
  const customerLine = [order.external_customer_name, customerCode(order)]
    .filter(Boolean)
    .join(' · ')

  // The whole card opens the order; its own buttons and links keep working.
  function handleCardClick(event: MouseEvent<HTMLDivElement>) {
    if (busy || (event.target as HTMLElement).closest('button, a')) return
    navigate(`/dashboard/jobs/${order.id}`)
  }

  async function handleAccept() {
    setAccepting(true)
    setFailed(false)
    const success = await onAccept(order.id)
    if (!success) {
      setAccepting(false)
      setFailed(true)
      return
    }
    await flyTo(
      cardRef.current,
      document.querySelector('.bottom-nav a[href="/dashboard/my-jobs"]'),
    )
    onAccepted(order.id)
  }

  async function handleReject() {
    setRejecting(true)
    await onReject(order.id)
    // No need to reset `rejecting` — the card is removed by the parent.
  }

  return (
    <div
      ref={cardRef}
      className={`available-order-card available-order-card--clickable${busy ? '' : ' available-order-card--pending'}`}
      onClick={handleCardClick}
    >
      <div className="available-order-card__top">
        <span className="available-order-card__type">
          {TRANSPORT_TYPE_LABELS[order.transport_type]}
        </span>
        <span className="available-order-card__time">
          {formatDateTime(order.scheduled_date, order.scheduled_time, order.express)}
        </span>
      </div>

      <div className="available-order-card__route">
        <span>{formatPlace(order.pickup_district, order.pickup_custom_location)}</span>
        <span className="available-order-card__arrow" aria-hidden="true">
          →
        </span>
        <span>
          {formatPlace(order.destination_district, order.destination_custom_location)}
        </span>
      </div>

      <div className="available-order-card__meta">
        {VehicleIcon && (
          <span className="available-order-card__vehicle">
            <VehicleIcon />
            {VEHICLE_LABELS[order.vehicle!]}
          </span>
        )}
        {amount && <span className="available-order-card__amount">{amount}</span>}
        {method && (
          <span className="available-order-card__method">
            {PAYMENT_METHOD_LABELS[method]}
          </span>
        )}
        <span
          className={`available-order-card__badge${order.payment_status === 'paid' ? ' available-order-card__badge--paid' : ''}`}
        >
          {order.payment_status === 'paid'
            ? PAYMENT_STATUS_LABELS.paid
            : STATUS_LABELS.open}
        </span>
      </div>

      {customerLine && (
        <p className="available-order-card__customer">Kunde: {customerLine}</p>
      )}

      {failed && (
        <p className="available-order-card__error">
          Auftrag wurde bereits von jemand anderem angenommen.
        </p>
      )}

      <div className="available-order-card__actions">
        <div className="available-order-card__actions-row">
          <button
            type="button"
            className="available-order-card__reject"
            onClick={handleReject}
            disabled={busy}
          >
            {rejecting ? 'Wird abgelehnt…' : 'Ablehnen'}
          </button>
          <button
            type="button"
            className="available-order-card__accept"
            onClick={handleAccept}
            disabled={busy}
          >
            {accepting ? 'Wird angenommen…' : 'Annehmen'}
          </button>
        </div>
        <Link to={`/dashboard/jobs/${order.id}`} className="available-order-card__view">
          Auftrag ansehen
        </Link>
      </div>
    </div>
  )
}

export default AvailableOrderCard
