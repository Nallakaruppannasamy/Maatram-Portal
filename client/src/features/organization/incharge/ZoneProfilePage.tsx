import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { LoadingPage } from '@/components/ui/LoadingPage'
import { profileApi } from '@/api/profile.api'
import { useAuth } from '@/hooks/useAuth'
import { notify } from '@/utils/toast'

export const ZoneProfilePage = () => {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [fullName, setFullName] = useState('')
  const [mobile, setMobile] = useState('')

  const { data: profileRes, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  })

  const profile = profileRes?.data

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || (profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : user?.fullName || ''))
      setMobile(profile.mobile || '')
    }
  }, [profile, user])

  const updateMutation = useMutation({
    mutationFn: (payload: any) => profileApi.update(payload),
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate({ fullName, mobile })
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
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Zone Incharge Profile</h2>
        <p className="text-xs text-[#45464c]">Manage your account details and assigned zone administration settings.</p>
      </div>

      <Card className="p-8 space-y-6 bg-white border border-[#E5E7EB] rounded-2xl">
        <div className="flex items-center gap-4 pb-6 border-b border-[#E5E7EB]">
          <div className="w-16 h-16 rounded-2xl bg-[#111827] text-white flex items-center justify-center font-bold text-2xl border border-slate-700">
            <span className="text-[#D4AF37]">{initials}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#111827]">{displayName}</h3>
              <Badge variant="info">Zone Incharge</Badge>
            </div>
            <p className="text-xs text-[#76777d]">Assigned Role: {user?.role ? user.role.toUpperCase() : 'ZONE'}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={updateMutation.isPending}
            required
          />
          <Input
            label="Official Email Address"
            value={user?.email || ''}
            disabled
          />
          <Input
            label="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            disabled={updateMutation.isPending}
            placeholder="+91 98765 43210"
          />

          <Button
            type="submit"
            variant="gold"
            size="md"
            disabled={updateMutation.isPending}
            className="w-full font-bold"
          >
            {updateMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              'Save Profile Updates'
            )}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default ZoneProfilePage
