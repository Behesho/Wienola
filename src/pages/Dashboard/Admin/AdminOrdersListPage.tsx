import { useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import AdminOrderCard from './AdminOrderCard'
import { AdminPage, Chips, type ChipOption } from './AdminShell'
import { isRunning, useAdminData } from './useAdminData'

type Filter = 'new' | 'running' | 'mine' | 'rejected'

/** "Aufträge" tab: new orders waiting, running ones, the admin's own. */
function AdminOrdersListPage() {
  const { user } = useAuth()
  const adminId = user?.id ?? ''
  const { data, loading, failed, refresh } = useAdminData(adminId)
  const [filter, setFilter] = useState<Filter>('new')

  const orders = data?.orders ?? []
  const rejected = data?.rejected ?? new Set<string>()

  const lists: Record<Filter, typeof orders> = {
    new: orders.filter((order) => order.status === 'open' && !rejected.has(order.id)),
    running: orders.filter(isRunning),
    mine: orders.filter((order) => order.driver_id === adminId),
    rejected: orders.filter((order) => rejected.has(order.id)),
  }

  const options: ChipOption<Filter>[] = [
    { key: 'new', label: 'Neu', count: lists.new.length, alert: true },
    { key: 'running', label: 'Läuft', count: lists.running.length },
    { key: 'mine', label: 'Meine Jobs', count: lists.mine.length },
    { key: 'rejected', label: 'Abgelehnt', count: lists.rejected.length },
  ]

  return (
    <AdminPage title="Aufträge" onRefresh={refresh} failed={failed}>
      <Chips options={options} value={filter} onChange={setFilter} />

      {loading && !data ? (
        <p className="admin-empty">Lädt…</p>
      ) : lists[filter].length === 0 ? (
        <p className="admin-empty">Keine Aufträge in dieser Ansicht.</p>
      ) : (
        lists[filter].map((order) => (
          <AdminOrderCard
            key={order.id}
            order={order}
            adminId={adminId}
            drivers={data?.drivers ?? []}
            onChanged={refresh}
          />
        ))
      )}
    </AdminPage>
  )
}

export default AdminOrdersListPage
