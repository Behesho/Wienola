import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import { getNotificationsEnabled } from '../../lib/driverPreferences'
import { acknowledgeNewOrders, notifyNewOrder, onOrdersAcknowledged } from '../../lib/orderNotifications'
import { BellIcon } from '../icons/NavIcons'
import './NewOrderNotification.css'

function NewOrderNotification() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (role !== 'dienstleister') return
    if (!getNotificationsEnabled()) return

    const channel = supabase
      .channel('new-open-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: 'status=eq.open' },
        () => {
          setPendingCount((count) => count + 1)
          notifyNewOrder()
        },
      )
      .subscribe()

    const unsubscribeAck = onOrdersAcknowledged(() => setPendingCount(0))

    return () => {
      supabase.removeChannel(channel)
      unsubscribeAck()
    }
  }, [role])

  if (role !== 'dienstleister' || pendingCount === 0) return null

  function handleView() {
    acknowledgeNewOrders()
    navigate('/dashboard')
  }

  function handleDismiss() {
    acknowledgeNewOrders()
  }

  return (
    <div className="new-order-notification" role="status">
      <BellIcon className="new-order-notification__icon" />
      <span className="new-order-notification__text">
        {pendingCount === 1
          ? '1 neuer Auftrag verfügbar'
          : `${pendingCount} neue Aufträge verfügbar`}
      </span>
      <button
        type="button"
        className="new-order-notification__view"
        onClick={handleView}
      >
        Ansehen
      </button>
      <button
        type="button"
        className="new-order-notification__dismiss"
        onClick={handleDismiss}
        aria-label="Benachrichtigung schließen"
      >
        ×
      </button>
    </div>
  )
}

export default NewOrderNotification
