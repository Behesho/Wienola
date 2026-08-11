import { BoltIcon, CalendarIcon, ClockIcon } from './icons'
import './ScheduleStep.css'

interface ScheduleStepProps {
  date: string
  time: string
  express: boolean
  onChange: (patch: {
    date?: string
    time?: string
    express?: boolean
  }) => void
}

function ScheduleStep({ date, time, express, onChange }: ScheduleStepProps) {
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
    </div>
  )
}

export default ScheduleStep
