import React from 'react'
import { Link } from 'react-router-dom'
import { Users, Search, Filter, Download, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

export const ZoneStudentManagementPage = () => {
  const students = [
    { name: 'Ananya Sharma', reg: '2024CS1092', college: 'MIT Chennai', dept: 'CSE', cgpa: 8.82, hours: 42.5, status: 'Active' },
    { name: 'Karthik Raja', reg: '2024ME1105', college: 'CEG Guindy', dept: 'Mechanical', cgpa: 8.40, hours: 38.0, status: 'Active' },
    { name: 'Priya Dharshini', reg: '2024EC1044', college: 'SSN College', dept: 'ECE', cgpa: 9.12, hours: 54.0, status: 'Active' },
    { name: 'Siddharth V', reg: '2024IT1088', college: 'MIT Chennai', dept: 'IT', cgpa: 7.95, hours: 22.5, status: 'Active' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Zone Students Directory</h2>
          <p className="text-xs text-[#45464c]">View and manage student portfolios assigned to Chennai Zone 1.</p>
        </div>
        <Button variant="outline" size="md" icon={<Download className="w-4 h-4" />}>
          Export Zone Directory (Excel)
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-80">
            <Input icon={<Search className="w-4 h-4" />} placeholder="Search student name or register no..." />
          </div>
          <div className="flex gap-2">
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
                  <th className="py-3 px-3 font-bold">College & Dept</th>
                  <th className="py-3 px-3 font-bold">Academic CGPA</th>
                  <th className="py-3 px-3 font-bold">Verified Hours</th>
                  <th className="py-3 px-3 font-bold">Status</th>
                  <th className="py-3 px-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {students.map((st, idx) => (
                  <tr key={idx} className="hover:bg-[#FCF8FA] transition-colors">
                    <td className="py-3.5 px-3 font-bold text-[#111827]">{st.name}</td>
                    <td className="py-3.5 px-3 text-[#76777d] font-mono">{st.reg}</td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-[#111827]">{st.college}</p>
                      <p className="text-[10px] text-[#76777d]">{st.dept}</p>
                    </td>
                    <td className="py-3.5 px-3 font-extrabold text-[#111827]">{st.cgpa}</td>
                    <td className="py-3.5 px-3 font-extrabold text-[#D4AF37]">{st.hours} hrs</td>
                    <td className="py-3.5 px-3">
                      <Badge variant="approved">{st.status}</Badge>
                    </td>
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
