import React from 'react'
import { BarChart3, TrendingUp, Users, Award, HeartHandshake } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export const ZoneAnalyticsPage = () => {
  const collegeData = [
    { name: 'MIT Chennai', hours: 3200, students: 140 },
    { name: 'CEG Guindy', hours: 2800, students: 180 },
    { name: 'SSN College', hours: 1600, students: 110 },
    { name: 'Loyola Inst', hours: 820, students: 50 },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Zone 1 Analytics Dashboard</h2>
        <p className="text-xs text-[#45464c]">College-wise participation metrics, volunteer hour distribution, and approval trends.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>College-Wise Volunteer Hours Distribution</CardTitle>
            <CardDescription>Cumulative approved hours contributed by each partner college</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collegeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#76777d" fontSize={11} />
                <YAxis stroke="#76777d" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="hours" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Top Zone Performers</CardTitle>
            <CardDescription>Highest volunteer contributors in Chennai Zone 1</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {[
              { name: 'Priya Dharshini', college: 'SSN College', hours: 54.0 },
              { name: 'Ananya Sharma', college: 'MIT Chennai', hours: 42.5 },
              { name: 'Karthik Raja', college: 'CEG Guindy', hours: 38.0 },
            ].map((perf, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-[#111827]">{perf.name}</p>
                    <p className="text-[10px] text-[#76777d]">{perf.college}</p>
                  </div>
                </div>
                <Badge variant="gold">{perf.hours} hrs</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
