import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/hooks/useAuth'
import { authApi } from '@/api/auth.api'
import { notify } from '@/utils/toast'

export const ChangePasswordPage = () => {
  const navigate = useNavigate()
  const { user, updateCurrentUser } = useAuth()
  const [tempPass, setTempPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!tempPass) {
      notify.error('Please enter your current temporary password.')
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(newPass)) {
      notify.error(
        'Password must contain at least 1 uppercase letter (A-Z), 1 lowercase letter (a-z), 1 number, and 1 special character (@$!%*?&).'
      )
      return
    }
      return
    }

    if (newPass !== confirmPass) {
      notify.error('New password and confirm password do not match.')
      return
    }

    setLoading(true)

    try {
      const res = await authApi.changePassword({
        currentPassword: tempPass,
        newPassword: newPass,
        confirmPassword: confirmPass,
      })

      if (res.success) {
        notify.success(res.message || 'Password updated successfully!')
        updateCurrentUser({ isFirstLogin: false, isFirstTimeUser: false })

        // Redirect user to their corresponding role space
        if (user?.role === 'admin') {
          navigate('/admin/dashboard', { replace: true })
        } else if (user?.role === 'zone') {
          navigate('/zone/dashboard', { replace: true })
        } else {
          navigate('/student/dashboard', { replace: true })
        }
      } else {
        notify.error(res.message || 'Failed to update password.')
      }
    } catch (err: any) {
      let errMsg =
        err?.response?.data?.message || err?.message || 'Error updating password. Please check your credentials.'
      const validationErrors = err?.response?.data?.errors
      if (Array.isArray(validationErrors) && validationErrors.length > 0) {
        errMsg = validationErrors.map((e: any) => e.message).join('\n')
      }
      notify.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FCF8FA] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#FED65B]/30 border border-[#FED65B] flex items-center justify-center text-[#745c00] mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">First Login Security Setup</h2>
          <p className="text-xs text-[#45464c]">
            For your security, please update your temporary system password before proceeding to your dashboard.
          </p>
        </div>

        <Card className="p-8 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          <form onSubmit={handleUpdate} className="space-y-5">
            <Input
              label="Temporary Password"
              type="password"
              placeholder="Received in your email"
              value={tempPass}
              onChange={(e) => setTempPass(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              disabled={loading}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Min 8 chars (e.g. Samy@2007)"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              disabled={loading}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              disabled={loading}
              required
            />

            <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] space-y-1">
              <p className="text-[11px] font-semibold text-[#111827]">Password Requirements:</p>
              <ul className="text-[11px] text-[#45464c] space-y-0.5 list-disc pl-4">
                <li>At least 8 characters long</li>
                <li>Contains 1 uppercase (A-Z) & 1 lowercase letter (a-z)</li>
                <li>Contains 1 number (0-9) & 1 special character (@$!%*?&)</li>
              </ul>
            </div>

            <Button type="submit" variant="gold" size="lg" disabled={loading} className="w-full font-bold">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Save & Activate Account <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
