import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { TableLoader } from '@/components/ui/TableLoader'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { volunteerApi } from '@/api/volunteer.api'
import { studentApi } from '@/api/student.api'

export const ZoneAnalyticsPage = () => {
  const { data: volunteersRes, isLoading: isVolunteersLoading } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => volunteerApi.list(),
  })

  const { data: studentsRes, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.list(),
  })

  const volunteers = volunteersRes?.data || []
  const students = studentsRes?.data || []

  // Aggregate category-wise volunteer hours
  const categoryHoursMap: Record<string, number> = {}
  volunteers.forEach((v) => {
    const cat = v.category || 'General'
    const hrs = Number(v.hours) || 0
    categoryHoursMap[cat] = (categoryHoursMap[cat] || 0) + hrs
  })

  const categoryChartData = Object.entries(categoryHoursMap).map(([name, hours]) => ({
    name,
    hours,
  }))

  // Top volunteer contributors
  const studentHoursMap: Record<string, { name: string; hours: number }> = {}
  volunteers.forEach((v) => {
    const sId = v.studentId || 'unknown'
    const hrs = Number(v.hours) || 0
    if (!studentHoursMap[sId]) {
      studentHoursMap[sId] = { name: v.title || 'Scholar Student', hours: 0 }
    }
    studentHoursMap[sId].hours += hrs
  })

  const topPerformers = Object.values(studentHoursMap)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5)

  if (isVolunteersLoading || isStudentsLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Zone Analytics Dashboard</h2>
          <p className="text-xs text-[#45464c]">Category-wise participation metrics and volunteer hour distribution.</p>
        </div>
        <TableLoader rows={4} columns={4} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Zone Analytics Dashboard</h2>
        <p className="text-xs text-[#45464c]">Category-wise participation metrics and volunteer hour distribution.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Category-Wise Volunteer Hours Distribution</CardTitle>
            <CardDescription>Cumulative approved hours contributed by activity category</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                No volunteer activity data recorded yet to render chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#76777d" fontSize={11} />
                  <YAxis stroke="#76777d" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="hours" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Top Zone Performers</CardTitle>
            <CardDescription>Highest volunteer contributors in your zone</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {topPerformers.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-500">
                No active contributors yet.
              </div>
            ) : (
              topPerformers.map((perf, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-xs text-[#111827]">{perf.name}</p>
                      <p className="text-[10px] text-[#76777d]">Active Scholar</p>
                    </div>
                  </div>
                  <Badge variant="gold">{perf.hours} hrs</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ZoneAnalyticsPage
