import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { UploadCloud, Calendar, CheckCircle2, ArrowRight, Loader2, Image as ImageIcon, X } from 'lucide-react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('TELE_VERIFICATION')
  const [count, setCount] = useState('1')
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const showCount = ['TELE_VERIFICATION', 'PHYSICAL_VERIFICATION', 'SCHOOL_VISIT'].includes(category)

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      notify.error('Invalid image type. Only JPG, JPEG, PNG, and WEBP are accepted.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error('File size exceeds 5MB limit.')
      return
    }

    try {
      setUploading(true)
      const res = await volunteerApi.uploadImage(file)
      if (res.success && res.data?.url) {
        setImageUrl(res.data.url)
        notify.success('Proof image uploaded successfully!')
      } else {
        notify.error(res.message || 'Failed to upload image.')
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.message || err?.message || 'Error uploading image.')
    } finally {
      setUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      notify.error('Invalid image type. Only JPG, JPEG, PNG, and WEBP are accepted.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error('File size exceeds 5MB limit.')
      return
    }

    try {
      setUploading(true)
      const res = await volunteerApi.uploadImage(file)
      if (res.success && res.data?.url) {
        setImageUrl(res.data.url)
        notify.success('Proof image uploaded successfully!')
      } else {
        notify.error(res.message || 'Failed to upload image.')
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.message || err?.message || 'Error uploading image.')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = () => {
    setImageUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      notify.error('Please fill in all required fields.')
      return
    }

    const payload: any = {
      title: title.trim(),
      category,
      eventDate,
      description: description.trim(),
      imageUrl: imageUrl || undefined,
    }

    if (showCount) {
      const parsedCount = parseInt(count)
      if (isNaN(parsedCount) || parsedCount < 1 || parsedCount > 1000) {
        notify.error('Count must be an integer between 1 and 1000.')
        return
      }
      payload.count = parsedCount
    }

    submitMutation.mutate(payload)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Submit Volunteer Work Log</h2>
        <p className="text-xs text-[#45464c]">
          Log your community service activities with proof documentation for review by your Zone Incharge.
        </p>
      </div>

      <Card className="p-8 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <Input
                label="Activity Title"
                placeholder="e.g. Tele-verification of Provisioned Candidates"
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
                    <option value="TELE_VERIFICATION">Tele Verification</option>
                    <option value="PHYSICAL_VERIFICATION">Physical Verification</option>
                    <option value="SCHOOL_VISIT">School Visit</option>
                    <option value="KARPOM_KARPIPOM_TUTORING">Karpom Karpipom Tutoring</option>
                    <option value="OFFLINE_PANEL_VOLUNTEERING">Offline Panel Volunteering</option>
                    <option value="SANGAMAM_VOLUNTEERING">Sangamam Volunteering</option>
                    <option value="OTHER_OFFLINE_EVENT_VOLUNTEERING">Other Offline Event Volunteering</option>
                  </select>
                </div>

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

              {showCount && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <Input
                    label="Count (Verification count or visits)"
                    type="number"
                    min="1"
                    max="1000"
                    placeholder="Enter number (1-1000)"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    disabled={submitMutation.isPending}
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                  Detailed Activity Description
                </label>
                <textarea
                  rows={4}
                  className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                  placeholder="Describe your specific contributions, responsibilities, and outcomes during the activity..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={submitMutation.isPending}
                  required
                />
              </div>

              {/* File Dropzone */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                  Upload Proof Image / Certificate Evidence (Max 5MB)
                </label>
                
                {!imageUrl ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed border-[#E5E7EB] hover:border-[#D4AF37] bg-[#FCF8FA] rounded-2xl p-6 text-center space-y-2 cursor-pointer transition-colors relative ${
                      uploading ? 'pointer-events-none opacity-60' : ''
                    }`}
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-[#D4AF37] mx-auto animate-spin" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-[#D4AF37] mx-auto" />
                    )}
                    <p className="text-xs font-semibold text-[#111827]">
                      {uploading ? 'Uploading proof image...' : 'Click or drag proof photo / certificate here'}
                    </p>
                    <p className="text-[11px] text-[#76777d]">PNG, JPG, JPEG, or WEBP up to 5MB</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-[#E5E7EB] bg-slate-50 flex items-center justify-center p-2 max-h-60">
                    <img
                      src={imageUrl}
                      alt="Uploaded proof"
                      className="max-h-56 object-contain rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={submitMutation.isPending || uploading}
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
