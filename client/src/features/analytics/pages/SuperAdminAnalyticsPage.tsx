import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { TableLoader } from '@/components/ui/TableLoader'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { volunteerApi } from '@/api/volunteer.api'
import { zoneApi } from '@/api/zone.api'
import { studentApi } from '@/api/student.api'

export const SuperAdminAnalyticsPage = () => {
  const { data: volunteersRes, isLoading: isVolunteersLoading } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => volunteerApi.list(),
  })

  const { data: zonesRes, isLoading: isZonesLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneApi.list(),
  })

  const { data: studentsRes, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.list(),
  })

  const volunteers = volunteersRes?.data || []
  const zones = zonesRes?.data || []
  const students = studentsRes?.data || []

  // Aggregate category-wise hours
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

  // Aggregate zone-wise student counts
  const zoneStudentMap: Record<string, number> = {}
  zones.forEach((z) => {
    zoneStudentMap[z.name] = 0
  })

  students.forEach((s) => {
    const zName = s.zone?.name || s.operationalZone || 'Zone 1'
    zoneStudentMap[zName] = (zoneStudentMap[zName] || 0) + 1
  })

  const zoneChartData = Object.entries(zoneStudentMap).map(([zone, count]) => ({
    zone,
    count,
  }))

  if (isVolunteersLoading || isZonesLoading || isStudentsLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Organization-Wide Analytics</h2>
          <p className="text-xs text-[#45464c]">Zone distribution, category volunteer metrics, and student rosters.</p>
        </div>
        <TableLoader rows={4} columns={4} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Organization-Wide Analytics</h2>
        <p className="text-xs text-[#45464c]">Zone distribution, category volunteer metrics, and student rosters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Volunteering Hours by Category</CardTitle>
            <CardDescription>Cumulative approved volunteer hours across activity categories</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                No volunteer data available to render chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#76777d" fontSize={11} />
                  <YAxis stroke="#76777d" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="hours" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Distribution Across Zones</CardTitle>
            <CardDescription>Comparing total enrolled scholars across active zones</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            {zoneChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-gray-500">
                No zone data available to render chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#76777d" fontSize={11} />
                  <YAxis dataKey="zone" type="category" stroke="#76777d" fontSize={10} width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#111827" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SuperAdminAnalyticsPage
