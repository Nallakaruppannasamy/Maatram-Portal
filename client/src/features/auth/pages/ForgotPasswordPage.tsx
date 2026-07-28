import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export const ForgotPasswordPage = () => {
  const [submitted, setSubmitted] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-[#FCF8FA] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Reset Your Password</h2>
          <p className="text-xs text-[#45464c]">Enter your registered email address or register number</p>
        </div>

        <Card className="p-8 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address or Register No."
                placeholder="e.g. 2024CS1092 or student@maatram.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <Button type="submit" variant="gold" size="lg" className="w-full font-bold">
                Send Reset Link
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">Reset Instructions Sent!</h3>
              <p className="text-xs text-[#45464c]">
                If an account exists for <span className="font-semibold text-[#111827]">{email || 'your email'}</span>, you will receive password recovery instructions shortly.
              </p>
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111827] hover:text-[#D4AF37]">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
