import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export const ForgotPasswordPage = () => {
  const [identifier, setIdentifier] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)

  // Countdown timer for resend action
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendTimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!identifier.trim()) {
      toast.error('Please enter your Email Address or Register Number')
      return
    }

    setIsLoading(true)

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'
      const response = await fetch(`${backendUrl}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(data.message || 'Reset instructions sent to your email.')
      } else {
        toast.info('If an account exists, recovery instructions have been processed.')
      }

      setSubmitted(true)
      setResendTimer(60)
    } catch (error) {
      toast.info('If an account exists, recovery instructions have been processed.')
      setSubmitted(true)
      setResendTimer(60)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = () => {
    if (resendTimer === 0) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    }
  }

  return (
    <div className="min-h-screen bg-[#FCF8FA] flex items-center justify-center p-6 font-sans antialiased selection:bg-[#D4AF37]/20 selection:text-[#111827]">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Section */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">
            Reset Your Password
          </h2>
          <p className="text-xs text-[#45464c]">
            Enter your registered email address or register number to recover your account
          </p>
        </div>

        {/* Main Card */}
        <Card className="p-8 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm transition-all duration-300">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address or Register No."
                placeholder="e.g. 2024CS1092 or student@maatram.org"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                icon={<Mail className="w-4 h-4 text-[#45464c]" />}
                disabled={isLoading}
                required
                autoFocus
              />

              <Button
                type="submit"
                variant="gold"
                size="lg"
                disabled={isLoading}
                className="w-full font-bold transition-all duration-200 active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-5 py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200/60 shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-[#111827]">Reset Instructions Sent</h3>
                <p className="text-xs text-[#45464c] leading-relaxed">
                  If an active account exists for <span className="font-semibold text-[#111827] break-all">{identifier}</span>, you will receive password recovery instructions shortly.
                </p>
              </div>

              {/* Resend Action Area */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendTimer > 0 || isLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111827] hover:text-[#D4AF37] disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  {resendTimer > 0 ? `Resend link in ${resendTimer}s` : "Didn't receive code? Resend"}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Footer */}
          <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111827] hover:text-[#D4AF37] transition-colors duration-150"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}