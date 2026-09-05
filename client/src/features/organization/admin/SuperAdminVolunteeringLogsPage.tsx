import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Eye,
  User,
  Search,
  FileText,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Download,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { TableLoader } from '@/components/ui/TableLoader'
import { volunteerApi } from '@/api/volunteer.api'
import { zoneApi } from '@/api/zone.api'
import { profileApi } from '@/api/profile.api'
import { getMediaUrl } from '@/utils/media'
import { useDebounce } from '@/hooks/useDebounce'
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

const CATEGORY_MAP: Record<string, string> = {
  PHYSICAL_VERIFICATION: 'Physical Verification',
  TELE_VERIFICATION: 'Tele Verification',
  SCHOOL_VISIT: 'School Visit',
  OFFLINE_PANEL_VOLUNTEERING: 'Offline Events',
  OTHER_OFFLINE_EVENT_VOLUNTEERING: 'Others',
  KARPOM_KARPIPOM_TUTORING: 'Karpom Karpipom Tutoring',
  SANGAMAM_VOLUNTEERING: 'Sangamam Volunteering',
}

const getStatusBadge = (status: string) => {
  const s = String(status).toLowerCase()
  if (s === 'approved') {
    return <Badge variant="approved">Approved</Badge>
  }
  if (s === 'rejected') {
    return <Badge variant="rejected">Rejected</Badge>
  }
  return <Badge variant="pending">Pending Review</Badge>
}

