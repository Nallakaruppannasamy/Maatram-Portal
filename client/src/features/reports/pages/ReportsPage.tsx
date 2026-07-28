import React from 'react'
import { FileText, Download, FileSpreadsheet, Printer } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const ReportsPage = () => {
  const reports = [
    { title: 'Student Master Roster Report', desc: 'Complete directory of students with CGPA and total verified hours', format: 'Excel / PDF' },
    { title: 'Volunteer Hours Impact Summary', desc: 'Category-wise breakdown of volunteer hours across all zones', format: 'Excel / PDF' },
    { title: 'Zone Performance Ranking Report', desc: 'Zone approval rates, active student ratios, and metrics', format: 'Excel / PDF' },
    { title: 'College-Wise Academic & Volunteer Audit', desc: 'Correlated academic CGPA and volunteering hours report', format: 'Excel / PDF' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">On-Demand Reports Module</h2>
        <p className="text-xs text-[#45464c]">Generate and export audit-ready PDF and Excel reports for foundation leadership.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((rep, idx) => (
          <Card key={idx} hoverable className="p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="gold" className="font-mono text-[10px]">Exportable</Badge>
                <FileText className="w-5 h-5 text-[#D4AF37]" />
              </div>
              <h3 className="text-base font-bold text-[#111827]">{rep.title}</h3>
              <p className="text-xs text-[#45464c]">{rep.desc}</p>
            </div>

            <div className="flex gap-3 pt-3 border-t border-[#E5E7EB]">
              <Button variant="outline" size="sm" className="flex-1" icon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}>
                Export Excel
              </Button>
              <Button variant="gold" size="sm" className="flex-1" icon={<Download className="w-4 h-4" />}>
                Export PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
