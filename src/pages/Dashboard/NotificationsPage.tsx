import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon } from '../../components/icons/NavIcons'
import { useNotifications } from '../../context/useNotifications'
import './NotificationsPage.css'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('de-AT', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function NotificationsPage() {
  const { notifications, markAllRead } = useNotifications()
  // Which entries were unread when the page opened — they stay highlighted
  // even though everything is marked read a moment later.
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())
  const snapshotTaken = useRef(false)

  useEffect(() => {
    if (snapshotTaken.current || notifications.length === 0) return
    snapshotTaken.current = true
    setHighlighted(
      new Set(notifications.filter((item) => !item.read_at).map((item) => item.id)),
    )
    const timer = window.setTimeout(() => {
      void markAllRead()
    }, 1200)
    return () => window.clearTimeout(timer)
  }, [notifications, markAllRead])

  return (
    <div className="notifications-page">
      <h1 className="notifications-page__title">Mitteilungen</h1>

      {notifications.length === 0 ? (
        <div className="notifications-page__empty">
          <BellIcon className="notifications-page__empty-icon" />
          <p>Keine Mitteilungen.</p>
        </div>
      ) : (
        <ul className="notifications-page__list">
          {notifications.map((item) => (
            <li key={item.id}>
              <Link
                to="/dashboard/orders"
                className={`notification-item${
                  highlighted.has(item.id) || !item.read_at
                    ? ' notification-item--unread'
                    : ''
                }${item.type === 'cancelled' ? ' notification-item--cancelled' : ''}`}
              >
                <div className="notification-item__top">
                  <span className="notification-item__title">{item.title}</span>
                  <span className="notification-item__time">
                    {formatWhen(item.created_at)}
                  </span>
                </div>
                {item.body && (
                  <p className="notification-item__body">{item.body}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default NotificationsPage
