import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar, UserRole } from './Sidebar'
import { Header } from './Header'

export const AppLayout = () => {
  const location = useLocation()
  
  // Determine default role based on current URL path
  const getInitialRole = (): UserRole => {
    if (location.pathname.startsWith('/admin')) return 'admin'
    if (location.pathname.startsWith('/zone')) return 'zone'
    return 'student'
  }

  const [activeRole, setActiveRole] = useState<UserRole>(getInitialRole())

  return (
    <div className="min-h-screen bg-[#FCF8FA] flex">
      {/* Fixed Sidebar */}
      <Sidebar activeRole={activeRole} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header activeRole={activeRole} onRoleChange={setActiveRole} />

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
