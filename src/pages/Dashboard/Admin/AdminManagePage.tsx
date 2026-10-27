import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import { usePoll } from '../../../hooks/usePoll'
import { fetchAvailability } from '../../../lib/admin'
import {
  addDays,
  countsAsAvailable,
  dayState,
  describeDay,
  hourLabel,
  indexAvailability,
  isoDay,
  WEEKDAYS,
  type AvailabilityRow,
  type DayState,
} from '../../../lib/availability'
import AdminOrderCard from './AdminOrderCard'
import { AdminPage, Chips, SqlWarning, type ChipOption } from './AdminShell'
import { isRunning, useAdminData } from './useAdminData'

type Tab = 'orders' | 'calendar'
type Filter = 'free' | 'running' | 'delivered' | 'cancelled' | 'all'

function chipText(state: DayState, rows: AvailabilityRow[]): string {
  if (state === 'yes') return '✓ ganztägig'
  if (state === 'no') return '✕ nicht da'
  if (state === 'none') return 'keine Angabe'
  return rows
    .filter((row) => row.start_hour !== null && row.end_hour !== null)
    .map(
      (row) =>
        `${hourLabel(row.start_hour!)}–${hourLabel(row.end_hour!)} ${row.available ? '✓' : '✕'}`,
    )
    .join(' · ')
}

/** "Admin" tab: all orders with filters, plus a two-week driver calendar. */
function AdminManagePage() {
  const { user } = useAuth()
  const adminId = user?.id ?? ''
  const data = useAdminData(adminId)
  const [tab, setTab] = useState<Tab>('orders')
  const [filter, setFilter] = useState<Filter>('running')

  // Two weeks starting with this week's Monday.
  const monday = (() => {
    const today = new Date()
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    return start
  })()
  const availability = usePoll(
    () => fetchAvailability(isoDay(monday), isoDay(addDays(monday, 13))),
    tab === 'calendar' ? 10000 : 60000,
  )

  const orders = data.data?.orders ?? []
  const drivers = data.data?.drivers ?? []

  const lists: Record<Filter, typeof orders> = {
    free: orders.filter((order) => order.status === 'open'),
    running: orders.filter(isRunning),
    delivered: orders.filter(
      (order) => order.status === 'delivered' || order.status === 'completed',
    ),
    cancelled: orders.filter((order) => order.status === 'cancelled'),
    all: orders,
  }

  const filterOptions: ChipOption<Filter>[] = [
    { key: 'free', label: 'Frei', count: lists.free.length },
    { key: 'running', label: 'Läuft', count: lists.running.length },
    { key: 'delivered', label: 'Zugestellt', count: lists.delivered.length },
    { key: 'cancelled', label: 'Storniert', count: lists.cancelled.length },
    { key: 'all', label: 'Alle', count: lists.all.length },
  ]

  function refresh() {
    void data.refresh()
    void availability.refresh()
  }

  const rows = availability.data?.data ?? []
  const index = indexAvailability(rows)
  const today = isoDay(new Date())

  return (
    <AdminPage title="Admin" onRefresh={refresh} failed={data.failed}>
      <div className="admin-card__actions" style={{ marginBottom: 14 }}>
        <Link to="/dashboard/new-order" className="admin-btn admin-btn--primary" style={linkStyle}>
          + Neuer Auftrag
        </Link>
        <Link to="/dashboard/admin/import" className="admin-btn" style={linkStyle}>
          Auftrag aus E-Mail
        </Link>
      </div>

      <Chips
        options={[
          { key: 'orders', label: 'Aufträge' },
          { key: 'calendar', label: 'Kalender' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'orders' && (
        <>
          <Chips options={filterOptions} value={filter} onChange={setFilter} />
          {data.loading && !data.data ? (
            <p className="admin-empty">Lädt…</p>
          ) : lists[filter].length === 0 ? (
            <p className="admin-empty">Keine Aufträge in dieser Ansicht.</p>
          ) : (
            lists[filter].map((order) => (
              <AdminOrderCard
                key={order.id}
                order={order}
                adminId={adminId}
                drivers={drivers}
                onChanged={refresh}
              />
            ))
          )}
        </>
      )}

      {tab === 'calendar' && (
        <>
          {availability.data?.missing && (
            <SqlWarning>Die Verfügbarkeits-Tabelle existiert noch nicht.</SqlWarning>
          )}
          {Array.from({ length: 14 }, (_, offset) => {
            const date = addDays(monday, offset)
            const day = isoDay(date)
            const perDriver = drivers.map((driver) => {
              const driverRows = index.get(`${driver.id}|${day}`) ?? []
              return { driver, rows: driverRows, state: dayState(driverRows) }
            })
            const available = perDriver.filter((entry) => countsAsAvailable(entry.state)).length
            return (
              <div key={day} className={`cal-day${day === today ? ' cal-day--today' : ''}`}>
                <div className="cal-day__head">
                  <span>
                    {WEEKDAYS[date.getDay()]} {date.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <span className="cal-day__count">{available} verfügbar</span>
                </div>
                {perDriver.length === 0 && (
                  <p className="driver-card__detail">Keine Fahrer.</p>
                )}
                {perDriver.map(({ driver, rows: driverRows, state }) => (
                  <div key={driver.id} className="cal-day__driver" title={describeDay(driverRows)}>
                    <span>{driver.full_name || 'Fahrer'}</span>
                    <span className={`cal-chip cal-chip--${state}`}>
                      {chipText(state, driverRows)}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </>
      )}
    </AdminPage>
  )
}

const linkStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
} as const

export default AdminManagePage
