import React from 'react'
import { CheckSquare, Search, Filter, Shield, Clock, Download } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'

export const AuditLogsPage = () => {
  const auditEntries = [
    {
      id: 'AUD-9021',
      actor: 'Dr. Ramesh Kumar (Zone Incharge)',
      action: 'VOLUNTEER_LOG_APPROVED',
      target: 'Ananya Sharma (2024CS1092)',
      details: 'Approved 6.0 hrs for Blood Donation Drive Coordination',
      ip: '192.168.1.45',
      timestamp: 'Jul 28, 2026 • 14:32:05',
    },
    {
      id: 'AUD-9020',
      actor: 'Super Admin (System)',
      action: 'BULK_STUDENT_IMPORT',
      target: 'Roster_Batch2026_Zone1.xlsx',
      details: 'Imported 120 student accounts. 0 Duplicates.',
      ip: '10.0.4.12',
      timestamp: 'Jul 28, 2026 • 11:15:22',
    },
    {
      id: 'AUD-9019',
      actor: 'Ananya Sharma (Student)',
      action: 'FIRST_LOGIN_PASSWORD_CHANGED',
      target: 'Account Activation',
      details: 'Mandatory initial password reset completed successfully',
      ip: '49.207.18.90',
      timestamp: 'Jul 26, 2026 • 18:04:10',
    },
    {
      id: 'AUD-9018',
      actor: 'Arun Sundaram (Super Admin)',
      action: 'ZONE_INCHARGE_CREATED',
      target: 'Prof. S. Lakshmi',
      details: 'Assigned Zone Incharge role for Zone 2 (Coimbatore)',
      ip: '10.0.4.12',
      timestamp: 'Jul 25, 2026 • 09:40:00',
    },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">System Audit & Compliance Log</h2>
          <p className="text-xs text-[#45464c]">Traceable system audit trail logging all administrative actions, data edits, and approvals.</p>
        </div>
        <Button variant="outline" size="md" icon={<Download className="w-4 h-4" />}>
          Export Audit Logs (CSV)
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative w-80">
            <Input icon={<Search className="w-4 h-4" />} placeholder="Search actor, action, or log ID..." />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Filter className="w-4 h-4" />}>
              Filter Module
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#76777d] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 font-bold">Log ID</th>
                  <th className="py-3 px-3 font-bold">Actor Profile</th>
                  <th className="py-3 px-3 font-bold">Action Code</th>
                  <th className="py-3 px-3 font-bold">Target Entity</th>
                  <th className="py-3 px-3 font-bold">Action Details</th>
                  <th className="py-3 px-3 font-bold">IP Address</th>
                  <th className="py-3 px-3 font-bold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {auditEntries.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FCF8FA] transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-[#D4AF37]">{log.id}</td>
                    <td className="py-3.5 px-3 font-bold text-[#111827]">{log.actor}</td>
                    <td className="py-3.5 px-3">
                      <Badge variant="gold" className="font-mono text-[10px]">{log.action}</Badge>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#111827]">{log.target}</td>
                    <td className="py-3.5 px-3 text-[#45464c] max-w-xs">{log.details}</td>
                    <td className="py-3.5 px-3 font-mono text-[#76777d] text-[10px]">{log.ip}</td>
                    <td className="py-3.5 px-3 text-[#76777d] text-[10px]">{log.timestamp}</td>
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
