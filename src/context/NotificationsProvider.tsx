import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'
import { playChimeOnce } from '../lib/notificationSound'
import {
  fetchNotifications,
  markAllNotificationsRead,
  type AppNotification,
} from '../lib/notifications'
import { NotificationsContext } from './notifications-context'

const TOAST_DURATION_MS = 7000

/** Loads the signed-in user's notifications and listens for new ones live. */
export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [toast, setToast] = useState<AppNotification | null>(null)
  const toastTimer = useRef<number | null>(null)

  const dismissToast = useCallback(() => {
    if (toastTimer.current !== null) {
      window.clearTimeout(toastTimer.current)
      toastTimer.current = null
    }
    setToast(null)
  }, [])

  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let active = true

    fetchNotifications().then(({ data, error }) => {
      if (!active) return
      if (error) {
        console.error('Failed to load notifications:', error.message)
      } else {
        setNotifications(data ?? [])
      }
    })

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const incoming = payload.new as AppNotification
          setNotifications((prev) => [incoming, ...prev])
          setToast(incoming)
          playChimeOnce()
          if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
          toastTimer.current = window.setTimeout(() => {
            toastTimer.current = null
            setToast(null)
          }, TOAST_DURATION_MS)
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current)
      setNotifications([])
      setToast(null)
    }
  }, [userId])

  const markAllRead = useCallback(async () => {
    if (!userId) return
    const { error } = await markAllNotificationsRead(userId)
    if (error) {
      console.error('Failed to mark notifications read:', error.message)
      return
    }
    const now = new Date().toISOString()
    setNotifications((prev) =>
      prev.map((item) => (item.read_at ? item : { ...item, read_at: now })),
    )
  }, [userId])

  const unreadCount = notifications.filter((item) => !item.read_at).length

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, toast, dismissToast, markAllRead }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}
