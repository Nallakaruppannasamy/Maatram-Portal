import React, { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Upload, Trash2, Camera, Lock, CheckCircle2, User, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { profileApi } from '@/api/profile.api'
import { authApi } from '@/api/auth.api'
import { useAuth } from '@/hooks/useAuth'
import { notify } from '@/utils/toast'
import { getMediaUrl } from '@/utils/media'

export const ZoneProfilePage = () => {
  const queryClient = useQueryClient()
  const { user, updateCurrentUser } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile Form State
  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')
  const [designation, setDesignation] = useState('')
  const [bio, setBio] = useState('')
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [imageRemoving, setImageRemoving] = useState(false)

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Fetch Profile Data
  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  })

  const profile = profileRes?.data

  useEffect(() => {
    if (profile) {
      setFullName(
        profile.fullName ||
          (profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : user?.fullName || '')
      )
      setMobile(profile.mobile || '')
      setDesignation(profile.designation || '')
      setBio(profile.bio || '')
      setProfileImage(profile.profileImage || null)
    }
  }, [profile, user])

  // Update Profile Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: any) => profileApi.update(payload),
    onSuccess: (res) => {
      if (res.success) {
        notify.success('Zone Profile details saved successfully!')
        const currentImg = res.data?.profileImage ?? (profileImage || null)
        if (updateCurrentUser) {
          updateCurrentUser({
            fullName: fullName.trim(),
            mobile: mobile.trim(),
            profileImage: currentImg,
            profilePhotoUrl: currentImg,
          })
        }
        queryClient.setQueryData(['profile'], (old: any) =>
          old ? { ...old, data: { ...old.data, ...res.data } } : old
        )
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        queryClient.invalidateQueries({ queryKey: ['auth-user'] })
        queryClient.invalidateQueries({ queryKey: ['me'] })
      } else {
        notify.error(res.message || 'Failed to update profile.')
      }
    },
    onError: (err: any) => {
      notify.error(err?.response?.data?.message || err?.message || 'Error updating profile.')
    },
  })

  // Change Password Mutation
  const passwordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      authApi.changePassword(payload as any),
    onSuccess: (res) => {
      if (res.success) {
        notify.success('Password changed successfully!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        notify.error(res.message || 'Failed to change password.')
      }
    },
    onError: (err: any) => {
      notify.error(err?.response?.data?.message || err?.message || 'Error changing password.')
    },
  })

  // Handle Image Upload Validation & Server POST
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      notify.error('Invalid image type. Please upload JPEG, PNG, or WebP files.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error('File size exceeds 5MB limit. Please upload a smaller image.')
      return
    }

    try {
      setImageUploading(true)
      const res = await profileApi.uploadImage(file)
      if (res.success && res.data?.fileUrl) {
        const newImageUrl = res.data.fileUrl
        setProfileImage(newImageUrl)
        if (updateCurrentUser) {
          updateCurrentUser({
            profileImage: newImageUrl,
            profilePhotoUrl: newImageUrl,
          })
        }
        queryClient.setQueryData(['profile'], (old: any) =>
          old ? { ...old, data: { ...old.data, profileImage: newImageUrl } } : old
        )
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        queryClient.invalidateQueries({ queryKey: ['auth-user'] })
        queryClient.invalidateQueries({ queryKey: ['me'] })
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        notify.success('Profile picture updated successfully!')
      } else {
        notify.error('Failed to upload image.')
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.message || err?.message || 'Error uploading image.')
    } finally {
      setImageUploading(false)
    }
  }

  // Remove Profile Picture
  const handleRemoveImage = async () => {
    try {
      setImageRemoving(true)
      const res = await profileApi.update({
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        designation: designation.trim(),
        bio: bio.trim(),
        profileImage: null,
      })

      if (res.success) {
        setProfileImage(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        if (updateCurrentUser) {
          updateCurrentUser({
            profileImage: null,
            profilePhotoUrl: null,
          })
        }
        queryClient.setQueryData(['profile'], (old: any) =>
          old ? { ...old, data: { ...old.data, profileImage: null } } : old
        )
        queryClient.invalidateQueries({ queryKey: ['profile'] })
        queryClient.invalidateQueries({ queryKey: ['auth-user'] })
        queryClient.invalidateQueries({ queryKey: ['me'] })
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] })
        notify.success('Profile picture removed successfully!')
      } else {
        notify.error(res.message || 'Failed to remove profile picture.')
      }
    } catch (err: any) {
      notify.error(err?.response?.data?.message || err?.message || 'Error removing profile picture.')
    } finally {
      setImageRemoving(false)
    }
  }

  // Submit Profile Changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      designation: designation.trim(),
      bio: bio.trim(),
      profileImage: profileImage || null,
    })
  }

  // Submit Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword) {
      notify.error('Please enter your current password.')
      return
    }
    if (!newPassword || newPassword.length < 8) {
      notify.error('New password must be at least 8 characters long.')
      return
    }
    if (newPassword !== confirmPassword) {
      notify.error('New password and confirm password do not match.')
      return
    }

    passwordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    })
  }

  if (isLoading) {
    return <LoadingPage message="Loading zone profile details..." />
  }

  const displayName = fullName || user?.fullName || user?.name || user?.email || 'Zone Incharge'
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Zone Incharge Profile</h2>
        <p className="text-xs text-[#45464c]">Manage your official profile, bio, contact preferences, and security settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-12 space-y-6">
          <Card className="p-6 md:p-8 space-y-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs">
            {/* Header / Avatar Row */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#E5E7EB]">
              <div className="relative group">
                {profileImage ? (
                  <img
                    src={getMediaUrl(profileImage)}
                    alt={displayName}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-[#D4AF37] shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-[#111827] text-white flex items-center justify-center font-bold text-3xl border-2 border-slate-700 shadow-sm">
                    <span className="text-[#D4AF37]">{initials}</span>
                  </div>
                )}

                {imageUploading && (
                  <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-xl font-bold text-[#111827]">{displayName}</h3>
                  <Badge variant="info">Zone Incharge</Badge>
                </div>
                <p className="text-xs text-[#76777d]">
                  Designation: <span className="font-semibold text-[#111827]">{designation || 'Zone Administrator'}</span>
                </p>

                {/* Avatar Action Controls */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={imageUploading || imageRemoving}
                    onClick={() => fileInputRef.current?.click()}
                    icon={imageUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  >
                    {profileImage ? 'Replace Photo' : 'Upload Photo'}
                  </Button>

                  {profileImage && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={imageUploading || imageRemoving}
                      onClick={handleRemoveImage}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      icon={imageRemoving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    >
                      {imageRemoving ? 'Removing...' : 'Remove Photo'}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Update Form */}
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <h4 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                <User className="w-4 h-4 text-[#D4AF37]" /> Personal Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={updateMutation.isPending}
                  required
                  placeholder="Enter full name"
                />
                <Input
                  label="Official Email Address"
                  value={user?.email || ''}
                  disabled
                />
                <Input
                  label="Mobile Contact Number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  disabled={updateMutation.isPending}
                  placeholder="+91 98765 43210"
                />
                <Input
                  label="Official Designation"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  disabled={updateMutation.isPending}
                  placeholder="e.g. North Zone Regional In-Charge"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111827] mb-1.5">
                  Administrative Bio / Summary
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={updateMutation.isPending}
                  placeholder="Briefly describe your zone administration responsibilities..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-xs text-[#111827] focus:ring-2 focus:ring-[#111827] focus:border-transparent outline-none transition disabled:bg-gray-50"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="gold"
                  size="md"
                  disabled={updateMutation.isPending}
                  className="w-full sm:w-auto font-bold px-8"
                  icon={updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                >
                  {updateMutation.isPending ? 'Saving Updates...' : 'Save Profile Updates'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Change Password Card */}
          <Card className="p-6 md:p-8 space-y-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs">
            <h4 className="text-sm font-bold text-[#111827] flex items-center gap-2 border-b border-[#E5E7EB] pb-3">
              <Lock className="w-4 h-4 text-[#D4AF37]" /> Security & Account Password
            </h4>

            <form onSubmit={handleChangePassword} className="space-y-4 max-w-2xl">
              <Input
                label="Current Password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={passwordMutation.isPending}
                required
                placeholder="••••••••"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={passwordMutation.isPending}
                  required
                  placeholder="Minimum 8 characters"
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={passwordMutation.isPending}
                  required
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="outline"
                  size="md"
                  disabled={passwordMutation.isPending}
                  className="w-full sm:w-auto font-bold px-6 border-slate-300 text-slate-800 hover:bg-slate-50"
                  icon={passwordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                >
                  {passwordMutation.isPending ? 'Updating Password...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ZoneProfilePage
