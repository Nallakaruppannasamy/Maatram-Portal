import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Shield, Users, HeartHandshake, FileSpreadsheet, FolderGit2, CheckSquare } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { organizationApi } from '@/api/organization.api'
import { zoneApi } from '@/api/zone.api'
import { studentApi } from '@/api/student.api'
import { volunteerApi } from '@/api/volunteer.api'
import { userApi } from '@/api/user.api'

export const SuperAdminDashboardPage = () => {
  const { data: orgsRes, isLoading: isOrgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.list(),
  })

  const { data: zonesRes, isLoading: isZonesLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneApi.list(),
  })

  const { data: studentsRes, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.list(),
  })

  const { data: volunteersRes, isLoading: isVolunteersLoading } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => volunteerApi.list(),
  })

  const { data: usersRes, isLoading: isUsersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.list(),
  })

  const orgs = orgsRes?.data || []
  const zones = zonesRes?.data || []
  const students = studentsRes?.data || []
  const volunteers = volunteersRes?.data || []
  const users = usersRes?.data?.items || []

  const approvedLogs = volunteers.filter(
    (v) => v.status === 'approved' || v.status === 'APPROVED'
  )
  const totalApprovedHours = approvedLogs.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0)

  if (isOrgsLoading || isZonesLoading || isStudentsLoading || isVolunteersLoading || isUsersLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">Super Admin Executive Dashboard</h2>
          <p className="text-xs text-[#45464c]">Organization-wide analytics and governance.</p>
        </div>
        <CardSkeleton count={4} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Super Admin Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="gold">Executive System Portal</Badge>
            <span className="text-xs text-[#76777d]">Global Foundation Governance</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight mt-1">Super Admin Executive Dashboard</h2>
          <p className="text-xs text-[#45464c]">Organization-wide analytics, bulk student provisioning, hierarchy setup, and audit logging.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/admin/provisioning">
            <Button variant="gold" size="md" icon={<FileSpreadsheet className="w-4 h-4" />}>
              Excel Student Import
            </Button>
          </Link>
          <Link to="/admin/team">
            <Button variant="outline" size="md" icon={<Shield className="w-4 h-4" />}>
              Manage Admin Team
            </Button>
          </Link>
        </div>
      </div>

      {/* Global Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Total Enrolled Students</span>
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
              <Users className="w-5 h-5 text-[#D4AF37]" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#111827] mt-3">
            {students.length} <span className="text-xs font-normal text-[#76777d]">students</span>
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">Active Scholar Roster</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Total Verified Hours</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#D4AF37] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#111827] mt-3">
            {totalApprovedHours} <span className="text-xs font-normal text-[#76777d]">hrs</span>
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">Across {zones.length} foundation zones</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Active Zones</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#111827] mt-3">
            {zones.length} <span className="text-xs font-normal text-[#76777d]">zones</span>
          </p>
          <p className="text-xs text-[#76777d] mt-2">{orgs.length} Organizations</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">System Staff Users</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#111827] mt-3">
            {users.length} <span className="text-xs font-normal text-[#76777d]">users</span>
          </p>
          <p className="text-xs text-[#76777d] mt-2">System Administrators & Incharges</p>
        </Card>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hoverable className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111827]">Bulk Excel Enrollment</h3>
            <FileSpreadsheet className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <p className="text-xs text-[#45464c]">Upload student rosters, validate duplicate register numbers, and generate auto temporary passwords.</p>
          <Link to="/admin/provisioning" className="inline-flex items-center text-xs font-bold text-[#111827] hover:text-[#D4AF37] pt-2">
            Open Provisioning Tool →
          </Link>
        </Card>

        <Card hoverable className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111827]">Organization Hierarchy</h3>
            <FolderGit2 className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <p className="text-xs text-[#45464c]">Configure the organization hierarchy tree from Organizations down to Zones and Students.</p>
          <Link to="/admin/hierarchy" className="inline-flex items-center text-xs font-bold text-[#111827] hover:text-[#D4AF37] pt-2">
            Manage Hierarchy Tree →
          </Link>
        </Card>

        <Card hoverable className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#111827]">Audit Logs & Compliance</h3>
            <CheckSquare className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <p className="text-xs text-[#45464c]">Inspect system-wide change logs capturing actor ID, timestamp, IP address, and updated fields.</p>
          <Link to="/admin/audit-logs" className="inline-flex items-center text-xs font-bold text-[#111827] hover:text-[#D4AF37] pt-2">
            View System Audit Logs →
          </Link>
        </Card>
      </div>
    </div>
  )
}

export default SuperAdminDashboardPage
