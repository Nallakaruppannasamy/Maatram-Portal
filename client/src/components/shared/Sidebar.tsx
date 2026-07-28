import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  User,
  HeartHandshake,
  FileCheck2,
  FileText,
  BarChart3,
  Users,
  Building2,
  ShieldCheck,
  Bell,
  CheckSquare,
  History,
  FileSpreadsheet,
  Settings,
  LogOut,
  FolderGit2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'

export type UserRole = 'student' | 'zone' | 'admin'

interface SidebarProps {
  activeRole: UserRole
}

export const Sidebar = ({ activeRole }: SidebarProps) => {
  const location = useLocation()

  const studentNav = [
    { title: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { title: 'My Profile', path: '/student/profile', icon: User },
    { title: 'Log Volunteer Work', path: '/student/volunteer-submit', icon: HeartHandshake },
    { title: 'Volunteer History', path: '/student/volunteer-history', icon: History },
    { title: 'Resume Builder', path: '/student/resume', icon: FileText, badge: 'QR Verified' },
  ]

  const zoneNav = [
    { title: 'Zone Dashboard', path: '/zone/dashboard', icon: LayoutDashboard },
    { title: 'Pending Approvals', path: '/zone/approvals', icon: FileCheck2, badge: '5 Pending' },
    { title: 'Zone Students', path: '/zone/students', icon: Users },
    { title: 'Assigned Colleges', path: '/zone/colleges', icon: Building2 },
    { title: 'Zone Analytics', path: '/zone/analytics', icon: BarChart3 },
    { title: 'Zone Profile', path: '/zone/profile', icon: User },
  ]

  const adminNav = [
    { title: 'Global Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Excel Provisioning', path: '/admin/provisioning', icon: FileSpreadsheet, badge: 'Import' },
    { title: 'Student Directory', path: '/admin/students', icon: Users },
    { title: 'Organization Hierarchy', path: '/admin/hierarchy', icon: FolderGit2 },
    { title: 'Team Management', path: '/admin/team', icon: ShieldCheck },
    { title: 'Global Analytics', path: '/admin/analytics', icon: BarChart3 },
    { title: 'Audit Logs', path: '/admin/audit-logs', icon: CheckSquare },
  ]

  const commonNav = [
    { title: 'Notifications', path: '/notifications', icon: Bell, badge: '3' },
    { title: 'Export Reports', path: '/reports', icon: FileText },
  ]

  const currentNav = activeRole === 'student' ? studentNav : activeRole === 'zone' ? zoneNav : adminNav

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col h-screen sticky top-0 shrink-0 z-30 select-none">
      {/* Brand Logo & Title */}
      <div className="p-6 border-b border-[#E5E7EB] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center text-white font-bold text-lg shadow-sm border border-slate-700">
          <span className="text-[#D4AF37]">M</span>
        </div>
        <div>
          <h1 className="font-bold text-[#111827] text-base leading-tight tracking-tight">MAATRAM</h1>
          <p className="text-[11px] font-medium text-[#45464c] uppercase tracking-wider">Volunteering Portal</p>
        </div>
      </div>

      {/* Role Badge Header */}
      <div className="px-6 py-3 bg-[#FCF8FA] border-b border-[#E5E7EB] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Workspace</span>
        <Badge variant={activeRole === 'admin' ? 'gold' : activeRole === 'zone' ? 'info' : 'neutral'} size="sm">
          {activeRole === 'admin' ? 'Super Admin' : activeRole === 'zone' ? 'Zone Incharge' : 'Student'}
        </Badge>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-semibold text-[#76777d] uppercase tracking-widest mb-2">Main Menu</p>
          {currentNav.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-[#111827] text-white shadow-sm font-semibold'
                      : 'text-[#45464c] hover:bg-[#F0EDEE] hover:text-[#111827]'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-[#D4AF37]' : 'text-[#76777d]')} />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <Badge variant={isActive ? 'gold' : 'neutral'} size="sm">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            )
          })}
        </div>

        {/* System & Tools */}
        <div className="space-y-1 pt-4 border-t border-[#E5E7EB]">
          <p className="px-3 text-[10px] font-semibold text-[#76777d] uppercase tracking-widest mb-2">System & Reports</p>
          {commonNav.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-[#111827] text-white shadow-sm font-semibold'
                      : 'text-[#45464c] hover:bg-[#F0EDEE] hover:text-[#111827]'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn('w-4 h-4', isActive ? 'text-[#D4AF37]' : 'text-[#76777d]')} />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <Badge variant={isActive ? 'gold' : 'pending'} size="sm">
                    {item.badge}
                  </Badge>
                )}
              </NavLink>
            )
          })}
        </div>
      </div>

      {/* Public Landing Link & Footer */}
      <div className="p-4 border-t border-[#E5E7EB] bg-[#FCF8FA] space-y-2">
        <NavLink
          to="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#45464c] hover:text-[#111827] hover:bg-white border border-transparent hover:border-[#E5E7EB] transition-all"
        >
          <LogOut className="w-4 h-4 text-[#76777d]" />
          <span>Exit to Public Landing</span>
        </NavLink>
      </div>
    </aside>
  )
}
