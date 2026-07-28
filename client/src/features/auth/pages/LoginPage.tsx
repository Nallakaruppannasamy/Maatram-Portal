import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, ShieldCheck, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student')
  const [identifier, setIdentifier] = useState('2024CS1092')
  const [password, setPassword] = useState('••••••••')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'student') {
      navigate('/student/dashboard')
    } else {
      navigate('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#FCF8FA] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#111827] flex items-center justify-center text-white font-bold text-2xl border border-slate-700 shadow-sm">
              <span className="text-[#D4AF37]">M</span>
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Sign in to Maatram Portal</h2>
          <p className="text-xs text-[#45464c]">Select your account type to access your workspace</p>
        </div>

        {/* Auth Role Selector Tabs */}
        <Card className="p-2 bg-white border border-[#E5E7EB] rounded-2xl shadow-xs">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setActiveTab('student')
                setIdentifier('2024CS1092')
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'student'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-[#45464c] hover:bg-[#FCF8FA] hover:text-[#111827]'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${activeTab === 'student' ? 'text-[#D4AF37]' : ''}`} />
              Student Login
            </button>

            <button
              onClick={() => {
                setActiveTab('admin')
                setIdentifier('admin@maatram.org')
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'admin'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-[#45464c] hover:bg-[#FCF8FA] hover:text-[#111827]'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${activeTab === 'admin' ? 'text-[#D4AF37]' : ''}`} />
              Zone / Admin
            </button>
          </div>
        </Card>

        {/* Login Form */}
        <Card className="p-8 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <Input
                label={activeTab === 'student' ? 'Register Number' : 'Work Email Address'}
                placeholder={activeTab === 'student' ? 'e.g. 2024CS1092' : 'e.g. admin@maatram.org'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                icon={activeTab === 'student' ? <User className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-[#76777d] uppercase tracking-wider"></span>
                <Link to="/forgot-password" className="text-xs font-semibold text-[#D4AF37] hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full font-bold" icon={<ArrowRight className="w-4 h-4" />}>
              {activeTab === 'student' ? 'Login as Student' : 'Login as Admin'}
            </Button>
          </form>

          {/* First Login Hint */}
          {activeTab === 'student' && (
            <div className="mt-6 pt-5 border-t border-[#E5E7EB] text-center">
              <p className="text-xs text-[#45464c]">
                First time logging in with temporary credentials?{' '}
                <Link to="/change-password" className="font-semibold text-[#111827] underline">
                  Activate Account
                </Link>
              </p>
            </div>
          )}
        </Card>

        {/* Quick Demo Navigation Helper */}
        <div className="p-4 bg-[#F0EDEE] rounded-xl border border-[#E5E7EB] text-center space-y-1.5">
          <p className="text-xs font-semibold text-[#111827]">Demo Flow Shortcut:</p>
          <div className="flex justify-center gap-3 text-xs">
            <Link to="/student/dashboard" className="text-[#D4AF37] font-semibold hover:underline">
              Student View →
            </Link>
            <span className="text-[#76777d]">|</span>
            <Link to="/zone/dashboard" className="text-[#111827] font-semibold hover:underline">
              Zone Incharge →
            </Link>
            <span className="text-[#76777d]">|</span>
            <Link to="/admin/dashboard" className="text-[#111827] font-semibold hover:underline">
              Super Admin →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
