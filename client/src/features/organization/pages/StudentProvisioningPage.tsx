import React, { useState } from 'react'
import { FileSpreadsheet, UploadCloud, CheckCircle2, AlertTriangle, Mail, RefreshCw, Key } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'

export const StudentProvisioningPage = () => {
  const [fileUploaded, setFileUploaded] = useState(false)
  const [validating, setValidating] = useState(false)

  const provisionedAccounts = [
    { name: 'Ananya Sharma', reg: '2024CS1092', email: 'ananya.sharma@student.maatram.org', status: 'Password Changed', tempPass: 'Mtm#9021', date: 'Jul 26, 2026' },
    { name: 'Karthik Raja', reg: '2024ME1105', email: 'karthik.r@student.maatram.org', status: 'Activated', tempPass: 'Mtm#4412', date: 'Jul 26, 2026' },
    { name: 'Meera Krishnan', reg: '2024EC1077', email: 'meera.k@student.maatram.org', status: 'Pending First Login', tempPass: 'Mtm#8819', date: 'Jul 28, 2026' },
    { name: 'Rohan Gupta', reg: '2024EE1021', email: 'rohan.g@student.maatram.org', status: 'Pending First Login', tempPass: 'Mtm#3310', date: 'Jul 28, 2026' },
  ]

  const handleUpload = () => {
    setValidating(true)
    setTimeout(() => {
      setValidating(false)
      setFileUploaded(true)
    }, 1200)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Bulk Student Enrollment System</h2>
          <p className="text-xs text-[#45464c]">Upload Excel rosters, validate register numbers, generate temp passwords, and dispatch credentials.</p>
        </div>
        <Button variant="outline" size="md" icon={<FileSpreadsheet className="w-4 h-4" />}>
          Download Excel Roster Template
        </Button>
      </div>

      {/* Excel Upload Area */}
      <Card className="p-8 bg-white border border-[#E5E7EB] rounded-2xl">
        {!fileUploaded ? (
          <div className="space-y-6 text-center">
            <div
              onClick={handleUpload}
              className="border-2 border-dashed border-[#E5E7EB] hover:border-[#D4AF37] bg-[#FCF8FA] rounded-2xl p-10 cursor-pointer transition-colors space-y-3"
            >
              <UploadCloud className="w-12 h-12 text-[#D4AF37] mx-auto" />
              <div>
                <p className="text-sm font-bold text-[#111827]">
                  {validating ? 'Validating Excel Sheet & Checking Duplicates...' : 'Click to Upload Student Roster Excel (.xlsx)'}
                </p>
                <p className="text-xs text-[#76777d]">Format: Full Name, Register No, Email, Zone, College Code, Department, Batch</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
            <div className="flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <p className="text-sm font-bold">Roster Validated Successfully! (120 Records)</p>
                <p className="text-xs">0 Duplicate Register Numbers found. Temporary passwords generated and credential emails dispatched to queue.</p>
              </div>
            </div>
            <Button variant="gold" size="sm" onClick={() => setFileUploaded(false)}>
              Upload Another Roster
            </Button>
          </div>
        )}
      </Card>

      {/* Provisioned Student Accounts Status Lifecycle */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Account Activation Status Directory</CardTitle>
            <CardDescription>Track first-login progress and temporary password status for imported accounts</CardDescription>
          </div>
          <Badge variant="gold">4 Accounts Managed</Badge>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#76777d] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 font-bold">Student Name</th>
                  <th className="py-3 px-3 font-bold">Register No.</th>
                  <th className="py-3 px-3 font-bold">Email Address</th>
                  <th className="py-3 px-3 font-bold">Generated Temp Password</th>
                  <th className="py-3 px-3 font-bold">Import Date</th>
                  <th className="py-3 px-3 font-bold">Account Lifecycle Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {provisionedAccounts.map((acc, idx) => (
                  <tr key={idx} className="hover:bg-[#FCF8FA] transition-colors">
                    <td className="py-3.5 px-3 font-bold text-[#111827]">{acc.name}</td>
                    <td className="py-3.5 px-3 text-[#76777d] font-mono">{acc.reg}</td>
                    <td className="py-3.5 px-3 text-[#45464c]">{acc.email}</td>
                    <td className="py-3.5 px-3 font-mono text-[#D4AF37] font-semibold">{acc.tempPass}</td>
                    <td className="py-3.5 px-3 text-[#76777d]">{acc.date}</td>
                    <td className="py-3.5 px-3">
                      <Badge
                        variant={
                          acc.status === 'Password Changed'
                            ? 'approved'
                            : acc.status === 'Activated'
                            ? 'info'
                            : 'pending'
                        }
                      >
                        {acc.status}
                      </Badge>
                    </td>
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
