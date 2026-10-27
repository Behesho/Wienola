import { useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import { useFeedback } from '../../../context/useFeedback'
import { usePoll } from '../../../hooks/usePoll'
import { supabase } from '../../../lib/supabase'
import {
  addDays,
  describeDay,
  dayState,
  hourLabel,
  isoDay,
  WEEKDAYS,
  type AvailabilityRow,
} from '../../../lib/availability'
import { SqlWarning } from '../Admin/AdminShell'
import './DriverCalendarPage.css'

const DAYS_AHEAD = 14

async function fetchMine(driverId: string) {
  const from = isoDay(new Date())
  const to = isoDay(addDays(new Date(), DAYS_AHEAD))
  const { data, error } = await supabase
    .from('driver_availability')
    .select('*')
    .eq('driver_id', driverId)
    .gte('day', from)
    .lte('day', to)
    .returns<AvailabilityRow[]>()
  if (error) throw error
  return data ?? []
}

interface Window {
  available: boolean
  start: number
  end: number
}

/** The driver tells the admin on which days / hours he can work. */
function DriverCalendarPage() {
  const { user } = useAuth()
  const { toast } = useFeedback()
  const driverId = user?.id ?? ''
  const mine = usePoll(() => fetchMine(driverId), 30000)
  const [editDay, setEditDay] = useState<string | null>(null)
  const [windowDraft, setWindowDraft] = useState<Window>({ available: true, start: 9, end: 17 })
  const [busy, setBusy] = useState(false)
  const [missing, setMissing] = useState(false)

  const rows = mine.data ?? []
  const days = Array.from({ length: DAYS_AHEAD + 1 }, (_, offset) => addDays(new Date(), offset))

  /** Replaces everything for one day with `next` (empty = clear the day). */
  async function saveDay(day: string, next: Omit<AvailabilityRow, 'id' | 'driver_id' | 'day'>[]) {
    setBusy(true)
    const removed = await supabase
      .from('driver_availability')
      .delete()
      .eq('driver_id', driverId)
      .eq('day', day)
    let error = removed.error
    if (!error && next.length > 0) {
      const inserted = await supabase
        .from('driver_availability')
        .insert(next.map((row) => ({ ...row, day })))
      error = inserted.error
    }
    setBusy(false)
    if (error) {
      console.error('Availability save failed:', error.message)
      if (['PGRST205', '42P01'].includes(error.code ?? '')) setMissing(true)
      toast('Das konnte nicht gespeichert werden.', 'error')
      return
    }
    toast('Gespeichert')
    setEditDay(null)
    void mine.refresh()
  }

  return (
    <div className="driver-calendar">
      <h1 className="driver-calendar__title">Kalender</h1>
      <p className="driver-calendar__hint">
        Sag uns, wann du arbeiten kannst. Der Admin sieht das bei der Planung.
      </p>

      {missing && <SqlWarning>Die Verfügbarkeits-Tabelle existiert noch nicht.</SqlWarning>}

      {days.map((date) => {
        const day = isoDay(date)
        const dayRows = rows.filter((row) => row.day === day)
        const state = dayState(dayRows)
        const editing = editDay === day

        return (
          <div key={day} className={`dc-day dc-day--${state}`}>
            <div className="dc-day__head">
              <span className="dc-day__date">
                {WEEKDAYS[date.getDay()]} {date.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' })}
              </span>
              <span className="dc-day__state">{describeDay(dayRows)}</span>
            </div>

            <div className="dc-day__buttons">
              <button
                type="button"
                className="dc-btn dc-btn--yes"
                disabled={busy}
                onClick={() => saveDay(day, [{ available: true, start_hour: null, end_hour: null }])}
              >
                Ganztägig
              </button>
              <button
                type="button"
                className="dc-btn dc-btn--no"
                disabled={busy}
                onClick={() => saveDay(day, [{ available: false, start_hour: null, end_hour: null }])}
              >
                Nicht da
              </button>
              <button
                type="button"
                className="dc-btn"
                disabled={busy}
                onClick={() => setEditDay(editing ? null : day)}
              >
                Zeiten
              </button>
              {dayRows.length > 0 && (
                <button
                  type="button"
                  className="dc-btn"
                  disabled={busy}
                  onClick={() => saveDay(day, [])}
                >
                  Löschen
                </button>
              )}
            </div>

            {editing && (
              <div className="dc-edit">
                <select
                  className="dc-select"
                  value={windowDraft.available ? 'yes' : 'no'}
                  onChange={(event) =>
                    setWindowDraft({ ...windowDraft, available: event.target.value === 'yes' })
                  }
                  aria-label="Art"
                >
                  <option value="yes">Verfügbar</option>
                  <option value="no">Nicht verfügbar</option>
                </select>
                <select
                  className="dc-select"
                  value={windowDraft.start}
                  onChange={(event) =>
                    setWindowDraft({ ...windowDraft, start: Number(event.target.value) })
                  }
                  aria-label="Von"
                >
                  {Array.from({ length: 24 }, (_, hour) => (
                    <option key={hour} value={hour}>
                      ab {hourLabel(hour)}
                    </option>
                  ))}
                </select>
                <select
                  className="dc-select"
                  value={windowDraft.end}
                  onChange={(event) =>
                    setWindowDraft({ ...windowDraft, end: Number(event.target.value) })
                  }
                  aria-label="Bis"
                >
                  {Array.from({ length: 24 }, (_, index) => index + 1).map((hour) => (
                    <option key={hour} value={hour}>
                      bis {hourLabel(hour)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="dc-btn dc-btn--save"
                  disabled={busy || windowDraft.start >= windowDraft.end}
                  onClick={() =>
                    saveDay(day, [
                      {
                        available: windowDraft.available,
                        start_hour: windowDraft.start,
                        end_hour: windowDraft.end,
                      },
                    ])
                  }
                >
                  Speichern
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default DriverCalendarPage
