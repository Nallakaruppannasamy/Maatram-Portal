import React from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, Filter, Download, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

export const SuperAdminStudentDirectoryPage = () => {
  const globalStudents = [
    { name: 'Ananya Sharma', reg: '2024CS1092', zone: 'Zone 1 (Chennai)', college: 'MIT Chennai', cgpa: 8.82, hours: 42.5 },
    { name: 'Karthik Raja', reg: '2024ME1105', zone: 'Zone 1 (Chennai)', college: 'CEG Guindy', cgpa: 8.40, hours: 38.0 },
    { name: 'Vijay Anand', reg: '2024ECE091', zone: 'Zone 3 (Coimbatore)', college: 'PSG Tech', cgpa: 9.05, hours: 60.0 },
    { name: 'Meenakshi Sundaram', reg: '2024CIV302', zone: 'Zone 5 (Madurai)', college: 'Thiagarajar Engg', cgpa: 8.15, hours: 28.0 },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Global Student Directory</h2>
          <p className="text-xs text-[#45464c]">Organization-wide master database of all registered Maatram scholars across all zones.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="md" icon={<Download className="w-4 h-4" />}>
            Export Full Directory (Excel)
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-80">
            <Input icon={<Search className="w-4 h-4" />} placeholder="Search student, reg no, zone, or college..." />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Filter className="w-4 h-4" />}>
              Filter Zone
            </Button>
            <Button variant="outline" size="sm" icon={<Filter className="w-4 h-4" />}>
              Filter College
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#76777d] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 font-bold">Student Name</th>
                  <th className="py-3 px-3 font-bold">Register No.</th>
                  <th className="py-3 px-3 font-bold">Assigned Zone</th>
                  <th className="py-3 px-3 font-bold">College</th>
                  <th className="py-3 px-3 font-bold">CGPA</th>
                  <th className="py-3 px-3 font-bold">Verified Hours</th>
                  <th className="py-3 px-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {globalStudents.map((st, idx) => (
                  <tr key={idx} className="hover:bg-[#FCF8FA] transition-colors">
                    <td className="py-3.5 px-3 font-bold text-[#111827]">{st.name}</td>
                    <td className="py-3.5 px-3 text-[#76777d] font-mono">{st.reg}</td>
                    <td className="py-3.5 px-3">
                      <Badge variant="info">{st.zone}</Badge>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#111827]">{st.college}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#111827]">{st.cgpa}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#D4AF37]">{st.hours} hrs</td>
                    <td className="py-3.5 px-3">
                      <Link to="/student/profile">
                        <Button variant="ghost" size="sm" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                          View Portfolio
                        </Button>
                      </Link>
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
