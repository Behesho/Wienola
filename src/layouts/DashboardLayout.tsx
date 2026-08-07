import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav/BottomNav'
import './DashboardLayout.css'

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <main className="dashboard-layout__content">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

export default DashboardLayout
