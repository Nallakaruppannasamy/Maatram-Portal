import React, { useState } from 'react'
import { FileCheck2, CheckCircle2, XCircle, Eye, AlertCircle, Calendar, Clock, User, Building, MessageSquare } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'

export const VolunteerApprovalPage = () => {
  const [selectedSubmission, setSelectedSubmission] = useState<{
    id: string
    studentName: string
    registerNo: string
    college: string
    title: string
    category: string
    organization: string
    hours: number
    date: string
    description: string
  } | null>({
    id: 'SUB-2026-881',
    studentName: 'Ananya Sharma',
    registerNo: '2024CS1092',
    college: 'Madras Institute of Technology',
    title: 'Community Cleanliness & Recycling Drive',
    category: 'Environment',
    organization: 'NSS Unit 4',
    hours: 4.0,
    date: 'Jul 24, 2026',
    description: 'Organized a waste segregation and community recycling awareness drive across 3 local wards. Collected 120kg of recyclable materials.',
  })

  const [modalType, setModalType] = useState<'approve' | 'reject' | null>(null)
  const [feedback, setFeedback] = useState('')

  const handleDecision = () => {
    setModalType(null)
    setSelectedSubmission(null)
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
            <h3 className="text-xs font-bold text-[#76777d] uppercase tracking-wider mb-3">Pending Submissions (2)</h3>
            
            <div className="space-y-3">
              <div
                onClick={() =>
                  setSelectedSubmission({
                    id: 'SUB-2026-881',
                    studentName: 'Ananya Sharma',
                    registerNo: '2024CS1092',
                    college: 'Madras Institute of Technology',
                    title: 'Community Cleanliness & Recycling Drive',
                    category: 'Environment',
                    organization: 'NSS Unit 4',
                    hours: 4.0,
                    date: 'Jul 24, 2026',
                    description: 'Organized a waste segregation and community recycling awareness drive across 3 local wards.',
                  })
                }
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedSubmission?.id === 'SUB-2026-881'
                    ? 'border-[#D4AF37] bg-[#FCF8FA] shadow-xs'
                    : 'border-[#E5E7EB] hover:bg-[#FCF8FA]'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-[#111827]">Ananya Sharma</span>
                  <Badge variant="gold">4.0 hrs</Badge>
                </div>
                <p className="text-xs font-semibold text-[#45464c] mt-1">Community Cleanliness Drive</p>
                <p className="text-[10px] text-[#76777d] mt-1">Submitted: Jul 24, 2026</p>
              </div>

              <div
                onClick={() =>
                  setSelectedSubmission({
                    id: 'SUB-2026-882',
                    studentName: 'Karthik Raja',
                    registerNo: '2024ME1105',
                    college: 'College of Engineering Guindy',
                    title: 'Digital Literacy Workshop for Seniors',
                    category: 'Education',
                    organization: 'HelpAge India',
                    hours: 8.0,
                    date: 'Jul 22, 2026',
                    description: 'Conducted a 2-day digital literacy workshop teaching senior citizens basic smartphone operations and online banking safety.',
                  })
                }
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedSubmission?.id === 'SUB-2026-882'
                    ? 'border-[#D4AF37] bg-[#FCF8FA] shadow-xs'
                    : 'border-[#E5E7EB] hover:bg-[#FCF8FA]'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-[#111827]">Karthik Raja</span>
                  <Badge variant="gold">8.0 hrs</Badge>
                </div>
                <p className="text-xs font-semibold text-[#45464c] mt-1">Digital Literacy Workshop</p>
                <p className="text-[10px] text-[#76777d] mt-1">Submitted: Jul 22, 2026</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Detailed Proof Inspection & Decision Pane */}
        <div className="lg:col-span-7">
          {selectedSubmission ? (
            <Card className="space-y-6">
              <CardHeader className="flex flex-row items-center justify-between border-b border-[#E5E7EB] pb-4">
                <div>
                  <Badge variant="pending" className="mb-1">Pending Approval</Badge>
                  <CardTitle>{selectedSubmission.title}</CardTitle>
                  <CardDescription>Submitted by {selectedSubmission.studentName} ({selectedSubmission.registerNo})</CardDescription>
                </div>
                <span className="text-2xl font-extrabold text-[#D4AF37]">{selectedSubmission.hours} hrs</span>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                    <span className="text-[#76777d] block text-[10px] uppercase font-bold">College</span>
                    <span className="font-bold text-[#111827]">{selectedSubmission.college}</span>
                  </div>
                  <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                    <span className="text-[#76777d] block text-[10px] uppercase font-bold">Partner Organization</span>
                    <span className="font-bold text-[#111827]">{selectedSubmission.organization}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-[#76777d] block text-[10px] uppercase font-bold">Description</span>
                  <p className="text-[#45464c] leading-relaxed bg-[#FCF8FA] p-3 rounded-xl border border-[#E5E7EB]">
                    {selectedSubmission.description}
                  </p>
                </div>

                {/* Proof Image Box Placeholder */}
                <div className="space-y-2">
                  <span className="text-[#76777d] block text-[10px] uppercase font-bold">Proof Evidence Upload</span>
                  <div className="w-full h-48 bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-white space-y-2 relative overflow-hidden border border-slate-700">
                    <Eye className="w-8 h-8 text-[#D4AF37]" />
                    <p className="text-xs font-bold">Uploaded Activity Photo / Event Certificate</p>
                    <p className="text-[10px] text-slate-400 font-mono">proof_evidence_jul2026.jpg • 2.4 MB</p>
                  </div>
                </div>

                {/* Decision Actions */}
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
        description="This will add 4.0 verified hours to Ananya Sharma's official record."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setModalType(null)}>Cancel</Button>
            <Button variant="gold" size="sm" onClick={handleDecision}>Confirm Approval</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <Input label="Approval Comments (Optional)" placeholder="e.g. Verified with event certificate. Great job!" />
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
            <Button variant="danger" size="sm" onClick={handleDecision}>Confirm Rejection</Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <Input label="Rejection Reason" placeholder="e.g. Proof image unclear or missing event date." required />
        </div>
      </Modal>
    </div>
  )
}
