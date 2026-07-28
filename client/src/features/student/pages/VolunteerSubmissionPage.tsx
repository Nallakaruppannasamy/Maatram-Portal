import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HeartHandshake, UploadCloud, Calendar, Clock, Building, FileText, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export const VolunteerSubmissionPage = () => {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Education')
  const [organization, setOrganization] = useState('')
  const [hours, setHours] = useState('4.0')
  const [eventDate, setEventDate] = useState('2026-07-28')
  const [description, setDescription] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      navigate('/student/volunteer-history')
    }, 1500)
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
                  required
                />

                <Input
                  label="Event / Activity Date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  icon={<Calendar className="w-4 h-4" />}
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
                  required
                />
              </div>

              {/* File Dropzone */}
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

            <Button type="submit" variant="gold" size="lg" className="w-full font-bold" icon={<ArrowRight className="w-4 h-4" />}>
              Submit Log for Zone Approval
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
