import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Printer, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { profileApi } from '@/api/profile.api'
import { resumeApi } from '@/api/resume.api'
import { useAuth } from '@/hooks/useAuth'
import { ResumeTemplate } from '../components/ResumeTemplate'

export const ResumeGeneratorPage = () => {
  const { user } = useAuth()

  // Fetch logged in user's profile to get studentId
  const { data: profileRes, isLoading: isProfileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  })

  const profile = profileRes?.data
  const studentId = profile?.id

  // Fetch complete resume details once studentId is available
  const { data: resumeRes, isLoading: isResumeLoading, error } = useQuery({
    queryKey: ['resume', studentId],
    queryFn: () => resumeApi.get(studentId || ''),
    enabled: !!studentId && user?.role === 'student',
    retry: false,
  })

  const handlePrint = () => {
    window.print()
  }

  if (isProfileLoading || (isResumeLoading && user?.role === 'student')) {
    return <LoadingPage message="Generating student resume from verified records..." />
  }

  // If user is Admin or Zone, they shouldn't view a resume here without studentId
  if (user?.role !== 'student') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-md p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-blue-900">
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Resume Builder Console</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            As a <strong>{user?.role?.toUpperCase()}</strong> incharge, you can view individual student resumes directly by clicking their Register Numbers in the Student Directory.
          </p>
        </div>
      </div>
    )
  }

  if (error || !resumeRes?.success || !resumeRes?.data) {
    const apiErr = (error as any)?.response?.data || {}
    const message = apiErr.message || 'Failed to compile resume. Please ensure profile is complete.'
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="bg-white border border-red-200 rounded-2xl shadow-md p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Resume Error</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto">{message}</p>
        </div>
      </div>
    )
  }

  const resumeData = resumeRes.data

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Verified Student Resume Builder</h2>
          <p className="text-xs text-[#45464c]">
            Standardized, exportable resume populated directly from your verified academic records and approved volunteer logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="gold" size="md" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Print / Save PDF
          </Button>
        </div>
      </div>

      {/* Interactive PDF Paper Preview */}
      <div className="flex justify-center">
        <ResumeTemplate data={resumeData} />
      </div>
    </div>
  )
}

export default ResumeGeneratorPage
