import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../app/AuthContext'
import { Loading } from '../components/StateViews'
import ErrorPage from '../components/ErrorPage'
import type { Role } from '../types'

export default function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Loading label="Checking session…" />
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (roles && !roles.includes(user.role)) return <ErrorPage code={403} title="Access denied" message="You do not have permission to view this page." home="/admin" homeLabel="Back to dashboard" />
  return <Outlet />
}
