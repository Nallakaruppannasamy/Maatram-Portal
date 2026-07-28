import React from 'react'
import { Link } from 'react-router-dom'
import { History, Plus, Filter, Search, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

export const VolunteerHistoryPage = () => {
  const historyLogs = [
    {
      id: 'VLOG-1092-01',
      title: 'Blood Donation Drive Coordination',
      category: 'Healthcare',
      organization: 'Red Cross / Maatram',
      hours: 6.0,
      date: 'Jul 20, 2026',
      status: 'approved',
      reviewer: 'Dr. Ramesh Kumar',
      comment: 'Excellent coordination work. Proof verified.',
    },
    {
      id: 'VLOG-1092-02',
      title: 'Rural Science Fair Mentorship',
      category: 'Education',
      organization: 'Govt Higher Sec School',
      hours: 12.0,
      date: 'Jul 14, 2026',
      status: 'approved',
      reviewer: 'Dr. Ramesh Kumar',
      comment: 'Verified with school principal attendance letter.',
    },
    {
      id: 'VLOG-1092-03',
      title: 'Community Cleanliness Drive',
      category: 'Environment',
      organization: 'NSS Unit 4',
      hours: 4.0,
      date: 'Jul 24, 2026',
      status: 'pending',
      reviewer: 'Pending Zone Review',
      comment: 'Under review by Zone Incharge.',
    },
    {
      id: 'VLOG-1092-04',
      title: 'Tree Plantation Campaign',
      category: 'Environment',
      organization: 'Green Earth Trust',
      hours: 5.0,
      date: 'Jun 10, 2026',
      status: 'rejected',
      reviewer: 'Dr. Ramesh Kumar',
      comment: 'Proof photo missing clear date stamp. Please resubmit with event photo.',
    },
  ]

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
            <Input icon={<Search className="w-4 h-4" />} placeholder="Search activity title..." />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Filter className="w-4 h-4" />}>
              Filter Status
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#76777d] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 font-bold">ID / Title</th>
                  <th className="py-3 px-3 font-bold">Category</th>
                  <th className="py-3 px-3 font-bold">Organization</th>
                  <th className="py-3 px-3 font-bold">Hours</th>
                  <th className="py-3 px-3 font-bold">Event Date</th>
                  <th className="py-3 px-3 font-bold">Status</th>
                  <th className="py-3 px-3 font-bold">Reviewer Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {historyLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FCF8FA] transition-colors">
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-[#111827]">{log.title}</p>
                      <p className="text-[10px] text-[#76777d] font-mono">{log.id}</p>
                    </td>
                    <td className="py-3.5 px-3 text-[#45464c] font-medium">{log.category}</td>
                    <td className="py-3.5 px-3 text-[#45464c]">{log.organization}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#111827]">{log.hours} hrs</td>
                    <td className="py-3.5 px-3 text-[#76777d]">{log.date}</td>
                    <td className="py-3.5 px-3">
                      <Badge
                        variant={log.status === 'approved' ? 'approved' : log.status === 'pending' ? 'pending' : 'rejected'}
                      >
                        {log.status === 'approved' ? 'Approved' : log.status === 'pending' ? 'Pending' : 'Rejected'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 max-w-xs">
                      <p className="text-[11px] text-[#45464c] truncate">{log.comment}</p>
                      <p className="text-[10px] text-[#76777d] font-semibold">{log.reviewer}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
