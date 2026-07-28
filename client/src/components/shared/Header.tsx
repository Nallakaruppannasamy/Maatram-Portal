import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bell, UserCheck, Shield, GraduationCap, ChevronDown } from 'lucide-react'
import { UserRole } from './Sidebar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'

interface HeaderProps {
  activeRole: UserRole
  onRoleChange: (role: UserRole) => void
}

export const Header = ({ activeRole, onRoleChange }: HeaderProps) => {
  const navigate = useNavigate()

  const handleRoleSelect = (role: UserRole) => {
    onRoleChange(role)
    if (role === 'student') navigate('/student/dashboard')
    else if (role === 'zone') navigate('/zone/dashboard')
    else if (role === 'admin') navigate('/admin/dashboard')
  }

  const roleLabels = {
    student: { title: 'Ananya Sharma', subtitle: 'Reg: 2024CS1092 • Zone 1', icon: GraduationCap },
    zone: { title: 'Dr. Ramesh Kumar', subtitle: 'Zone Incharge • Chennai Zone', icon: UserCheck },
    admin: { title: 'Super Administrator', subtitle: 'Maatram Executive Team', icon: Shield },
  }

  const currentProfile = roleLabels[activeRole]
  const ProfileIcon = currentProfile.icon

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Global Search Bar */}
      <div className="relative w-80">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#76777d]" />
        <input
          type="text"
          placeholder="Search students, register no, zones..."
          className="w-full bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-1.5 text-xs text-[#111827] placeholder-[#76777d] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all"
        />
      </div>

      {/* Right Controls & Role Switcher */}
      <div className="flex items-center gap-6">
        {/* Prototype Flow Switcher */}
        <div className="flex items-center gap-1.5 bg-[#F0EDEE] p-1 rounded-xl border border-[#E5E7EB]">
          <span className="text-[10px] font-bold text-[#76777d] uppercase px-2">Flow View:</span>
          <button
            onClick={() => handleRoleSelect('student')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeRole === 'student'
                ? 'bg-white text-[#111827] shadow-xs border border-[#E5E7EB]'
                : 'text-[#45464c] hover:text-[#111827]'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => handleRoleSelect('zone')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeRole === 'zone'
                ? 'bg-white text-[#111827] shadow-xs border border-[#E5E7EB]'
                : 'text-[#45464c] hover:text-[#111827]'
            }`}
          >
            Zone Incharge
          </button>
          <button
            onClick={() => handleRoleSelect('admin')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              activeRole === 'admin'
                ? 'bg-[#111827] text-white shadow-xs'
                : 'text-[#45464c] hover:text-[#111827]'
            }`}
          >
            Super Admin
          </button>
        </div>

        {/* Notifications Icon */}
        <Link
          to="/notifications"
          className="relative p-2 text-[#45464c] hover:text-[#111827] hover:bg-[#FCF8FA] rounded-xl border border-transparent hover:border-[#E5E7EB] transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#D4AF37] rounded-full ring-2 ring-white"></span>
        </Link>

        {/* Active Profile Info */}
        <div className="flex items-center gap-3 pl-4 border-l border-[#E5E7EB]">
          <div className="w-9 h-9 rounded-xl bg-[#FCF8FA] border border-[#E5E7EB] flex items-center justify-center text-[#111827] font-semibold text-sm">
            <ProfileIcon className="w-4 h-4 text-[#D4AF37]" />
          </div>
          <div className="hidden sm:block text-left">
            <h4 className="text-xs font-bold text-[#111827] leading-tight">{currentProfile.title}</h4>
            <p className="text-[10px] text-[#76777d]">{currentProfile.subtitle}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
