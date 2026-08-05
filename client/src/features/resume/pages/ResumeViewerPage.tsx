import React from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Printer, AlertCircle } from 'lucide-react'
import { resumeApi } from '@/api/resume.api'
import { ResumeTemplate } from '../components/ResumeTemplate'
import { Button } from '@/components/ui/Button'
import { LoadingPage } from '@/components/ui/LoadingPage'

export const ResumeViewerPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>()

  const { data: resumeRes, isLoading, error } = useQuery({
    queryKey: ['resume', studentId],
    queryFn: () => resumeApi.get(studentId || ''),
    enabled: !!studentId,
    retry: false,
  })

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return <LoadingPage message="Retrieving student portfolio and rendering resume..." />
  }

  if (error || !resumeRes?.success || !resumeRes?.data) {
    const status = (error as any)?.response?.status
    const apiErr = (error as any)?.response?.data || {}
    const message = apiErr.message || (status === 404 ? 'The requested student resume portfolio was not found.' : 'You are unauthorized to view this student\'s resume portfolio.')
    const title = status === 404 ? 'Resume Not Found (404)' : 'Access Denied (403)'
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-2xl shadow-xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
          <div className="pt-2">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const resumeData = resumeRes.data

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 print:bg-white print:py-0 print:px-0 flex flex-col items-center gap-6 font-sans">
      {/* Printable Header Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between no-print bg-white p-4 border border-gray-200 rounded-xl shadow-sm">
        <div>
          <h2 className="text-base font-bold text-gray-900">Student Portfolio Resume</h2>
          <p className="text-[10px] text-gray-500">Official verified resume document from academic database.</p>
        </div>
        <Button variant="gold" size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
          Print / Save PDF
        </Button>
      </div>

      {/* Render presentational template */}
      <ResumeTemplate data={resumeData} />
    </div>
  )
}

export default ResumeViewerPage
