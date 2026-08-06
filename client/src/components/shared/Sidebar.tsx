import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
  LogOut,
  FolderGit2,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { assets } from '@/assets'
import { UserRole } from '@/constants/roles'
import { volunteerApi } from '@/api/volunteer.api'
import { getMediaUrl } from '@/utils/media'

export type { UserRole }

interface UserProfile {
  name?: string
  regNumber?: string
  avatarUrl?: string
  profileImage?: string
}

interface NavItem {
  title: string
  path: string
  icon: LucideIcon
  badge?: string
}

interface SidebarProps {
  activeRole: UserRole
  user?: UserProfile
  onLogout?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ activeRole, user, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Fetch live pending volunteer approvals count for Zone role
  const { data: pendingVolunteersRes } = useQuery({
    queryKey: ['volunteers', 'pending-count'],
    queryFn: () => volunteerApi.list({ status: 'pending' }),
    enabled: activeRole === 'zone',
  })

  const pendingCount = pendingVolunteersRes?.data?.length || 0

  const handleLogout = () => {
    if (onLogout) {
      onLogout()
    } else {
      navigate('/login')
    }
  }

  // Navigation Items Mapping per Role (Cleaned of static/hardcoded badges)
  const studentNav: NavItem[] = [
    { title: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { title: 'My Profile', path: '/student/profile', icon: User },
    { title: 'Log Volunteer Work', path: '/student/volunteer-submit', icon: HeartHandshake },
    { title: 'Volunteer History', path: '/student/volunteer-history', icon: History },
    { title: 'Resume Builder', path: '/student/resume', icon: FileText },
  ]

  const zoneNav: NavItem[] = [
    { title: 'Zone Dashboard', path: '/zone/dashboard', icon: LayoutDashboard },
    {
      title: 'Pending Approvals',
      path: '/zone/approvals',
      icon: FileCheck2,
      badge: pendingCount > 0 ? `${pendingCount} Pending` : undefined,
    },
    { title: 'Zone Students', path: '/zone/students', icon: Users },
    { title: 'Assigned Colleges', path: '/zone/colleges', icon: Building2 },
    { title: 'Zone Analytics', path: '/zone/analytics', icon: BarChart3 },
    { title: 'Zone Profile', path: '/zone/profile', icon: User },
  ]

  const adminNav: NavItem[] = [
    { title: 'Global Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Excel Provisioning', path: '/admin/provisioning', icon: FileSpreadsheet },
    { title: 'Student Directory', path: '/admin/students', icon: Users },
    { title: 'Organization Hierarchy', path: '/admin/hierarchy', icon: FolderGit2 },
    { title: 'Zone Management', path: '/admin/zones', icon: Building2 },
    { title: 'Team Management', path: '/admin/team', icon: ShieldCheck },
    { title: 'Global Analytics', path: '/admin/analytics', icon: BarChart3 },
    { title: 'Audit Logs', path: '/admin/audit-logs', icon: CheckSquare },
  ]

  const commonNav: NavItem[] = [
    { title: 'Notifications', path: '/notifications', icon: Bell },
  ]

  const currentNav = activeRole === 'student' ? studentNav : activeRole === 'zone' ? zoneNav : adminNav

  return (
    <aside
      className={cn(
        'h-screen bg-white border-r border-[#E5E7EB] flex flex-col sticky top-0 shrink-0 z-40 select-none transition-all duration-300 relative',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* COLLAPSE / EXPAND TOGGLE BUTTON */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        className="absolute -right-3 top-6 bg-white border border-[#E5E7EB] text-[#76777d] hover:text-[#111827] w-6 h-6 rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:scale-110 transition-all z-50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
      >
        {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* BRANDING SECTION */}
      <div className={cn('p-4 border-b border-[#E5E7EB] flex items-center gap-3', isCollapsed && 'justify-center')}>
        {assets?.logo ? (
          <img
            src={assets.logo}
            alt="Maatram Logo"
            className={cn('object-contain transition-all duration-300', isCollapsed ? 'h-8 w-8' : 'h-10')}
          />
        ) : (
          <div className="min-w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center text-white font-black text-lg shadow-sm border border-slate-700">
            <span className="text-[#D4AF37]">M</span>
          </div>
        )}
        {!isCollapsed && (
          <div className="flex flex-col overflow-hidden">
            <h1 className="font-extrabold text-[#111827] text-base leading-tight tracking-tight uppercase truncate">
              MAATRAM
            </h1>
            <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider truncate">
              Volunteering Portal
            </p>
          </div>
        )}
      </div>

      {/* USER PROFILE META BANNER */}
      <div
        className={cn(
          'p-3.5 border-b border-[#E5E7EB] flex items-center bg-[#FCF8FA] gap-3',
          isCollapsed && 'justify-center'
        )}
      >
        <div className="relative min-w-10 h-10 rounded-full border-2 border-[#D4AF37] bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
          {user?.avatarUrl || user?.profileImage ? (
            <img
              src={getMediaUrl(user.avatarUrl || user.profileImage)}
              alt="Avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <span className="font-bold text-[#111827] text-sm uppercase">
              {user?.name ? user.name.charAt(0) : activeRole.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden truncate flex-1">
            <p className="text-xs font-bold text-[#111827] truncate leading-tight">
              {user?.name || (activeRole === 'admin' ? 'Super Administrator' : activeRole === 'zone' ? 'Zone Coordinator' : 'Volunteer Student')}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge
                variant={activeRole === 'admin' ? 'gold' : activeRole === 'zone' ? 'info' : 'neutral'}
                size="sm"
              >
                {activeRole === 'admin' ? 'Super Admin' : activeRole === 'zone' ? 'Zone Incharge' : 'Student'}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* NAVIGATION LINKS CONTAINER */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* MAIN MENU SECTION */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-[#76777d] uppercase tracking-widest mb-2">
              Main Menu
            </p>
          )}
          {currentNav.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group cursor-pointer',
                    isActive
                      ? 'bg-[#111827] text-white shadow-sm font-semibold border-l-4 border-[#D4AF37]'
                      : 'text-[#45464c] hover:bg-[#F0EDEE] hover:text-[#111827]',
                    isCollapsed && 'justify-center px-0'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-5 h-5 shrink-0',
                      isActive ? 'text-[#D4AF37]' : 'text-[#76777d] group-hover:text-[#111827]'
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </div>

                {/* Badge Indicator */}
                {item.badge && !isCollapsed && (
                  <Badge variant={isActive ? 'gold' : 'pending'} size="sm">
                    {item.badge}
                  </Badge>
                )}

                {/* Collapsed Badge Dot Signal */}
                {item.badge && isCollapsed && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D4AF37] ring-2 ring-white" />
                )}

                {/* Collapsed Hover Floating Tooltip */}
                {isCollapsed && (
                  <div className="absolute left-20 bg-[#111827] text-white text-[11px] font-medium tracking-wide px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md z-50">
                    {item.title}
                  </div>
                )}
              </NavLink>
            )
          })}
        </div>

        {/* SYSTEM & REPORTS SECTION */}
        <div className="space-y-1 pt-4 border-t border-[#E5E7EB]">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-[#76777d] uppercase tracking-widest mb-2">
              System & Reports
            </p>
          )}
          {commonNav.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group cursor-pointer',
                    isActive
                      ? 'bg-[#111827] text-white shadow-sm font-semibold border-l-4 border-[#D4AF37]'
                      : 'text-[#45464c] hover:bg-[#F0EDEE] hover:text-[#111827]',
                    isCollapsed && 'justify-center px-0'
                  )
                }
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-5 h-5 shrink-0',
                      isActive ? 'text-[#D4AF37]' : 'text-[#76777d] group-hover:text-[#111827]'
                    )}
                  />
                  {!isCollapsed && <span className="truncate">{item.title}</span>}
                </div>

                {item.badge && !isCollapsed && (
                  <Badge variant={isActive ? 'gold' : 'pending'} size="sm">
                    {item.badge}
                  </Badge>
                )}

                {isCollapsed && (
                  <div className="absolute left-20 bg-[#111827] text-white text-[11px] font-medium tracking-wide px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md z-50">
                    {item.title}
                  </div>
                )}
              </NavLink>
            )
          })}
        </div>
      </div>

      {/* FOOTER & LOGOUT SECTION */}
      <div className="p-3 border-t border-[#E5E7EB] bg-[#FCF8FA] space-y-1.5 mt-auto">
        <button
          type="button"
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-[#45464c] hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all relative group cursor-pointer',
            isCollapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0 text-[#76777d] group-hover:text-red-600 transition-colors" />
          {!isCollapsed && <span>Logout Workspace</span>}

          {/* Collapsed Tooltip for Logout */}
          {isCollapsed && (
            <div className="absolute left-20 bg-red-600 text-white text-[11px] font-medium tracking-wide px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md z-50">
              Logout Workspace
            </div>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar