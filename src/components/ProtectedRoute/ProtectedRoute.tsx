import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import './ProtectedRoute.css'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="protected-route-loading">Lädt…</div>
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}

export default ProtectedRoute
