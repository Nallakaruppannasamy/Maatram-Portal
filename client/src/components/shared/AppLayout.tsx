import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar, UserRole } from './Sidebar'
import { Header } from './Header'

export const AppLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()

  // Derive active role dynamically based on current URL route
  const activeRole: UserRole = React.useMemo(() => {
    if (location.pathname.startsWith('/admin')) return 'admin'
    if (location.pathname.startsWith('/zone')) return 'zone'
    return 'student'
  }, [location.pathname])

  // Handle role switching by navigating to the corresponding portal space
  const handleRoleChange = (newRole: UserRole) => {
    const routeMap: Record<UserRole, string> = {
      admin: '/admin/dashboard',
      zone: '/zone/dashboard',
      student: '/student/dashboard',
    }
    navigate(routeMap[newRole] || `/${newRole}`)
  }

  return (
    <div className="h-screen w-full bg-[#FCF8FA] flex overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar activeRole={activeRole} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Sticky Top Header */}
        <Header activeRole={activeRole} onRoleChange={handleRoleChange} />

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