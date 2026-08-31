import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Eye, Loader2, User, BookOpen, GraduationCap, Calendar, HelpCircle, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { TableLoader } from '@/components/ui/TableLoader'
import { volunteerApi } from '@/api/volunteer.api'
import { notify } from '@/utils/toast'
import { getMediaUrl } from '@/utils/media'

const safeString = (val: any, fallback: string = 'N/A'): string => {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'string' || typeof val === 'number') return String(val)
  if (typeof val === 'object') {
    if (val.name) return String(val.name)
    if (val.fullName) return String(val.fullName)
    if (val.title) return String(val.title)
    if (val.code) return String(val.code)
  }
  return fallback
}

const CATEGORY_MAP: Record<string, string> = {
  PHYSICAL_VERIFICATION: 'Physical Verification',
  TELE_VERIFICATION: 'Tele Verification',
  SCHOOL_VISIT: 'School Visit',
  OFFLINE_PANEL_VOLUNTEERING: 'Offline Event',
  OTHER_OFFLINE_EVENT_VOLUNTEERING: 'Others',
  KARPOM_KARPIPOM_TUTORING: 'Karpom Karpipom Tutoring',
  SANGAMAM_VOLUNTEERING: 'Sangamam Volunteering',
}

export const VolunteerApprovalPage = () => {
  const queryClient = useQueryClient()

  const { data: volunteersRes, isLoading } = useQuery({
    queryKey: ['volunteers', 'pending'],
    queryFn: () => volunteerApi.list({ status: 'PENDING' }),
  })

  const pendingSubmissions = volunteersRes?.data || []

  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [activeImage, setActiveImage] = useState<string | null>(null)

  useEffect(() => {
    if (pendingSubmissions.length > 0 && !selectedSubmission) {
      setSelectedSubmission(pendingSubmissions[0])
    } else if (pendingSubmissions.length === 0) {
      setSelectedSubmission(null)
    }
  }, [pendingSubmissions, selectedSubmission])

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reviewerComment }: { id: string; status: 'APPROVED' | 'REJECTED'; reviewerComment?: string }) =>
      volunteerApi.changeStatus(id, status, reviewerComment),
    onSuccess: (res, variables) => {
      if (res.success) {
        notify.success(`Volunteer submission ${variables.status.toLowerCase()} successfully!`)
        queryClient.invalidateQueries({ queryKey: ['volunteers'] })
        setModalType(null)
        setFeedback('')
        setSelectedSubmission(null)
      } else {
        notify.error(res.message || 'Failed to update submission status.')
      }
    },
    onError: (err: any) => {
      notify.error(err?.response?.data?.message || err?.message || 'Error updating submission status.')
    },
  })

  const handleConfirmDecision = () => {
    if (!selectedSubmission) return

    const newStatus = modalType === 'approve' ? 'APPROVED' : 'REJECTED'

    if (newStatus === 'REJECTED' && !feedback.trim()) {
      notify.error('Please enter a rejection reason.')
      return
    }

    statusMutation.mutate({
      id: selectedSubmission.id,
      status: newStatus,
      reviewerComment: feedback.trim() || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Volunteer Submissions Approval Inbox</h2>
          <p className="text-xs text-[#45464c]">Inspect proof image evidence, student details, and approve or reject submissions with feedback.</p>
        </div>
        <TableLoader rows={5} columns={5} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Volunteer Submissions Approval Inbox</h2>
        <p className="text-xs text-[#45464c]">Inspect proof image evidence, student details, and approve or reject submissions with feedback.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Pending Submissions Queue List */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 bg-white border border-[#E5E7EB] rounded-2xl">
            <h3 className="text-xs font-bold text-[#76777d] uppercase tracking-wider mb-3">
              Pending Submissions ({pendingSubmissions.length})
            </h3>

            {pendingSubmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-500">
                No pending submissions requiring review.
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                {pendingSubmissions.map((sub: any) => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedSubmission?.id === sub.id
                        ? 'border-[#D4AF37] bg-[#FCF8FA] shadow-xs'
                        : 'border-[#E5E7EB] hover:bg-[#FCF8FA]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs text-[#111827] truncate max-w-[70%]">
                        {safeString(sub.title, 'Volunteer Activity')}
                      </span>
                      <Badge variant="pending">Pending</Badge>
                    </div>
                    <p className="text-[11px] font-semibold text-[#45464c] mt-1.5 flex items-center gap-1">
                      <User className="w-3 h-3 text-[#76777d]" />
                      {sub.student ? ([sub.student.firstName, sub.student.middleName, sub.student.lastName].filter(Boolean).join(' ') || sub.student.name || 'Scholar Student') : 'Scholar Student'}
                    </p>
                    <div className="flex justify-between items-center mt-2 text-[10px] text-[#76777d]">
                      <span>{CATEGORY_MAP[sub.category] || safeString(sub.category, 'General')}</span>
                      <span>
                        {sub.eventDate ? new Date(sub.eventDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short'
                        }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Detailed Proof Inspection & Decision Pane */}
        <div className="lg:col-span-7">
          {selectedSubmission ? (
            <Card className="space-y-6">
              <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-[#E5E7EB] pb-4 gap-4">
                <div>
                  <Badge variant="pending" className="mb-1">Pending Review</Badge>
                  <CardTitle>{safeString(selectedSubmission.title, 'Activity')}</CardTitle>
                  <CardDescription>Code: <span className="font-mono text-[#D4AF37] font-bold">{selectedSubmission.submissionCode || selectedSubmission.id}</span></CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Student Profile Info */}
                <div className="bg-[#FCF8FA] p-4 rounded-xl border border-[#E5E7EB] space-y-3">
                  <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-[#E5E7EB]/80 pb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                    Student Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div>
                      <span className="text-[#76777d]">Full Name:</span>
                      <p className="font-bold text-[#111827]">
                        {selectedSubmission.student
                          ? ([selectedSubmission.student.firstName, selectedSubmission.student.middleName, selectedSubmission.student.lastName].filter(Boolean).join(' ') || selectedSubmission.student.name || 'Scholar Student')
                          : 'Scholar Student'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#76777d]">Register Number:</span>
                      <p className="font-bold text-[#111827] font-mono">{selectedSubmission.student?.registrationNumber || selectedSubmission.student?.registerNumber || 'N/A'}</p>
                    </div>
                    <div className="mt-1">
                      <span className="text-[#76777d]">College:</span>
                      <p className="font-semibold text-[#45464c]">{safeString(selectedSubmission.student?.college?.name || selectedSubmission.student?.college, 'N/A')}</p>
                    </div>
                    <div className="mt-1">
                      <span className="text-[#76777d]">Department / Program:</span>
                      <p className="font-semibold text-[#45464c]">
                        {safeString(selectedSubmission.student?.department?.name || selectedSubmission.student?.department, 'N/A')}
                        {' — '}
                        {safeString(selectedSubmission.student?.program?.name || selectedSubmission.student?.program, 'N/A')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                    <span className="text-[#76777d] block text-[10px] uppercase font-bold">Category</span>
                    <span className="font-bold text-[#111827]">{CATEGORY_MAP[selectedSubmission.category] || safeString(selectedSubmission.category, 'General')}</span>
                  </div>
                  <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                    <span className="text-[#76777d] block text-[10px] uppercase font-bold">Event Date</span>
                    <span className="font-bold text-[#111827]">
                      {selectedSubmission.eventDate ? new Date(selectedSubmission.eventDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                  <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                    <span className="text-[#76777d] block text-[10px] uppercase font-bold">Count / Metric</span>
                    <span className="font-extrabold text-[#D4AF37]">
                      {selectedSubmission.count !== null && selectedSubmission.count !== undefined ? `${selectedSubmission.count} units` : '—'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[#76777d] block text-[10px] uppercase font-bold">Student Description</span>
                  <p className="text-[#45464c] leading-relaxed bg-[#FCF8FA] p-3 rounded-xl border border-[#E5E7EB] whitespace-pre-wrap">
                    {safeString(selectedSubmission.description, 'No description provided.')}
                  </p>
                </div>

                {/* Uploaded Evidence Image */}
                <div className="space-y-2">
                  <span className="text-[#76777d] block text-[10px] uppercase font-bold">Uploaded Evidence</span>
                  {selectedSubmission.imageUrl || selectedSubmission.proofFileUrl ? (
                    <div
                      onClick={() => setActiveImage(getMediaUrl(selectedSubmission.imageUrl || selectedSubmission.proofFileUrl))}
                      className="group w-full h-48 bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden border border-slate-700 cursor-zoom-in"
                    >
                      <img
                        src={getMediaUrl(selectedSubmission.imageUrl || selectedSubmission.proofFileUrl)}
                        alt="Proof document"
                        className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition-opacity">
                        <Eye className="w-4 h-4 text-[#D4AF37]" />
                        Click to enlarge proof
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-24 bg-slate-50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-[#E5E7EB] text-gray-400">
                      <FileText className="w-6 h-6 mb-1 text-gray-300" />
                      <p className="text-xs">No upload evidence submitted.</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-4">
                  <Button variant="danger" size="md" icon={<XCircle className="w-4 h-4" />} onClick={() => setModalType('reject')}>
                    Reject Submission
                  </Button>
                  <Button variant="gold" size="md" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setModalType('approve')}>
                    Approve Work Log
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-16 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-[#111827]">Queue Complete</h3>
              <p className="text-xs text-[#45464c]">All pending volunteer submissions in your zone have been reviewed!</p>
            </Card>
          )}
        </div>
      </div>

      {/* Approve Modal */}
      <Modal
        isOpen={modalType === 'approve'}
        onClose={() => setModalType(null)}
        title="Approve Volunteer Submission"
        description="Verify and approve this volunteer submission to count it towards the official student record."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button variant="gold" size="sm" disabled={statusMutation.isPending} onClick={handleConfirmDecision}>
              {statusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Approval'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <Input
            label="Approval Comments (Optional)"
            placeholder="e.g. Verified. Excellent work!"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={modalType === 'reject'}
        onClose={() => setModalType(null)}
        title="Reject Volunteer Submission"
        description="Please provide clear feedback explaining why this submission is rejected so the student can correct it."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button
              variant="danger"
              size="sm"
              disabled={statusMutation.isPending || !feedback.trim()}
              onClick={handleConfirmDecision}
            >
              {statusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <Input
            label="Rejection Reason (Mandatory)"
            placeholder="e.g. Proof image blurry / event date does not match."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
          />
        </div>
      </Modal>

      {/* Large Image Preview Modal */}
      <Modal
        isOpen={!!activeImage}
        onClose={() => setActiveImage(null)}
        title="Proof Evidence Document"
        description="Detailed review of the uploaded proof."
      >
        <div className="flex items-center justify-center p-2 bg-slate-900 rounded-2xl overflow-hidden max-h-[70vh]">
          {activeImage && (
            <img
              src={activeImage}
              alt="Full size proof"
              className="max-w-full max-h-[60vh] object-contain rounded-xl"
            />
          )}
        </div>
      </Modal>
    </div>
  )
}

export default VolunteerApprovalPage
