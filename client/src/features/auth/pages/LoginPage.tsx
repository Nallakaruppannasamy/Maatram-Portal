import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  GraduationCap,
  ShieldCheck,
  Mail,
  Lock,
  Hash,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  KeyRound,
  AlertCircle
} from 'lucide-react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { assets } from '@/assets'
import { useAuth } from '../../../context/AuthContext'

export type AuthRole = 'student' | 'zone_incharge' | 'super_admin'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { login } = useAuth()

  // 12. Environment Variable Configuration
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

  // 1. Explicit 3-Role Segmentation State
  const [selectedRole, setSelectedRole] = useState<AuthRole>('student')
  
  // Form Inputs
  const [regNumber, setRegNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // UI & Interactive States
  const [loading, setLoading] = useState(false) // 14. Form Submission Rate Mitigation
  const [showPassword, setShowPassword] = useState(false) // 5. Interactive Password Visibility Toggle
  const [error, setError] = useState('') // 9. Inline Field Error Highlights

  // 7. Client-Side Validation Flags
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPasswordValid = password.length >= 6
  const isRegValid = regNumber.trim().length >= 4

  // 8. Disabled Button State Guard
  const isFormValid =
    selectedRole === 'student'
      ? isRegValid && isPasswordValid
      : isEmailValid && isPasswordValid

  // Handle Role Switching
  const handleRoleChange = (role: AuthRole) => {
    setSelectedRole(role)
    setError('')
    setRegNumber('')
    setEmail('')
    setPassword('')
  }

  // 6. Live Input Formatting for Registration Number
  const handleRegNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = e.target.value.toUpperCase().replace(/\s+/g, '')
    setRegNumber(formatted)
  }

  // Submission Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || loading) return

    setError('')
    setLoading(true)

    try {
      // 10. Dual Identifier Payload Handling (backend expects 'identifier' and 'password')
      const identifier =
        selectedRole === 'student'
          ? regNumber.trim().toUpperCase()
          : email.trim().toLowerCase()

      const payload = {
        identifier,
        password,
      }

      const response = await axios.post(`${backendUrl}/api/v1/auth/login`, payload)

      if (response.data.success) {
        const { accessToken, user } = response.data.data

        // 11. Standardized JWT Local Storage Sync
        login(user, accessToken)

        // 17. Toast Feedback Notifications
        toast.success(response.data.message || 'Login Successful!')

        // FIRST-TIME LOGIN PASSWORD CHANGE ENFORCEMENT
        if (user.isFirstLogin) {
          toast.info('First-time login detected. Please set up a new password.')
          navigate('/change-password', { state: { required: true, role: selectedRole } })
          return
        }

        // 13. Role-Based Post-Login Routing (backend role enum: 'admin', 'zone', 'student')
        if (user.role === 'admin') {
          navigate('/admin/dashboard')
        } else if (user.role === 'zone') {
          navigate('/zone/dashboard')
        } else {
          navigate('/student/dashboard')
        }
      }
    } catch (err: any) {
      const errMsg =
        err.response?.data?.message ||
        'Authentication failed. Please verify your credentials.'
      
      // 9. Inline Field Error Highlights & 17. Toast Feedback
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    // 16. Timeless Altruism Token Colors (#FCF8FA Background)
    <div className="min-h-screen bg-[#FCF8FA] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#D4AF37]/20 selection:text-[#111827]">
      {/* 19. Subtle Entrance Animations CSS */}
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-login-card { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* 3. Responsive Mobile-First Card Layout (1-col on mobile, 2-col on md+) */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl bg-white border border-[#E5E7EB] shadow-xl overflow-hidden animate-login-card">
        
        {/* LEFT COLUMN: AUTH FORM */}
        <div className="p-8 sm:p-10 flex flex-col justify-center order-2 md:order-1">
          {/* Brand Header with 15. Assets Fallback Integration */}
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center gap-3 mb-3 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] rounded-xl">
              {assets?.logo ? (
                <img src={assets.logo} alt="Maatram Foundation" className="h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center text-white font-bold text-xl border border-slate-700 shadow-xs">
                  <span className="text-[#D4AF37]">M</span>
                </div>
              )}
            </Link>
            <h2 className="text-2xl font-black text-[#111827] tracking-tight">Portal Login</h2>
            <p className="text-xs font-medium text-[#45464c] mt-1">
              Select your workspace role and enter your credentials.
            </p>
          </div>

          {/* 1. Explicit 3-Role Segmentation Controls */}
          <div className="grid grid-cols-3 p-1 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] mb-6">
            {(['student', 'zone_incharge', 'super_admin'] as AuthRole[]).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`py-2 px-1 text-[10px] font-bold uppercase tracking-wider rounded-lg text-center transition-all cursor-pointer ${
                  selectedRole === role
                    ? 'bg-[#111827] text-white shadow-xs'
                    : 'text-[#76777d] hover:text-[#111827]'
                }`}
              >
                {role === 'zone_incharge'
                  ? 'Zone'
                  : role === 'super_admin'
                  ? 'Admin'
                  : 'Student'}
              </button>
            ))}
          </div>

          {/* 9. Inline Field Error Highlights Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Fields with 20. Keyboard Navigation & Accessibility */}
          <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
            {selectedRole === 'student' ? (
              <div>
                <label 
                  htmlFor="regNumber" 
                  className="block text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-1.5 ml-1"
                >
                  Registration Number
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
                  <input
                    id="regNumber"
                    name="regNumber"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={!isRegValid && regNumber.length > 0}
                    // 4. Context-Aware Dynamic Form Placeholders
                    placeholder="e.g. 2024CS1092"
                    value={regNumber}
                    // 6. Live Input Formatting
                    onChange={handleRegNumberChange}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold text-[#111827] uppercase focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all ${
                      regNumber && !isRegValid
                        ? 'border-red-300 bg-red-50/30'
                        : regNumber && isRegValid
                        ? 'border-emerald-500/50 bg-white'
                        : 'border-[#E5E7EB] bg-[#FCF8FA] focus:bg-white'
                    }`}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label 
                  htmlFor="email" 
                  className="block text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-1.5 ml-1"
                >
                  Authorized Work Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    aria-required="true"
                    aria-invalid={!isEmailValid && email.length > 0}
                    // 4. Context-Aware Dynamic Form Placeholders
                    placeholder={
                      selectedRole === 'zone_incharge'
                        ? 'coordinator@maatram.org'
                        : 'admin@maatram.org'
                    }
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-all ${
                      email && !isEmailValid
                        ? 'border-red-300 bg-red-50/30'
                        : email && isEmailValid
                        ? 'border-emerald-500/50 bg-white'
                        : 'border-[#E5E7EB] bg-[#FCF8FA] focus:bg-white'
                    }`}
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5 ml-1">
                <label 
                  htmlFor="password" 
                  className="block text-[10px] font-bold text-[#111827] uppercase tracking-wider"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-[#D4AF37] hover:underline focus:outline-none focus:ring-2 focus:ring-[#D4AF37] rounded"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#76777d]" />
                <input
                  id="password"
                  name="password"
                  // 5. Interactive Password Visibility Toggle State
                  type={showPassword ? 'text' : 'password'}
                  required
                  aria-required="true"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-[#E5E7EB] bg-[#FCF8FA] text-sm font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#76777d] hover:text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] rounded p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 8. Disabled Button State Guard & 14. Submission Rate Mitigation */}
            <Button
              type="submit"
              variant="gold"
              size="lg"
              disabled={loading || !isFormValid}
              className="w-full font-bold rounded-xl mt-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto text-white" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Access Workspace <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* First-Time Student Notice */}
          {selectedRole === 'student' && (
            <div className="mt-6 pt-4 border-t border-[#E5E7EB] text-center">
              <p className="text-[11px] text-[#45464c] flex items-center justify-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
                First-time user? Login with temporary credentials to trigger setup.
              </p>
            </div>
          )}
        </div>

        {/* 2. Visual Right-Side Feature Banner */}
        <div className="p-8 sm:p-10 bg-[#111827] text-white flex flex-col justify-between order-1 md:order-2 border-b md:border-b-0 md:border-l border-slate-800 relative overflow-hidden">
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between">
              <Badge variant="gold" size="sm">
                SVMS Enterprise
              </Badge>
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                System Operational
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-2xl font-black leading-snug tracking-tight">
                Verified Student Social Impact System
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Centralizing student volunteering records, zone-level hour verifications, and automated placement-ready resume builds for Maatram Foundation.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-xs font-medium text-slate-300">
                  Role-based access control & enterprise audit trails
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-xs font-medium text-slate-300">
                  QR code-authenticated student resumes
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span className="text-xs font-medium text-slate-300">
                  Multi-tier hour approval workflows
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between items-center relative z-10">
            <span>© 2026 Maatram Foundation</span>
            <Link to="/" className="text-[#D4AF37] hover:underline font-semibold focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded">
              Public Portal →
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default LoginPage