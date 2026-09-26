import { createContext } from 'react'
import type { AppNotification } from '../lib/notifications'

export interface NotificationsContextValue {
  notifications: AppNotification[]
  unreadCount: number
  /** The most recent notification that just arrived live, shown as a banner. */
  toast: AppNotification | null
  dismissToast: () => void
  markAllRead: () => Promise<void>
}

export const NotificationsContext =
  createContext<NotificationsContextValue | null>(null)
