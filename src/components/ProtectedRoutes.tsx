// src/components/ProtectedRoute.tsx
import { Navigate, useLocation } from 'react-router-dom'
import  useAuthStore  from '../store/useAuthStore'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}