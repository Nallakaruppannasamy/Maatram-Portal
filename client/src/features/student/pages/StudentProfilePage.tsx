import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, BookOpen, Code, Award, FolderGit2, Save, Plus, Loader2, Upload, AlertCircle, Trash2, Edit3, ExternalLink, Github, Globe, X, Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { profileApi } from '@/api/profile.api'
import { useAuth } from '@/hooks/useAuth'
import { notify } from '@/utils/toast'
import { getMediaUrl } from '@/utils/media'

export const StudentProfilePage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'basic' | 'academics' | 'skills' | 'projects' | 'achievements'>('basic')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile Form States
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [bloodGroup, setBloodGroup] = useState('')
  const [nationality, setNationality] = useState('')
  const [community, setCommunity] = useState('')
  const [religion, setReligion] = useState('')

  const [mobile, setMobile] = useState('')
  const [alternateMobile, setAlternateMobile] = useState('')

  const [parentName, setParentName] = useState('')
  const [parentMobile, setParentMobile] = useState('')
  const [parentOccupation, setParentOccupation] = useState('')
  const [guardianName, setGuardianName] = useState('')
  const [guardianMobile, setGuardianMobile] = useState('')

  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [state, setState] = useState('')
  const [country, setCountry] = useState('')
  const [pincode, setPincode] = useState('')

  const [careerObjective, setCareerObjective] = useState('')
  const [profileImage, setProfileImage] = useState('')

  // Academic Details
  const [collegeId, setCollegeId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [programId, setProgramId] = useState('')
  const [batch, setBatch] = useState('')
  const [cgpa, setCgpa] = useState('')
  const [semesterGrades, setSemesterGrades] = useState<{ semesterNumber: number; gpa: string }[]>([])

  const [isUploadingImage, setIsUploadingImage] = useState(false)

  // Fetch Master Data for academic dropdowns
  const { data: collegesRes } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => profileApi.getColleges(),
  })
  const { data: departmentsRes } = useQuery({
    queryKey: ['departments'],
    queryFn: () => profileApi.getDepartments(),
  })
  const { data: degreesRes } = useQuery({
    queryKey: ['degrees'],
    queryFn: () => profileApi.getDegrees(),
  })

  const colleges = collegesRes?.data || []
  const departments = departmentsRes?.data || []
  const degrees = degreesRes?.data || []

  // Filtered dropdown lists based on selection
  const filteredDepartments = departments.filter((d: any) => d.collegeId === collegeId)
  const filteredPrograms = degrees.filter((p: any) => p.departmentId === departmentId)

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  })

  const profile = profileRes?.data

  // Skills CRUD State
  const [newSkillInput, setNewSkillInput] = useState('')
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null)
  const [editingSkillName, setEditingSkillName] = useState('')

  // Projects CRUD State
  const [projectForm, setProjectForm] = useState({
    id: '',
    title: '',
    description: '',
    techStack: '',
    githubUrl: '',
    demoUrl: '',
  })
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)

  // Certifications CRUD State
  const [certForm, setCertForm] = useState({
    id: '',
    title: '',
    issuer: '',
    issueDate: '',
    certificateUrl: '',
  })
  const [isEditingCert, setIsEditingCert] = useState(false)
  const [showCertModal, setShowCertModal] = useState(false)

  // React Query Cache Invalidation Helper
  const invalidateProfileQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    if (profile?.id) {
      queryClient.invalidateQueries({ queryKey: ['resume', profile.id] })
    }
  }

  // Skill Mutations
  const addSkillMutation = useMutation({
    mutationFn: (skillName: string) => profileApi.addSkill(skillName),
    onSuccess: () => {
      invalidateProfileQueries()
      setNewSkillInput('')
      notify.success('Skill added successfully!')
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to add skill'),
  })

  const updateSkillMutation = useMutation({
    mutationFn: ({ id, skillName }: { id: string; skillName: string }) => profileApi.updateSkill(id, skillName),
    onSuccess: () => {
      invalidateProfileQueries()
      setEditingSkillId(null)
      setEditingSkillName('')
      notify.success('Skill updated successfully!')
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to update skill'),
  })

  const deleteSkillMutation = useMutation({
    mutationFn: (id: string) => profileApi.deleteSkill(id),
    onSuccess: () => {
      invalidateProfileQueries()
      notify.success('Skill deleted!')
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to delete skill'),
  })

  // Project Mutations
  const addProjectMutation = useMutation({
    mutationFn: (data: typeof projectForm) => profileApi.addProject(data),
    onSuccess: () => {
      invalidateProfileQueries()
      setShowProjectModal(false)
      setProjectForm({ id: '', title: '', description: '', techStack: '', githubUrl: '', demoUrl: '' })
      notify.success('Project added successfully!')
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to add project'),
  })

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof projectForm }) => profileApi.updateProject(id, data),
    onSuccess: () => {
      invalidateProfileQueries()
      setShowProjectModal(false)
      setIsEditingProject(false)
      setProjectForm({ id: '', title: '', description: '', techStack: '', githubUrl: '', demoUrl: '' })
      notify.success('Project updated successfully!')
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to update project'),
  })

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => profileApi.deleteProject(id),
    onSuccess: () => {
      invalidateProfileQueries()
      notify.success('Project deleted!')
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to delete project'),
  })

  // Certification Mutations
  const addCertMutation = useMutation({
    mutationFn: (data: typeof certForm) => profileApi.addCertification(data),
    onSuccess: () => {
      invalidateProfileQueries()
      setShowCertModal(false)
      setCertForm({ id: '', title: '', issuer: '', issueDate: '', certificateUrl: '' })
      notify.success('Certification added successfully!')
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to add certification'),
  })

  const updateCertMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof certForm }) => profileApi.updateCertification(id, data),
    onSuccess: () => {
      invalidateProfileQueries()
      setShowCertModal(false)
      setIsEditingCert(false)
      setCertForm({ id: '', title: '', issuer: '', issueDate: '', certificateUrl: '' })
      notify.success('Certification updated successfully!')
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to update certification'),
  })

  const deleteCertMutation = useMutation({
    mutationFn: (id: string) => profileApi.deleteCertification(id),
    onSuccess: () => {
      invalidateProfileQueries()
      notify.success('Certification deleted!')
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to delete certification'),
  })

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '')
      setMiddleName(profile.middleName || '')
      setLastName(profile.lastName || '')
      setGender(profile.gender || '')
      setDob(profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().split('T')[0] : '')
      setBloodGroup(profile.bloodGroup || '')
      setNationality(profile.nationality || '')
      setCommunity(profile.community || '')
      setReligion(profile.religion || '')

      setMobile(profile.mobile || '')
      setAlternateMobile(profile.alternateMobile || '')

      setParentName(profile.parentName || '')
      setParentMobile(profile.parentMobile || '')
      setParentOccupation(profile.parentOccupation || '')
      setGuardianName(profile.guardianName || '')
      setGuardianMobile(profile.guardianMobile || '')

      setAddressLine1(profile.addressLine1 || '')
      setAddressLine2(profile.addressLine2 || '')
      setCity(profile.city || '')
      setDistrict(profile.district || '')
      setState(profile.state || '')
      setCountry(profile.country || '')
      setPincode(profile.pincode || '')

      setCareerObjective(profile.careerObjective || '')
      setProfileImage(profile.profileImage || '')

      setCollegeId(profile.collegeId || '')
      setDepartmentId(profile.departmentId || '')
      setProgramId(profile.programId || '')
      setBatch(profile.batch || '')
      setCgpa(profile.cgpa ? String(profile.cgpa) : '')

      // Construct GPA list (semesters 1 to 8)
      const gradesMap = new Map<number, string>(
        (profile.semesterGrades || []).map((g: any) => [g.semesterNumber, String(g.gpa)] as [number, string])
      )
      const initialGrades = Array.from({ length: 8 }, (_, i) => {
        const sem = i + 1
        return {
          semesterNumber: sem,
          gpa: gradesMap.get(sem) || '',
        }
      })
      setSemesterGrades(initialGrades)
    }
  }, [profile])

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

    // Validate phone numbers: 10-15 digits
    const phoneRegex = /^\d{10,15}$/
    if (mobile && !phoneRegex.test(mobile)) {
      notify.error('Mobile number must be between 10 and 15 digits')
      return
    }
    if (alternateMobile && !phoneRegex.test(alternateMobile)) {
      notify.error('Alternate mobile must be between 10 and 15 digits')
      return
    }
    if (parentMobile && !phoneRegex.test(parentMobile)) {
      notify.error('Parent mobile must be between 10 and 15 digits')
      return
    }
    if (guardianMobile && !phoneRegex.test(guardianMobile)) {
      notify.error('Guardian mobile must be between 10 and 15 digits')
      return
    }

    // Validate pincode: 5-10 digits
    if (pincode && !/^\d{5,10}$/.test(pincode)) {
      notify.error('Pincode must be between 5 and 10 digits')
      return
    }

    // Validate CGPA range: 0 to 10
    if (cgpa !== '') {
      const numericCgpa = parseFloat(cgpa)
      if (isNaN(numericCgpa) || numericCgpa < 0 || numericCgpa > 10) {
        notify.error('Cumulative CGPA must be a number between 0 and 10')
        return
      }
    }

    const formattedSemesterGrades = semesterGrades
      .filter((g) => g.gpa !== '')
      .map((g) => {
        const val = parseFloat(g.gpa)
        if (isNaN(val) || val < 0 || val > 10) {
          throw new Error(`Semester ${g.semesterNumber} GPA must be a number between 0 and 10`)
        }
        return {
          semesterNumber: g.semesterNumber,
          gpa: val,
        }
      })

    try {
      updateMutation.mutate({
        firstName,
        middleName: middleName || null,
        lastName,
        gender,
        bloodGroup: bloodGroup || null,
        nationality: nationality || null,
        community: community || null,
        religion: religion || null,
        mobile,
        alternateMobile: alternateMobile || null,
        parentName,
        parentMobile,
        parentOccupation: parentOccupation || null,
        guardianName: guardianName || null,
        guardianMobile: guardianMobile || null,
        addressLine1,
        addressLine2: addressLine2 || null,
        city,
        district,
        state,
        country,
        pincode,
        careerObjective: careerObjective || null,
        profileImage: profileImage || null,
        collegeId,
        departmentId,
        programId,
        batch,
        cgpa: cgpa !== '' ? parseFloat(cgpa) : null,
        semesterGrades: formattedSemesterGrades,
      })
    } catch (err: any) {
      notify.error(err.message)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Size limit check (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify.error('Image size exceeds 5MB limit')
      return
    }

    // MIME type check (JPEG, PNG, WEBP)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      notify.error('Invalid image type. Allowed formats: JPEG, PNG, WEBP')
      return
    }

    try {
      setIsUploadingImage(true)
      const res = await profileApi.uploadImage(file)
      if (res.success && res.data?.fileUrl) {
        setProfileImage(res.data.fileUrl)
        queryClient.invalidateQueries({ queryKey: ['student-profile'] })
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        queryClient.invalidateQueries({ queryKey: ['auth-user'] })
        queryClient.invalidateQueries({ queryKey: ['me'] })
        notify.success('Profile picture uploaded successfully')
      } else {
        notify.error(res.message || 'Image upload failed')
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.message || err?.message || 'Error uploading image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const selectClassName = "w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"

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
        <div className="space-y-6">
          {/* Profile Completion Indicator */}
          {profile && profile.completionPercentage !== undefined && (
            <div className="bg-[#FAF9F6] border border-[#D4AF37]/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#111827]">Profile Completion Status</span>
                <span className="text-sm font-bold text-[#D4AF37]">{profile.completionPercentage}% Complete</span>
              </div>
              <div className="w-full bg-[#E5E7EB] h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-[#D4AF37] h-full transition-all duration-500" 
                  style={{ width: `${profile.completionPercentage}%` }}
                />
              </div>
              {profile.missingSections && profile.missingSections.length > 0 && (
                <div className="flex items-start gap-2 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    <strong>Missing sections:</strong> {profile.missingSections.join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Profile Picture Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
              <CardDescription>Upload a professional photograph (JPEG, PNG, WEBP, max 5MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center relative">
                  {profileImage ? (
                    <img 
                      src={getMediaUrl(profileImage)} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-center sm:text-left">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/webp" 
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    icon={<Upload className="w-4 h-4" />}
                  >
                    Choose Photo
                  </Button>
                  <p className="text-[10px] text-[#76777d]">Supported formats: JPEG, PNG, WEBP. Maximum size: 5MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Primary identification and personal attributes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <Input
                  label="Middle Name"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Optional"
                />
                <Input
                  label="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={selectClassName}
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>

                <Input
                  label="Date of Birth"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={Boolean(profile?.dateOfBirth)}
                  helperText={profile?.dateOfBirth ? "DOB is read-only after creation." : "Select your date of birth"}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                    Blood Group
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A_POSITIVE">A+</option>
                    <option value="A_NEGATIVE">A-</option>
                    <option value="B_POSITIVE">B+</option>
                    <option value="B_NEGATIVE">B-</option>
                    <option value="AB_POSITIVE">AB+</option>
                    <option value="AB_NEGATIVE">AB-</option>
                    <option value="O_POSITIVE">O+</option>
                    <option value="O_NEGATIVE">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Nationality"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="e.g. Indian"
                />
                <Input
                  label="Community"
                  value={community}
                  onChange={(e) => setCommunity(e.target.value)}
                  placeholder="e.g. BC / MBC / OC"
                />
                <Input
                  label="Religion"
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  placeholder="e.g. Hinduism / Christianity"
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Details</CardTitle>
              <CardDescription>How the foundation and volunteers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Register Number"
                  value={profile?.registrationNumber || 'Data not available'}
                  disabled
                  helperText="Admin controlled identifier"
                />
                <Input
                  label="Email Address"
                  value={user?.email || ''}
                  disabled
                  helperText="Admin controlled identifier"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Mobile Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-15 digit phone number"
                  required
                />
                <Input
                  label="Alternate Mobile"
                  value={alternateMobile}
                  onChange={(e) => setAlternateMobile(e.target.value)}
                  placeholder="10-15 digit phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Parents / Guardian Card */}
          <Card>
            <CardHeader>
              <CardTitle>Parents & Guardian Details</CardTitle>
              <CardDescription>Primary contact details of your parents or local guardian</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Parent Name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  required
                />
                <Input
                  label="Parent Mobile"
                  value={parentMobile}
                  onChange={(e) => setParentMobile(e.target.value)}
                  placeholder="10-15 digit phone number"
                  required
                />
                <Input
                  label="Parent Occupation"
                  value={parentOccupation}
                  onChange={(e) => setParentOccupation(e.target.value)}
                  placeholder="Occupation"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Guardian Name"
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  placeholder="Optional"
                />
                <Input
                  label="Guardian Mobile"
                  value={guardianMobile}
                  onChange={(e) => setGuardianMobile(e.target.value)}
                  placeholder="10-15 digit phone number"
                />
              </div>
            </CardContent>
          </Card>

          {/* Address Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Address Details</CardTitle>
              <CardDescription>Current residential address information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Address Line 1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="Door No, Street Name"
                  required
                />
                <Input
                  label="Address Line 2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Area, Locality"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <Input
                  label="District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                />
                <Input
                  label="State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                />
                <Input
                  label="Pincode"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="6 digit pincode"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Career Objective Card */}
          <Card>
            <CardHeader>
              <CardTitle>Career Objective Summary</CardTitle>
              <CardDescription>A brief statement summarizing your professional path and goals</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                rows={4}
                value={careerObjective}
                onChange={(e) => setCareerObjective(e.target.value)}
                placeholder="Enthusiastic undergraduate dedicated to leveraging software development skills for social impact..."
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'academics' && (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Academic Records</CardTitle>
            <CardDescription>College, department, program, batch, and semester-wise GPA progression</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Automatic Zone Determination Display */}
            {profile?.zone?.name && (
              <div className="bg-[#FAF9F6] border border-[#D4AF37]/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-[#76777d] block uppercase font-bold tracking-wider">Assigned Zone</span>
                  <span className="text-sm font-bold text-[#111827]">{profile.zone.name}</span>
                </div>
                <Badge variant="gold">Zone Auto-Determined</Badge>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* College Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                  College
                </label>
                <select
                  value={collegeId}
                  onChange={(e) => {
                    setCollegeId(e.target.value)
                    setDepartmentId('')
                    setProgramId('')
                  }}
                  className={selectClassName}
                  required
                >
                  <option value="">Select College</option>
                  {colleges.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Department Dropdown (labeled Degree) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                  Degree
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value)
                    setProgramId('')
                  }}
                  className={selectClassName}
                  disabled={!collegeId}
                  required
                >
                  <option value="">Select Degree</option>
                  {filteredDepartments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Program Dropdown (labeled Department) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                  Department
                </label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className={selectClassName}
                  disabled={!departmentId}
                  required
                >
                  <option value="">Select Department</option>
                  {filteredPrograms.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Batch"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="YYYY-YYYY e.g. 2024-2028"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
              <Input 
                label="Current Academic Year" 
                value={profile?.academicYear || 'Not Calculated'} 
                disabled 
                helperText="Auto-computed from Batch"
              />
              <Input 
                label="Current Semester" 
                value={profile?.semester || 'Not Calculated'} 
                disabled 
                helperText="Auto-computed from Batch"
              />
              <Input 
                label="Cumulative CGPA (Overall)" 
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={cgpa} 
                onChange={(e) => setCgpa(e.target.value)}
                placeholder="0.00 to 10.00"
              />
            </div>

            {/* Semester GPA Inputs */}
            <div className="pt-6 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-[#111827] mb-4">Semester-wise GPA Tracker</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {semesterGrades.map((g, idx) => (
                  <div key={g.semesterNumber} className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Sem {g.semesterNumber} GPA
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      value={g.gpa}
                      onChange={(e) => {
                        const updated = [...semesterGrades]
                        updated[idx].gpa = e.target.value
                        setSemesterGrades(updated)
                      }}
                      placeholder="e.g. 8.5"
                      className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                    />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills Tab (Task 1 CRUD) */}
      {activeTab === 'skills' && (
        <Card className="space-y-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Technical & Soft Skills</CardTitle>
              <CardDescription>Tag technologies, programming languages, and core competencies</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Add Skill Input Form */}
            <div className="flex gap-3">
              <Input
                placeholder="e.g. React.js, Python, Data Structures..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newSkillInput.trim()) {
                    e.preventDefault()
                    addSkillMutation.mutate(newSkillInput.trim())
                  }
                }}
              />
              <Button
                variant="gold"
                icon={<Plus size={16} />}
                disabled={!newSkillInput.trim() || addSkillMutation.isPending}
                onClick={() => addSkillMutation.mutate(newSkillInput.trim())}
              >
                {addSkillMutation.isPending ? 'Adding...' : 'Add Skill'}
              </Button>
            </div>

            {/* Skill Tags List */}
            {profile?.skills && profile.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2.5 pt-2">
                {profile.skills.map((skill: any) => (
                  <div
                    key={skill.id}
                    className="flex items-center gap-2 bg-[#FAF9F6] text-[#111827] px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-sm font-semibold shadow-xs"
                  >
                    {editingSkillId === skill.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingSkillName}
                          onChange={(e) => setEditingSkillName(e.target.value)}
                          className="px-2 py-0.5 text-xs border border-gray-300 rounded bg-white outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editingSkillName.trim()) {
                              updateSkillMutation.mutate({ id: skill.id, skillName: editingSkillName.trim() })
                            }
                          }}
                        />
                        <button
                          onClick={() => updateSkillMutation.mutate({ id: skill.id, skillName: editingSkillName.trim() })}
                          className="text-emerald-600 hover:text-emerald-700 p-0.5 cursor-pointer"
                          title="Save"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setEditingSkillId(null)}
                          className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                          title="Cancel"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span>{skill.skillName}</span>
                        <button
                          onClick={() => {
                            setEditingSkillId(skill.id)
                            setEditingSkillName(skill.skillName)
                          }}
                          className="text-gray-400 hover:text-blue-600 cursor-pointer transition ml-1"
                          title="Edit Skill"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => deleteSkillMutation.mutate(skill.id)}
                          className="text-gray-400 hover:text-red-600 cursor-pointer transition"
                          title="Delete Skill"
                        >
                          <X size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#76777d] italic">No skills tagged yet. Add your first skill tag above.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Projects Tab (Task 2 CRUD) */}
      {activeTab === 'projects' && (
        <Card className="space-y-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Projects & Demos</CardTitle>
              <CardDescription>Showcase your academic and personal software projects</CardDescription>
            </div>
            <Button
              variant="gold"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => {
                setIsEditingProject(false)
                setProjectForm({ id: '', title: '', description: '', techStack: '', githubUrl: '', demoUrl: '' })
                setShowProjectModal(true)
              }}
            >
              Add Project
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {profile?.projects && profile.projects.length > 0 ? (
              <div className="space-y-4">
                {profile.projects.map((proj: any) => (
                  <div key={proj.id} className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E5E7EB] space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-[#111827]">{proj.title}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          <span className="font-semibold text-gray-700">Tech Stack:</span> {proj.techStack}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIsEditingProject(true)
                            setProjectForm({
                              id: proj.id,
                              title: proj.title || '',
                              description: proj.description || '',
                              techStack: proj.techStack || '',
                              githubUrl: proj.githubUrl || '',
                              demoUrl: proj.demoUrl || '',
                            })
                            setShowProjectModal(true)
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-900 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title="Edit Project"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => deleteProjectMutation.mutate(proj.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#45464c] leading-relaxed">{proj.description}</p>
                    <div className="flex gap-4 text-xs font-semibold pt-1">
                      {proj.githubUrl && (
                        <a href={proj.githubUrl} target="_blank" rel="noreferrer" className="text-blue-900 hover:underline flex items-center gap-1">
                          <Github size={13} /> GitHub Repo
                        </a>
                      )}
                      {proj.demoUrl && (
                        <a href={proj.demoUrl} target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:underline flex items-center gap-1">
                          <Globe size={13} /> Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#76777d] italic">No projects recorded. Click &quot;Add Project&quot; to showcase your software work.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Certifications Tab (Task 3 CRUD) */}
      {activeTab === 'achievements' && (
        <Card className="space-y-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Certifications & Honours</CardTitle>
              <CardDescription>Verified course certificates, hackathons, and awards</CardDescription>
            </div>
            <Button
              variant="gold"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => {
                setIsEditingCert(false)
                setCertForm({ id: '', title: '', issuer: '', issueDate: '', certificateUrl: '' })
                setShowCertModal(true)
              }}
            >
              Add Certification
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {profile?.certifications && profile.certifications.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.certifications.map((cert: any) => {
                  const issueDateFormatted = cert.issueDate
                    ? new Date(cert.issueDate).toISOString().split('T')[0]
                    : ''
                  return (
                    <div key={cert.id} className="p-4 bg-[#FAF9F6] rounded-xl border border-[#E5E7EB] flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-[#111827]">{cert.title}</h4>
                        <p className="text-xs text-gray-500">
                          {cert.issuer} {issueDateFormatted && `• ${issueDateFormatted}`}
                        </p>
                        {cert.certificateUrl && (
                          <a href={cert.certificateUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-900 hover:underline flex items-center gap-1 mt-1">
                            <ExternalLink size={12} /> View Certificate
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setIsEditingCert(true)
                            setCertForm({
                              id: cert.id,
                              title: cert.title || '',
                              issuer: cert.issuer || '',
                              issueDate: issueDateFormatted,
                              certificateUrl: cert.certificateUrl || '',
                            })
                            setShowCertModal(true)
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-900 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title="Edit Certification"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => deleteCertMutation.mutate(cert.id)}
                          className="p-1.5 text-gray-500 hover:text-red-600 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                          title="Delete Certification"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-[#76777d] italic">No certifications recorded. Click &quot;Add Certification&quot; to add course completion records.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">{isEditingProject ? 'Edit Project' : 'Add New Project'}</h3>
              <button onClick={() => setShowProjectModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <Input
                label="Project Title"
                placeholder="e.g. Student SIS Portal"
                value={projectForm.title}
                onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                required
              />
              <Input
                label="Tech Stack (Comma Separated)"
                placeholder="e.g. React, Node.js, PostgreSQL"
                value={projectForm.techStack}
                onChange={(e) => setProjectForm({ ...projectForm, techStack: e.target.value })}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe key features, challenges, and impact..."
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-900"
                  required
                />
              </div>
              <Input
                label="GitHub Repository URL (Optional)"
                placeholder="https://github.com/..."
                value={projectForm.githubUrl}
                onChange={(e) => setProjectForm({ ...projectForm, githubUrl: e.target.value })}
              />
              <Input
                label="Live Demo URL (Optional)"
                placeholder="https://my-app.vercel.app"
                value={projectForm.demoUrl}
                onChange={(e) => setProjectForm({ ...projectForm, demoUrl: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setShowProjectModal(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                disabled={!projectForm.title || !projectForm.description || !projectForm.techStack || addProjectMutation.isPending || updateProjectMutation.isPending}
                onClick={() => {
                  if (isEditingProject) {
                    updateProjectMutation.mutate({ id: projectForm.id, data: projectForm })
                  } else {
                    addProjectMutation.mutate(projectForm)
                  }
                }}
              >
                {isEditingProject ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Certification Modal */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">{isEditingCert ? 'Edit Certification' : 'Add New Certification'}</h3>
              <button onClick={() => setShowCertModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <Input
                label="Certification Title"
                placeholder="e.g. AWS Certified Developer"
                value={certForm.title}
                onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                required
              />
              <Input
                label="Issuing Organization"
                placeholder="e.g. Amazon Web Services / Coursera"
                value={certForm.issuer}
                onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                required
              />
              <Input
                label="Issue Date"
                type="date"
                value={certForm.issueDate}
                onChange={(e) => setCertForm({ ...certForm, issueDate: e.target.value })}
                required
              />
              <Input
                label="Certificate URL / Verification Link (Optional)"
                placeholder="https://..."
                value={certForm.certificateUrl}
                onChange={(e) => setCertForm({ ...certForm, certificateUrl: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setShowCertModal(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                disabled={!certForm.title || !certForm.issuer || !certForm.issueDate || addCertMutation.isPending || updateCertMutation.isPending}
                onClick={() => {
                  if (isEditingCert) {
                    updateCertMutation.mutate({ id: certForm.id, data: certForm })
                  } else {
                    addCertMutation.mutate(certForm)
                  }
                }}
              >
                {isEditingCert ? 'Save Changes' : 'Add Certification'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StudentProfilePage
