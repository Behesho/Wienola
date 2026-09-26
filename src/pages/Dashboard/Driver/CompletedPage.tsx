import { useEffect, useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import { fetchCompletedJobs } from '../../../lib/orders'
import {
  DATE_PRESET_LABELS,
  getPresetRange,
  type DatePreset,
} from '../../../lib/dateRangePresets'
import JobCard from '../../../components/JobCard/JobCard'
import { getOrderPrice } from '../../../lib/pricing'
import { formatAmount, type OrderWithCustomer } from '../../../types/order'
import './CompletedPage.css'

function CompletedPage() {
  const { user } = useAuth()
  const [preset, setPreset] = useState<DatePreset>('week')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [orders, setOrders] = useState<OrderWithCustomer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    if (preset === 'custom' && (!customFrom || !customTo)) {
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)
    const range = getPresetRange(preset, customFrom, customTo)

    fetchCompletedJobs(user.id, range).then(({ data, error }) => {
      if (!active) return
      if (error) {
        console.error('Failed to load completed jobs:', error.message)
      } else {
        setOrders(data ?? [])
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [user, preset, customFrom, customTo])

  const completed = orders.filter((order) => order.status === 'completed')
  const cancelledCount = orders.length - completed.length
  const revenue = completed.reduce(
    (sum, order) => sum + (getOrderPrice(order) ?? 0),
    0,
  )

  return (
    <div className="completed-page">
      <h1 className="completed-page__title">Erledigt</h1>

      <select
        className="completed-page__filter"
        value={preset}
        onChange={(event) => setPreset(event.target.value as DatePreset)}
        aria-label="Zeitraum"
      >
        {(Object.keys(DATE_PRESET_LABELS) as DatePreset[]).map((key) => (
          <option key={key} value={key}>
            {DATE_PRESET_LABELS[key]}
          </option>
        ))}
      </select>

      {preset === 'custom' && (
        <div className="completed-page__custom-range">
          <input
            type="date"
            value={customFrom}
            onChange={(event) => setCustomFrom(event.target.value)}
            aria-label="Von"
          />
          <span>–</span>
          <input
            type="date"
            value={customTo}
            onChange={(event) => setCustomTo(event.target.value)}
            aria-label="Bis"
          />
        </div>
      )}

      <div className="completed-page__list">
        {loading ? (
          <p className="completed-page__empty">Lädt…</p>
        ) : orders.length === 0 ? (
          <p className="completed-page__empty">
            Keine erledigten Aufträge in diesem Zeitraum.
          </p>
        ) : (
          orders.map((order) => <JobCard key={order.id} order={order} />)
        )}
      </div>

      {!loading && orders.length > 0 && (
        <section className="completed-summary" aria-label="Bilanz">
          <h2 className="completed-summary__title">Bilanz</h2>
          <div className="completed-summary__grid">
            <div className="completed-summary__item">
              <span className="completed-summary__value">{completed.length}</span>
              <span className="completed-summary__label">Aufträge</span>
            </div>
            <div className="completed-summary__item">
              <span className="completed-summary__value completed-summary__value--brand">
                {formatAmount(revenue)}
              </span>
              <span className="completed-summary__label">Umsatz</span>
            </div>
          </div>
          {cancelledCount > 0 && (
            <p className="completed-summary__cancelled">
              {cancelledCount === 1
                ? '1 Auftrag storniert'
                : `${cancelledCount} Aufträge storniert`}
            </p>
          )}
        </section>
      )}
    </div>
  )
}

export default CompletedPage
