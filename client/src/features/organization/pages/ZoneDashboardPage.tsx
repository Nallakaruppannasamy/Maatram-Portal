import React from 'react'
import { Link } from 'react-router-dom'
import { FileCheck2, Users, Building2, Clock, CheckCircle2, XCircle, ArrowRight, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const ZoneDashboardPage = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Zone Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="info">Zone 1 Workspace</Badge>
            <span className="text-xs text-[#76777d]">Chennai & Kanchipuram Region</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight mt-1">Zone Incharge Dashboard</h2>
          <p className="text-xs text-[#45464c]">Manage volunteer approvals, students, and colleges assigned to your zone.</p>
        </div>
        <Link to="/zone/approvals">
          <Button variant="gold" size="md" icon={<FileCheck2 className="w-4 h-4" />}>
            Review Pending Approvals (5)
          </Button>
        </Link>
      </div>

      {/* Zone Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Assigned Students</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#111827] mt-3">480 <span className="text-xs font-normal text-[#76777d]">students</span></p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">Across 8 colleges</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Pending Approvals</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#D4AF37] mt-3">5 <span className="text-xs font-normal text-[#76777d]">submissions</span></p>
          <p className="text-xs text-amber-600 font-semibold mt-2">Requires review</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Total Approved Hours</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#111827] mt-3">8,420 <span className="text-xs font-normal text-[#76777d]">hrs</span></p>
          <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +140 hrs this week
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Approval Rate</span>
            <div className="w-9 h-9 rounded-xl bg-[#FCF8FA] text-[#111827] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#111827] mt-3">94.2%</p>
          <p className="text-xs text-[#76777d] mt-2">Zone Average</p>
        </Card>
      </div>

      {/* Approval Inbox Queue Preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Volunteering Submissions Queue</CardTitle>
            <CardDescription>Review proof images and approve hours submitted by your zone students</CardDescription>
          </div>
          <Link to="/zone/approvals">
            <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              Open Approval Inbox
            </Button>
          </Link>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#76777d] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 font-bold">Student Name & Reg</th>
                  <th className="py-3 px-3 font-bold">College</th>
                  <th className="py-3 px-3 font-bold">Activity Title</th>
                  <th className="py-3 px-3 font-bold">Hours</th>
                  <th className="py-3 px-3 font-bold">Event Date</th>
                  <th className="py-3 px-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                <tr>
                  <td className="py-3.5 px-3">
                    <p className="font-bold text-[#111827]">Ananya Sharma</p>
                    <p className="text-[10px] text-[#76777d]">2024CS1092</p>
                  </td>
                  <td className="py-3.5 px-3 text-[#45464c]">MIT Chennai</td>
                  <td className="py-3.5 px-3 font-bold">Community Cleanliness Drive</td>
                  <td className="py-3.5 px-3 font-extrabold text-[#D4AF37]">4.0 hrs</td>
                  <td className="py-3.5 px-3 text-[#76777d]">Jul 24, 2026</td>
                  <td className="py-3.5 px-3">
                    <Link to="/zone/approvals">
                      <Button variant="gold" size="sm">
                        Review Proof
                      </Button>
                    </Link>
                  </td>
                </tr>

                <tr>
                  <td className="py-3.5 px-3">
                    <p className="font-bold text-[#111827]">Karthik Raja</p>
                    <p className="text-[10px] text-[#76777d]">2024ME1105</p>
                  </td>
                  <td className="py-3.5 px-3 text-[#45464c]">College of Engg Guindy</td>
                  <td className="py-3.5 px-3 font-bold">Digital Literacy Workshop</td>
                  <td className="py-3.5 px-3 font-extrabold text-[#D4AF37]">8.0 hrs</td>
                  <td className="py-3.5 px-3 text-[#76777d]">Jul 22, 2026</td>
                  <td className="py-3.5 px-3">
                    <Link to="/zone/approvals">
                      <Button variant="gold" size="sm">
                        Review Proof
                      </Button>
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
