import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from '../components/BottomNav/BottomNav'
import RoleBadge from '../components/RoleBadge/RoleBadge'
import NewOrderNotification from '../components/NewOrderNotification/NewOrderNotification'
import NotificationToast from '../components/NotificationToast/NotificationToast'
import NudgeAlert from '../components/NudgeAlert/NudgeAlert'
import PullIndicator from '../components/PullIndicator/PullIndicator'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import { FeedbackProvider } from '../context/FeedbackProvider'
import { NotificationsProvider } from '../context/NotificationsProvider'
import './DashboardLayout.css'

function DashboardLayout() {
  const { pathname } = useLocation()

  // Pull down from the top to reload the app. Not while filling in an order,
  // and pages with their own refresh (the admin pages) take precedence.
  usePullToRefresh(() => {
    if (!pathname.endsWith('/new-order')) window.location.reload()
  })

  return (
    <FeedbackProvider>
    <NotificationsProvider>
      <div className="dashboard-layout">
        <NewOrderNotification />
        <NotificationToast />
        <NudgeAlert />
        <PullIndicator />
        <main className="dashboard-layout__content">
          {/* The Profil page shows the role in its own header. */}
          {pathname !== '/dashboard/profile' && (
            <div className="dashboard-layout__role">
              <RoleBadge />
            </div>
          )}
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </NotificationsProvider>
    </FeedbackProvider>
  )
}

export default DashboardLayout
