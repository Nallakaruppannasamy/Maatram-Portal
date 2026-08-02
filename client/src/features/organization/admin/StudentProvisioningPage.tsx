import React, { useState, useEffect, useRef, ChangeEvent, DragEvent, useCallback } from 'react'
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Mail,
  RefreshCw,
  Eye,
  EyeOff,
  Search,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

// ─── Type Definitions ────────────────────────────────────────────────────────

interface StudentRecord {
  id: string
  registrationNumber: string
  fullName: string
  accountStatus: 'pending_first_login' | 'activated' | 'password_changed' | string
  createdAt: string
  user?: {
    email?: string
    tempPassword?: string
    accountStatus?: string
  }
}

interface ImportSummary {
  totalRows: number
  successCount: number
  duplicateCount: number
  errorCount: number
  fileName: string
}

export const StudentProvisioningPage: React.FC = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  // State Management
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [validating, setValidating] = useState(false)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [resendingId, setResendingId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Auth Header Helper
  const getAuthHeaders = () => {
    const token = localStorage.getItem('svms_token')
    return {
      Authorization: `Bearer ${token || ''}`,
    }
  }

  // ─── 1. Load Live Students from Database ─────────────────────────────────
  const fetchStudents = useCallback(async (query = '') => {
    setLoadingList(true)
    try {
      const response = await axios.get(`${backendUrl}/api/v1/students`, {
        headers: getAuthHeaders(),
        params: {
          search: query || undefined,
          limit: 100,
        },
      })

      if (response.data.success) {
        setStudents(response.data.data || [])
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Failed to load student directory'
      toast.error(errMsg)
    } finally {
      setLoadingList(false)
    }
  }, [backendUrl])

  useEffect(() => {
    fetchStudents(searchQuery)
  }, [fetchStudents, searchQuery])

  // ─── 2. Handle Roster Export / Template Download ───────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/v1/students/export?format=csv`, {
        headers: getAuthHeaders(),
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Maatram_Student_Roster_${Date.now()}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Student roster CSV exported successfully')
    } catch {
      // Fallback CSV template generator if database is empty
      const csvHeader = 'Full Name,Register No,Email,Zone,College Code,Department,Batch\n'
      const sampleRow = 'Sample Student,2024CS1001,sample.s@student.maatram.org,ZONE-1,MIT-CHE,CSE,2024-2028\n'
      const blob = new Blob([csvHeader + sampleRow], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Maatram_Student_Enrollment_Template.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.info('Downloaded student enrollment CSV template')
    }
  }

  // ─── 3. Bulk CSV / Excel Upload to Backend ────────────────────────────────
  const processFileUpload = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Invalid file format! Please upload an Excel (.xlsx, .xls) or CSV file.')
      return
    }

    setValidating(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${backendUrl}/api/v1/students/import`, formData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      })

      if (response.data.success) {
        const report = response.data.data
        setImportSummary({
          totalRows: report.totalRows || report.successCount || 0,
          successCount: report.successCount || 0,
          duplicateCount: report.duplicateCount || 0,
          errorCount: report.errorCount || 0,
          fileName: file.name,
        })
        setFileUploaded(true)
        toast.success(`Successfully imported ${report.successCount || 0} student records!`)
        fetchStudents(searchQuery)
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Roster import failed. Please check file columns.'
      toast.error(errMsg)
    } finally {
      setValidating(false)
    }
  }

  // Drag and Drop Handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFileUpload(e.target.files[0])
    }
  }

  // ─── 4. Helpers ─────────────────────────────────────────────────────────────
  const togglePasswordVisibility = (id: string) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const formatStatus = (status: string) => {
    switch (status) {
      case 'password_changed':
      case 'Password Changed':
        return { label: 'Password Changed', variant: 'approved' as const }
      case 'activated':
      case 'Activated':
        return { label: 'Activated', variant: 'info' as const }
      default:
        return { label: 'Pending First Login', variant: 'pending' as const }
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 antialiased selection:bg-[#D4AF37]/20 selection:text-[#111827]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Bulk Student Enrollment System
          </h2>
          <p className="text-xs text-[#45464c] mt-0.5">
            Upload CSV/Excel rosters, generate temporary credentials, and manage active student accounts.
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          onClick={handleDownloadTemplate}
          className="border-[#E5E7EB] text-[#111827] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all flex items-center gap-2 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
          Export Roster / Download Template
        </Button>
      </div>

      {/* Roster Upload Dropzone Card */}
      <Card className="p-8 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {!fileUploaded ? (
          <div className="space-y-6 text-center">
            <div
              onClick={() => !validating && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all space-y-3 ${isDragging
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5 scale-[0.99]'
                  : 'border-[#E5E7EB] hover:border-[#D4AF37] bg-[#FCF8FA]'
                }`}
            >
              {validating ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-[#111827]">
                      Processing Roster & Creating Database Records...
                    </p>
                    <p className="text-xs text-[#76777d]">Parsing CSV rows and validating organization keys</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 bg-white border border-[#E5E7EB] rounded-full flex items-center justify-center mx-auto shadow-xs text-[#D4AF37]">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#111827]">
                      Click to Upload or Drag & Drop Student Roster (.xlsx, .csv)
                    </p>
                    <p className="text-xs text-[#76777d] mt-1">
                      Required CSV Columns: Full Name, Register No, Email, Zone, College Code, Department, Batch
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 text-emerald-900">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">
                      Roster Imported Successfully! ({importSummary?.successCount || 0} Records Created)
                    </p>
                    <Badge variant="approved" className="text-[10px]">
                      {importSummary?.fileName || 'Roster.csv'}
                    </Badge>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {importSummary?.duplicateCount || 0} duplicates skipped. Database records and credentials generated.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFileUploaded(false)
                  setImportSummary(null)
                }}
                className="bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-100/50 shrink-0"
              >
                Upload Another Roster
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Account Activation Directory Table */}
      <Card className="border border-[#E5E7EB] bg-white rounded-2xl overflow-hidden shadow-xs">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-5">
          <div>
            <CardTitle className="text-lg font-extrabold text-[#111827]">
              Account Activation Directory
            </CardTitle>
            <CardDescription className="text-xs text-[#45464c]">
              Live database records of student accounts, activation status, and temporary passwords
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#76777d]" />
              <input
                type="text"
                placeholder="Search student or reg no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl focus:outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>
            <Badge variant="gold" className="shrink-0 font-bold px-3 py-1">
              {students.length} Accounts Found
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#FCF8FA] text-[#76777d] uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-bold">Student Name</th>
                  <th className="py-3.5 px-4 font-bold">Register No.</th>
                  <th className="py-3.5 px-4 font-bold">Email Address</th>
                  <th className="py-3.5 px-4 font-bold">Temp Password</th>
                  <th className="py-3.5 px-4 font-bold">Import Date</th>
                  <th className="py-3.5 px-4 font-bold">Lifecycle Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {loadingList ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#76777d]">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#D4AF37] mb-2" />
                      <span className="text-xs">Loading live student database records...</span>
                    </td>
                  </tr>
                ) : students.length > 0 ? (
                  students.map((student) => {
                    const isVisible = !!showPasswords[student.id]
                    const userEmail = student.user?.email || 'N/A'
                    const tempPassword = student.user?.tempPassword || 'Set by user'
                    const rawStatus = student.user?.accountStatus || student.accountStatus || 'pending_first_login'
                    const statusInfo = formatStatus(rawStatus)

                    return (
                      <tr key={student.id} className="hover:bg-[#FCF8FA]/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#111827]">{student.fullName}</td>
                        <td className="py-3.5 px-4 text-[#76777d] font-mono">{student.registrationNumber}</td>
                        <td className="py-3.5 px-4 text-[#45464c]">{userEmail}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#D4AF37]">
                          <div className="flex items-center gap-2">
                            <span>{isVisible ? tempPassword : '••••••••'}</span>
                            {tempPassword !== 'Set by user' && (
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(student.id)}
                                className="text-[#76777d] hover:text-[#111827] transition-colors focus:outline-none"
                                title={isVisible ? 'Hide Password' : 'Show Password'}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#76777d]">{formatDate(student.createdAt)}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-[#76777d] text-xs">
                      No matching student accounts found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StudentProvisioningPage