import React, { useState, useRef, ChangeEvent, DragEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Search,
  Loader2,
  Plus,
  Download,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { studentApi } from '@/api/student.api'
import { userApi } from '@/api/user.api'
import { notify } from '@/utils/toast'
import { useDebounce } from '@/hooks/useDebounce'

interface ImportSummary {
  totalRows: number
  successCount: number
  duplicateCount: number
  errorCount: number
  fileName: string
}

export const StudentProvisioningPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [fileUploaded, setFileUploaded] = useState(false)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [importErrors, setImportErrors] = useState<{ row: number; error: string }[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  // Pagination states
  const [page, setPage] = useState(1)
  const [limit] = useState(10)

  // Manual Provisioning Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newStudent, setNewStudent] = useState({
    studentName: '',
    registrationNumber: '',
    email: '',
    dateOfBirth: '',
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const debouncedSearch = useDebounce(searchQuery, 400)

  // Reset page to 1 when search changes
  React.useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const { data: studentsRes, isLoading: loadingList } = useQuery({
    queryKey: ['students', 'provisioning', debouncedSearch, page],
    queryFn: () => studentApi.list({ search: debouncedSearch, page, limit, view: 'provisioning' }),
  })

  const students = studentsRes?.data || []
  const meta = studentsRes?.meta || studentsRes?.pagination || { total: 0, totalPages: 1 }

  const importMutation = useMutation({
    mutationFn: (file: File) => studentApi.importCSV(file),
    onSuccess: (res, file) => {
      if (res.success) {
        const report = res.data || {}
        setImportSummary({
          totalRows: report.totalRows || report.successCount || 0,
          successCount: report.successCount || 0,
          duplicateCount: report.duplicateCount || 0,
          errorCount: report.errorCount || 0,
          fileName: file.name,
        })
        setImportErrors([])
        setFileUploaded(true)
        notify.success(`Successfully imported ${report.successCount || 0} student records!`)
        queryClient.invalidateQueries({ queryKey: ['students'] })
      } else {
        notify.error(res.message || 'Roster import failed.')
      }
    },
    onError: (err: any) => {
      const errorData = err?.response?.data
      if (errorData?.data?.errors) {
        setImportErrors(errorData.data.errors)
        setImportSummary({
          totalRows: errorData.data.totalRows || 0,
          successCount: 0,
          duplicateCount: errorData.data.duplicateCount || 0,
          errorCount: errorData.data.errorCount || 0,
          fileName: 'Import File',
        })
        setFileUploaded(false)
        notify.error('Import failed with validation errors. Review the report below.')
      } else {
        notify.error(err?.response?.data?.message || err?.message || 'Roster import failed.')
      }
    },
  })

  const manualMutation = useMutation({
    mutationFn: (payload: typeof newStudent) => studentApi.manualRegister(payload),
    onSuccess: (res) => {
      if (res.success) {
        notify.success('Student manually provisioned successfully!')
        setIsModalOpen(false)
        setNewStudent({ studentName: '', registrationNumber: '', email: '', dateOfBirth: '' })
        queryClient.invalidateQueries({ queryKey: ['students'] })
      } else {
        notify.error(res.message || 'Failed to provision student.')
      }
    },
    onError: (err: any) => {
      notify.error(err?.response?.data?.message || err?.message || 'Error provisioning student.')
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: string; active: boolean }) =>
      active ? userApi.activate(userId) : userApi.deactivate(userId),
    onSuccess: (_, variables) => {
      notify.success(`Student account ${variables.active ? 'activated' : 'deactivated'} successfully!`)
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (err: any) => {
      notify.error(err?.response?.data?.message || err?.message || 'Failed to update account status.')
    },
  })

  const handleDownloadTemplate = async () => {
    try {
      const blob = await studentApi.downloadTemplate()
      const url = window.URL.createObjectURL(
        new Blob([blob], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      )
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'Maatram_Student_Import_Template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      notify.success('Template downloaded successfully')
    } catch {
      notify.error('Failed to download student import template.')
    }
  }

  const handleExportProvisioning = async () => {
    try {
      // Export current provisioning table (respecting search, sorting, and pagination)
      const blob = await studentApi.exportCSV({
        search: debouncedSearch,
        page,
        limit,
        format: 'xlsx',
        view: 'provisioning',
      })
      const url = window.URL.createObjectURL(
        new Blob([blob], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      )
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Maatram_Student_Roster_${Date.now()}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      notify.success('Student roster exported successfully')
    } catch {
      notify.error('Failed to export student roster.')
    }
  }

  const processFileUpload = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      notify.error('Invalid file format! Please upload an Excel (.xlsx, .xls) or CSV file.')
      return
    }

    setImportSummary(null)
    setImportErrors([])
    setFileUploaded(false)
    importMutation.mutate(file)
  }

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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newStudent.studentName) {
      notify.error('Student Name is required')
      return
    }
    if (!newStudent.registrationNumber) {
      notify.error('Register Number is required')
      return
    }
    if (!newStudent.email) {
      notify.error('Email is required')
      return
    }
    if (!newStudent.dateOfBirth) {
      notify.error('Date of Birth is required')
      return
    }

    manualMutation.mutate(newStudent)
  }

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

  const formatDate = (dateStr?: string) => {
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
            Student Provisioning & Enrollment
          </h2>
          <p className="text-xs text-[#45464c] mt-0.5">
            Provision student accounts manually or via bulk Excel imports, and track temporary activation credentials.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={handleDownloadTemplate}
            className="border-[#E5E7EB] text-[#111827] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all flex items-center gap-2 cursor-pointer bg-white"
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            Download Template
          </Button>

          <Button
            variant="outline"
            size="md"
            onClick={handleExportProvisioning}
            className="border-[#E5E7EB] text-[#111827] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all flex items-center gap-2 cursor-pointer bg-white"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
            Export Current Table
          </Button>

          <Button
            variant="gold"
            size="md"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Bulk Excel Upload Dropzone Card */}
      <Card className="p-8 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {!fileUploaded && importErrors.length === 0 ? (
          <div className="space-y-6 text-center">
            <div
              onClick={() => !importMutation.isPending && fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all space-y-3 ${
                isDragging
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5 scale-[0.99]'
                  : 'border-[#E5E7EB] hover:border-[#D4AF37] bg-[#FCF8FA]'
              }`}
            >
              {importMutation.isPending ? (
                <div className="flex flex-col items-center gap-3 py-2">
                  <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin" />
                  <div>
                    <p className="text-sm font-bold text-[#111827]">
                      Processing Roster & Syncing Database...
                    </p>
                    <p className="text-xs text-[#76777d]">
                      Validating file rows transactionally
                    </p>
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
                      Required Columns: Student Name, Register Number, Email, Date Of Birth
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : fileUploaded ? (
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
                      {importSummary?.fileName || 'Roster.xlsx'}
                    </Badge>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Welcome credential emails have been sent to all registered students.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFileUploaded(false)
                  setImportSummary(null)
                  setImportErrors([])
                }}
                className="bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-100/50 shrink-0"
              >
                Upload Another Roster
              </Button>
            </div>
          </div>
        ) : (
          /* Detailed Row Validation Failures display */
          <div className="space-y-4 p-5 bg-red-50 rounded-2xl border border-red-200 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-200 pb-3">
              <div className="flex items-start gap-3 text-red-900">
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">
                    Import Failed! ({importSummary?.errorCount || 0} Row Errors Found)
                  </p>
                  <p className="text-xs text-red-800 mt-0.5">
                    The entire sheet upload was rolled back. Correct the errors below and try again.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFileUploaded(false)
                  setImportSummary(null)
                  setImportErrors([])
                }}
                className="bg-white border-red-200 text-red-800 hover:bg-red-100/50 shrink-0"
              >
                Reset Upload
              </Button>
            </div>
            <div className="max-h-60 overflow-y-auto rounded-xl border border-red-200 bg-white divide-y divide-red-100">
              {importErrors.map((err, i) => (
                <div key={i} className="px-4 py-2.5 flex justify-between gap-4 text-xs text-red-700">
                  <span className="font-semibold shrink-0">Row {err.row}:</span>
                  <span className="text-left w-full">{err.error}</span>
                </div>
              ))}
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
              {meta.total} Accounts Found
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
                  <th className="py-3.5 px-4 font-bold">Account Status</th>
                  <th className="py-3.5 px-4 font-bold">Lifecycle Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {loadingList ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#76777d]">
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
                    const isUserActive = student.user?.isActive !== false
                    const targetUserId = student.userId || student.user?.id

                    return (
                      <tr key={student.id} className="hover:bg-[#FCF8FA]/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#111827]">
                          {student.fullName || (student.firstName ? `${student.firstName} ${student.lastName || ''}`.trim() : userEmail)}
                        </td>
                        <td className="py-3.5 px-4 text-[#76777d] font-mono">
                          {student.registrationNumber || student.regNumber || student.id.slice(0, 8)}
                        </td>
                        <td className="py-3.5 px-4 text-[#45464c]">{userEmail}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#D4AF37]">
                          <div className="flex items-center gap-2">
                            <span>{isVisible ? tempPassword : '••••••••'}</span>
                            {tempPassword !== 'Set by user' && (
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(student.id)}
                                className="text-[#76777d] hover:text-[#111827] transition-colors focus:outline-none cursor-pointer"
                                title={isVisible ? 'Hide Password' : 'Show Password'}
                              >
                                {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#76777d]">{formatDate(student.createdAt)}</td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            disabled={toggleActiveMutation.isPending || !targetUserId}
                            onClick={() => {
                              if (!targetUserId) {
                                notify.error('User record ID not found for student')
                                return
                              }
                              toggleActiveMutation.mutate({
                                userId: targetUserId,
                                active: !isUserActive,
                              })
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              isUserActive
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            }`}
                            title={isUserActive ? 'Click to deactivate account' : 'Click to activate account'}
                          >
                            {isUserActive ? (
                              <>
                                <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Active</span>
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-3.5 h-3.5 text-rose-600" />
                                <span>Deactivated</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[#76777d] text-xs">
                      No matching student accounts found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E7EB] bg-gray-50">
              <span className="text-xs text-gray-500">
                Page {page} of {meta.totalPages} ({meta.total} total records)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === meta.totalPages}
                  onClick={() => setPage((prev) => Math.min(prev + 1, meta.totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Student Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Student"
        description="Provision a student account manually. Credentials will be emailed automatically."
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={manualMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="gold"
              size="sm"
              onClick={handleManualSubmit}
              disabled={manualMutation.isPending}
              icon={manualMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            >
              {manualMutation.isPending ? 'Provisioning...' : 'Provision Student'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <Input
            label="Student Name"
            placeholder="e.g. Adhithya Vardhan"
            value={newStudent.studentName}
            onChange={(e) => setNewStudent({ ...newStudent, studentName: e.target.value })}
            required
            disabled={manualMutation.isPending}
          />
          <Input
            label="Register Number"
            placeholder="e.g. 2024CS109"
            value={newStudent.registrationNumber}
            onChange={(e) => setNewStudent({ ...newStudent, registrationNumber: e.target.value })}
            required
            disabled={manualMutation.isPending}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="student@example.com"
            value={newStudent.email}
            onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
            required
            disabled={manualMutation.isPending}
          />
          <Input
            label="Date of Birth"
            type="date"
            value={newStudent.dateOfBirth}
            onChange={(e) => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })}
            required
            disabled={manualMutation.isPending}
            helperText="Used to generate the initial temporary password (format dd/mm/yyyy)"
          />
        </form>
      </Modal>
    </div>
  )
}

export default StudentProvisioningPage