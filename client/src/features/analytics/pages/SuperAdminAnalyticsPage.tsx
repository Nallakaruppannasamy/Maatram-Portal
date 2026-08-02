import React from 'react'
import { BarChart3, TrendingUp, Award, HeartHandshake, Users } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export const SuperAdminAnalyticsPage = () => {
  const zoneHoursData = [
    { zone: 'Zone 1 (Chennai)', hours: 8420 },
    { zone: 'Zone 2 (Coimbatore)', hours: 7150 },
    { zone: 'Zone 3 (Madurai)', hours: 5900 },
    { zone: 'Zone 4 (Trichy)', hours: 4800 },
    { zone: 'Zone 5 (Salem)', hours: 3900 },
  ]

  const growthTrend = [
    { month: 'Jan', hours: 2400 },
    { month: 'Feb', hours: 3100 },
    { month: 'Mar', hours: 4200 },
    { month: 'Apr', hours: 5800 },
    { month: 'May', hours: 6900 },
    { month: 'Jun', hours: 7800 },
    { month: 'Jul', hours: 8420 },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Organization-Wide Analytics</h2>
        <p className="text-xs text-[#45464c]">Zone rankings, monthly growth trends, academic CGPA vs volunteer impact metrics.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Volunteering Hours Growth Trend</CardTitle>
            <CardDescription>Cumulative approved volunteer hours across all 14 zones</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#76777d" fontSize={11} />
                <YAxis stroke="#76777d" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Line type="monotone" dataKey="hours" stroke="#D4AF37" strokeWidth={3} dot={{ fill: '#D4AF37', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Zone Volunteering Contributions</CardTitle>
            <CardDescription>Comparing total verified volunteer hours across foundation zones</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneHoursData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" stroke="#76777d" fontSize={11} />
                <YAxis dataKey="zone" type="category" stroke="#76777d" fontSize={10} width={120} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="hours" fill="#111827" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
