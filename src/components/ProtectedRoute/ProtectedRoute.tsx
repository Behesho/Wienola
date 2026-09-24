import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import AuthLoading from './AuthLoading'

/**
 * Requires a signed-in user. Waits for the session/profile check to finish
 * before rendering anything (so protected content never flashes), then either
 * renders its children — or, used as a layout route, the nested routes — or
 * redirects to /login.
 *
 * This is UX only: real data protection is Supabase RLS.
 */
function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <AuthLoading />
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children ?? <Outlet />}</>
}

export default ProtectedRoute
