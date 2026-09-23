import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BikeIcon,
  CarIcon,
  TruckIcon,
  VanIcon,
} from '../../pages/Dashboard/NewOrder/icons'
import { formatDateTime } from '../../lib/formatDate'
import {
  formatAmount,
  formatPlace,
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
}

function AvailableOrderCard({ order, onAccept }: AvailableOrderCardProps) {
  const [accepting, setAccepting] = useState(false)
  const [failed, setFailed] = useState(false)
  const VehicleIcon = order.vehicle ? VEHICLE_ICONS[order.vehicle] : null
  const amount = formatAmount(order.amount)

  async function handleAccept() {
    setAccepting(true)
    setFailed(false)
    const success = await onAccept(order.id)
    setAccepting(false)
    if (!success) setFailed(true)
  }

  return (
    <div className="available-order-card">
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
        <span
          className={`available-order-card__badge${order.payment_status === 'paid' ? ' available-order-card__badge--paid' : ''}`}
        >
          {order.payment_status === 'paid'
            ? PAYMENT_STATUS_LABELS.paid
            : STATUS_LABELS.open}
        </span>
      </div>

      {failed && (
        <p className="available-order-card__error">
          Auftrag wurde bereits von jemand anderem angenommen.
        </p>
      )}

      <div className="available-order-card__actions">
        <Link to={`/dashboard/jobs/${order.id}`} className="available-order-card__view">
          Auftrag ansehen
        </Link>
        <button
          type="button"
          className="available-order-card__accept"
          onClick={handleAccept}
          disabled={accepting}
        >
          {accepting ? 'Wird angenommen…' : 'Annehmen'}
        </button>
      </div>
    </div>
  )
}

export default AvailableOrderCard
