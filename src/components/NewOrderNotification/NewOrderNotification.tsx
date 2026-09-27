import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { supabase } from '../../lib/supabase'
import { fetchOpenOrderIds } from '../../lib/orders'
import { getNotificationsEnabled } from '../../lib/driverPreferences'
import { acknowledgeNewOrders, notifyNewOrder, onOrdersAcknowledged } from '../../lib/orderNotifications'
import { installAudioUnlock } from '../../lib/notificationSound'
import { BellIcon } from '../icons/NavIcons'
import './NewOrderNotification.css'

const POLL_INTERVAL_MS = 15000

function NewOrderNotification() {
  const { role } = useAuth()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)
  // null until the first check has run — that first batch of open orders is
  // already visible in "Neue Aufträge", so it must not trigger a popup.
  const seenIds = useRef<Set<string> | null>(null)

  // Realtime is the fast path; this poll is the safety net for when the
  // WebSocket connection drops silently without reconnecting — seen in
  // practice on some mobile browsers/networks (e.g. iOS Chrome) — so an
  // order can otherwise arrive with no notification at all.
  const checkForNewOrders = useCallback(async () => {
    const { data, error } = await fetchOpenOrderIds()
    if (error || !data) return

    if (seenIds.current === null) {
      seenIds.current = new Set(data.map((row) => row.id))
      return
    }

    const freshIds = data.filter((row) => !seenIds.current!.has(row.id))
    data.forEach((row) => seenIds.current!.add(row.id))

    if (freshIds.length > 0) {
      setPendingCount((count) => count + freshIds.length)
      notifyNewOrder()
    }
  }, [])

  useEffect(() => {
    if (role !== 'dienstleister') return
    if (!getNotificationsEnabled()) return

    const removeAudioUnlock = installAudioUnlock()

    void checkForNewOrders()
    const pollTimer = window.setInterval(checkForNewOrders, POLL_INTERVAL_MS)

    function handleVisibility() {
      if (document.visibilityState === 'visible') void checkForNewOrders()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    const channel = supabase
      .channel('new-open-orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: 'status=eq.open' },
        (payload) => {
          const id = (payload.new as { id: string }).id
          if (seenIds.current?.has(id)) return
          seenIds.current?.add(id)
          setPendingCount((count) => count + 1)
          notifyNewOrder()
        },
      )
      .subscribe()

    const unsubscribeAck = onOrdersAcknowledged(() => setPendingCount(0))

    return () => {
      supabase.removeChannel(channel)
      unsubscribeAck()
      removeAudioUnlock()
      window.clearInterval(pollTimer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [role, checkForNewOrders])

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
