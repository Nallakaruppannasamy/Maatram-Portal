import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, BookOpen, Code, Award, FolderGit2, Save, Plus, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { profileApi } from '@/api/profile.api'
import { useAuth } from '@/hooks/useAuth'
import { notify } from '@/utils/toast'

export const StudentProfilePage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'basic' | 'academics' | 'skills' | 'projects' | 'achievements'>('basic')

  // Profile Form States
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')
  const [parentMobile, setParentMobile] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [address, setAddress] = useState('')
  const [careerObjective, setCareerObjective] = useState('')

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  })

  const profile = profileRes?.data

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || (profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : user?.fullName || ''))
      setEmail(user?.email || '')
      setMobile(profile.mobile || '')
      setParentMobile(profile.parentMobile || '')
      setGender(profile.gender || '')
      setDob(profile.dob || profile.dateOfBirth || '')
      setAddress(profile.address || '')
      setCareerObjective(profile.careerObjective || '')
    }
  }, [profile, user])

  const updateMutation = useMutation({
    mutationFn: (updatedPayload: any) => profileApi.update(updatedPayload),
    onSuccess: (res) => {
      if (res.success) {
        notify.success('Profile updated successfully!')
        queryClient.invalidateQueries({ queryKey: ['profile'] })
      } else {
        notify.error(res.message || 'Failed to update profile.')
      }
    },
    onError: (err: any) => {
      notify.error(err?.response?.data?.message || err?.message || 'Error updating profile.')
    },
  })

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      fullName,
      mobile,
      parentMobile,
      gender,
      dob,
      address,
      careerObjective,
    })
  }

  if (isLoading) {
    return <LoadingPage message="Loading student profile data..." />
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Modular Student Profile</h2>
          <p className="text-xs text-[#45464c]">Manage your personal details, academic CGPA, skills, projects, and certifications.</p>
        </div>
        <Button
          variant="gold"
          size="md"
          onClick={handleSaveProfile}
          disabled={updateMutation.isPending}
          icon={updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-2">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'basic'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#45464c] hover:bg-[#F0EDEE] border border-[#E5E7EB]'
          }`}
        >
          <User className="w-4 h-4 text-[#D4AF37]" /> Basic Information
        </button>

        <button
          onClick={() => setActiveTab('academics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'academics'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#45464c] hover:bg-[#F0EDEE] border border-[#E5E7EB]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#D4AF37]" /> Academic History
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'skills'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#45464c] hover:bg-[#F0EDEE] border border-[#E5E7EB]'
          }`}
        >
          <Code className="w-4 h-4 text-[#D4AF37]" /> Skills & Technologies
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'projects'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#45464c] hover:bg-[#F0EDEE] border border-[#E5E7EB]'
          }`}
        >
          <FolderGit2 className="w-4 h-4 text-[#D4AF37]" /> Projects & GitHub
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'achievements'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#45464c] hover:bg-[#F0EDEE] border border-[#E5E7EB]'
          }`}
        >
          <Award className="w-4 h-4 text-[#D4AF37]" /> Certifications & Awards
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'basic' && (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Primary identification, contact information, and objective summary</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="Register Number"
                value={user?.regNumber || user?.registrationNumber || 'Data not available'}
                disabled
              />
              <Input
                label="Email Address"
                value={email || user?.email || ''}
                disabled
              />
              <Input
                label="Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Parent/Guardian Mobile"
                value={parentMobile}
                onChange={(e) => setParentMobile(e.target.value)}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="e.g. Male / Female"
              />
              <Input
                label="Date of Birth"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                Address
              </label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Residential Address"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                Career Objective Summary
              </label>
              <textarea
                rows={3}
                value={careerObjective}
                onChange={(e) => setCareerObjective(e.target.value)}
                placeholder="Enthusiastic undergraduate dedicated to leveraging software development skills for social impact."
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'academics' && (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Academic Records</CardTitle>
            <CardDescription>College, department, program, batch, and semester-wise GPA progression</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="College" value="Data not available" disabled />
              <Input label="Department" value="Data not available" disabled />
              <Input label="Program" value="Data not available" disabled />
              <Input label="Batch" value="Data not available" disabled />
              <Input label="Cumulative CGPA" value="Data not available" disabled />
              <Input label="Current Semester" value="Data not available" disabled />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'skills' && (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Technical & Soft Skills</CardTitle>
            <CardDescription>Tag technologies, programming languages, and competencies</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-xs text-[#76777d]">Skill tags can be specified in your student profile configuration.</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'projects' && (
        <Card className="space-y-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Projects & Demos</CardTitle>
              <CardDescription>Showcase your academic and personal software projects</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-xs text-[#76777d]">No projects recorded. Use backend profile updates to add projects.</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'achievements' && (
        <Card className="space-y-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Certifications & Honours</CardTitle>
              <CardDescription>Verified course certificates, hackathons, and awards</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-xs text-[#76777d]">No certifications recorded. Use backend profile updates to add certifications.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StudentProfilePage
