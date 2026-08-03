import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useAuth } from '@/context/AuthContext'
import { UserRole, ROLES } from '@/constants/roles'

export const AppLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Derive active role dynamically based on current URL route or user profile
  const activeRole: UserRole = React.useMemo(() => {
    if (location.pathname.startsWith('/admin')) return ROLES.ADMIN
    if (location.pathname.startsWith('/zone')) return ROLES.ZONE
    if (user?.role === 'admin') return ROLES.ADMIN
    if (user?.role === 'zone') return ROLES.ZONE
    return ROLES.STUDENT
  }, [location.pathname, user?.role])

  // Handle role switching by navigating to the corresponding portal space
  const handleRoleChange = (newRole: UserRole) => {
    const routeMap: Record<UserRole, string> = {
      admin: '/admin/dashboard',
      zone: '/zone/dashboard',
      student: '/student/dashboard',
    }
    navigate(routeMap[newRole] || `/${newRole}`)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="h-screen w-full bg-[#FCF8FA] flex overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeRole={activeRole} user={user ? { name: user.fullName || user.name || user.email, regNumber: user.regNumber || user.registrationNumber } : undefined} onLogout={handleLogout} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sticky Top Header */}
        <Header activeRole={activeRole} user={user} onLogout={handleLogout} onRoleChange={handleRoleChange} />

        {/* Scrollable Viewport */}
        <main
          id="main-content"
          className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto focus:outline-none"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout