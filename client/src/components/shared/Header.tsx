import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  Shield,
  UserCheck,
  GraduationCap,
  ChevronDown,
  Settings,
  Sparkles,
} from 'lucide-react'
import { UserRole } from '@/constants/roles'
import { AuthUser } from '@/types/api'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { getMediaUrl } from '@/utils/media'

interface HeaderProps {
  activeRole: UserRole
  user?: AuthUser | null
  unreadCount?: number
  onLogout?: () => void
  onRoleChange?: (newRole: UserRole) => void
}

export const Header: React.FC<HeaderProps> = ({
  activeRole,
  user,
  unreadCount = 0,
  onLogout,
}) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Map backend role to UI display metadata
  const getRoleConfig = () => {
    switch (activeRole) {
      case 'admin':
        return {
          label: 'Super Admin',
          badgeVariant: 'gold' as const,
          defaultTitle: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.fullName || 'Super Administrator' : 'Super Administrator',
          subtitle: 'Maatram Executive Team',
          icon: Shield,
          profileLink: '/admin/profile',
        }
      case 'zone':
        return {
          label: 'Zone Incharge',
          badgeVariant: 'info' as const,
          defaultTitle: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Zone Incharge' : 'Zone Incharge',
          subtitle: user?.zoneName ? `${user.zoneName} Zone` : 'Zone Coordinator',
          icon: UserCheck,
          profileLink: '/zone/profile',
        }
      case 'student':
      default:
        return {
          label: 'Student',
          badgeVariant: 'neutral' as const,
          defaultTitle: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student Scholar' : 'Student Scholar',
          subtitle: user?.rollNumber ? `Reg: ${user.rollNumber}` : 'Maatram Scholar',
          icon: GraduationCap,
          profileLink: '/student/profile',
        }
    }
  }

  const roleConfig = getRoleConfig()
  const RoleIcon = roleConfig.icon

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (activeRole === 'admin') {
        navigate(`/admin/students?search=${encodeURIComponent(searchQuery.trim())}`)
      } else if (activeRole === 'zone') {
        navigate(`/zone/students?search=${encodeURIComponent(searchQuery.trim())}`)
      } else {
        navigate(`/student/volunteer-history?search=${encodeURIComponent(searchQuery.trim())}`)
      }
    }
  }

  const handleLogoutClick = () => {
    setIsProfileMenuOpen(false)
    if (onLogout) {
      onLogout()
    } else {
      // Fallback redirect if handler not passed
      navigate('/login')
    }
  }

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-[#E5E7EB] px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 transition-all">
      {/* Global Search Bar */}
      <div className="relative w-64 md:w-80 group">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#76777d] group-focus-within:text-[#D4AF37] transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search students, reg no, zones..."
          aria-label="Global Search"
          className="w-full bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-1.5 text-xs text-[#111827] placeholder-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all"
        />
        <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 pointer-events-none">
          ↵
        </kbd>
      </div>

      {/* Right Controls & Profile */}
      <div className="flex items-center gap-4 lg:gap-6">
        {/* Workspace Active Role Badge */}
        <Badge
          variant={roleConfig.badgeVariant}
          size="sm"
          className="hidden sm:inline-flex shadow-2xs"
        >
          <Sparkles className="w-3 h-3 text-[#D4AF37]" />
          {roleConfig.label}
        </Badge>

        {/* Notifications Button (Hidden for Super Admin) */}
        {activeRole !== 'admin' && (
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative p-2 text-[#45464c] hover:text-[#111827] hover:bg-[#FCF8FA] rounded-xl border border-transparent hover:border-[#E5E7EB] transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-4 px-1 bg-[#D4AF37] text-[#111827] text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        )}

        {/* User Profile Dropdown */}
        <div className="relative border-l border-[#E5E7EB] pl-4" ref={menuRef}>
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-[#FCF8FA] transition-all focus:outline-none group"
            aria-expanded={isProfileMenuOpen}
            aria-haspopup="true"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FCF8FA] border border-[#E5E7EB] flex items-center justify-center text-[#111827] font-semibold text-sm overflow-hidden shadow-2xs group-hover:border-[#D4AF37]/50 transition-colors">
              {user?.profilePhotoUrl || (user as any)?.avatarUrl || (user as any)?.profileImage || (user as any)?.profile?.profileImage || (user as any)?.userProfile?.profileImage || (user as any)?.student?.profileImage ? (
                <img
                  src={getMediaUrl(
                    user?.profilePhotoUrl ||
                      (user as any)?.avatarUrl ||
                      (user as any)?.profileImage ||
                      (user as any)?.profile?.profileImage ||
                      (user as any)?.userProfile?.profileImage ||
                      (user as any)?.student?.profileImage
                  )}
                  alt={roleConfig.defaultTitle}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ) : (
                <RoleIcon className="w-4.5 h-4.5 text-[#D4AF37]" />
              )}
            </div>

            <div className="hidden md:block text-left">
              <h4 className="text-xs font-bold text-[#111827] leading-tight truncate max-w-[140px]">
                {roleConfig.defaultTitle}
              </h4>
              <p className="text-[10px] text-[#76777d] truncate max-w-[140px]">
                {roleConfig.subtitle}
              </p>
            </div>

            <ChevronDown
              className={cn(
                'w-4 h-4 text-[#76777d] transition-transform duration-200 hidden md:block',
                isProfileMenuOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-[#E5E7EB] py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 border-b border-[#E5E7EB] bg-[#FCF8FA]/60">
                <p className="text-xs font-bold text-[#111827]">{roleConfig.defaultTitle}</p>
                <p className="text-[11px] text-[#76777d] truncate mt-0.5">{user?.email || 'scholar@maatram.org'}</p>
              </div>

              <div className="py-1">
                <Link
                  to={roleConfig.profileLink}
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#45464c] hover:text-[#111827] hover:bg-[#FCF8FA] transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-[#76777d]" />
                  <span>My Profile</span>
                </Link>

                {activeRole !== 'admin' && (
                  <Link
                    to="/notifications"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#45464c] hover:text-[#111827] hover:bg-[#FCF8FA] transition-colors"
                  >
                    <Bell className="w-4 h-4 text-[#76777d]" />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-[#D4AF37]/20 text-[#745c00] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                )}
              </div>

              <div className="pt-1 border-t border-[#E5E7EB]">
                <button
                  onClick={handleLogoutClick}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header