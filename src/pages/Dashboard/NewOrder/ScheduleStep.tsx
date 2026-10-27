import { BoltIcon, CalendarIcon, ClockIcon } from './icons'
import type { PayerChoice, PaymentMethod } from './types'
import './ScheduleStep.css'

const PAYER_OPTIONS: { value: PayerChoice; label: string }[] = [
  { value: 'pickup', label: 'Abholadresse' },
  { value: 'destination', label: 'Zustelladresse' },
]

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Bar' },
  { value: 'card', label: 'Online mit Karte' },
]

interface ScheduleStepProps {
  date: string
  time: string
  express: boolean
  payer: PayerChoice | null
  paymentMethod: PaymentMethod | null
  onChange: (patch: {
    date?: string
    time?: string
    express?: boolean
    payer?: PayerChoice
    paymentMethod?: PaymentMethod
  }) => void
}

function ScheduleStep({
  date,
  time,
  express,
  payer,
  paymentMethod,
  onChange,
}: ScheduleStepProps) {
  return (
    <div className="schedule-step">
      <h2 className="order-step__heading">Wunschtermin</h2>

      <div className="schedule-step__fields">
        <label className="schedule-step__field">
          <span>
            <CalendarIcon className="schedule-step__field-icon" />
            Datum
          </span>
          <input
            type="date"
            value={date}
            disabled={express}
            onChange={(event) => onChange({ date: event.target.value })}
          />
        </label>

        <label className="schedule-step__field">
          <span>
            <ClockIcon className="schedule-step__field-icon" />
            Uhrzeit
          </span>
          <input
            type="time"
            value={time}
            disabled={express}
            onChange={(event) => onChange({ time: event.target.value })}
          />
        </label>
      </div>

      <div className="schedule-step__divider">
        <span>oder</span>
      </div>

      <button
        type="button"
        className={`schedule-step__express${express ? ' schedule-step__express--selected' : ''}`}
        aria-pressed={express}
        onClick={() => onChange({ express: !express })}
      >
        <BoltIcon className="schedule-step__express-icon" />
        <span>
          <span className="schedule-step__express-title">
            So schnell wie möglich
          </span>
          <span className="schedule-step__express-subtitle">
            Express-Abholung ohne festen Termin
          </span>
        </span>
      </button>

      <div className="schedule-step__payer">
        <span className="schedule-step__payer-title">Wer bezahlt?</span>
        <div className="schedule-step__payer-options">
          {PAYER_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`schedule-step__payer-option${payer === option.value ? ' schedule-step__payer-option--selected' : ''}`}
              aria-pressed={payer === option.value}
              onClick={() => onChange({ payer: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="schedule-step__payer">
        <span className="schedule-step__payer-title">Zahlungsart</span>
        <div className="schedule-step__payer-options">
          {METHOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`schedule-step__payer-option${paymentMethod === option.value ? ' schedule-step__payer-option--selected' : ''}`}
              aria-pressed={paymentMethod === option.value}
              onClick={() => onChange({ paymentMethod: option.value })}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ScheduleStep
