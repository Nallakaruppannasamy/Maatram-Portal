import React from 'react'
import { Link } from 'react-router-dom'
import { HeartHandshake, ShieldCheck, Award, GraduationCap, ArrowRight, CheckCircle2, Users, Building, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#FCF8FA] text-[#111827] flex flex-col font-sans">
      {/* Top Header Navigation */}
      <header className="h-20 border-b border-[#E5E7EB] bg-white px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center text-white font-bold text-xl border border-slate-700 shadow-sm">
            <span className="text-[#D4AF37]">M</span>
          </div>
          <div>
            <h1 className="font-bold text-[#111827] text-lg tracking-tight">MAATRAM FOUNDATION</h1>
            <p className="text-[11px] font-semibold text-[#76777d] uppercase tracking-wider">Student & Volunteer Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="outline" size="md">
              Sign In
            </Button>
          </Link>
          <Link to="/student/dashboard">
            <Button variant="gold" size="md" icon={<ArrowRight className="w-4 h-4" />}>
              Explore Demo Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-8 max-w-7xl mx-auto flex flex-col items-center text-center">
        <Badge variant="gold" className="mb-6 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest shadow-xs">
          <Sparkles className="w-3.5 h-3.5 mr-1" /> Verified Student Impact Platform
        </Badge>
        
        <h1 className="text-5xl sm:text-6xl font-extrabold text-[#111827] tracking-tight max-w-4xl leading-[1.15]">
          From scattered records to a <span className="text-[#D4AF37] underline decoration-[#D4AF37]/30">verified story</span> of every student's impact.
        </h1>

        <p className="mt-6 text-lg text-[#45464c] max-w-2xl leading-relaxed">
          The official Student & Volunteer Management System for Maatram Foundation. Empowering students to build verified portfolios, log volunteer hours, and generate QR-verified resumes for mock HR interviews.
        </p>

        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link to="/login">
            <Button variant="primary" size="lg" icon={<GraduationCap className="w-5 h-5 text-[#D4AF37]" />}>
              Student Login
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg" icon={<ShieldCheck className="w-5 h-5 text-[#111827]" />}>
              Zone & Admin Portal
            </Button>
          </Link>
        </div>

        {/* Hero Impact Metrics Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 w-full max-w-5xl">
          <Card className="text-center p-6 bg-white border border-[#E5E7EB] rounded-2xl">
            <p className="text-3xl font-extrabold text-[#111827]">2,500+</p>
            <p className="text-xs font-semibold text-[#76777d] mt-1 uppercase tracking-wider">Active Students</p>
          </Card>
          <Card className="text-center p-6 bg-white border border-[#E5E7EB] rounded-2xl">
            <p className="text-3xl font-extrabold text-[#D4AF37]">48,000+</p>
            <p className="text-xs font-semibold text-[#76777d] mt-1 uppercase tracking-wider">Verified Hours</p>
          </Card>
          <Card className="text-center p-6 bg-white border border-[#E5E7EB] rounded-2xl">
            <p className="text-3xl font-extrabold text-[#111827]">14</p>
            <p className="text-xs font-semibold text-[#76777d] mt-1 uppercase tracking-wider">Foundation Zones</p>
          </Card>
          <Card className="text-center p-6 bg-white border border-[#E5E7EB] rounded-2xl">
            <p className="text-3xl font-extrabold text-[#111827]">120+</p>
            <p className="text-xs font-semibold text-[#76777d] mt-1 uppercase tracking-wider">Partner Colleges</p>
          </Card>
        </div>
      </section>

      {/* Core Platform Capabilities */}
      <section className="py-16 bg-white border-t border-[#E5E7EB] px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-[#111827]">Platform Capabilities</h2>
            <p className="text-sm text-[#45464c] mt-2">Enterprise-grade architecture built for transparency, auditability, and ease of management.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card hoverable className="p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FCF8FA] border border-[#E5E7EB] flex items-center justify-center text-[#D4AF37]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#111827]">Verified Volunteering</h3>
              <p className="text-xs text-[#45464c] leading-relaxed">
                Volunteering hours count only when reviewed and approved with proof by assigned Zone Incharges. No unverified self-reporting.
              </p>
            </Card>

            <Card hoverable className="p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FCF8FA] border border-[#E5E7EB] flex items-center justify-center text-[#111827]">
                <Award className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-[#111827]">QR-Verified Resumes</h3>
              <p className="text-xs text-[#45464c] leading-relaxed">
                Automatically generate standardized, print-ready PDF resumes complete with verifiable QR codes for HR interviews and placements.
              </p>
            </Card>

            <Card hoverable className="p-8 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-[#FCF8FA] border border-[#E5E7EB] flex items-center justify-center text-[#111827]">
                <Building className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="text-xl font-bold text-[#111827]">Hierarchical Control</h3>
              <p className="text-xs text-[#45464c] leading-relaxed">
                Structured multi-tier access mapping Organizations $\rightarrow$ Zones $\rightarrow$ Colleges $\rightarrow$ Departments $\rightarrow$ Batches for effortless scaling.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[#111827] text-white px-8 mt-auto border-t border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Maatram Foundation. All Rights Reserved. Student & Volunteer Management System (v0.2).</p>
          <div className="flex gap-6">
            <Link to="/login" className="hover:text-white transition-colors">Portal Login</Link>
            <Link to="/student/dashboard" className="hover:text-[#D4AF37] transition-colors">Demo Student View</Link>
            <Link to="/admin/dashboard" className="hover:text-[#D4AF37] transition-colors">Demo Admin View</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
