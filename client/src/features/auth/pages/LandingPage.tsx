import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  HeartHandshake,
  Building2,
  ShieldCheck,
  Award,
  Users,
  School,
  Building,
  CheckCircle2,
  FileText,
  PieChart,
  Calendar,
  Layers,
  ArrowRight,
  Star,
  Globe,
  Mail,
  Phone,
  Send,
  Sparkles,
  TrendingUp,
  FileCheck2,
  Download,
  Lock,
  Compass,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { assets } from '@/assets'

export const LandingPage: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#FCF8FA] text-[#1B1B1D] flex flex-col font-sans antialiased selection:bg-[#D4AF37]/20 selection:text-[#111827]">
      {/* SECTION 1: HEADER NAVIGATION */}
      <header
        className={`sticky top-0 w-full z-50 bg-[#FCF8FA]/90 backdrop-blur-md border-b border-[#E5E2E3] transition-all duration-300 ${
          isScrolled ? 'h-16 shadow-md' : 'h-20'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex justify-between items-center h-full">
          {/* Brand Identity with Assets Logo */}
          <div className="flex items-center gap-3">
            {assets?.logo ? (
              <img
                src={assets.logo}
                alt="Maatram Foundation Logo"
                className={`object-contain transition-all duration-300 ${
                  isScrolled ? 'h-10' : 'h-12'
                }`}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center text-white font-black text-xl border border-slate-700 shadow-sm">
                <span className="text-[#D4AF37]">M</span>
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="font-extrabold text-[#111827] text-base leading-tight tracking-tight uppercase">
                MAATRAM
              </h1>
              <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
                Volunteering Portal
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#hero" className="text-[#D4AF37] font-semibold border-b-2 border-[#D4AF37] pb-1 text-sm">
              Home
            </a>
            <a href="#impact" className="text-[#45464C] font-medium hover:text-[#D4AF37] transition-colors text-sm">
              Impact
            </a>
            <a href="#philosophy" className="text-[#45464C] font-medium hover:text-[#D4AF37] transition-colors text-sm">
              About
            </a>
            <a href="#modules" className="text-[#45464C] font-medium hover:text-[#D4AF37] transition-colors text-sm">
              Features
            </a>
            <a href="#footer" className="text-[#45464C] font-medium hover:text-[#D4AF37] transition-colors text-sm">
              Contact
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link to="/student/dashboard" className="hidden lg:block">
              <Button variant="outline" size="sm" className="rounded-xl border-[#E5E7EB]">
                Explore Demo
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="gold" size="sm" className="rounded-xl font-bold shadow-sm">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* SECTION 2: HERO SECTION */}
        <section id="hero" className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="z-10">
              <Badge variant="gold" className="mb-6 px-3.5 py-1 text-xs font-bold uppercase tracking-widest rounded-full">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Verified Student Impact
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111827] tracking-tight leading-[1.12] mb-6">
                Empowering Every Student Through{' '}
                <span className="text-[#D4AF37] underline decoration-[#D4AF37]/30 decoration-wavy underline-offset-8">
                  Verified Volunteering.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-[#45464C] mb-8 max-w-lg leading-relaxed">
                A robust digital ecosystem designed to streamline student outreach, volunteer engagement, and impact reporting with enterprise-grade security.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/login">
                  <Button variant="gold" size="lg" className="rounded-xl px-8 font-bold shadow-md">
                    Get Started
                  </Button>
                </Link>
                <a href="#modules">
                  <Button variant="outline" size="lg" className="rounded-xl px-8 border-[#76777D] text-[#111827] hover:bg-[#F0EDEE]">
                    Explore Platform
                  </Button>
                </a>
              </div>
            </div>

            {/* Dashboard Visual Mockup Container */}
            <div className="relative">
              <div className="rounded-2xl border border-[#E5E2E3] bg-white shadow-2xl p-2 relative overflow-hidden">
                <div className="bg-[#111827] rounded-xl p-4 text-white mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-slate-400 font-mono ml-2">svms.maatramfoundation.org</span>
                  </div>
                  <Badge variant="gold" size="sm">LIVE PORTAL</Badge>
                </div>
                
                <div className="p-4 space-y-4 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-[#E5E7EB] text-center">
                      <p className="text-[10px] text-[#76777D] font-bold uppercase">Log Hours</p>
                      <p className="text-lg font-black text-[#111827]">48,200+</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-[#E5E7EB] text-center">
                      <p className="text-[10px] text-[#76777D] font-bold uppercase">Approvals</p>
                      <p className="text-lg font-black text-[#D4AF37]">99.4%</p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-[#E5E7EB] text-center">
                      <p className="text-[10px] text-[#76777D] font-bold uppercase">Zones</p>
                      <p className="text-lg font-black text-[#111827]">14 Active</p>
                    </div>
                  </div>
                  <ProgressBar value={78} label="Quarterly Community Reach Goal" color="gold" size="md" />
                </div>
              </div>

              {/* Floating Stat Badge */}
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl border border-[#E5E2E3] shadow-xl hidden md:flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37]">
                  <Star className="w-6 h-6 fill-[#D4AF37]" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#76777D] uppercase tracking-wider">Top Achievement</p>
                  <p className="text-sm font-black text-[#111827]">98% Placement Success Rate</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: SOCIAL IMPACT STATS */}
        <section id="impact" className="bg-[#F6F3F4] py-16 lg:py-20 border-y border-[#E5E2E3]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight mb-2">
                Building Verified Student Impact
              </h2>
              <div className="w-16 h-1 bg-[#D4AF37] mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white p-8 rounded-2xl border border-[#E5E2E3] text-center hover:shadow-lg transition-all">
                <School className="w-10 h-10 text-[#D4AF37] mx-auto mb-4" />
                <h3 className="text-3xl lg:text-4xl font-extrabold text-[#111827]">10k+</h3>
                <p className="text-sm font-medium text-[#45464C] mt-1">Active Students</p>
              </Card>

              <Card className="bg-white p-8 rounded-2xl border border-[#E5E2E3] text-center hover:shadow-lg transition-all">
                <HeartHandshake className="w-10 h-10 text-[#D4AF37] mx-auto mb-4" />
                <h3 className="text-3xl lg:text-4xl font-extrabold text-[#111827]">500+</h3>
                <p className="text-sm font-medium text-[#45464C] mt-1">Verified Activities</p>
              </Card>

              <Card className="bg-white p-8 rounded-2xl border border-[#E5E2E3] text-center hover:shadow-lg transition-all">
                <Building className="w-10 h-10 text-[#D4AF37] mx-auto mb-4" />
                <h3 className="text-3xl lg:text-4xl font-extrabold text-[#111827]">50+</h3>
                <p className="text-sm font-medium text-[#45464C] mt-1">Corporate Partners</p>
              </Card>

              <Card className="bg-white p-8 rounded-2xl border border-[#E5E2E3] text-center hover:shadow-lg transition-all">
                <Award className="w-10 h-10 text-[#D4AF37] mx-auto mb-4" />
                <h3 className="text-3xl lg:text-4xl font-extrabold text-[#111827]">100+</h3>
                <p className="text-sm font-medium text-[#45464C] mt-1">Programs Launched</p>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 4: WHY MAATRAM (CORE PHILOSOPHY) */}
        <section id="philosophy" className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="w-full max-w-md p-8 bg-white rounded-2xl border border-[#E5E2E3] shadow-xl relative">
                <div className="flex items-center gap-3 mb-6">
                  {assets?.logo ? (
                    <img src={assets.logo} alt="Maatram Foundation" className="h-12 w-auto" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-[#111827] text-[#D4AF37] flex items-center justify-center font-bold text-2xl shadow-md">
                      M
                    </div>
                  )}
                </div>
                <h4 className="text-xl font-bold text-[#111827] mb-2">Centralized Governance</h4>
                <p className="text-xs text-[#45464C] leading-relaxed mb-6">
                  Connecting Students, Zone Coordinators, and Management into a unified transparent ecosystem.
                </p>
                <div className="space-y-3">
                  <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-xs font-semibold text-[#111827]">Role-Based Security (RBAC)</span>
                  </div>
                  <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] flex items-center gap-3">
                    <FileCheck2 className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-xs font-semibold text-[#111827]">Multi-Level Hour Approval</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest mb-2 block">
                Core Philosophy
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] mb-4 leading-tight">
                Designed for Students. <br />Built for Organisations.
              </h2>
              <p className="text-base text-[#45464C] mb-8 leading-relaxed">
                Our platform bridges the gap between individual aspiration and institutional oversight, providing real-time tools for every stakeholder.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                {[
                  { title: 'Verified Records', icon: ShieldCheck },
                  { title: 'Resume Generator', icon: FileText },
                  { title: 'Role Based Access', icon: Lock },
                  { title: 'Advanced Analytics', icon: PieChart },
                  { title: 'Student Portfolio', icon: GraduationCap },
                  { title: 'Approval Workflow', icon: CheckCircle2 },
                  { title: 'Secure Auth', icon: ShieldCheck },
                  { title: 'Enterprise Arch', icon: Layers },
                ].map((item, idx) => {
                  const IconComponent = item.icon
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <IconComponent className="w-5 h-5 text-[#D4AF37] shrink-0" />
                      <span className="text-sm font-semibold text-[#111827]">{item.title}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: HOW IT WORKS (ONBOARDING TIMELINE) */}
        <section className="bg-[#111827] text-white py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                Seamless Onboarding Process
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto">
                Follow these four simple steps to begin building your verified legacy within the Maatram ecosystem.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              {[
                { step: '1', title: 'Registration', desc: 'Securely register your institutional or individual profile.' },
                { step: '2', title: 'Profile Verification', desc: 'Submit credentials for our automated verification engine.' },
                { step: '3', title: 'Submit Activities', desc: 'Log your volunteer hours and extracurricular achievements.' },
                { step: '4', title: 'Generate Portfolio', desc: 'Export your verified resume and impact report instantly.' },
              ].map((item, idx) => (
                <div key={idx} className="text-center md:text-left space-y-3">
                  <div className="w-16 h-16 bg-[#D4AF37] text-[#111827] rounded-2xl font-black text-2xl flex items-center justify-center mx-auto md:mx-0 shadow-lg">
                    {item.step}
                  </div>
                  <h4 className="text-lg font-bold text-white">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 6: INTEGRATED PLATFORM MODULES */}
        <section id="modules" className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-4">
              <div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] mb-2">
                  Integrated Platform Modules
                </h2>
                <p className="text-base text-[#45464C]">Explore the core features of the management suite.</p>
              </div>
              <Button variant="ghost" className="text-[#D4AF37] hover:text-[#111827] font-bold p-0 flex items-center gap-1.5">
                View Documentation <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Student Portal', icon: GraduationCap, desc: 'Personalized dashboards for students to track progress, download certificates, and find opportunities.' },
                { title: 'Volunteer Mgmt', icon: HeartHandshake, desc: 'Tools for organizations to manage recruitment, shifts, and verification workflows effortlessly.' },
                { title: 'Impact Analytics', icon: PieChart, desc: 'Granular data insights on community impact, volunteer hours, and geographical reach.' },
                { title: 'Report Engine', icon: FileText, desc: 'Automated generation of CSR reports, annual summaries, and regulatory filings.' },
                { title: 'Event Planner', icon: Calendar, desc: 'Coordinate large-scale foundation events with RSVP tracking and automated reminders.' },
                { title: 'API Integration', icon: Layers, desc: 'Seamlessly connect Maatram data with external institutional management systems.' },
              ].map((mod, idx) => {
                const IconComponent = mod.icon
                return (
                  <Card key={idx} hoverable className="p-8 bg-white border border-[#E5E2E3] rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-[#FCF8FA] border border-[#E5E7EB] flex items-center justify-center text-[#D4AF37] mb-6">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-[#111827] mb-3">{mod.title}</h3>
                      <p className="text-xs text-[#45464C] leading-relaxed mb-6">{mod.desc}</p>
                    </div>
                    <div className="h-1 w-12 bg-[#D4AF37]/40 rounded-full" />
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* SECTION 7: TAILORED EXPERIENCES BY ROLE */}
        <section className="bg-[#F6F3F4] py-20 lg:py-28 border-y border-[#E5E2E3]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] mb-2">
                Tailored Experiences by Role
              </h2>
              <p className="text-sm text-[#45464C] max-w-xl mx-auto">
                Every user gets a curated interface designed for their specific objectives and permissions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Student Role */}
              <Card className="bg-white rounded-2xl border-l-4 border-l-[#D4AF37] border-t border-r border-b border-[#E5E2E3] p-8 shadow-sm">
                <h4 className="text-xl font-bold text-[#111827] mb-6 flex items-center gap-2">
                  <GraduationCap className="w-6 h-6 text-[#D4AF37]" /> Student
                </h4>
                <ul className="space-y-3 text-sm text-[#45464C]">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" /> Access activity marketplace</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" /> Log volunteer hours with proof</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" /> Download QR-verified resume</li>
                </ul>
              </Card>

              {/* Zone Incharge Role */}
              <Card className="bg-white rounded-2xl border-l-4 border-l-[#D4AF37] border-t border-r border-b border-[#E5E2E3] p-8 shadow-sm">
                <h4 className="text-xl font-bold text-[#111827] mb-6 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-[#D4AF37]" /> Zone Incharge
                </h4>
                <ul className="space-y-3 text-sm text-[#45464C]">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" /> Moderate local activities</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" /> Approve student logged hours</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" /> Regional impact reporting</li>
                </ul>
              </Card>

              {/* Super Admin Role */}
              <Card className="bg-white rounded-2xl border-l-4 border-l-[#D4AF37] border-t border-r border-b border-[#E5E2E3] p-8 shadow-sm">
                <h4 className="text-xl font-bold text-[#111827] mb-6 flex items-center gap-2">
                  <Lock className="w-6 h-6 text-[#D4AF37]" /> Super Admin
                </h4>
                <ul className="space-y-3 text-sm text-[#45464C]">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" /> System-wide configuration</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" /> Excel batch provisioning</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-[#D4AF37]" /> Audit logs & security settings</li>
                </ul>
              </Card>
            </div>
          </div>
        </section>

        {/* SECTION 8: FEATURE HIGHLIGHT (RESUME GENERATOR) */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] mb-4">
                Professional Resume Generator
              </h2>
              <p className="text-base text-[#45464C] mb-8 leading-relaxed">
                Instantly transform your volunteer hours and academic achievements into a professional, industry-standard resume. The platform compiles your verified history with a single click.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4 p-4 bg-[#F6F3F4] rounded-2xl border border-[#E5E7EB]">
                  <FileText className="w-8 h-8 text-[#D4AF37] shrink-0" />
                  <div>
                    <p className="font-bold text-[#111827] text-base">Verified PDF Export</p>
                    <p className="text-xs text-[#45464C] mt-0.5">Resumes include QR codes for instant institutional verification during mock HR interviews.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-[#F6F3F4] rounded-2xl border border-[#E5E7EB]">
                  <Sparkles className="w-8 h-8 text-[#D4AF37] shrink-0" />
                  <div>
                    <p className="font-bold text-[#111827] text-base">Standardized Formatting</p>
                    <p className="text-xs text-[#45464C] mt-0.5">Clean ATS-friendly design tailored for corporate placements.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resume Preview Box */}
            <div className="rounded-2xl border border-[#E5E2E3] bg-white overflow-hidden p-6 shadow-2xl rotate-1 transition-transform hover:rotate-0">
              <div className="border-b border-[#E5E7EB] pb-4 mb-4 flex justify-between items-center">
                <div>
                  <h3 className="font-black text-[#111827] text-lg">STUDENT RESUME</h3>
                  <p className="text-[10px] text-[#76777D] font-bold uppercase">Maatram Verified Portfolio</p>
                </div>
                <Badge variant="gold">QR Authenticated</Badge>
              </div>
              <div className="space-y-3 text-xs text-[#45464C]">
                <div className="p-2.5 bg-[#FCF8FA] rounded-lg border border-[#E5E7EB]">
                  <p className="font-bold text-[#111827]">Verified Volunteering Hours: 120 Hrs</p>
                  <p className="text-[10px] text-[#76777D]">Approved by Zone Incharge</p>
                </div>
                <div className="p-2.5 bg-[#FCF8FA] rounded-lg border border-[#E5E7EB]">
                  <p className="font-bold text-[#111827]">Academic Specialization</p>
                  <p className="text-[10px] text-[#76777D]">Electronics & Communication Engineering</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 9: ANALYTICS SHOWCASE */}
        <section className="py-20 lg:py-28 bg-[#111827] text-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 bg-[#1A1A1A] p-6 sm:p-8 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-white">Impact Analytics Overview</h3>
                <Badge variant="gold" size="sm">Real-time</Badge>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2 text-xs font-semibold text-slate-300">
                    <span>Volunteer Hours Progress</span>
                    <span>75,400 / 100,000</span>
                  </div>
                  <ProgressBar value={75} color="gold" size="md" showPercentage={false} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#111827] p-3 rounded-xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Students</p>
                    <p className="text-lg font-black text-white">12.4k</p>
                  </div>
                  <div className="bg-[#111827] p-3 rounded-xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Hours</p>
                    <p className="text-lg font-black text-[#D4AF37]">8.2k</p>
                  </div>
                  <div className="bg-[#111827] p-3 rounded-xl border border-slate-800 text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Cities</p>
                    <p className="text-lg font-black text-white">24</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Data-Driven Decision Making
              </h2>
              <p className="text-base text-slate-400 mb-8 leading-relaxed">
                Empower foundation leaders with deep insights into student performance and regional impact. Our analytics engine translates complex data into actionable strategies.
              </p>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
                  <span>Track long-term academic and social progress.</span>
                </div>
                <div className="flex items-center gap-3">
                  <PieChart className="w-5 h-5 text-[#D4AF37]" />
                  <span>Heatmaps of volunteer concentration across zones.</span>
                </div>
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-[#D4AF37]" />
                  <span>One-click exports for board meetings and reports.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 10: TESTIMONIALS */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#111827] mb-2">
                Voice of Our Community
              </h2>
              <p className="text-sm text-[#45464C]">Hear from those who are actively shaping the future through Maatram.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'Rahul Verma', role: 'Active Student', quote: '"The resume generator changed my life. I had years of volunteering experience but didn\'t know how to present it. Maatram made it professional and verified."' },
                { name: 'Meera Krishnan', role: 'Zone Coordinator', quote: '"Managing 200+ students across three zones was challenging until we integrated this system. Verification that used to take weeks now takes seconds."' },
                { name: 'Dr. Arvind Swami', role: 'Foundation Admin', quote: '"As an admin, the audit logs and enterprise security give me complete peace of mind. The data integrity within Maatram is second to none."' },
              ].map((item, idx) => (
                <Card key={idx} className="p-8 bg-white border border-[#E5E2E3] rounded-2xl flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex gap-1 mb-4 text-[#D4AF37]">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#D4AF37]" />
                      ))}
                    </div>
                    <p className="text-xs text-[#45464C] italic leading-relaxed mb-6">{item.quote}</p>
                  </div>
                  <div>
                    <p className="font-bold text-[#111827] text-sm">{item.name}</p>
                    <p className="text-[10px] text-[#76777D] font-bold uppercase">{item.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 11: MISSION & FINAL CTA */}
        <section className="py-20 lg:py-28 bg-[#D4AF37]/5 relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 text-center">
            <Card className="bg-white p-10 sm:p-14 rounded-2xl shadow-xl border border-[#D4AF37]/20 mb-12">
              <span className="text-[#D4AF37] font-bold text-xs uppercase tracking-widest mb-3 block">
                Our Mission
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mb-4 leading-tight">
                To catalyze social transformation by empowering the youth through education and active community engagement.
              </h2>
              <p className="text-sm text-[#45464C] max-w-2xl mx-auto leading-relaxed">
                Maatram is more than a platform; it is a movement to digitize trust and accelerate human impact across every corner of the nation.
              </p>
            </Card>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#111827] mb-6">
              Ready to Begin Your Journey?
            </h3>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/login">
                <Button variant="gold" size="lg" className="rounded-xl px-8 font-bold shadow-md">
                  Join as Student
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="primary" size="lg" className="rounded-xl px-8 font-bold shadow-md">
                  Partner with Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer id="footer" className="bg-white border-t border-[#E5E2E3] text-[#111827]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand & Logo */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {assets?.logo ? (
                <img src={assets.logo} alt="Maatram Foundation" className="h-10 w-auto" />
              ) : (
                <h2 className="text-xl font-extrabold text-[#111827]">Maatram Foundation</h2>
              )}
            </div>
            <p className="text-xs text-[#45464C] leading-relaxed">
              Empowering through education. Building a verified ecosystem for student social impact.
            </p>
            <div className="flex gap-3 text-[#76777D]">
              <Globe className="w-5 h-5 hover:text-[#D4AF37] transition-colors cursor-pointer" />
              <Mail className="w-5 h-5 hover:text-[#D4AF37] transition-colors cursor-pointer" />
              <Phone className="w-5 h-5 hover:text-[#D4AF37] transition-colors cursor-pointer" />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-4">Resources</h4>
            <ul className="space-y-2 text-xs text-[#45464C]">
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Cookie Policy</a></li>
            </ul>
          </div>

          {/* Governance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-4">Governance</h4>
            <ul className="space-y-2 text-xs text-[#45464C]">
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Annual Reports</a></li>
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">CSR Partners</a></li>
              <li><a href="#" className="hover:text-[#D4AF37] transition-colors">Contact Support</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#111827] mb-4">Stay Informed</h4>
            <p className="text-xs text-[#45464C] mb-3">Subscribe for impact updates.</p>
            <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs w-full focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
              <Button type="submit" variant="gold" size="sm" className="rounded-xl px-3">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#E5E2E3] py-6 bg-[#FCF8FA]">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col sm:flex-row justify-between items-center text-xs text-[#76777D] gap-2">
            <p>© 2026 Maatram Foundation. Empowering through education.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span>Systems Operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage