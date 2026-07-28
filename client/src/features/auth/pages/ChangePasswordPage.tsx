import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export const ChangePasswordPage = () => {
  const navigate = useNavigate()
  const [tempPass, setTempPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/student/dashboard')
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
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
            />

            <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] space-y-1">
              <p className="text-[11px] font-semibold text-[#111827]">Password Requirements:</p>
              <ul className="text-[11px] text-[#45464c] space-y-0.5 list-disc pl-4">
                <li>At least 8 characters long</li>
                <li>Contains at least one number or special character</li>
              </ul>
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full font-bold" icon={<ArrowRight className="w-4 h-4" />}>
              Save & Activate Account
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
