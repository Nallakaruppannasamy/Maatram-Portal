import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export const AuditLogsPage = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">System Audit & Compliance Log</h2>
          <p className="text-xs text-[#45464c]">Traceable system audit trail logging all administrative actions, data edits, and approvals.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="info">Backend Version 1.0.1</Badge>
            <CardTitle>Audit Log Service Status</CardTitle>
          </div>
          <CardDescription>System auditing and security compliance integration</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center space-y-3">
          <p className="text-sm font-bold text-[#111827]">
            Audit log API not available in Version 1.
          </p>
          <p className="text-xs text-[#76777d] max-w-md mx-auto">
            All database mutations, volunteer status changes, and user lifecycle updates are recorded securely in server application logs. Direct UI audit log query APIs will be enabled in a future release.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuditLogsPage
