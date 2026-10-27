import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import { useFeedback } from '../../../context/useFeedback'
import { usePoll } from '../../../hooks/usePoll'
import {
  fetchUsers,
  sendNudge,
  timeAgo,
  setApproved,
  setBanned,
  type AdminOrder,
  type AdminUser,
} from '../../../lib/admin'
import { formatDateTime } from '../../../lib/formatDate'
import {
  formatEuro,
  inPeriod,
  isDelivered,
  PERIOD_LABELS,
  periodRange,
  saldoShort,
  saldoText,
  settle,
  type PeriodKind,
} from '../../../lib/settlement'
import {
  formatPlace,
  STATUS_LABELS,
  TRANSPORT_TYPE_LABELS,
} from '../../../types/order'
import { AdminPage, Chips, SqlWarning, type ChipOption } from './AdminShell'
import { isRunning, useAdminData } from './useAdminData'

const DEFAULT_NUDGE = 'Bitte öffne die App – es warten Aufträge auf dich.'
const PERIODS = Object.keys(PERIOD_LABELS) as PeriodKind[]

type StatusFilter = 'all' | 'delivered' | 'cancelled' | 'running'

/** The date an order counts for in the accounting. */
const referenceDate = (order: AdminOrder) => order.completed_at ?? order.updated_at

function MiniOrder({ order, onOpen }: { order: AdminOrder; onOpen: () => void }) {
  return (
    <button type="button" className="mini-order" onClick={onOpen}>
      {TRANSPORT_TYPE_LABELS[order.transport_type]} ·{' '}
      {formatPlace(order.pickup_district, order.pickup_custom_location)} →{' '}
      {formatPlace(order.destination_district, order.destination_custom_location)}
      <br />
      <span className="admin-card__muted">
        {formatDateTime(order.scheduled_date, order.scheduled_time, order.express)} ·{' '}
        {STATUS_LABELS[order.status]}
      </span>
    </button>
  )
}

