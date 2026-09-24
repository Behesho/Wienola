import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import AuthLoading from './AuthLoading'

/**
 * For /login and /register: signed-in users are sent straight to their
 * dashboard. /dashboard itself resolves by profile role (customer vs.
 * dienstleister), so one redirect target lands each role in the right place.
 */
function PublicOnlyRoute({ children }: { children?: ReactNode }) {
  const { session, loading } = useAuth()

  if (loading) {
    return <AuthLoading />
  }

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children ?? <Outlet />}</>
}

export default PublicOnlyRoute
