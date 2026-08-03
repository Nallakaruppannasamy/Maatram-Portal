import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { TableLoader } from '@/components/ui/TableLoader'
import { studentApi } from '@/api/student.api'
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

export const ZoneStudentManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(searchTerm, 400)

  const { data: studentsRes, isLoading } = useQuery({
    queryKey: ['students', debouncedSearch, page],
    queryFn: () => studentApi.list({ search: debouncedSearch, page, limit: 10 }),
  })

  const students = studentsRes?.data || []
  const meta = studentsRes?.meta || { total: students.length, page: 1, totalPages: 1 }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Zone Students Directory</h2>
          <p className="text-xs text-[#45464c]">View and manage student portfolios assigned to your zone.</p>
        </div>
        <Button variant="outline" size="md" icon={<Download className="w-4 h-4" />}>
          Export Zone Directory
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-80">
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
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <TableLoader rows={5} columns={6} />
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              No students found matching search criteria.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#111827]">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] text-[#76777d] uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3 font-bold">Student Name</th>
                      <th className="py-3 px-3 font-bold">Register No.</th>
                      <th className="py-3 px-3 font-bold">College & Dept</th>
                      <th className="py-3 px-3 font-bold">Status</th>
                      <th className="py-3 px-3 font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {students.map((st) => {
                      const name = safeString(st.fullName || st.user?.fullName || st.user?.email, 'Scholar Student')
                      const regNo = safeString(st.registrationNumber || st.user?.regNumber || st.id.slice(0, 8), 'UNASSIGNED')
                      const college = safeString(st.college || st.collegeName, 'Maatram College')
                      const dept = safeString(st.department, 'General')
                      const status = safeString(st.accountStatus, 'ACTIVE')

                      return (
                        <tr key={st.id} className="hover:bg-[#FCF8FA] transition-colors">
                          <td className="py-3.5 px-3 font-bold text-[#111827]">{name}</td>
                          <td className="py-3.5 px-3 text-[#76777d] font-mono">{regNo}</td>
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-[#111827]">{college}</p>
                            <p className="text-[10px] text-[#76777d]">{dept}</p>
                          </td>
                          <td className="py-3.5 px-3">
                            <Badge variant="approved">{status.toUpperCase()}</Badge>
                          </td>
                          <td className="py-3.5 px-3">
                            <Link to="/student/profile">
                              <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                                View Portfolio
                              </Button>
                            </Link>
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
