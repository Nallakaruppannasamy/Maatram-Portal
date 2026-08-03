import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, Filter } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { TableLoader } from '@/components/ui/TableLoader'
import { volunteerApi } from '@/api/volunteer.api'
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

export const VolunteerHistoryPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const debouncedSearch = useDebounce(searchTerm, 400)

  const { data: volunteersRes, isLoading } = useQuery({
    queryKey: ['volunteers', debouncedSearch, statusFilter],
    queryFn: () => volunteerApi.list({ search: debouncedSearch, status: statusFilter || undefined }),
  })

  const historyLogs = volunteersRes?.data || []

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Volunteer Submissions History</h2>
          <p className="text-xs text-[#45464c]">Complete audit trail of all your submitted volunteer logs and reviewer feedback.</p>
        </div>
        <Link to="/student/volunteer-submit">
          <Button variant="gold" size="md" icon={<Plus className="w-4 h-4" />}>
            Log New Activity
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-72">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Search activity title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#76777d]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-1.5 text-xs text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending Review</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <TableLoader rows={5} columns={7} />
          ) : historyLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500">
              No volunteer submission records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#111827]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#76777d] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 font-bold">Activity Title</th>
                    <th className="py-3 px-3 font-bold">Category</th>
                    <th className="py-3 px-3 font-bold">Organization</th>
                    <th className="py-3 px-3 font-bold">Hours</th>
                    <th className="py-3 px-3 font-bold">Event Date</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                    <th className="py-3 px-3 font-bold">Reviewer Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {historyLogs.map((log: any) => {
                    const isApproved = log.status === 'approved' || log.status === 'APPROVED'
                    const isRejected = log.status === 'rejected' || log.status === 'REJECTED'
                    return (
                      <tr key={log.id} className="hover:bg-[#FCF8FA] transition-colors">
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-[#111827]">{safeString(log.title, 'Activity')}</p>
                          <p className="text-[10px] text-[#76777d] font-mono">{log.id}</p>
                        </td>
                        <td className="py-3.5 px-3 text-[#45464c] font-medium">{safeString(log.category, 'General')}</td>
                        <td className="py-3.5 px-3 text-[#45464c]">{safeString(log.organization, 'Partner Org')}</td>
                        <td className="py-3.5 px-3 font-extrabold text-[#111827]">{log.hours} hrs</td>
                        <td className="py-3.5 px-3 text-[#76777d]">{safeString(log.eventDate, 'N/A')}</td>
                        <td className="py-3.5 px-3">
                          <Badge variant={isApproved ? 'approved' : isRejected ? 'rejected' : 'pending'}>
                            {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-3 max-w-xs">
                          <p className="text-[11px] text-[#45464c] truncate">
                            {log.reviewerComment || (isApproved ? 'Verified by Zone Incharge.' : 'Under review.')}
                          </p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default VolunteerHistoryPage
