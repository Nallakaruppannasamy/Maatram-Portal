import React, { useState, useRef, useEffect } from 'react'
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
  Archive,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'
import { Avatar } from '@/components/ui/Avatar'
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

export const ArchivedStudentsPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [collegeFilter, setCollegeFilter] = useState<string>('All')
  const [zoneFilter, setZoneFilter] = useState<string>('All')
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('All')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(searchTerm, 400)

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

  // Fetch Archived Students (scope = archived)
  const { data: studentsRes, isLoading } = useQuery({
    queryKey: [
      'archived-students',
      debouncedSearch,
      currentPage,
      zoneFilter,
      collegeFilter,
      academicYearFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      studentApi.list({
        scope: 'archived',
        search: debouncedSearch,
        page: currentPage,
        limit: 10,
        zoneId: zoneFilter !== 'All' ? zoneFilter : undefined,
        collegeId: collegeFilter !== 'All' ? collegeFilter : undefined,
        academicYear: academicYearFilter !== 'All' ? academicYearFilter : undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
      }),
  })

  const students = studentsRes?.data || []
  const meta = studentsRes?.meta || { total: 0, page: currentPage, totalPages: 1 }

  // Account Status Toggle Mutation (allows activating archived students back to active)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      setPendingStatusId(id)
      return studentApi.changeStatus(id, status)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['archived-students'] })
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

  // Export File (Backend Powered, respects pagination/sorting/filtering for archived records)
  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (students.length === 0) return notify.info('No archived student records found to export.')

    try {
      const blob = await studentApi.exportCSV({
        format,
        scope: 'archived',
        search: debouncedSearch,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
        zoneId: zoneFilter !== 'All' ? zoneFilter : undefined,
        collegeId: collegeFilter !== 'All' ? collegeFilter : undefined,
        academicYear: academicYearFilter !== 'All' ? academicYearFilter : undefined,
        page: currentPage,
        limit: 10,
      })

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Archived_Students_${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      notify.success(`Exported archived table data as ${format.toUpperCase()}`)
    } catch {
      notify.error('Failed to export archived student directory data.')
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900">Archived Students</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Historical Archive
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Historical database of deactivated scholar profiles with full academic, SPOC, and resume records.
            </p>
          </div>

          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm transition shadow-sm cursor-pointer"
            >
              <Download size={16} />
              <span>Export Archive</span>
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
                    Export Archive (Excel)
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Export Archive (CSV)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Archived"
            value={meta.total}
            icon={Archive}
            colorClass="bg-slate-100"
            iconColor="text-slate-700"
          />
          <StatCard
            title="Current Page"
            value={meta.page}
            icon={Users}
            colorClass="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Total Pages"
            value={Math.max(meta.totalPages, 1)}
            icon={Users}
            colorClass="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="relative grow">
            <input
              type="text"
              placeholder="Search archived students by name or registration number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-800 outline-none"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Zone Filter */}
            <select
              value={zoneFilter}
              onChange={(e) => {
                setZoneFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-800 outline-none"
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
              onChange={(e) => {
                setCollegeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-800 outline-none max-w-xs"
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
              onChange={(e) => {
                setAcademicYearFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-800 outline-none"
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
              searchTerm ||
              sortBy) && (
              <button
                onClick={() => {
                  setZoneFilter('All')
                  setCollegeFilter('All')
                  setAcademicYearFilter('All')
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

        {/* Table Container */}
        <div className="grow">
          {isLoading ? (
            <TableLoader rows={6} columns={12} />
          ) : students.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <Archive size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-semibold text-sm">
                No archived student records match your current criteria.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Deactivated students from Student Provisioning will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Account Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-xs">
                  {students.map((student, index) => {
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
                    const isRowStatusPending = toggleStatusMutation.isPending && pendingStatusId === student.id

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-4 whitespace-nowrap text-gray-500 font-medium text-center">
                          {(currentPage - 1) * 10 + index + 1}
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
                            title="View archived student resume"
                          >
                            {regNo}
                          </a>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-900">
                          <span>{name}</span>
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
            Showing {(meta.page - 1) * 10 + 1} to{' '}
            {Math.min(meta.page * 10, meta.total)} of {meta.total} archived students
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

export default ArchivedStudentsPage
