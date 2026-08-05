import React, { useState, Fragment, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
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
  MapPin,
  LucideIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'
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
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [collegeFilter, setCollegeFilter] = useState<string>('All')
  const [zoneFilter, setZoneFilter] = useState<string>('All')
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('All')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false)
  const [sortBy, setSortBy] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
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

  // Fetch Students
  const { data: studentsRes, isLoading } = useQuery({
    queryKey: [
      'students',
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

  // Export File (Backend Powered, respects pagination/sorting/filtering)
  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (students.length === 0) return notify.info('No student records found to export.')

    try {
      const blob = await studentApi.exportCSV({
        format,
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
      a.download = `Student_Directory_${Date.now()}.${format}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      notify.success(`Exported table data as ${format.toUpperCase()}`)
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

  return (
    <Fragment>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Super Admin Student Directory</h1>
            <p className="text-sm text-gray-500 mt-1">
              Global directory of all scholar students across zones, colleges, and programs.
            </p>
          </div>
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-950 transition shadow-sm cursor-pointer"
            >
              <Download size={16} /> Export Options <ChevronDown size={14} className="ml-1" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-100 overflow-hidden">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('xlsx')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Export Current Table (Excel)
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Export Current Table (CSV)
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
              placeholder="Search by student name or registration code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-900 outline-none"
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
              onChange={(e) => {
                setCollegeFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-900 outline-none max-w-xs"
            >
              <option value="All">All Colleges</option>
              {colleges.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Academic Year Filter (Replaces Status Filter) */}
            <select
              value={academicYearFilter}
              onChange={(e) => {
                setAcademicYearFilter(e.target.value)
                setCurrentPage(1)
              }}
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
            <TableLoader rows={6} columns={8} />
          ) : students.length === 0 ? (
            <p className="text-center py-12 text-gray-400 font-medium">
              No student records match your current criteria.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      S. No.
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
                      Status
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
                    const status = student.status || 'ACTIVE'

                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-gray-500 font-medium">
                          {(currentPage - 1) * 10 + index + 1}
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
                          {name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-700">{college}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-600">{zone}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-600">{batch}</td>
                        <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-700">
                          {academicYearLabel}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {status}
                          </span>
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
        {meta.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 border-t pt-4 text-xs">
            <p className="text-gray-500">
              Showing page {meta.page} of {meta.totalPages} ({meta.total} total students)
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 rounded border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={currentPage === meta.totalPages}
                className="w-9 h-9 rounded border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(meta.totalPages)}
                disabled={currentPage === meta.totalPages}
                className="w-9 h-9 rounded border flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 cursor-pointer"
              >
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Fragment>
  )
}

export default SuperAdminStudentDirectoryPage