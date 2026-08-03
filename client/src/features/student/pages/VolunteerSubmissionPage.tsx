import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UploadCloud, Calendar, Clock, Building, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { volunteerApi } from '@/api/volunteer.api'
import { useAuth } from '@/hooks/useAuth'
import { notify } from '@/utils/toast'

export const VolunteerSubmissionPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Education')
  const [organization, setOrganization] = useState('')
  const [hours, setHours] = useState('4.0')
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const submitMutation = useMutation({
    mutationFn: (payload: any) => volunteerApi.create(payload),
    onSuccess: (res) => {
      if (res.success) {
        notify.success('Volunteer log submitted successfully!')
        queryClient.invalidateQueries({ queryKey: ['volunteers'] })
        setSubmitted(true)
        setTimeout(() => {
          navigate('/student/volunteer-history')
        }, 1500)
      } else {
        notify.error(res.message || 'Failed to submit volunteer log.')
      }
    },
    onError: (err: any) => {
      notify.error(
        err?.response?.data?.message || err?.message || 'Error submitting volunteer log.'
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !organization.trim() || !hours || !description.trim()) {
      notify.error('Please fill in all required fields.')
      return
    }

    submitMutation.mutate({
      studentId: user?.id || '',
      title: title.trim(),
      category,
      organization: organization.trim(),
      hours: parseFloat(hours) || 0,
      eventDate,
      description: description.trim(),
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Submit Volunteer Work Log</h2>
        <p className="text-xs text-[#45464c]">
          Log your community service hours with proof documentation for review by your Zone Incharge.
        </p>
      </div>

      <Card className="p-8 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Activity Title"
                placeholder="e.g. Free Tutoring for Government School Students"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitMutation.isPending}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                    Activity Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={submitMutation.isPending}
                    className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                  >
                    <option value="Education">Education & Mentorship</option>
                    <option value="Healthcare">Healthcare & Blood Donation</option>
                    <option value="Environment">Environmental Awareness</option>
                    <option value="Disaster Relief">Disaster Relief</option>
                    <option value="Community Outreach">Community Outreach</option>
                  </select>
                </div>

                <Input
                  label="Organization / Partner NGO"
                  placeholder="e.g. Maatram Foundation / NSS Unit"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  icon={<Building className="w-4 h-4" />}
                  disabled={submitMutation.isPending}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Total Volunteer Hours"
                  type="number"
                  step="0.5"
                  placeholder="e.g. 4.5"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  icon={<Clock className="w-4 h-4" />}
                  disabled={submitMutation.isPending}
                  required
                />

                <Input
                  label="Event / Activity Date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  icon={<Calendar className="w-4 h-4" />}
                  disabled={submitMutation.isPending}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                  Detailed Activity Description
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                  placeholder="Describe your specific contributions, responsibilities, and outcomes during the event..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitMutation.isPending}
                  required
                />
              </div>

              {/* File Dropzone Placeholder */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                  Upload Proof Image / Certificate Evidence
                </label>
                <div className="border-2 border-dashed border-[#E5E7EB] hover:border-[#D4AF37] bg-[#FCF8FA] rounded-2xl p-6 text-center space-y-2 cursor-pointer transition-colors">
                  <UploadCloud className="w-8 h-8 text-[#D4AF37] mx-auto" />
                  <p className="text-xs font-semibold text-[#111827]">Click or drag proof photo / certificate here</p>
                  <p className="text-[11px] text-[#76777d]">PNG, JPG, or PDF up to 10MB</p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={submitMutation.isPending}
              className="w-full font-bold"
            >
              {submitMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Submitting Log...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Submit Log for Zone Approval <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-[#111827]">Log Submitted Successfully!</h3>
            <p className="text-xs text-[#45464c]">
              Your volunteering log has been sent to your Zone Incharge for review and approval.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}

export default VolunteerSubmissionPage
