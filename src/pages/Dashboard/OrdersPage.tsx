import './OrdersPage.css'

function OrdersPage() {
  return (
    <div className="orders-page">
      <h1 className="orders-page__title">Aufträge</h1>

      <div className="orders-page__empty">
        <p>Noch keine Aufträge vorhanden.</p>
      </div>
    </div>
  )
}

export default OrdersPage
