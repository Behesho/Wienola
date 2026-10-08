import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import {
  acceptOrder,
  advanceOrderStatus,
  cancelOrder,
  fetchOrderById,
  rejectOrder,
} from '../../../lib/orders'
import { acknowledgeNewOrders } from '../../../lib/orderNotifications'
import { formatDateTime } from '../../../lib/formatDate'
import { getOrderPrice } from '../../../lib/pricing'
import {
  BikeIcon,
  CarIcon,
  TruckIcon,
  VanIcon,
} from '../NewOrder/icons'
import { PhoneIcon, PinIcon } from '../../../components/icons/NavIcons'
import JobProgressHero from './JobProgressHero'
import { ChevronLeftIcon } from '../NewOrder/icons'
import {
  customerDisplayName,
  formatAmount,
  formatStockUnit,
  formatStreetLine,
  PAYER_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_ADVANCE,
  STATUS_LABELS,
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
  const location = useLocation()
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

  async function handleReject() {
    if (!user || !order) return
    setBusy(true)
    setError(null)
    const { error: rejectError } = await rejectOrder(order.id, user.id)
    setBusy(false)

    if (rejectError) {
      setError('Auftrag konnte nicht abgelehnt werden. Bitte versuche es erneut.')
      return
    }
    navigate('/dashboard')
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

  async function handleCancel() {
    if (!order) return
    if (!window.confirm('Möchtest du diesen Auftrag wirklich stornieren?')) return

    setBusy(true)
    setError(null)
    const { data, error: cancelError } = await cancelOrder(order.id)
    setBusy(false)

    if (cancelError || !data) {
      setError('Auftrag konnte nicht storniert werden. Bitte versuche es erneut.')
      return
    }
    setOrder({ ...order, ...data })
  }

  // Back to the previous page; if the page was opened directly, go home.
  function goBack() {
    if (location.key === 'default') navigate('/dashboard')
    else navigate(-1)
  }

  const backButton = (
    <button
      type="button"
      className="order-details-page__back"
      onClick={goBack}
      aria-label="Zurück"
    >
      <ChevronLeftIcon />
    </button>
  )

  if (loading) {
    return (
      <>
        {backButton}
        <p className="order-details-page__empty">Lädt…</p>
      </>
    )
  }

  if (!order) {
    return (
      <>
        {backButton}
        <p className="order-details-page__empty">Auftrag nicht gefunden.</p>
      </>
    )
  }

  const VehicleIcon = order.vehicle ? VEHICLE_ICONS[order.vehicle] : null
  const amount = formatAmount(getOrderPrice(order))
  const advance = STATUS_ADVANCE[order.status]
  const pickupPlace =
    order.pickup_district === 'other'
      ? order.pickup_custom_location
      : order.pickup_district
  const destinationPlace =
    order.destination_district === 'other'
      ? order.destination_custom_location
      : order.destination_district
  const isMyJob = order.driver_id === user?.id
  const headingToDestination = isMyJob && order.status === 'in_transit'
  const destinationLine = [
    formatStreetLine(order.destination_street, order.destination_house_number),
    destinationPlace,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="order-details-page">
      <div className="order-details-page__header">
        {backButton}
        <h1 className="order-details-page__title">Auftragsdetails</h1>
      </div>

      {advance && isMyJob && (
        <JobProgressHero
          status={order.status}
          vehicle={order.vehicle}
          destination={destinationLine}
          actionLabel={advance.label}
          busy={busy}
          error={error}
          onAction={handleAdvance}
        />
      )}

      {order.status === 'cancelled' && (
        <p className="order-details-page__cancelled" role="status">
          {STATUS_LABELS.cancelled}
        </p>
      )}

      <Section title="Kunde">
        <p className="order-details-page__customer-name">
          {customerDisplayName(order)}
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
        {(order.external_customer_email || order.customer?.email) && (
          <div className="order-details-page__phone-row">
            <span>{order.external_customer_email || order.customer?.email}</span>
            <a
              href={`mailto:${order.external_customer_email || order.customer?.email}`}
              className="order-details-page__call"
            >
              E-Mail
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
          <div
            className={`order-details-page__address${headingToDestination ? ' order-details-page__address--target' : ''}`}
          >
            {headingToDestination && (
              <span className="order-details-page__target-badge">
                <PinIcon />
                Hierhin fahren
              </span>
            )}
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
              <dt>Zahlungsart</dt>
              <dd>{PAYER_LABELS[order.payer]}</dd>
            </>
          )}
          {amount && (
            <>
              <dt>Preis</dt>
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

          {order.photo_url &&
            (order.transport_type === 'letter' ||
              order.transport_type === 'willhaben' ||
              order.transport_type === 'billa') && (
            <p className="order-details-page__photo-label">
              {order.transport_type === 'willhaben'
                ? 'Willhaben-Beleg'
                : order.transport_type === 'billa'
                  ? 'Bestellbestätigung'
                  : 'Abholschein'}
            </p>
          )}
          {order.photo_url && (
            <img
              src={order.photo_url}
              alt=""
              className="order-details-page__photo"
            />
          )}
        </Section>
      )}

      {error && !(advance && isMyJob) && (
        <p className="order-details-page__error">{error}</p>
      )}

      {order.status === 'open' && (
        <div className="order-details-page__open-actions">
          <button
            type="button"
            className="order-details-page__reject"
            onClick={handleReject}
            disabled={busy}
          >
            Ablehnen
          </button>
          <button
            type="button"
            className="order-details-page__cta"
            onClick={handleAccept}
            disabled={busy}
          >
            {busy ? 'Wird angenommen…' : 'Auftrag annehmen'}
          </button>
        </div>
      )}

      {order.status === 'accepted' && order.driver_id === user?.id && (
        <button
          type="button"
          className="order-details-page__cancel"
          onClick={handleCancel}
          disabled={busy}
        >
          Auftrag stornieren
        </button>
      )}
    </div>
  )
}

export default OrderDetailsPage
