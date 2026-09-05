import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Users,
  MapPin,
  GraduationCap,
  HeartHandshake,
  Star,
  ToggleLeft,
  ToggleRight,
  FileText,
  UserX,
  Loader2,
} from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { TableLoader } from '@/components/ui/TableLoader'
import { Avatar } from '@/components/ui/Avatar'
import { studentApi } from '@/api/student.api'
import { zoneApi } from '@/api/zone.api'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { notify } from '@/utils/toast'

const safeString = (val: any, fallback: string = 'N/A'): string => {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'string' || typeof val === 'number') return String(val)
  if (typeof val === 'object') {
    if (val.name) return String(val.name)
    if (val.fullName) return String(val.fullName)
    if (val.title) return String(val.title)
    if (val.code) return String(val.code)
  }
  return fallback
}

export const ZoneStudentManagementPage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [academicYearFilter, setAcademicYearFilter] = useState('All')
  const [streamFilter, setStreamFilter] = useState('All')
  const [accountStatusFilter, setAccountStatusFilter] = useState('All')
  const [spocFilter, setSpocFilter] = useState<'All' | 'SPOC Only' | 'Non-SPOC'>('All')
  const [collegeFilter, setCollegeFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [pendingSpocId, setPendingSpocId] = useState<string | null>(null)
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])

  const debouncedSearch = useDebounce(searchTerm, 400)
  const PAGE_LIMIT = 50

  // Reset page and selection when filters change
  useEffect(() => {
    setPage(1)
    setSelectedStudentIds([])
  }, [debouncedSearch, academicYearFilter, streamFilter, accountStatusFilter, spocFilter, collegeFilter])

  // Fetch Assigned Colleges strictly for authenticated Zone Incharge
  const { data: collegesRes } = useQuery({
    queryKey: ['my-assigned-colleges'],
    queryFn: () => zoneApi.getMyColleges(),
  })
  const colleges = collegesRes?.data || []

  const { data: studentsRes, isLoading } = useQuery({
    queryKey: [
      'zone-students',
      debouncedSearch,
      page,
      academicYearFilter,
      streamFilter,
      accountStatusFilter,
      spocFilter,
      collegeFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      studentApi.list({
        search: debouncedSearch,
        page,
        limit: PAGE_LIMIT,
        academicYear: academicYearFilter !== 'All' ? academicYearFilter : undefined,
        stream: streamFilter !== 'All' ? streamFilter : undefined,
        accountStatus: accountStatusFilter !== 'All' ? accountStatusFilter.toLowerCase() : undefined,
        isSpoc: spocFilter === 'All' ? undefined : spocFilter === 'SPOC Only',
        collegeId: collegeFilter !== 'All' ? collegeFilter : undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
      }),
  })

  const students = studentsRes?.data || []
  const meta = studentsRes?.meta || { total: students.length, page: 1, totalPages: 1 }

  // SPOC Mutation
  const toggleSpocMutation = useMutation({
    mutationFn: ({ id, isSpoc }: { id: string; isSpoc: boolean }) => {
      setPendingSpocId(id)
      return studentApi.updateSpoc(id, isSpoc)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['zone-students'] })
      notify.success(
        variables.isSpoc ? 'Student marked as SPOC successfully' : 'Student unmarked from SPOC'
      )
    },
    onError: (err: any) => {
      notify.error(err.response?.data?.message || 'Failed to update SPOC status')
    },
    onSettled: () => {
      setPendingSpocId(null)
    },
  })

  // Account Status Toggle Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      setPendingStatusId(id)
      return studentApi.changeStatus(id, status)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['zone-students'] })
      notify.success(
        variables.status === 'active'
          ? 'Student account activated successfully'
          : 'Student account deactivated successfully'
      )
    },
    onError: (err: any) => {
      notify.error(err.response?.data?.message || 'Failed to update account status')
    },
    onSettled: () => {
      setPendingStatusId(null)
    },
  })

  // Bulk Deactivate Mutation
  const bulkDeactivateMutation = useMutation({
    mutationFn: (ids: string[]) => studentApi.bulkDeactivate(ids),
    onSuccess: (res) => {
      notify.success(`Successfully deactivated ${res.data?.count || selectedStudentIds.length} students`)
      setSelectedStudentIds([])
      queryClient.invalidateQueries({ queryKey: ['zone-students'] })
    },
    onError: (err: any) => {
      notify.error(err.response?.data?.message || 'Failed to deactivate selected students')
    },
  })

  // Sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setPage(1)
  }

  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) return <ArrowUpDown size={12} className="ml-1 text-gray-400 inline" />
    return sortOrder === 'asc' ? (
      <ArrowUp size={12} className="ml-1 text-blue-900 inline" />
    ) : (
      <ArrowDown size={12} className="ml-1 text-blue-900 inline" />
    )
  }

  // Bulk Selection Handlers
  const handleSelectAllOnPage = () => {
    const pageIds = students.map((s) => s.id)
    const allSelected = pageIds.every((id) => selectedStudentIds.includes(id))
    if (allSelected) {
      setSelectedStudentIds((prev) => prev.filter((id) => !pageIds.includes(id)))
    } else {
      setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // Bulk Actions
  const handleBulkOpenCV = () => {
    if (selectedStudentIds.length === 0) return
    selectedStudentIds.forEach((id) => {
      window.open(`/resume/${id}`, '_blank')
    })
    notify.info(`Opened ${selectedStudentIds.length} resume tabs`)
  }

  const handleBulkDeactivate = () => {
    if (selectedStudentIds.length === 0) return
    if (
      window.confirm(
        `Are you sure you want to deactivate ${selectedStudentIds.length} selected student(s)? They will be moved to Archived Students.`
      )
    ) {
      bulkDeactivateMutation.mutate(selectedStudentIds)
    }
  }

  // Export full filtered dataset
  const handleExport = async () => {
    try {
      const blob = await studentApi.exportCSV({
        format: 'xlsx',
        search: debouncedSearch,
        academicYear: academicYearFilter !== 'All' ? academicYearFilter : undefined,
        stream: streamFilter !== 'All' ? streamFilter : undefined,
        accountStatus: accountStatusFilter !== 'All' ? accountStatusFilter.toLowerCase() : undefined,
        isSpoc: spocFilter === 'All' ? undefined : spocFilter === 'SPOC Only',
        collegeId: collegeFilter !== 'All' ? collegeFilter : undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Zone_Students_Report_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      notify.success('Zone student directory exported into Excel successfully!')
    } catch (err) {
      notify.error('Failed to export zone student directory data. Please try again.')
    }
  }

  const isPageAllSelected =
    students.length > 0 && students.every((s) => selectedStudentIds.includes(s.id))

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Zone Students Directory</h2>
          <p className="text-xs text-[#45464c]">View, filter, and manage verified student portfolios assigned to your zone.</p>
        </div>
        <Button variant="gold" size="md" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
          Export Full Dataset (Excel)
        </Button>
      </div>

      {/* Summary Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-900 font-bold">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Zone Students</p>
            <p className="text-xl font-extrabold text-[#111827]">{meta.total}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Active Scholars</p>
            <p className="text-xl font-extrabold text-[#111827]">
              {students.filter((s) => s.status === 'ACTIVE' || s.accountStatus === 'activated').length}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-[#D4AF37] font-bold">
            <HeartHandshake size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Current Page</p>
            <p className="text-xl font-extrabold text-[#111827]">
              {meta.page} / {Math.max(meta.totalPages, 1)}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Zone Status</p>
            <p className="text-sm font-bold text-[#111827] truncate max-w-[120px]">
              {(user as any)?.zone?.name || user?.zoneName || 'Assigned Zone'}
            </p>
          </div>
        </div>
      </div>

      {/* Directory Table Card */}
      <Card className="border border-[#E5E7EB] shadow-xs">
        <CardHeader className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-[#E5E7EB] bg-[#FCF8FA] px-6 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
            <Input
              placeholder="Search by student name, register number, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white border-[#E5E7EB] text-xs h-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Stream Filter */}
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-none h-9 font-medium text-gray-700"
            >
              <option value="All">All Streams</option>
              <option value="Arts & Science">Arts & Science</option>
              <option value="Engineering">Engineering</option>
              <option value="Nursing">Nursing</option>
            </select>

            {/* Account Status Filter */}
            <select
              value={accountStatusFilter}
              onChange={(e) => setAccountStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-none h-9 font-medium text-gray-700"
            >
              <option value="All">All Account Statuses</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>

            {/* College Filter */}
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-none h-9 font-medium text-gray-700 max-w-[200px] truncate"
            >
              <option value="All">All Colleges</option>
              {colleges.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* SPOC Filter */}
            <select
              value={spocFilter}
              onChange={(e) => setSpocFilter(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-none h-9 font-medium text-gray-700"
            >
              <option value="All">All SPOC Status</option>
              <option value="SPOC Only">SPOC Only</option>
              <option value="Non-SPOC">Non-SPOC</option>
            </select>

            {/* Academic Year Filter */}
            <select
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-none h-9 font-medium text-gray-700"
            >
              <option value="All">All Academic Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            {(academicYearFilter !== 'All' ||
              streamFilter !== 'All' ||
              accountStatusFilter !== 'All' ||
              spocFilter !== 'All' ||
              collegeFilter !== 'All' ||
              searchTerm ||
              sortBy) && (
              <button
                onClick={() => {
                  setAcademicYearFilter('All')
                  setStreamFilter('All')
                  setAccountStatusFilter('All')
                  setSpocFilter('All')
                  setCollegeFilter('All')
                  setSearchTerm('')
                  setSortBy('')
                  setPage(1)
                }}
                className="flex items-center gap-1 p-2 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition cursor-pointer text-xs h-9"
                title="Reset Filters"
              >
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>
        </CardHeader>

        {/* Bulk Actions Floating Bar */}
        {selectedStudentIds.length > 0 && (
          <div className="mx-6 mt-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-blue-900">
                {selectedStudentIds.length} student(s) selected
              </span>
              <button
                onClick={() => setSelectedStudentIds([])}
                className="text-xs text-blue-600 hover:underline cursor-pointer"
              >
                Deselect All
              </button>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkOpenCV}
                className="bg-white border-blue-300 text-blue-900 hover:bg-blue-100 flex items-center gap-1.5 text-xs"
              >
                <FileText size={14} /> Open CV / Resume ({selectedStudentIds.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDeactivate}
                disabled={bulkDeactivateMutation.isPending}
                className="bg-white border-rose-300 text-rose-700 hover:bg-rose-50 flex items-center gap-1.5 text-xs"
              >
                {bulkDeactivateMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UserX size={14} />
                )}
                Deactivate Selected
              </Button>
            </div>
          </div>
        )}

        <CardContent>
          {isLoading ? (
            <TableLoader rows={10} columns={14} />
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              {spocFilter === 'SPOC Only'
                ? 'No SPOC students found matching your search criteria in your assigned zone.'
                : 'No students found matching your search criteria in your assigned zone.'}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                <table className="w-full text-left text-xs text-[#111827]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#76777d] uppercase tracking-wider text-[10px] bg-gray-50">
                      <th className="py-3 px-3 text-center w-10">
                        <input
                          type="checkbox"
                          checked={isPageAllSelected}
                          onChange={handleSelectAllOnPage}
                          className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                          title="Select/Deselect all on this page"
                        />
                      </th>
                      <th className="py-3 px-3 font-bold w-12 text-center">S. No.</th>
                      <th className="py-3 px-3 font-bold w-14 text-center">Photo</th>
                      <th
                        className="py-3 px-3 font-bold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('registerNumber')}
                      >
                        Register No. {renderSortIndicator('registerNumber')}
                      </th>
                      <th
                        className="py-3 px-3 font-bold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('name')}
                      >
                        Student Name {renderSortIndicator('name')}
                      </th>
                      <th className="py-3 px-3 font-bold">Stream</th>
                      <th className="py-3 px-3 font-bold">Degree</th>
                      <th className="py-3 px-3 font-bold">Department</th>
                      <th
                        className="py-3 px-3 font-bold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('college')}
                      >
                        College {renderSortIndicator('college')}
                      </th>
                      <th className="py-3 px-3 font-bold">Zone</th>
                      <th
                        className="py-3 px-3 font-bold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('batch')}
                      >
                        Batch {renderSortIndicator('batch')}
                      </th>
                      <th
                        className="py-3 px-3 font-bold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('academicYear')}
                      >
                        Current Year {renderSortIndicator('academicYear')}
                      </th>
                      <th className="py-3 px-3 font-bold text-center">SPOC</th>
                      <th className="py-3 px-3 font-bold">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] bg-white">
                    {students.map((st, idx) => {
                      const isSelected = selectedStudentIds.includes(st.id)
                      const serialNum = (meta.page - 1) * PAGE_LIMIT + idx + 1
                      const name = safeString(st.fullName || st.user?.fullName || st.user?.email, 'Scholar Student')
                      const regNo = safeString(st.registrationNumber || st.user?.regNumber || st.id.slice(0, 8), 'UNASSIGNED')
                      const stream = safeString((st as any).stream, 'N/A')
                      const degree = safeString((st as any).degree || (st as any).program?.name || (st as any).course, 'N/A')
                      const dept = safeString((st as any).departmentName || (st as any).department?.name || (st as any).department, 'N/A')
                      const college = safeString(st.college?.name || st.collegeName, 'Assigned College')
                      const zoneLabel = safeString(st.zone?.name || (st as any).zoneName, 'Assigned Zone')
                      const batch = safeString(st.batch, '2024-2028')
                      const getYearLabel = (year?: string | number | null) => {
                        if (!year) return 'N/A'
                        const y = String(year)
                        if (y === '1') return '1st Year'
                        if (y === '2') return '2nd Year'
                        if (y === '3') return '3rd Year'
                        if (y === '4') return '4th Year'
                        return `${y}th Year`
                      }
                      const academicYearLabel = getYearLabel(st.academicYear)
                      const isUserActive = (st.user?.isActive !== false) && (st.status !== 'DEACTIVATED')
                      const isSpocActive = !!st.isSpoc
                      const isRowSpocPending = toggleSpocMutation.isPending && pendingSpocId === st.id
                      const isRowStatusPending = toggleStatusMutation.isPending && pendingStatusId === st.id

                      return (
                        <tr
                          key={st.id}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-blue-50/70'
                              : isSpocActive
                              ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-[#D4AF37]'
                              : 'hover:bg-[#FCF8FA]'
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleStudent(st.id)}
                              className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-3 font-bold text-center text-gray-400">{serialNum}</td>
                          <td className="py-3.5 px-3 text-center">
                            <Avatar
                              src={st.profileImage || (st as any).user?.profilePhotoUrl}
                              name={name}
                              size="sm"
                            />
                          </td>
                          <td className="py-3.5 px-3 text-blue-900 font-mono font-bold">
                            <a
                              href={`/resume/${st.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline hover:text-blue-950 cursor-pointer"
                              title="Click to view verified resume portfolio in new tab"
                            >
                              {regNo}
                            </a>
                          </td>
                          <td className="py-3.5 px-3 font-bold text-[#111827]">
                            <div className="flex items-center gap-2">
                              <span>{name}</span>
                              {isSpocActive && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#D4AF37]/15 text-[#996515] border border-[#D4AF37]/30">
                                  <Star size={10} className="fill-[#D4AF37] text-[#D4AF37]" /> SPOC
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-gray-700">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800">
                              {stream}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-gray-700">{degree}</td>
                          <td className="py-3.5 px-3 text-gray-700">{dept}</td>
                          <td className="py-3.5 px-3 text-[#111827] font-semibold">{college}</td>
                          <td className="py-3.5 px-3 font-medium text-gray-700">{zoneLabel}</td>
                          <td className="py-3.5 px-3 text-[#76777d] font-mono">{batch}</td>
                          <td className="py-3.5 px-3 font-semibold text-gray-700">{academicYearLabel}</td>
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                toggleSpocMutation.mutate({
                                 id: st.id,
                                 isSpoc: !isSpocActive,
                               })
                              }
                              disabled={isRowSpocPending}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
                                isSpocActive
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                              } ${isRowSpocPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={isSpocActive ? 'Click to unmark SPOC' : 'Click to mark as SPOC'}
                            >
                              {isSpocActive ? (
                                <>
                                  <ToggleRight size={16} className="text-amber-700" />
                                  <span>SPOC</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft size={16} className="text-gray-400" />
                                  <span>OFF</span>
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-3.5 px-3">
                            <button
                              type="button"
                              disabled={isRowStatusPending}
                              onClick={() =>
                                toggleStatusMutation.mutate({
                                  id: st.id,
                                  status: isUserActive ? 'deactivated' : 'active',
                                })
                              }
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                isUserActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                              } ${isRowStatusPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={isUserActive ? 'Click to deactivate account' : 'Click to activate account'}
                            >
                              {isUserActive ? (
                                <>
                                  <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Deactivated</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB] text-xs">
                  <span className="text-[#76777d]">
                    Showing page {meta.page} of {meta.totalPages} ({meta.total} total students - Max {PAGE_LIMIT} per page)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="w-4 h-4" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={meta.page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ZoneStudentManagementPage
