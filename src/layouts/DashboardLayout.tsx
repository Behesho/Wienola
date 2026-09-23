import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav/BottomNav'
import NewOrderNotification from '../components/NewOrderNotification/NewOrderNotification'
import './DashboardLayout.css'

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <NewOrderNotification />
      <main className="dashboard-layout__content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

export default DashboardLayout
