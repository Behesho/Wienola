import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import { acceptOrder, advanceOrderStatus, fetchOrderById } from '../../../lib/orders'
import { acknowledgeNewOrders } from '../../../lib/orderNotifications'
import { formatDateTime } from '../../../lib/formatDate'
import {
  BikeIcon,
  CarIcon,
  TruckIcon,
  VanIcon,
} from '../NewOrder/icons'
import { PhoneIcon } from '../../../components/icons/NavIcons'
import {
  formatAmount,
  formatStockUnit,
  formatStreetLine,
  PAYER_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_ADVANCE,
  TRANSPORT_TYPE_LABELS,
  VEHICLE_LABELS,
  type OrderWithCustomer,
} from '../../../types/order'
import './OrderDetailsPage.css'

const VEHICLE_ICONS = {
  bike: BikeIcon,
  car: CarIcon,
  van: VanIcon,
  truck: TruckIcon,
} as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="order-details-section">
      <h2 className="order-details-section__title">{title}</h2>
      {children}
    </section>
  )
}

function OrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderWithCustomer | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    let active = true

    fetchOrderById(orderId).then(({ data, error: fetchError }) => {
      if (!active) return
      if (fetchError) {
        console.error('Failed to load order:', fetchError.message)
      } else {
        setOrder(data)
        if (data?.status === 'open') {
          acknowledgeNewOrders()
        }
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [orderId])

  async function handleAccept() {
    if (!user || !order) return
    setBusy(true)
    setError(null)
    const { data, error: acceptError } = await acceptOrder(order.id, user.id)
    acknowledgeNewOrders()

    if (acceptError || !data) {
      setBusy(false)
      setError('Auftrag wurde bereits von jemand anderem angenommen.')
      return
    }

    // Re-fetch with the customer join — RLS only allows reading the
    // customer's profile once this driver actually holds the order.
    const { data: refreshed } = await fetchOrderById(order.id)
    setBusy(false)
    if (refreshed) setOrder(refreshed)
  }

  async function handleAdvance() {
    if (!user || !order) return
    const advance = STATUS_ADVANCE[order.status]
    if (!advance) return

    setBusy(true)
    setError(null)
    const { data, error: advanceError } = await advanceOrderStatus(
      order.id,
      user.id,
      advance.next,
    )
    setBusy(false)

    if (advanceError || !data) {
      setError('Status konnte nicht aktualisiert werden. Bitte versuche es erneut.')
      return
    }

    if (advance.next === 'completed') {
      navigate('/dashboard/completed')
      return
    }
    setOrder({ ...order, ...data })
  }

  if (loading) {
    return <p className="order-details-page__empty">Lädt…</p>
  }

  if (!order) {
    return <p className="order-details-page__empty">Auftrag nicht gefunden.</p>
  }

  const VehicleIcon = order.vehicle ? VEHICLE_ICONS[order.vehicle] : null
  const amount = formatAmount(order.amount)
  const advance = STATUS_ADVANCE[order.status]
  const pickupPlace =
    order.pickup_district === 'other'
      ? order.pickup_custom_location
      : order.pickup_district
  const destinationPlace =
    order.destination_district === 'other'
      ? order.destination_custom_location
      : order.destination_district

  return (
    <div className="order-details-page">
      <h1 className="order-details-page__title">Auftragsdetails</h1>

      <Section title="Kunde">
        <p className="order-details-page__customer-name">
          {order.customer?.full_name || 'Kund_in'}
        </p>
        {(order.contact_phone || order.customer?.phone) && (
          <div className="order-details-page__phone-row">
            <span>{order.contact_phone || order.customer?.phone}</span>
            <a
              href={`tel:${order.contact_phone || order.customer?.phone}`}
              className="order-details-page__call"
            >
              <PhoneIcon />
              Anrufen
            </a>
          </div>
        )}
      </Section>

      <Section title="Termin">
        <p className="order-details-page__schedule">
          {formatDateTime(order.scheduled_date, order.scheduled_time, order.express)}
        </p>
      </Section>

      <Section title="Route">
        <div className="order-details-page__route">
          <div className="order-details-page__address">
            <span className="order-details-page__address-label">Abholung</span>
            {(order.pickup_street || order.pickup_house_number) && (
              <p>
                {formatStreetLine(order.pickup_street, order.pickup_house_number)}
              </p>
            )}
            {formatStockUnit(order.pickup_stock, order.pickup_unit) && (
              <p>{formatStockUnit(order.pickup_stock, order.pickup_unit)}</p>
            )}
            {pickupPlace && <p>{pickupPlace}</p>}
          </div>
          <div className="order-details-page__address">
            <span className="order-details-page__address-label">Zustellung</span>
            {(order.destination_street || order.destination_house_number) && (
              <p>
                {formatStreetLine(
                  order.destination_street,
                  order.destination_house_number,
                )}
              </p>
            )}
            {formatStockUnit(order.destination_stock, order.destination_unit) && (
              <p>
                {formatStockUnit(order.destination_stock, order.destination_unit)}
              </p>
            )}
            {destinationPlace && <p>{destinationPlace}</p>}
          </div>
        </div>
      </Section>

      <Section title="Zahlung">
        <dl className="order-details-page__payment">
          {order.payer && (
            <>
              <dt>Wer bezahlt?</dt>
              <dd>{PAYER_LABELS[order.payer]}</dd>
            </>
          )}
          {amount && (
            <>
              <dt>Auftragsbetrag</dt>
              <dd>{amount}</dd>
            </>
          )}
          <dt>Zahlungsstatus</dt>
          <dd>
            <span
              className={`order-details-page__badge${order.payment_status === 'paid' ? ' order-details-page__badge--paid' : ''}`}
            >
              {PAYMENT_STATUS_LABELS[order.payment_status]}
            </span>
          </dd>
        </dl>
      </Section>

      {(order.description ||
        order.vehicle ||
        order.photo_url ||
        order.length_cm ||
        order.pickup_floor ||
        order.destination_floor) && (
        <Section title="Weitere Informationen">
          <dl className="order-details-page__info">
            <dt>Auftragsart</dt>
            <dd>{TRANSPORT_TYPE_LABELS[order.transport_type]}</dd>

            {order.description && (
              <>
                <dt>Beschreibung</dt>
                <dd>{order.description}</dd>
              </>
            )}

            {order.vehicle && VehicleIcon && (
              <>
                <dt>Fahrzeug</dt>
                <dd className="order-details-page__vehicle">
                  <VehicleIcon />
                  {VEHICLE_LABELS[order.vehicle]}
                </dd>
              </>
            )}

            {order.length_cm && order.width_cm && order.height_cm && (
              <>
                <dt>Maße</dt>
                <dd>
                  {order.length_cm} × {order.width_cm} × {order.height_cm} cm
                </dd>
              </>
            )}

            {order.pickup_floor && (
              <>
                <dt>Etage (Abholung)</dt>
                <dd>
                  {order.pickup_floor}
                  {order.pickup_elevator !== null &&
                    ` · Aufzug: ${order.pickup_elevator ? 'Ja' : 'Nein'}`}
                </dd>
              </>
            )}

            {order.destination_floor && (
              <>
                <dt>Etage (Ziel)</dt>
                <dd>
                  {order.destination_floor}
                  {order.destination_elevator !== null &&
                    ` · Aufzug: ${order.destination_elevator ? 'Ja' : 'Nein'}`}
                </dd>
              </>
            )}
          </dl>

          {order.photo_url && (
            <img
              src={order.photo_url}
              alt=""
              className="order-details-page__photo"
            />
          )}
        </Section>
      )}

      {error && <p className="order-details-page__error">{error}</p>}

      {order.status === 'open' && (
        <button
          type="button"
          className="order-details-page__cta"
          onClick={handleAccept}
          disabled={busy}
        >
          {busy ? 'Wird angenommen…' : 'Auftrag annehmen'}
        </button>
      )}

      {advance && order.driver_id === user?.id && (
        <button
          type="button"
          className="order-details-page__cta"
          onClick={handleAdvance}
          disabled={busy}
        >
          {busy ? 'Wird aktualisiert…' : advance.label}
        </button>
      )}
    </div>
  )
}

export default OrderDetailsPage
