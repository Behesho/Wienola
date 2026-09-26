import { getOrderPrice } from '../../lib/pricing'
import { formatAmount, type OrderWithCustomer } from '../../types/order'
import './BilanzCard.css'

/**
 * Summary card for a driver: number of completed jobs, revenue (Umsatz) and
 * how many were cancelled (shown in red).
 */
function BilanzCard({
  title = 'Bilanz',
  orders,
}: {
  title?: string
  orders: OrderWithCustomer[]
}) {
  const completed = orders.filter((order) => order.status === 'completed')
  const cancelledCount = orders.filter((order) => order.status === 'cancelled').length
  const revenue = completed.reduce(
    (sum, order) => sum + (getOrderPrice(order) ?? 0),
    0,
  )

  return (
    <section className="bilanz-card" aria-label={title}>
      <h2 className="bilanz-card__title">{title}</h2>
      <div className="bilanz-card__grid">
        <div className="bilanz-card__item">
          <span className="bilanz-card__value">{completed.length}</span>
          <span className="bilanz-card__label">Aufträge</span>
        </div>
        <div className="bilanz-card__item">
          <span className="bilanz-card__value bilanz-card__value--brand">
            {formatAmount(revenue)}
          </span>
          <span className="bilanz-card__label">Umsatz</span>
        </div>
      </div>
      {cancelledCount > 0 && (
        <p className="bilanz-card__cancelled">
          {cancelledCount === 1
            ? '1 Auftrag storniert'
            : `${cancelledCount} Aufträge storniert`}
        </p>
      )}
    </section>
  )
}

export default BilanzCard
