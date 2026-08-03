import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, KeyRound, ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { authApi } from '@/api/auth.api'
import { notify } from '@/utils/toast'

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialToken = searchParams.get('token') || ''

  const [token, setToken] = useState(initialToken)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token.trim()) {
      notify.error('Reset token is required.')
      return
    }

    if (newPassword.length < 6) {
      notify.error('New password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      notify.error('Passwords do not match.')
      return
    }

    setIsLoading(true)

    try {
      const res = await authApi.resetPassword({
        token: token.trim(),
        newPassword,
      })

      if (res.success) {
        notify.success(res.message || 'Password reset successfully! Please sign in with your new password.')
        navigate('/login')
      } else {
        notify.error(res.message || 'Failed to reset password.')
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message || err?.message || 'Invalid or expired reset token.'
      notify.error(errMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FCF8FA] flex items-center justify-center p-6 font-sans antialiased selection:bg-[#D4AF37]/20 selection:text-[#111827]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#745c00] mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Set New Password</h2>
          <p className="text-xs text-[#45464c]">
            Enter your reset token and your new account password below.
          </p>
        </div>

        <Card className="p-8 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Reset Token"
              placeholder="Enter recovery token from email"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              icon={<KeyRound className="w-4 h-4 text-[#45464c]" />}
              disabled={isLoading}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-[#45464c]" />}
              disabled={isLoading}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4 text-[#45464c]" />}
              disabled={isLoading}
              required
            />

            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={isLoading}
              className="w-full font-bold transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Resetting Password...
                </span>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111827] hover:text-[#D4AF37] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default ResetPasswordPage
