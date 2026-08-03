import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, XCircle, Eye, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { TableLoader } from '@/components/ui/TableLoader'
import { volunteerApi } from '@/api/volunteer.api'
import { notify } from '@/utils/toast'

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
          <p className="text-xs text-[#45464c]">Inspect proof image evidence, verify hours, and approve or reject submissions with feedback.</p>
        </div>
        <TableLoader rows={5} columns={5} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Volunteer Submissions Approval Inbox</h2>
        <p className="text-xs text-[#45464c]">Inspect proof image evidence, verify hours, and approve or reject submissions with feedback.</p>
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
              <div className="space-y-3">
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
                      <span className="font-bold text-xs text-[#111827]">{safeString(sub.title, 'Volunteer Activity')}</span>
                      <Badge variant="gold">{sub.hours} hrs</Badge>
                    </div>
                    <p className="text-xs font-semibold text-[#45464c] mt-1">{safeString(sub.organization, 'Partner Org')}</p>
                    <p className="text-[10px] text-[#76777d] mt-1">Date: {safeString(sub.eventDate, 'N/A')}</p>
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
              <CardHeader className="flex flex-row items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div>
                  <Badge variant="pending" className="mb-1">Pending Approval</Badge>
                  <CardTitle>{safeString(selectedSubmission.title, 'Activity')}</CardTitle>
                  <CardDescription>Category: {safeString(selectedSubmission.category, 'General')}</CardDescription>
                </div>
                <span className="text-2xl font-extrabold text-[#D4AF37]">{selectedSubmission.hours} hrs</span>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                    <span className="text-[#76777d] block text-[10px] uppercase font-bold">Event Date</span>
                    <span className="font-bold text-[#111827]">{safeString(selectedSubmission.eventDate, 'N/A')}</span>
                  </div>
                  <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                    <span className="text-[#76777d] block text-[10px] uppercase font-bold">Partner Organization</span>
                    <span className="font-bold text-[#111827]">{safeString(selectedSubmission.organization, 'N/A')}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[#76777d] block text-[10px] uppercase font-bold">Description</span>
                  <p className="text-[#45464c] leading-relaxed bg-[#FCF8FA] p-3 rounded-xl border border-[#E5E7EB]">
                    {safeString(selectedSubmission.description, 'No description provided.')}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[#76777d] block text-[10px] uppercase font-bold">Proof Evidence Upload</span>
                  <div className="w-full h-48 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white space-y-2 relative overflow-hidden border border-slate-700">
                    <Eye className="w-8 h-8 text-[#D4AF37]" />
                    <p className="text-xs font-bold">Uploaded Activity Photo / Event Certificate</p>
                    <p className="text-[10px] text-slate-400 font-mono">Proof evidence verified for review</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-end gap-4">
                  <Button variant="danger" size="md" icon={<XCircle className="w-4 h-4" />} onClick={() => setModalType('reject')}>
                    Reject Submission
                  </Button>
                  <Button variant="gold" size="md" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setModalType('approve')}>
                    Approve Hours
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
        title="Approve Volunteer Hours"
        description={`This will add ${selectedSubmission?.hours || 0} verified hours to the official student record.`}
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
            placeholder="e.g. Verified with event certificate. Great job!"
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
        description="Please provide clear feedback for why this submission is being rejected."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button variant="danger" size="sm" disabled={statusMutation.isPending} onClick={handleConfirmDecision}>
              {statusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <Input
            label="Rejection Reason"
            placeholder="e.g. Proof image unclear or missing event date."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            required
          />
        </div>
      </Modal>
    </div>
  )
}

export default VolunteerApprovalPage
