import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Download, ExternalLink, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, X, Users, MapPin, GraduationCap, HeartHandshake } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { TableLoader } from '@/components/ui/TableLoader'
import { studentApi } from '@/api/student.api'
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
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [academicYearFilter, setAcademicYearFilter] = useState('All')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const debouncedSearch = useDebounce(searchTerm, 400)

  const { data: studentsRes, isLoading } = useQuery({
    queryKey: ['zone-students', debouncedSearch, page, academicYearFilter, sortBy, sortOrder],
    queryFn: () =>
      studentApi.list({
        search: debouncedSearch,
        page,
        limit: 10,
        academicYear: academicYearFilter !== 'All' ? academicYearFilter : undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
      }),
  })

  const students = studentsRes?.data || []
  const meta = studentsRes?.meta || { total: students.length, page: 1, totalPages: 1 }

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

  // Export
  const handleExport = async () => {
    if (students.length === 0) return notify.info('No student records found to export.')

    try {
      const blob = await studentApi.exportCSV({
        format: 'xlsx',
        search: debouncedSearch,
        academicYear: academicYearFilter !== 'All' ? academicYearFilter : undefined,
        sortBy: sortBy || undefined,
        sortOrder: sortBy ? sortOrder : undefined,
        page,
        limit: 10,
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

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Zone Students Directory</h2>
          <p className="text-xs text-[#45464c]">View, filter, and audit verified student portfolios assigned to your zone.</p>
        </div>
        <Button variant="gold" size="md" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
          Export Zone Directory
        </Button>
      </div>

      {/* Summary Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-900 font-bold">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Zone Scholars</p>
            <p className="text-xl font-extrabold text-gray-900">{meta.total || students.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-[#D4AF37] font-bold">
            <MapPin size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Zone</p>
            <p className="text-sm font-extrabold text-gray-900 truncate max-w-[120px]">{user?.zoneId ? 'Active Zone' : 'Zone In-charge'}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Status</p>
            <p className="text-xl font-extrabold text-emerald-600">100%</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
            <HeartHandshake size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Volunteering</p>
            <p className="text-sm font-extrabold text-purple-900">Verified Logs</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-80">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Search student name or register no..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Academic Year Filter */}
            <select
              value={academicYearFilter}
              onChange={(e) => {
                setAcademicYearFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-none"
            >
              <option value="All">All Academic Years</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>

            {(academicYearFilter !== 'All' || searchTerm || sortBy) && (
              <button
                onClick={() => {
                  setAcademicYearFilter('All')
                  setSearchTerm('')
                  setSortBy('')
                  setPage(1)
                }}
                className="flex items-center gap-1 p-2 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition cursor-pointer text-xs"
                title="Reset Filters"
              >
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <TableLoader rows={5} columns={9} />
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              No students found matching your search criteria in your assigned zone.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-[#E5E7EB] rounded-lg">
                <table className="w-full text-left text-xs text-[#111827]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#76777d] uppercase tracking-wider text-[10px] bg-gray-50">
                      <th className="py-3 px-3 font-bold w-12 text-center">S. No.</th>
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
                      <th
                        className="py-3 px-3 font-bold cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('college')}
                      >
                        College & Dept {renderSortIndicator('college')}
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
                      <th className="py-3 px-3 font-bold">Status</th>
                      <th className="py-3 px-3 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] bg-white">
                    {students.map((st, idx) => {
                      const serialNum = (meta.page - 1) * 10 + idx + 1
                      const name = safeString(st.fullName || st.user?.fullName || st.user?.email, 'Scholar Student')
                      const regNo = safeString(st.registrationNumber || st.user?.regNumber || st.id.slice(0, 8), 'UNASSIGNED')
                      const college = safeString(st.college?.name || st.collegeName, 'Assigned College')
                      const dept = safeString((st as any).department?.name || (st as any).departmentName || st.department, 'General')
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
                      const status = safeString((st as any).status || st.accountStatus, 'ACTIVE')

                      return (
                        <tr key={st.id} className="hover:bg-[#FCF8FA] transition-colors">
                          <td className="py-3.5 px-3 font-bold text-center text-gray-400">{serialNum}</td>
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
                          <td className="py-3.5 px-3 font-bold text-[#111827]">{name}</td>
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-[#111827]">{college}</p>
                            <p className="text-[10px] text-[#76777d]">{dept}</p>
                          </td>
                          <td className="py-3.5 px-3 font-medium text-gray-700">{zoneLabel}</td>
                          <td className="py-3.5 px-3 text-[#76777d] font-mono">{batch}</td>
                          <td className="py-3.5 px-3 font-semibold text-gray-700">{academicYearLabel}</td>
                          <td className="py-3.5 px-3">
                            <Badge variant={status === 'ACTIVE' ? 'approved' : 'pending'}>
                              {status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-3">
                            <a href={`/resume/${st.id}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                                Resume
                              </Button>
                            </a>
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
                    Showing page {meta.page} of {meta.totalPages} ({meta.total} total students)
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
