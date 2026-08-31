import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ErrorBoundary } from './ErrorBoundary'
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
    <div className="h-screen w-full bg-[#FCF8FA] flex overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      {/* Sidebar Navigation */}
      <div className="no-print print:hidden">
        <Sidebar
          activeRole={activeRole}
          user={
            user
              ? {
                  name: user.fullName || user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email),
                  regNumber: user.regNumber || user.registrationNumber || user.rollNumber,
                  avatarUrl:
                    (user as any)?.avatarUrl ||
                    user?.profilePhotoUrl ||
                    (user as any)?.profileImage ||
                    (user as any)?.profile?.profileImage ||
                    (user as any)?.userProfile?.profileImage ||
                    (user as any)?.student?.profileImage,
                }
              : undefined
          }
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden print:h-auto print:overflow-visible print:w-full">
        {/* Sticky Top Header */}
        <div className="no-print print:hidden">
          <Header activeRole={activeRole} user={user} onLogout={handleLogout} onRoleChange={handleRoleChange} />
        </div>

        {/* Scrollable Viewport */}
        <main
          id="main-content"
          className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto focus:outline-none print:p-0 print:m-0 print:overflow-visible print:max-w-none print:w-full"
          tabIndex={-1}
        >
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

export default AppLayout