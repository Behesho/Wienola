import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import { advanceOrderStatus, fetchMyJobs } from '../../../lib/orders'
import TodayBilanz from '../../../components/BilanzCard/TodayBilanz'
import JobCard from '../../../components/JobCard/JobCard'
import { STATUS_ADVANCE, type OrderWithCustomer } from '../../../types/order'
import './MyJobsPage.css'

function MyJobsPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<OrderWithCustomer[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(() => {
    if (!user) return
    fetchMyJobs(user.id).then(({ data, error }) => {
      if (error) {
        console.error('Failed to load my jobs:', error.message)
      } else {
        setOrders(data ?? [])
      }
      setLoading(false)
    })
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  async function handleAdvance(order: OrderWithCustomer) {
    if (!user) return
    const advance = STATUS_ADVANCE[order.status]
    if (!advance) return

    const { error } = await advanceOrderStatus(order.id, user.id, advance.next)
    if (error) {
      console.error('Failed to update job status:', error.message)
      return
    }

    if (advance.next === 'completed') {
      setOrders((prev) => prev.filter((item) => item.id !== order.id))
    } else {
      setOrders((prev) =>
        prev.map((item) =>
          item.id === order.id ? { ...item, status: advance.next } : item,
        ),
      )
    }
  }

  return (
    <div className="my-jobs-page">
      <h1 className="my-jobs-page__title">Meine Aufträge</h1>

      {loading ? (
        <p className="my-jobs-page__empty">Lädt…</p>
      ) : orders.length === 0 ? (
        <p className="my-jobs-page__empty">Keine aktiven Aufträge.</p>
      ) : (
        orders.map((order) => {
          const advance = STATUS_ADVANCE[order.status]
          return (
            <JobCard
              key={order.id}
              order={order}
              actionLabel={advance?.label}
              onAction={advance ? () => handleAdvance(order) : undefined}
            />
          )
        })
      )}

      <TodayBilanz />
    </div>
  )
}

export default MyJobsPage
