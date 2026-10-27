import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from '../components/BottomNav/BottomNav'
import RoleBadge from '../components/RoleBadge/RoleBadge'
import NewOrderNotification from '../components/NewOrderNotification/NewOrderNotification'
import NotificationToast from '../components/NotificationToast/NotificationToast'
import NudgeAlert from '../components/NudgeAlert/NudgeAlert'
import { FeedbackProvider } from '../context/FeedbackProvider'
import { NotificationsProvider } from '../context/NotificationsProvider'
import './DashboardLayout.css'

function DashboardLayout() {
  const { pathname } = useLocation()

  return (
    <FeedbackProvider>
    <NotificationsProvider>
      <div className="dashboard-layout">
        <NewOrderNotification />
        <NotificationToast />
        <NudgeAlert />
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