export const SuperAdminVolunteeringLogsPage = () => {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [zoneFilter, setZoneFilter] = useState<string>('')
  const [collegeFilter, setCollegeFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  const debouncedSearch = useDebounce(searchQuery, 400)

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, statusFilter, zoneFilter, collegeFilter, categoryFilter])

  // Fetch zones for zone filter dropdown
  const { data: zonesRes } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneApi.list(),
  })
  const zones = zonesRes?.data || []

  // Fetch colleges for college filter dropdown
  const { data: collegesRes } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => profileApi.getColleges(),
  })
  const colleges = collegesRes?.data || []

  // Fetch volunteering logs
  const { data: submissionsRes, isLoading } = useQuery({
    queryKey: ['volunteering-logs', page, limit, debouncedSearch, statusFilter, zoneFilter, collegeFilter, categoryFilter],
    queryFn: () =>
      volunteerApi.list({
        view: 'logs',
        type: 'submissions',
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        zoneId: zoneFilter || undefined,
        collegeId: collegeFilter || undefined,
        category: categoryFilter || undefined,
      }),
  })

  const submissions = submissionsRes?.data || []
  const meta = submissionsRes?.meta || { total: 0, totalPages: 1 }

  useEffect(() => {
    if (submissions.length > 0) {
      if (!selectedSubmission || !submissions.some((s: any) => s.id === selectedSubmission.id)) {
        setSelectedSubmission(submissions[0])
      }
    } else {
      setSelectedSubmission(null)
    }
  }, [submissions, selectedSubmission])

  // Export full filtered dataset to Excel
  const handleExportLogs = async () => {
    try {
      const blob = await volunteerApi.exportLogs({
        search: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        zoneId: zoneFilter || undefined,
        collegeId: collegeFilter || undefined,
        category: categoryFilter || undefined,
      })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Volunteering_Logs_${Date.now()}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      notify.success('Volunteering logs exported to Excel successfully')
    } catch {
      notify.error('Failed to export volunteering logs.')
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Volunteering Logs & Review Audit
            </h2>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
              <ShieldCheck className="w-3 h-3" /> Read Only
            </span>
          </div>
          <p className="text-xs text-[#45464c] mt-1">
            Global view of all student volunteer activity logs across zones with proof evidence inspection.
          </p>
        </div>

        <Button
          variant="gold"
          size="md"
          icon={<Download className="w-4 h-4" />}
          onClick={handleExportLogs}
        >
          Export to Excel
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name, reg number, activity title, or college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] bg-[#FCF8FA]"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#FCF8FA] p-1 rounded-xl border border-[#E5E7EB] overflow-x-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-[#111827] shadow-xs border border-[#E5E7EB]'
                    : 'text-[#76777d] hover:text-[#111827]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-44">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] bg-[#FCF8FA] text-[#111827] font-semibold"
            >
              <option value="">All Categories</option>
              <option value="PHYSICAL_VERIFICATION">Physical Verification</option>
              <option value="TELE_VERIFICATION">Tele Verification</option>
              <option value="SCHOOL_VISIT">School Visit</option>
              <option value="OFFLINE_PANEL_VOLUNTEERING">Offline Events</option>
              <option value="OTHER_OFFLINE_EVENT_VOLUNTEERING">Others</option>
            </select>
          </div>

          {/* College Selector */}
          <div className="w-full sm:w-44">
            <select
              value={collegeFilter}
              onChange={(e) => setCollegeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] bg-[#FCF8FA] text-[#111827] font-semibold truncate"
            >
              <option value="">All Colleges</option>
              {colleges.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Zone Selector */}
          <div className="w-full sm:w-40">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37] bg-[#FCF8FA] text-[#111827] font-semibold"
            >
              <option value="">All Zones</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Main Grid: Queue on Left, Detailed Inspection on Right */}
      {isLoading ? (
        <TableLoader rows={6} columns={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Activity Submissions List */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-4 bg-white border border-[#E5E7EB] rounded-2xl">
              <div className="flex items-center justify-between mb-3 border-b border-[#E5E7EB] pb-2">
                <h3 className="text-xs font-bold text-[#76777d] uppercase tracking-wider">
                  Volunteering Logs ({meta.total || submissions.length})
                </h3>
                <span className="text-[11px] font-bold text-[#D4AF37]">
                  Page {page} of {meta.totalPages || 1}
                </span>
              </div>

              {submissions.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-500">
                  No volunteer activity submissions matching your criteria.
                </div>
              ) : (
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  {submissions.map((sub: any) => {
                    const isSelected = selectedSubmission?.id === sub.id
                    const studentName = sub.student
                      ? [sub.student.firstName, sub.student.middleName, sub.student.lastName]
                          .filter(Boolean)
                          .join(' ') || sub.student.name || 'Scholar Student'
                      : 'Scholar Student'

                    return (
                      <div
                        key={sub.id}
                        onClick={() => setSelectedSubmission(sub)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#D4AF37] bg-[#FCF8FA] shadow-xs'
                            : 'border-[#E5E7EB] hover:bg-[#FCF8FA]'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-bold text-xs text-[#111827] truncate max-w-[70%]">
                            {safeString(sub.title, 'Volunteer Activity')}
                          </span>
                          {getStatusBadge(sub.status)}
                        </div>

                        <p className="text-[11px] font-semibold text-[#45464c] mt-1.5 flex items-center gap-1">
                          <User className="w-3 h-3 text-[#76777d]" />
                          {studentName}
                          <span className="text-gray-400 font-mono text-[10px]">
                            ({sub.student?.registrationNumber || 'N/A'})
                          </span>
                        </p>

                        <div className="flex justify-between items-center mt-2 text-[10px] text-[#76777d]">
                          <span className="truncate max-w-[55%]">
                            {CATEGORY_MAP[sub.category] || safeString(sub.category, 'General')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-[#D4AF37]" />
                            {sub.zone?.name || 'Zone'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center mt-1 text-[10px] text-gray-400 border-t border-gray-100 pt-1.5">
                          <span>
                            Event:{' '}
                            {sub.eventDate
                              ? new Date(sub.eventDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'N/A'}
                          </span>
                          <span>
                            Logged:{' '}
                            {sub.createdAt
                              ? new Date(sub.createdAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                })
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Pagination Controls */}
              {meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-[#E5E7EB] pt-3 mt-3">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#45464c] bg-white border border-[#E5E7EB] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FCF8FA] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Prev
                  </button>
                  <span className="text-[11px] font-bold text-[#76777d]">
                    Page {page} of {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= meta.totalPages}
                    onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#45464c] bg-white border border-[#E5E7EB] rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#FCF8FA] transition-colors cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </Card>
          </div>

          {/* Right: Detailed Proof Inspection Pane */}
          <div className="lg:col-span-7">
            {selectedSubmission ? (
              <Card className="space-y-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs">
                <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-[#E5E7EB] pb-4 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      {getStatusBadge(selectedSubmission.status)}
                      <span className="text-[11px] font-mono text-gray-400">
                        {selectedSubmission.submissionCode || selectedSubmission.id}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-extrabold text-[#111827]">
                      {safeString(selectedSubmission.title, 'Volunteer Activity')}
                    </CardTitle>
                    <CardDescription className="text-xs text-[#76777d]">
                      Zone: <strong className="text-[#111827]">{selectedSubmission.zone?.name || 'N/A'}</strong> (
                      {selectedSubmission.zone?.code || 'ZONE'})
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Student Profile Info Card */}
                  <div className="bg-[#FCF8FA] p-4 rounded-xl border border-[#E5E7EB] space-y-3">
                    <h4 className="text-xs font-bold text-[#111827] uppercase tracking-wider border-b border-[#E5E7EB]/80 pb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Student Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
                      <div>
                        <span className="text-[#76777d]">Full Name:</span>
                        <p className="font-bold text-[#111827]">
                          {selectedSubmission.student
                            ? [
                                selectedSubmission.student.firstName,
                                selectedSubmission.student.middleName,
                                selectedSubmission.student.lastName,
                              ]
                                .filter(Boolean)
                                .join(' ') ||
                              selectedSubmission.student.name ||
                              'Scholar Student'
                            : 'Scholar Student'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#76777d]">Register Number:</span>
                        <p className="font-bold text-[#111827] font-mono">
                          {selectedSubmission.student?.registrationNumber ||
                            selectedSubmission.student?.registerNumber ||
                            'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#76777d]">College:</span>
                        <p className="font-semibold text-[#45464c]">
                          {safeString(
                            selectedSubmission.student?.college?.name || selectedSubmission.student?.college,
                            'N/A'
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-[#76777d]">Department & Program:</span>
                        <p className="font-semibold text-[#45464c]">
                          {safeString(
                            selectedSubmission.student?.department?.name ||
                              selectedSubmission.student?.department,
                            'N/A'
                          )}
                          {' — '}
                          {safeString(
                            selectedSubmission.student?.program?.name || selectedSubmission.student?.program,
                            'N/A'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Activity Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                      <span className="text-[#76777d] block text-[10px] uppercase font-bold">Category</span>
                      <span className="font-bold text-[#111827]">
                        {CATEGORY_MAP[selectedSubmission.category] ||
                          safeString(selectedSubmission.category, 'General')}
                      </span>
                    </div>
                    <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                      <span className="text-[#76777d] block text-[10px] uppercase font-bold">Event Date</span>
                      <span className="font-bold text-[#111827]">
                        {selectedSubmission.eventDate
                          ? new Date(selectedSubmission.eventDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                      <span className="text-[#76777d] block text-[10px] uppercase font-bold">Count / Metric</span>
                      <span className="font-extrabold text-[#D4AF37]">
                        {selectedSubmission.count !== null && selectedSubmission.count !== undefined
                          ? `${selectedSubmission.count} units`
                          : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Description */}
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
                        onClick={() =>
                          setActiveImage(
                            getMediaUrl(selectedSubmission.imageUrl || selectedSubmission.proofFileUrl)
                          )
                        }
                        className="group w-full h-56 bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden border border-slate-700 cursor-zoom-in"
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

                  {/* Review Audit Box */}
                  <div className="bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB] space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#76777d] uppercase font-bold text-[10px] flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                        Review Audit Status
                      </span>
                      {getStatusBadge(selectedSubmission.status)}
                    </div>

                    {selectedSubmission.reviewedAt ? (
                      <div className="text-xs text-[#45464c] space-y-1 pt-1 border-t border-gray-200">
                        <p>
                          <span className="text-[#76777d]">Reviewed On:</span>{' '}
                          <strong>
                            {new Date(selectedSubmission.reviewedAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </strong>
                        </p>
                        {selectedSubmission.reviewerComment && (
                          <div className="mt-2 p-2.5 bg-white rounded-lg border border-[#E5E7EB]">
                            <span className="text-[10px] uppercase font-bold text-[#76777d] block">
                              Reviewer Comments:
                            </span>
                            <p className="text-xs font-medium text-[#111827] mt-0.5">
                              {selectedSubmission.reviewerComment}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>This submission is pending review by the assigned Zone Incharge.</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="text-center py-20 space-y-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs">
                <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-[#111827]">No Submission Selected</h3>
                <p className="text-xs text-[#45464c]">Select an activity log from the list on the left to inspect details.</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Large Image Lightbox Modal */}
      <Modal
        isOpen={!!activeImage}
        onClose={() => setActiveImage(null)}
        title="Proof Evidence Document"
        description="Detailed review of the uploaded proof evidence."
      >
        <div className="flex items-center justify-center p-2 bg-slate-900 rounded-2xl overflow-hidden max-h-[75vh]">
          {activeImage && (
            <img
              src={activeImage}
              alt="Full size proof"
              className="max-w-full max-h-[65vh] object-contain rounded-xl"
            />
          )}
        </div>
      </Modal>
    </div>
  )
}

export default SuperAdminVolunteeringLogsPage
