import React, { useState, Fragment, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Download,
  Users,
  LucideIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Star,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Square,
  FileText,
  UserX,
  Loader2,
} from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { studentApi } from '@/api/student.api'
import { zoneApi } from '@/api/zone.api'
import { profileApi } from '@/api/profile.api'
import { notify } from '@/utils/toast'
import { useDebounce } from '@/hooks/useDebounce'

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

interface StatCardProps {
  title: string
  value?: number
  icon: LucideIcon
  colorClass: string
  iconColor: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, colorClass, iconColor }) => (
  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClass}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
      <p className="text-xl font-bold text-gray-900">{(value ?? 0).toLocaleString()}</p>
    </div>
  </div>
)

export const SuperAdminStudentDirectoryPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [collegeFilter, setCollegeFilter] = useState<string>('All')
  const [zoneFilter, setZoneFilter] = useState<string>('All')
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('All')
  const [streamFilter, setStreamFilter] = useState<string>('All')
  const [accountStatusFilter, setAccountStatusFilter] = useState<string>('All')
  const [spocFilter, setSpocFilter] = useState<'All' | 'SPOC Only' | 'Non-SPOC'>('All')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [pendingSpocId, setPendingSpocId] = useState<string | null>(null)
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(searchTerm, 400)
  const PAGE_LIMIT = 50

  // Reset page and selection when filters change
  useEffect(() => {
    setCurrentPage(1)
    setSelectedStudentIds([])
  }, [debouncedSearch, zoneFilter, collegeFilter, academicYearFilter, streamFilter, accountStatusFilter, spocFilter])

  // Fetch Master Data
  const { data: zonesRes } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneApi.list(),
  })
  const zones = zonesRes?.data || []

  const { data: collegesRes } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => profileApi.getColleges(),
  })
  const colleges = collegesRes?.data || []

  // Fetch Students
  const { data: studentsRes, isLoading } = useQuery({
    queryKey: [
      'students',
      debouncedSearch,
      currentPage,
      zoneFilter,
      collegeFilter,
      academicYearFilter,
      streamFilter,
      accountStatusFilter,
      spocFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      studentApi.list({
        search: debouncedSearch,
        page: currentPage,
        limit: PAGE_LIMIT,
        zoneId: zoneFilter !== 'All' ? zoneFilter : undefined,
        collegeId: collegeFilter !== 'All' ? collegeFilter : undefined,
        academicYear: academicYearFilter !== 'All' ? academicYearFilter : undefined,
        stream: streamFilter !== 'All' ? streamFilter : undefined,
        accountStatus: accountStatusFilter !== 'All' ? accountStatusFilter.toLowerCase() : undefined,
        isSpoc: spocFilter === 'All' ? undefined : spocFilter === 'SPOC Only',
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
      }),
  })

  const students = studentsRes?.data || []
  const meta = studentsRes?.meta || { total: 0, page: currentPage, totalPages: 1 }

  // SPOC Mutation
  const toggleSpocMutation = useMutation({
    mutationFn: ({ id, isSpoc }: { id: string; isSpoc: boolean }) => {
      setPendingSpocId(id)
      return studentApi.updateSpoc(id, isSpoc)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
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
      queryClient.invalidateQueries({ queryKey: ['students'] })
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
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (err: any) => {
      notify.error(err.response?.data?.message || 'Failed to deactivate selected students')
    },
  })

  // Sorting Handler
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
    setCurrentPage(1)
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

  // Export File (Backend Powered, exports ENTIRE filtered dataset with no pagination)
  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await studentApi.exportCSV({
        format,
        search: debouncedSearch,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
        zoneId: zoneFilter !== 'All' ? zoneFilter : undefined,
        collegeId: collegeFilter !== 'All' ? collegeFilter : undefined,
        academicYear: academicYearFilter !== 'All' ? academicYearFilter : undefined,
        stream: streamFilter !== 'All' ? streamFilter : undefined,
        accountStatus: accountStatusFilter !== 'All' ? accountStatusFilter.toLowerCase() : undefined,
        isSpoc: spocFilter === 'All' ? undefined : spocFilter === 'SPOC Only',
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Student_Directory_${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      notify.success(`Exported complete filtered dataset as ${format.toUpperCase()}`)
    } catch {
      notify.error('Failed to export student directory data.')
    }
  }

  // Click outside listener for export dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isPageAllSelected =
    students.length > 0 && students.every((s) => selectedStudentIds.includes(s.id))

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Directory</h1>
            <p className="text-sm text-gray-500 mt-1">
              Comprehensive scholar database with live academic records, SPOC designation, and zone assignments.
            </p>
          </div>

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm cursor-pointer"
            >
              <Download size={16} />
              <span>Export Full Dataset</span>
              <ChevronDown size={14} />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Select Format
                </div>
                <div className="py-1">
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Export to Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Export to CSV (.csv)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Dynamic Zone Student Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <StatCard
            title="Total Students"
            value={meta.total}
            icon={Users}
            colorClass="bg-blue-50"
            iconColor="text-blue-600"
          />
          {zones.map((zone) => (
            <StatCard
              key={zone.id}
              title={`Students in ${zone.name}`}
              value={(zone as any)._count?.students ?? 0}
              icon={Users}
              colorClass="bg-amber-50"
              iconColor="text-[#D4AF37]"
            />
          ))}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="relative grow">
            <input
              type="text"
              placeholder="Search by student name, registration code, department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-900 outline-none"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Stream Filter */}
            <select
              value={streamFilter}
              onChange={(e) => setStreamFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-900 outline-none"
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
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-900 outline-none"
            >
              <option value="All">All Account Statuses</option>
              <option value="active">Active</option>
              <option value="deactivated">Deactivated</option>
            </select>

            {/* SPOC Filter */}
            <select
              value={spocFilter}
              onChange={(e) => setSpocFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-900 outline-none"
            >
              <option value="All">All SPOC Status</option>
              <option value="SPOC Only">SPOC Only</option>
              <option value="Non-SPOC">Non-SPOC</option>
            </select>

            {/* Zone Filter */}
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-900 outline-none"
            >
              <option value="All">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>

            {/* College Filter */}
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-900 outline-none max-w-xs"
            >
              <option value="All">All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Academic Year Filter */}
            <select
              value={academicYearFilter}
              onChange={(e) => setAcademicYearFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-900 outline-none"
            >
              <option value="All">All Academic Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            {(zoneFilter !== 'All' ||
              collegeFilter !== 'All' ||
              academicYearFilter !== 'All' ||
              streamFilter !== 'All' ||
              accountStatusFilter !== 'All' ||
              spocFilter !== 'All' ||
              searchTerm ||
              sortBy) && (
              <button
                onClick={() => {
                  setZoneFilter('All')
                  setCollegeFilter('All')
                  setAcademicYearFilter('All')
                  setStreamFilter('All')
                  setAccountStatusFilter('All')
                  setSpocFilter('All')
                  setSearchTerm('')
                  setSortBy('')
                  setCurrentPage(1)
                }}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition cursor-pointer"
                title="Reset Parameters"
              >
                <X size={16} /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Bulk Actions Floating Bar */}
        {selectedStudentIds.length > 0 && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 animate-in fade-in">
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

        {/* Table Container */}
        <div className="grow">
          {isLoading ? (
            <TableLoader rows={10} columns={14} />
          ) : students.length === 0 ? (
            <p className="text-center py-12 text-gray-400 font-medium">
              {spocFilter === 'SPOC Only'
                ? 'No SPOC students found matching your criteria.'
                : 'No student records match your current criteria.'}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={isPageAllSelected}
                        onChange={handleSelectAllOnPage}
                        className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                        title="Select/Deselect all on this page"
                      />
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-12 text-center">
                      S. No.
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider w-14">
                      Photo
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('registerNumber')}
                    >
                      Register Number {renderSortIndicator('registerNumber')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('name')}
                    >
                      Name {renderSortIndicator('name')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Stream
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Degree
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('college')}
                    >
                      College Name {renderSortIndicator('college')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('zone')}
                    >
                      Zone {renderSortIndicator('zone')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('batch')}
                    >
                      Batch {renderSortIndicator('batch')}
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('academicYear')}
                    >
                      Current Year {renderSortIndicator('academicYear')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                      SPOC
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Account Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-xs">
                  {students.map((student, index) => {
                    const isSelected = selectedStudentIds.includes(student.id)
                    const regNo = safeString(
                      student.registrationNumber || student.user?.regNumber || student.id,
                      'UNASSIGNED'
                    )
                    const name = safeString(
                      student.fullName || student.user?.fullName || student.user?.email,
                      'Scholar Student'
                    )
                    const stream = safeString((student as any).stream, 'N/A')
                    const degree = safeString((student as any).degree || (student as any).program?.name || (student as any).course, 'N/A')
                    const dept = safeString((student as any).departmentName || (student as any).department?.name || (student as any).department, 'N/A')
                    const college = safeString(student.college?.name || student.collegeName, 'Maatram College')
                    const zone = safeString(student.zone?.name || (student as any).zoneName, 'N/A')
                    const batch = safeString(student.batch, '2024-2028')
                    const getYearLabel = (year?: string | number | null) => {
                      if (!year) return 'N/A'
                      const y = String(year)
                      if (y === '1') return '1st Year'
                      if (y === '2') return '2nd Year'
                      if (y === '3') return '3rd Year'
                      if (y === '4') return '4th Year'
                      return `${y}th Year`
                    }
                    const academicYearLabel = getYearLabel(student.academicYear)
                    const isUserActive = (student.user?.isActive !== false) && (student.status !== 'DEACTIVATED')
                    const isSpocActive = !!student.isSpoc
                    const isRowSpocPending = toggleSpocMutation.isPending && pendingSpocId === student.id
                    const isRowStatusPending = toggleStatusMutation.isPending && pendingStatusId === student.id

                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-blue-50/70'
                            : isSpocActive
                            ? 'bg-amber-50/40 hover:bg-amber-50/70'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-3 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleStudent(student.id)}
                            className="rounded border-gray-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-gray-500 font-medium text-center">
                          {(currentPage - 1) * PAGE_LIMIT + index + 1}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          <Avatar
                            src={student.profileImage || (student as any).user?.profilePhotoUrl}
                            name={name}
                            size="sm"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-bold text-blue-900 font-mono">
                          <a
                            href={`/resume/${student.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline hover:text-blue-950 cursor-pointer"
                          >
                            {regNo}
                          </a>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-900">
                          <div className="flex items-center gap-2">
                            <span>{name}</span>
                            {isSpocActive && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[#D4AF37]/15 text-[#996515] border border-[#D4AF37]/30">
                                <Star size={10} className="fill-[#D4AF37] text-[#D4AF37]" /> SPOC
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-700">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-800">
                            {stream}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-700">{degree}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-700">{dept}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-700">{college}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-600">{zone}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-600">{batch}</td>
                        <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-700">
                          {academicYearLabel}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() =>
                              toggleSpocMutation.mutate({
                                id: student.id,
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
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            type="button"
                            disabled={isRowStatusPending}
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: student.id,
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
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <p className="text-xs text-gray-500">
            Showing {(meta.page - 1) * PAGE_LIMIT + 1} to{' '}
            {Math.min(meta.page * PAGE_LIMIT, meta.total)} of {meta.total} students (Max {PAGE_LIMIT} per page)
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={meta.page <= 1}
              className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={meta.page <= 1}
              className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-4 py-2 text-xs font-semibold text-gray-700">
              Page {meta.page} of {Math.max(meta.totalPages, 1)}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, meta.totalPages))}
              disabled={meta.page >= meta.totalPages}
              className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(meta.totalPages)}
              disabled={meta.page >= meta.totalPages}
              className="p-2 border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default SuperAdminStudentDirectoryPage