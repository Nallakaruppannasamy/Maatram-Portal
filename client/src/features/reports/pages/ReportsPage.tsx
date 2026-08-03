import React from 'react'
import { FileText, Download, FileSpreadsheet } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { studentApi } from '@/api/student.api'
import { notify } from '@/utils/toast'

export const ReportsPage = () => {
  const handleExportRoster = async () => {
    try {
      const blob = await studentApi.exportCSV()
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Maatram_Master_Report_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      notify.success('Report exported successfully!')
    } catch {
      notify.error('Failed to export report CSV.')
    }
  }

  const reports = [
    { title: 'Student Master Roster Report', desc: 'Complete directory of students with verified hours and academic profile', format: 'CSV' },
    { title: 'Volunteer Hours Impact Summary', desc: 'Category-wise breakdown of volunteer hours across all zones', format: 'CSV' },
    { title: 'Zone Performance Ranking Report', desc: 'Zone approval rates, active student ratios, and metrics', format: 'CSV' },
    { title: 'College-Wise Academic & Volunteer Audit', desc: 'Correlated academic and volunteering hours report', format: 'CSV' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">On-Demand Reports Module</h2>
        <p className="text-xs text-[#45464c]">Generate and export audit-ready CSV reports for foundation leadership.</p>
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
              <Button
                variant="gold"
                size="sm"
                className="w-full"
                icon={<Download className="w-4 h-4" />}
                onClick={handleExportRoster}
              >
                Export Report Dataset ({rep.format})
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ReportsPage