/** "Fahrer" tab: ranking, accounting per driver, accounts and messages. */
function AdminDriversPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { confirm, toast } = useFeedback()
  const adminId = user?.id ?? ''
  const data = useAdminData(adminId)
  const users = usePoll(fetchUsers, 30000)

  const [kind, setKind] = useState<PeriodKind>('month')
  const [offset, setOffset] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [nudgeText, setNudgeText] = useState('')
  const [busy, setBusy] = useState(false)

  const range = periodRange(kind, offset)
  const orders = data.data?.orders ?? []
  const userList = users.data?.data ?? []
  const userById = new Map(userList.map((entry) => [entry.id, entry]))
  const usersMissing = users.data?.missing ?? false

  const rows = (data.data?.drivers ?? []).map((driver) => {
    const mine = orders.filter((order) => order.driver_id === driver.id)
    const inRange = mine.filter((order) => inPeriod(referenceDate(order), range))
    const settlement = settle(inRange)
    return {
      driver,
      account: userById.get(driver.id),
      mine,
      inRange,
      settlement,
      cancelled: inRange.filter((order) => order.status === 'cancelled').length,
      running: mine.filter(isRunning).length,
    }
  })
  rows.sort(
    (a, b) =>
      b.settlement.delivered - a.settlement.delivered ||
      b.settlement.revenue - a.settlement.revenue,
  )

  const totals = rows.reduce(
    (sum, row) => ({
      delivered: sum.delivered + row.settlement.delivered,
      revenue: sum.revenue + row.settlement.revenue,
      share: sum.share + row.settlement.driverEarnings,
    }),
    { delivered: 0, revenue: 0, share: 0 },
  )

  const waiting: AdminUser[] = userList.filter(
    (entry) => entry.role === 'dienstleister' && !entry.is_approved && !entry.is_admin,
  )

  function refresh() {
    void data.refresh()
    void users.refresh()
  }

  function pickPeriod(next: PeriodKind) {
    setKind(next)
    setOffset(0)
  }

  async function approve(entry: AdminUser) {
    setBusy(true)
    const result = await setApproved(entry.id, true)
    setBusy(false)
    if (result.ok) {
      toast(`${entry.full_name || 'Fahrer'} ist freigeschaltet`)
      refresh()
    } else {
      toast(result.missing ? 'Dafür fehlt noch SQL.' : 'Das war nicht möglich.', 'error')
    }
  }

  async function toggleBan(entry: AdminUser) {
    const next = !entry.banned
    const ok = await confirm({
      message: next
        ? `${entry.full_name || 'Fahrer'} sperren? Er wird sofort abgemeldet.`
        : `${entry.full_name || 'Fahrer'} wieder entsperren?`,
      confirmLabel: next ? 'Ja, sperren' : 'Ja, entsperren',
      danger: next,
    })
    if (!ok) return
    setBusy(true)
    const result = await setBanned(entry.id, next)
    setBusy(false)
    if (result.ok) {
      toast(next ? 'Fahrer gesperrt' : 'Fahrer entsperrt')
      refresh()
    } else {
      toast(result.missing ? 'Dafür fehlt noch SQL.' : 'Das war nicht möglich.', 'error')
    }
  }

  async function nudge(driverId: string | null) {
    const message = nudgeText.trim() || DEFAULT_NUDGE
    setBusy(true)
    const result = await sendNudge(message, driverId)
    setBusy(false)
    if (result.ok) {
      toast(driverId ? 'Erinnerung gesendet' : 'Erinnerung an alle gesendet')
    } else {
      toast(result.missing ? 'Dafür fehlt noch SQL.' : 'Das war nicht möglich.', 'error')
    }
  }

  const periodChips: ChipOption<PeriodKind>[] = PERIODS.map((key) => ({
    key,
    label: PERIOD_LABELS[key],
  }))

  return (
    <AdminPage title="Fahrer" onRefresh={refresh} failed={data.failed}>
      {usersMissing && (
        <SqlWarning>
          Konten (Freischalten, Sperren, letzte Aktivität) brauchen die Admin-Funktionen.
        </SqlWarning>
      )}

      <Chips options={periodChips} value={kind} onChange={pickPeriod} />

      {kind !== 'all' && (
        <div className="period-nav">
          <button
            type="button"
            className="period-nav__arrow"
            aria-label="Zurück"
            onClick={() => setOffset((value) => value - 1)}
          >
            ‹
          </button>
          <span className="period-nav__label">{range.label}</span>
          <button
            type="button"
            className="period-nav__arrow"
            aria-label="Weiter"
            disabled={offset >= 0}
            onClick={() => setOffset((value) => Math.min(0, value + 1))}
          >
            ›
          </button>
        </div>
      )}

      <div className="summary-tiles">
        <div className="admin-tile">
          <span className="admin-tile__value">{totals.delivered}</span>
          <span className="admin-tile__label">Zugestellt</span>
        </div>
        <div className="admin-tile admin-tile--green">
          <span className="admin-tile__value">{formatEuro(totals.revenue)}</span>
          <span className="admin-tile__label">Umsatz (brutto)</span>
        </div>
        <div className="admin-tile">
          <span className="admin-tile__value">{formatEuro(totals.share)}</span>
          <span className="admin-tile__label">Anteil Fahrer</span>
        </div>
      </div>

      {data.loading && !data.data ? (
        <p className="admin-empty">Lädt…</p>
      ) : rows.length === 0 ? (
        <p className="admin-empty">Noch keine Fahrer.</p>
      ) : (
        rows.map((row, position) => {
          const { driver, account, settlement } = row
          const saldo = saldoShort(settlement.saldo)
          const open = openId === driver.id

          const lists: Record<StatusFilter, AdminOrder[]> = {
            all: row.inRange,
            delivered: row.inRange.filter(isDelivered),
            cancelled: row.inRange.filter((order) => order.status === 'cancelled'),
            running: row.mine.filter(isRunning),
          }
          const statusChips: ChipOption<StatusFilter>[] = [
            { key: 'all', label: 'Alle', count: lists.all.length },
            { key: 'delivered', label: 'Zugestellt', count: lists.delivered.length },
            { key: 'cancelled', label: 'Storniert', count: lists.cancelled.length },
            { key: 'running', label: 'Laufend', count: lists.running.length },
          ]

          return (
            <div key={driver.id} className="rank">
              <button
                type="button"
                className="rank__row"
                aria-expanded={open}
                onClick={() => {
                  setOpenId(open ? null : driver.id)
                  setStatusFilter('all')
                }}
              >
                <span className={`rank__pos${position === 0 && settlement.delivered > 0 ? ' rank__pos--gold' : ''}`}>
                  {position + 1}
                </span>
                <span className="rank__who">
                  <span className="rank__name">
                    {driver.full_name || 'Fahrer'}
                    {account?.banned ? ' · gesperrt' : ''}
                  </span>
                  <span className="rank__sub">
                    {settlement.delivered} zugestellt · {row.running} laufend · {row.cancelled} storniert
                  </span>
                </span>
                <span className="rank__money">
                  <span className="rank__revenue">{formatEuro(settlement.revenue)}</span>
                  <span className={`rank__saldo rank__saldo--${saldo.tone}`}>{saldo.text}</span>
                </span>
              </button>

              {open && (
                <div className="rank__body">
                  <p className="rank__meta">
                    {account?.email ? `Login: ${account.email}` : 'Login: –'}
                    {account?.last_sign_in_at
                      ? ` · zuletzt aktiv ${timeAgo(account.last_sign_in_at)}`
                      : ''}
                  </p>

                  <div className="stat-grid">
                    <div className="stat">
                      <span className="stat__value">{settlement.delivered}</span>
                      <span className="stat__label">Zugestellt</span>
                    </div>
                    <div className="stat">
                      <span className="stat__value">{row.cancelled}</span>
                      <span className="stat__label">Storniert</span>
                    </div>
                    <div className="stat">
                      <span className="stat__value">{formatEuro(settlement.revenue)}</span>
                      <span className="stat__label">Umsatz</span>
                    </div>
                    <div className="stat">
                      <span className="stat__value">{formatEuro(settlement.driverEarnings)}</span>
                      <span className="stat__label">Verdienst Fahrer</span>
                    </div>
                    <div className="stat">
                      <span className="stat__value">{row.running}</span>
                      <span className="stat__label">Laufend jetzt</span>
                    </div>
                    <div className="stat">
                      <span className="stat__value">{row.inRange.length}</span>
                      <span className="stat__label">Aufträge im Zeitraum</span>
                    </div>
                  </div>

                  <div className="settle">
                    <h3 className="settle__title">Abrechnung</h3>
                    <div className="settle__line">
                      <span>Bar kassiert · Fahrer schuldet ({settlement.cashCount} Aufträge)</span>
                      <strong>{formatEuro(settlement.owes)}</strong>
                    </div>
                    <div className="settle__line">
                      <span>Online bezahlt · Guthaben ({settlement.cardCount} Aufträge)</span>
                      <strong>{formatEuro(settlement.credit)}</strong>
                    </div>
                    <div className="settle__line settle__total">
                      <span>{saldoText(settlement.saldo)}</span>
                    </div>
                    {settlement.skipped > 0 && (
                      <p className="settle__note">
                        {settlement.skipped} Aufträge ohne Preis oder Zahlungsart sind nicht enthalten.
                      </p>
                    )}
                  </div>

                  <Chips options={statusChips} value={statusFilter} onChange={setStatusFilter} />
                  {lists[statusFilter].length === 0 ? (
                    <p className="admin-empty">Keine Aufträge.</p>
                  ) : (
                    lists[statusFilter].map((order) => (
                      <MiniOrder
                        key={order.id}
                        order={order}
                        onOpen={() => navigate(`/dashboard/jobs/${order.id}`)}
                      />
                    ))
                  )}

                  <div className="rank__buttons">
                    <button
                      type="button"
                      className="admin-btn"
                      disabled={busy}
                      onClick={() => nudge(driver.id)}
                    >
                      Erinnerung senden
                    </button>
                    {account && !account.is_admin && account.id !== adminId && (
                      <button
                        type="button"
                        className={`admin-btn${account.banned ? '' : ' admin-btn--danger'}`}
                        disabled={busy}
                        onClick={() => toggleBan(account)}
                      >
                        {account.banned ? 'Entsperren' : 'Sperren'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {waiting.length > 0 && (
        <>
          <h2 className="admin-section-title">Wartet auf Freischaltung</h2>
          {waiting.map((entry) => (
            <div key={entry.id} className="pending-row">
              <span className="pending-row__who">
                {entry.full_name || 'Neuer Fahrer'}
                <span className="pending-row__mail">{entry.email}</span>
              </span>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={busy}
                onClick={() => approve(entry)}
              >
                Freischalten
              </button>
            </div>
          ))}
        </>
      )}

      <h2 className="admin-section-title">Nachricht an alle</h2>
      <div className="nudge-box">
        <input
          className="nudge-box__input"
          type="text"
          maxLength={300}
          value={nudgeText}
          onChange={(event) => setNudgeText(event.target.value)}
          placeholder={DEFAULT_NUDGE}
        />
        <button
          type="button"
          className="admin-btn admin-btn--primary admin-btn--wide"
          disabled={busy}
          onClick={() => nudge(null)}
        >
          Erinnerung an ALLE Fahrer senden
        </button>
      </div>
    </AdminPage>
  )
}

export default AdminDriversPage
