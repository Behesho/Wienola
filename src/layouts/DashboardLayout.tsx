import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from '../components/BottomNav/BottomNav'
import RoleBadge from '../components/RoleBadge/RoleBadge'
import NewOrderNotification from '../components/NewOrderNotification/NewOrderNotification'
import './DashboardLayout.css'

function DashboardLayout() {
  const { pathname } = useLocation()

  return (
    <div className="dashboard-layout">
      <NewOrderNotification />
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
  )
}

export default DashboardLayout
