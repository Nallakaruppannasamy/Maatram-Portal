import React from 'react'
import { Printer, Download, QrCode, CheckCircle2, Award, BookOpen, User, Phone, Mail, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const ResumeGeneratorPage = () => {
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">QR-Verified Student Resume Generator</h2>
          <p className="text-xs text-[#45464c]">
            Standardized, exportable resume populated directly from your verified academic records and approved volunteer logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            Print Resume
          </Button>
          <Button variant="gold" size="md" icon={<Download className="w-4 h-4" />} onClick={handlePrint}>
            Download PDF
          </Button>
        </div>
      </div>

      {/* Interactive PDF Paper Preview */}
      <div className="flex justify-center">
        <div className="w-full max-w-4xl bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-10 space-y-8 print-area text-[#111827]">
          {/* Header Branding & Student Meta */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-[#111827] pb-6 gap-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#111827] px-2.5 py-1 rounded-md">
                Maatram Foundation Scholar
              </span>
              <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight">ANANYA SHARMA</h1>
              <p className="text-sm font-semibold text-[#45464c]">Computer Science & Engineering • Batch 2022-2026</p>
              
              <div className="flex flex-wrap gap-4 text-xs text-[#45464c] pt-2">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-[#D4AF37]" /> ananya.sharma@student.maatram.org</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-[#D4AF37]" /> +91 98765 43210</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> Chennai, Tamil Nadu</span>
              </div>
            </div>

            {/* QR Verification Box */}
            <div className="p-3 bg-[#FCF8FA] border-2 border-dashed border-[#D4AF37] rounded-xl text-center space-y-1 shrink-0">
              <div className="w-20 h-20 bg-white border border-[#E5E7EB] rounded-lg mx-auto flex items-center justify-center">
                <QrCode className="w-16 h-16 text-[#111827]" />
              </div>
              <p className="text-[9px] font-bold text-[#111827] uppercase tracking-wider">QR VERIFIED PORTFOLIO</p>
              <p className="text-[9px] font-mono text-[#76777d]">MTM-2024-CS1092</p>
            </div>
          </div>

          {/* Objective */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1">
              Professional Summary
            </h3>
            <p className="text-xs text-[#45464c] leading-relaxed">
              Final-year Computer Science undergraduate with strong foundations in React, TypeScript, and Node.js. Passionate about applying software engineering solutions to scale social impact through Maatram Foundation.
            </p>
          </div>

          {/* Academic Background */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1">
              Academic Qualifications
            </h3>
            <div className="flex justify-between items-start text-xs">
              <div>
                <p className="font-bold text-[#111827]">B.E. Computer Science & Engineering</p>
                <p className="text-[#45464c]">Madras Institute of Technology, Anna University</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-[#D4AF37]">CGPA: 8.82 / 10</p>
                <p className="text-[#76777d]">2022 – 2026</p>
              </div>
            </div>
          </div>

          {/* Verified Volunteer Impact (Highlight Section) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-1">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified Volunteering & Leadership Impact
              </h3>
              <span className="text-xs font-extrabold text-[#D4AF37]">42.5 Verified Hours</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] space-y-1">
                <div className="flex justify-between font-bold text-[#111827]">
                  <span>Rural Science Fair Student Mentorship</span>
                  <span className="text-[#D4AF37]">12.0 Hours</span>
                </div>
                <p className="text-[#45464c]">Mentored 35 high school students in rural government schools to prepare STEM projects for district competition.</p>
                <p className="text-[10px] text-[#76777d] font-medium">Verified by: Dr. Ramesh Kumar (Zone Incharge, Chennai) • Jul 2026</p>
              </div>

              <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] space-y-1">
                <div className="flex justify-between font-bold text-[#111827]">
                  <span>Blood Donation Drive Lead Coordinator</span>
                  <span className="text-[#D4AF37]">6.0 Hours</span>
                </div>
                <p className="text-[#45464c]">Coordinated campus donor registrations, logistics, and donor certificate distribution for 150+ donors.</p>
                <p className="text-[10px] text-[#76777d] font-medium">Verified by: Dr. Ramesh Kumar (Zone Incharge, Chennai) • Jul 2026</p>
              </div>
            </div>
          </div>

          {/* Technical Skills & Projects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1">
                Technical Skills
              </h3>
              <ul className="text-xs text-[#45464c] space-y-1 list-disc pl-4">
                <li><span className="font-semibold text-[#111827]">Languages:</span> TypeScript, JavaScript, Python, C++</li>
                <li><span className="font-semibold text-[#111827]">Frontend:</span> React, Vite, Tailwind CSS, Zustand</li>
                <li><span className="font-semibold text-[#111827]">Backend & DB:</span> Node.js, Express, PostgreSQL, Prisma ORM</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1">
                Projects
              </h3>
              <div className="text-xs space-y-1">
                <p className="font-bold text-[#111827]">Volunteer Work Log Tracker SPA</p>
                <p className="text-[#45464c]">Full-stack web application built using React and Express.js to track volunteering hours with automated PDF resume generation.</p>
              </div>
            </div>
          </div>

          {/* Footer Verification Notice */}
          <div className="pt-6 border-t border-[#E5E7EB] text-center text-[10px] text-[#76777d] space-y-1">
            <p>Official Record • Generated via Maatram Foundation Student & Volunteer Management System</p>
            <p className="font-mono">Verify document validity at https://maatram.org/verify/MTM-2024-CS1092</p>
          </div>
        </div>
      </div>
    </div>
  )
}
