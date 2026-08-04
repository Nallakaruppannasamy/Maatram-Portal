import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, BookOpen, Code, Award, FolderGit2, Save, Plus, Loader2, Upload, AlertCircle } from 'lucide-react'
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
                      src={profileImage.startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${profileImage}` : profileImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
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

              {/* Department Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                  Department
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
                  <option value="">Select Department</option>
                  {filteredDepartments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Program Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                  Degree / Program
                </label>
                <select
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className={selectClassName}
                  disabled={!departmentId}
                  required
                >
                  <option value="">Select Program / Degree</option>
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
