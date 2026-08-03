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
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { TableLoader } from '@/components/ui/TableLoader'
import { studentApi } from '@/api/student.api'
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
  value: number
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
      <p className="text-xl font-bold text-gray-900">{value.toLocaleString()}</p>
    </div>
  </div>
)

export const SuperAdminStudentDirectoryPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [collegeFilter, setCollegeFilter] = useState<string>('All')
  const [zoneFilter, setZoneFilter] = useState<string>('All')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const debouncedSearch = useDebounce(searchTerm, 400)

  const { data: studentsRes, isLoading } = useQuery({
    queryKey: ['students', debouncedSearch, currentPage],
    queryFn: () => studentApi.list({ search: debouncedSearch, page: currentPage, limit: 10 }),
  })

  const students = studentsRes?.data || []
  const meta = studentsRes?.meta || { total: students.length, page: currentPage, totalPages: 1 }

  const handleExport = () => {
    if (students.length === 0) return notify.info('No student records found to export.')

    const worksheetData = students.map((s, index) => ({
      'S. No.': index + 1,
      'Register Number': safeString(s.registrationNumber || s.regNumber, 'UNASSIGNED'),
      'Student Name': safeString(s.fullName || s.user?.fullName, 'N/A'),
      'Mobile Number': safeString(s.user?.email, 'N/A'),
      'College Name': safeString(s.college || s.collegeName, 'N/A'),
      Degree: safeString(s.degree || s.course, 'N/A'),
      Department: safeString(s.department, 'N/A'),
      CGPA: safeString(s.cgpa, 'N/A'),
    }))

    const worksheet = XLSX.utils.json_to_sheet(worksheetData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students')

    XLSX.writeFile(workbook, `Maatram_Students_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    setShowExportMenu(false)
    notify.success('Spreadsheet data exported into Excel successfully!')
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <Fragment>
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 min-h-[80vh] flex flex-col font-sans">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 font-display">Student Portfolio Management</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Audit, monitor and track multi-semester academic profiles across operational regional sectors.
            </p>
          </div>
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-lg text-sm font-medium hover:bg-blue-950 transition shadow-sm cursor-pointer"
            >
              <Download size={16} /> Export Matrix <ChevronDown size={14} className="ml-1" />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-100 overflow-hidden">
                <div className="py-1">
                  <button
                    onClick={handleExport}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    Export Filtered Staged Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 5 Sector Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <StatCard title="Total Tracked" value={meta.total || students.length} icon={Users} colorClass="bg-blue-50" iconColor="text-blue-600" />
          <StatCard title="Sector Zone-1" value={students.length} icon={MapPin} colorClass="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard title="Sector Zone-2" value={0} icon={MapPin} colorClass="bg-indigo-50" iconColor="text-indigo-600" />
          <StatCard title="Sector Zone-3" value={0} icon={MapPin} colorClass="bg-amber-50" iconColor="text-amber-600" />
          <StatCard title="Sector Zone-4" value={0} icon={MapPin} colorClass="bg-rose-50" iconColor="text-rose-600" />
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="relative grow">
            <input
              type="text"
              placeholder="Search by student name or tracking registration code..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-900 outline-none"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>

          {(zoneFilter !== 'All' || collegeFilter !== 'All' || searchTerm) && (
            <button
              onClick={() => {
                setZoneFilter('All')
                setCollegeFilter('All')
                setSearchTerm('')
              }}
              className="flex items-center gap-1 p-2 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition cursor-pointer"
              title="Reset Parameters"
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>

        {/* Table Container */}
        <div className="grow">
          {isLoading ? (
            <TableLoader rows={6} columns={7} />
          ) : students.length === 0 ? (
            <p className="text-center py-12 text-gray-400 font-medium">
              No student records match your current search query.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">S. No.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Register Number</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">College Name</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-xs">
                  {students.map((student, index) => {
                    const regNo = safeString(student.registrationNumber || student.user?.regNumber || student.id, 'UNASSIGNED')
                    const name = safeString(student.fullName || student.user?.fullName || student.user?.email, 'Scholar Student')
                    const college = safeString(student.college || student.collegeName, 'Maatram College')
                    const dept = safeString(student.department, 'General')
                    const batch = safeString(student.batch, '2024-2028')

                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-gray-500 font-medium">
                          {(currentPage - 1) * 10 + index + 1}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-bold text-blue-900 font-mono">{regNo}</td>
                        <td className="px-4 py-4 whitespace-nowrap font-semibold text-gray-900">{name}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-700">{college}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-600">{dept}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-gray-600">{batch}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-emerald-600 font-bold">ACTIVE</td>
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