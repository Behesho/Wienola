import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useNotifications } from '../../context/useNotifications'
import { BellIcon } from '../icons/NavIcons'
import '../NewOrderNotification/NewOrderNotification.css'
import './NotificationToast.css'

/** Banner for a notification that just arrived while the app is open. */
function NotificationToast() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { toast, dismissToast } = useNotifications()

  if (!toast) return null

  function handleView() {
    dismissToast()
    navigate(role === 'dienstleister' ? '/dashboard/my-jobs' : '/dashboard/notifications')
  }

  return (
    <div className="new-order-notification" role="status">
      <BellIcon className="new-order-notification__icon" />
      <span className="new-order-notification__text">
        {toast.title}
        {toast.body && (
          <span className="notification-toast__body">{toast.body}</span>
        )}
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
        onClick={dismissToast}
        aria-label="Benachrichtigung schließen"
      >
        ×
      </button>
    </div>
  )
}

export default NotificationToast
