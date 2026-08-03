import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { UserRole, ROLES } from '@/constants/roles'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallbackPath?: string
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallbackPath,
}) => {
  const { user } = useAuth()

  if (!user || !user.role) {
    return <Navigate to="/login" replace />
  }

  let currentRole: UserRole = ROLES.STUDENT
  if (user.role === 'admin' || (user.role as string) === 'super_admin') {
    currentRole = ROLES.ADMIN
  } else if (user.role === 'zone' || (user.role as string) === 'zone_incharge') {
    currentRole = ROLES.ZONE
  }

  if (!allowedRoles.includes(currentRole)) {
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />
    }
    const defaultRedirect: Record<UserRole, string> = {
      admin: '/admin/dashboard',
      zone: '/zone/dashboard',
      student: '/student/dashboard',
    }
    return <Navigate to={defaultRedirect[currentRole] || '/student/dashboard'} replace />
  }

  return <>{children}</>
}

export default RoleGuard
