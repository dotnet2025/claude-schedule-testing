import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Alert } from '@mui/material'
import { useAuth } from '../app/AuthContext'
import { Loading } from '../components/StateViews'
import type { Role } from '../types'

export default function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <Loading label="Checking session…" />
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (roles && !roles.includes(user.role)) return <Alert severity="error" sx={{ m: 3 }}>403 – You do not have permission to view this page.</Alert>
  return <Outlet />
}
