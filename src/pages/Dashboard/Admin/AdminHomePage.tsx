import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import { usePoll } from '../../../hooks/usePoll'
import { fetchAvailability, fetchUsers } from '../../../lib/admin'
import {
  addDays,
  countsAsAvailable,
  dayState,
  describeDay,
  indexAvailability,
  isoDay,
  todayLine,
  WEEKDAYS,
  type DayState,
} from '../../../lib/availability'
import { AdminPage, SqlWarning } from './AdminShell'
import { isRunning, useAdminData } from './useAdminData'

const SORT_ORDER: Record<DayState, number> = { yes: 0, partial: 1, none: 2, no: 3 }

/** Admin home: how many drivers work today, and each driver's next 7 days. */
function AdminHomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const adminId = user?.id ?? ''
  const data = useAdminData(adminId)

  const start = new Date()
  const days = Array.from({ length: 7 }, (_, offset) => addDays(start, offset))
  const availability = usePoll(() => fetchAvailability(isoDay(days[0]), isoDay(days[6])))
  const users = usePoll(fetchUsers, 30000)

  const [openDay, setOpenDay] = useState<{ driverId: string; day: string } | null>(null)

  const banned = new Set(
    (users.data?.data ?? []).filter((user) => user.banned).map((user) => user.id),
  )
  const orders = data.data?.orders ?? []
  const drivers = (data.data?.drivers ?? []).filter((driver) => !banned.has(driver.id))
  const rows = availability.data?.data ?? []
  const index = indexAvailability(rows)
  const todayKey = isoDay(days[0])

  const cards = drivers
    .map((driver) => {
      const todayRows = index.get(`${driver.id}|${todayKey}`) ?? []
      return {
        driver,
        todayRows,
        todayState: dayState(todayRows),
        running: orders.filter((order) => order.driver_id === driver.id && isRunning(order)).length,
      }
    })
    .sort(
      (a, b) =>
        SORT_ORDER[a.todayState] - SORT_ORDER[b.todayState] ||
        (a.driver.full_name ?? '').localeCompare(b.driver.full_name ?? '', 'de'),
    )

  const available = cards.filter((card) => countsAsAvailable(card.todayState)).length
  const unavailable = cards.filter((card) => card.todayState === 'no').length
  const noEntry = cards.filter((card) => card.todayState === 'none').length
  const newOrders = orders.filter(
    (order) => order.status === 'open' && !data.data?.rejected.has(order.id),
  ).length

  function refresh() {
    void data.refresh()
    void availability.refresh()
    void users.refresh()
  }

  return (
    <AdminPage title="Home" onRefresh={refresh} failed={data.failed}>
      {availability.data?.missing && (
        <SqlWarning>Die Verfügbarkeits-Tabelle existiert noch nicht.</SqlWarning>
      )}

      <div className="admin-tiles">
        <div className="admin-tile admin-tile--green">
          <span className="admin-tile__value">{available}</span>
          <span className="admin-tile__label">Heute verfügbar</span>
        </div>
        <div className="admin-tile admin-tile--red">
          <span className="admin-tile__value">{unavailable}</span>
          <span className="admin-tile__label">Heute nicht da</span>
        </div>
        <div className="admin-tile">
          <span className="admin-tile__value">{noEntry}</span>
          <span className="admin-tile__label">Keine Angabe</span>
        </div>
        <button
          type="button"
          className={`admin-tile${newOrders > 0 ? ' admin-tile--alert' : ''}`}
          onClick={() => navigate('/dashboard/orders')}
        >
          <span className="admin-tile__value">{newOrders}</span>
          <span className="admin-tile__label">Neue Aufträge</span>
        </button>
      </div>

      {data.loading && !data.data ? (
        <p className="admin-empty">Lädt…</p>
      ) : cards.length === 0 ? (
        <p className="admin-empty">Noch keine aktiven Fahrer.</p>
      ) : (
        cards.map(({ driver, todayRows, running }) => (
          <div key={driver.id} className="driver-card">
            <div className="driver-card__top">
              <span className="driver-card__name">{driver.full_name || 'Fahrer'}</span>
              <span className="driver-card__jobs">
                {running > 0 ? `${running} laufend` : 'frei'}
              </span>
            </div>
            <p className="driver-card__today">{todayLine(todayRows)}</p>

            <div className="week-strip">
              {days.map((date) => {
                const day = isoDay(date)
                const dayRows = index.get(`${driver.id}|${day}`) ?? []
                const state = dayState(dayRows)
                const isOpen = openDay?.driverId === driver.id && openDay.day === day
                return (
                  <button
                    key={day}
                    type="button"
                    className={`day-box day-box--${state}${day === todayKey ? ' day-box--today' : ''}${isOpen ? ' day-box--open' : ''}`}
                    onClick={() => setOpenDay(isOpen ? null : { driverId: driver.id, day })}
                    aria-pressed={isOpen}
                    aria-label={`${WEEKDAYS[date.getDay()]} ${date.getDate()}.`}
                  >
                    <span>{WEEKDAYS[date.getDay()]}</span>
                    <span className="day-box__num">{date.getDate()}</span>
                  </button>
                )
              })}
            </div>

            {openDay?.driverId === driver.id && (
              <p className="driver-card__detail">
                {describeDay(index.get(`${driver.id}|${openDay.day}`) ?? [])}
              </p>
            )}
          </div>
        ))
      )}
    </AdminPage>
  )
}

export default AdminHomePage
