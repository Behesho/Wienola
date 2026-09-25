import { useEffect, useState } from 'react'
import { fetchCompletedJobs } from '../../lib/orders'
import { getOrderPrice } from '../../lib/pricing'
import {
  DATE_PRESET_LABELS,
  getPresetRange,
  type DatePreset,
} from '../../lib/dateRangePresets'
import './EarningsSummary.css'

interface EarningsSummaryProps {
  driverId: string
}

function EarningsSummary({ driverId }: EarningsSummaryProps) {
  const [preset, setPreset] = useState<DatePreset>('today')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (preset === 'custom' && (!customFrom || !customTo)) {
      setLoading(false)
      return
    }

    let active = true
    setLoading(true)

    const range = getPresetRange(preset, customFrom, customTo)
    fetchCompletedJobs(driverId, range).then(({ data, error }) => {
      if (!active) return
      if (error) {
        console.error('Failed to load earnings:', error.message)
        setTotal(null)
      } else {
        const sum = (data ?? [])
          .filter((order) => order.payment_status === 'paid')
          .reduce((acc, order) => acc + (getOrderPrice(order) ?? 0), 0)
        setTotal(sum)
      }
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [driverId, preset, customFrom, customTo])

  const label =
    preset === 'today' ? 'Heute verdient' : `${DATE_PRESET_LABELS[preset]} verdient`

  return (
    <div className="earnings-summary">
      <div className="earnings-summary__main">
        <span className="earnings-summary__label">{label}</span>
        <span className="earnings-summary__amount">
          {loading || total === null
            ? '–'
            : `€ ${total.toFixed(2).replace('.', ',')}`}
        </span>
      </div>

      <select
        className="earnings-summary__filter"
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
        <div className="earnings-summary__custom-range">
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
    </div>
  )
}

export default EarningsSummary
