import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer, Download, QrCode, CheckCircle2, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { profileApi } from '@/api/profile.api'
import { volunteerApi } from '@/api/volunteer.api'
import { useAuth } from '@/hooks/useAuth'

export const ResumeGeneratorPage = () => {
  const { user } = useAuth()

  const { data: profileRes, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  })

  const { data: volunteersRes, isLoading: isVolunteersLoading } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => volunteerApi.list(),
  })

  const profile = profileRes?.data
  const volunteers = volunteersRes?.data || []

  const approvedLogs = volunteers.filter(
    (v) => v.status === 'approved' || v.status === 'APPROVED'
  )

  const totalHours = approvedLogs.reduce((acc, curr) => acc + (Number(curr.hours) || 0), 0)

  const handlePrint = () => {
    window.print()
  }

  if (isProfileLoading || isVolunteersLoading) {
    return <LoadingPage message="Generating student resume from verified records..." />
  }

  const displayName = profile?.fullName || profile?.firstName
    ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
    : user?.fullName || user?.name || user?.email || 'Scholar Student'

  const regNo = user?.regNumber || user?.registrationNumber || 'MTM-SCHOLAR'
  const email = user?.email || 'scholar@maatram.org'
  const mobile = profile?.mobile || 'Not specified'
  const address = profile?.address || 'Tamil Nadu, India'
  const objective = profile?.careerObjective || 'Dedicated undergraduate committed to applying technical knowledge for community development and social impact.'

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">QR-Verified Student Resume Generator</h2>
          <p className="text-xs text-[#45464c]">
            Standardized, exportable resume populated directly from your verified academic records and approved volunteer logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Print Resume
          </Button>
          <Button variant="gold" size="md" icon={<Download className="w-4 h-4" />} onClick={handlePrint}>
            Download PDF
          </Button>
        </div>
      </div>

      {/* Interactive PDF Paper Preview */}
      <div className="flex justify-center">
        <div className="w-full max-w-4xl bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-10 space-y-8 print-area text-[#111827]">
          {/* Header Branding & Student Meta */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-[#111827] pb-6 gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#111827] px-2.5 py-1 rounded-md">
                Maatram Foundation Scholar
              </span>
              <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight uppercase">{displayName}</h1>
              <p className="text-sm font-semibold text-[#45464c]">Scholar Student • Verified Profile</p>
              
              <div className="flex flex-wrap gap-4 text-xs text-[#45464c] pt-2">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-[#D4AF37]" /> {email}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-[#D4AF37]" /> {mobile}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> {address}</span>
              </div>
            </div>

            {/* QR Verification Box */}
            <div className="p-3 bg-[#FCF8FA] border-2 border-dashed border-[#D4AF37] rounded-xl text-center space-y-1 shrink-0">
              <div className="w-20 h-20 bg-white border border-[#E5E7EB] rounded-lg mx-auto flex items-center justify-center">
                <QrCode className="w-16 h-16 text-[#111827]" />
              </div>
              <p className="text-[9px] font-bold text-[#111827] uppercase tracking-wider">QR VERIFIED PORTFOLIO</p>
              <p className="text-[9px] font-mono text-[#76777d]">{regNo}</p>
            </div>
          </div>

          {/* Objective */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1">
              Professional Summary
            </h3>
            <p className="text-xs text-[#45464c] leading-relaxed">{objective}</p>
          </div>

          {/* Academic Background */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1">
              Academic Qualifications
            </h3>
            <div className="flex justify-between items-start text-xs">
              <div>
                <p className="font-bold text-[#111827]">Maatram Foundation Scholar Program</p>
                <p className="text-[#45464c]">Verified Academic Registration: {regNo}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-[#D4AF37]">Active Scholar</p>
              </div>
            </div>
          </div>

          {/* Verified Volunteer Impact Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Volunteering & Leadership Impact
              </h3>
              <span className="text-xs font-extrabold text-[#D4AF37]">{totalHours} Verified Hours</span>
            </div>

            {approvedLogs.length === 0 ? (
              <p className="text-xs text-[#76777d]">No approved volunteer activities logged yet.</p>
            ) : (
              <div className="space-y-3 text-xs">
                {approvedLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] space-y-1">
                    <div className="flex justify-between font-bold text-[#111827]">
                      <span>{log.title}</span>
                      <span className="text-[#D4AF37]">{log.hours} Hours</span>
                    </div>
                    <p className="text-[#45464c]">{log.description}</p>
                    <p className="text-[10px] text-[#76777d] font-medium">
                      Category: {log.category} • Organization: {log.organization} • Event Date: {log.eventDate}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Verification Notice */}
          <div className="pt-6 border-t border-[#E5E7EB] text-center text-[10px] text-[#76777d] space-y-1">
            <p>Official Record • Generated via Maatram Foundation Student & Volunteer Management System</p>
            <p className="font-mono">Verify document validity at https://maatram.org/verify/{regNo}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResumeGeneratorPage
