import React from 'react'
import { Link } from 'react-router-dom'
import { HeartHandshake, Award, FileText, CheckCircle2, Clock, Plus, ArrowRight, TrendingUp, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'

export const StudentDashboardPage = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-[#111827] text-white p-8 rounded-2xl relative overflow-hidden shadow-md">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-[#D4AF37]/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 space-y-3 max-w-2xl">
          <Badge variant="gold" size="sm" className="uppercase tracking-widest">
            <Sparkles className="w-3 h-3 mr-1" /> Student Workspace
          </Badge>
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome back, Ananya Sharma!</h2>
          <p className="text-sm text-slate-300">
            Reg. No: <span className="font-semibold text-white">2024CS1092</span> • Chennai Zone 1 • Department of Computer Science
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link to="/student/volunteer-submit">
              <Button variant="gold" size="sm" icon={<Plus className="w-4 h-4" />}>
                Log Volunteer Activity
              </Button>
            </Link>
            <Link to="/student/resume">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                View Generated Resume
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Total Volunteer Hours</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#D4AF37] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#111827] mt-3">42.5 <span className="text-xs font-normal text-[#76777d]">hrs</span></p>
          <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +8.5 hrs this month
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Academic CGPA</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-[#111827] flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#111827] mt-3">8.82 <span className="text-xs font-normal text-[#76777d]">/ 10</span></p>
          <p className="text-xs text-[#76777d] mt-2">Semester 6 Complete</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Submitted Logs</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-[#111827] mt-3">12 <span className="text-xs font-normal text-[#76777d]">entries</span></p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">10 Approved • 2 Pending</p>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#76777d] uppercase tracking-wider">Resume Completeness</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <ProgressBar value={85} color="gold" showPercentage={false} />
            <div className="flex justify-between text-xs">
              <span className="font-bold text-[#111827]">85% Ready</span>
              <Link to="/student/profile" className="text-[#D4AF37] font-semibold hover:underline">Complete profile</Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Grid: Recent Activities & Resume Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Volunteer Submissions Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Volunteer Submissions</CardTitle>
              <CardDescription>Status of your submitted volunteering hours and evidence</CardDescription>
            </div>
            <Link to="/student/volunteer-history">
              <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </Link>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#111827]">
                <thead>
                  <tr className="border-b border-[#E5E7EB] text-[#76777d] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-2 font-bold">Activity Title</th>
                    <th className="py-3 px-2 font-bold">Category</th>
                    <th className="py-3 px-2 font-bold">Hours</th>
                    <th className="py-3 px-2 font-bold">Event Date</th>
                    <th className="py-3 px-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  <tr>
                    <td className="py-3.5 px-2 font-bold text-[#111827]">Blood Donation Drive Coordination</td>
                    <td className="py-3.5 px-2 text-[#45464c]">Healthcare</td>
                    <td className="py-3.5 px-2 font-semibold">6.0 hrs</td>
                    <td className="py-3.5 px-2 text-[#76777d]">Jul 20, 2026</td>
                    <td className="py-3.5 px-2">
                      <Badge variant="approved">Approved</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-2 font-bold text-[#111827]">Rural Science Fair Mentorship</td>
                    <td className="py-3.5 px-2 text-[#45464c]">Education</td>
                    <td className="py-3.5 px-2 font-semibold">12.0 hrs</td>
                    <td className="py-3.5 px-2 text-[#76777d]">Jul 14, 2026</td>
                    <td className="py-3.5 px-2">
                      <Badge variant="approved">Approved</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-2 font-bold text-[#111827]">Community Cleanliness Drive</td>
                    <td className="py-3.5 px-2 text-[#45464c]">Environment</td>
                    <td className="py-3.5 px-2 font-semibold">4.0 hrs</td>
                    <td className="py-3.5 px-2 text-[#76777d]">Jul 24, 2026</td>
                    <td className="py-3.5 px-2">
                      <Badge variant="pending">Pending Review</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Resume Status Card */}
        <Card className="space-y-6 flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#D4AF37]" /> QR-Verified Resume
              </CardTitle>
              <CardDescription>Your standardized resume is generated from your verified academic and volunteer history.</CardDescription>
            </CardHeader>
            <div className="p-4 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#76777d]">Verification Code:</span>
                <span className="font-mono font-bold text-[#111827]">MTM-2024-CS1092</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#76777d]">Last Generated:</span>
                <span className="font-semibold text-[#111827]">Jul 26, 2026</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#76777d]">Verified Hours Included:</span>
                <span className="font-semibold text-emerald-600">38.5 hrs</span>
              </div>
            </div>
          </div>

          <Link to="/student/resume" className="w-full">
            <Button variant="gold" size="md" className="w-full font-bold" icon={<ArrowRight className="w-4 h-4" />}>
              Open Resume Generator
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}
