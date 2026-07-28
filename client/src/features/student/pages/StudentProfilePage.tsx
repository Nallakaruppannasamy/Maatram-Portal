import React, { useState } from 'react'
import { User, BookOpen, Code, Award, FolderGit2, Save, Plus, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

export const StudentProfilePage = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'academics' | 'skills' | 'projects' | 'achievements'>('basic')

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Modular Student Profile</h2>
          <p className="text-xs text-[#45464c]">Manage your personal details, academic CGPA, skills, projects, and certifications.</p>
        </div>
        <Button variant="gold" size="md" icon={<Save className="w-4 h-4" />}>
          Save All Changes
        </Button>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-[#E5E7EB] pb-2">
        <button
          onClick={() => setActiveTab('basic')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'basic'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#45464c] hover:bg-[#F0EDEE] border border-[#E5E7EB]'
          }`}
        >
          <User className="w-4 h-4 text-[#D4AF37]" /> Basic Information
        </button>

        <button
          onClick={() => setActiveTab('academics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'academics'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#45464c] hover:bg-[#F0EDEE] border border-[#E5E7EB]'
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#D4AF37]" /> Academic History
        </button>

        <button
          onClick={() => setActiveTab('skills')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'skills'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#45464c] hover:bg-[#F0EDEE] border border-[#E5E7EB]'
          }`}
        >
          <Code className="w-4 h-4 text-[#D4AF37]" /> Skills & Technologies
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'projects'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#45464c] hover:bg-[#F0EDEE] border border-[#E5E7EB]'
          }`}
        >
          <FolderGit2 className="w-4 h-4 text-[#D4AF37]" /> Projects & GitHub
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'achievements'
              ? 'bg-[#111827] text-white shadow-xs'
              : 'bg-white text-[#45464c] hover:bg-[#F0EDEE] border border-[#E5E7EB]'
          }`}
        >
          <Award className="w-4 h-4 text-[#D4AF37]" /> Certifications & Awards
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'basic' && (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
            <CardDescription>Primary identification, contact information, and objective summary</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name" defaultValue="Ananya Sharma" />
              <Input label="Register Number" defaultValue="2024CS1092" disabled />
              <Input label="Email Address" defaultValue="ananya.sharma@student.maatram.org" />
              <Input label="Mobile Number" defaultValue="+91 98765 43210" />
              <Input label="Gender" defaultValue="Female" />
              <Input label="Date of Birth" type="date" defaultValue="2003-08-15" />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111827] uppercase tracking-wider">
                Career Objective Summary
              </label>
              <textarea
                rows={3}
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl p-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                defaultValue="Enthusiastic Computer Science undergraduate dedicated to leveraging software development skills for social impact and community empowerment."
              />
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'academics' && (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Academic Records</CardTitle>
            <CardDescription>College, department, program, batch, and semester-wise GPA progression</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input label="College" defaultValue="Madras Institute of Technology" disabled />
              <Input label="Department" defaultValue="Computer Science & Engineering" disabled />
              <Input label="Program" defaultValue="B.E. Computer Science" disabled />
              <Input label="Batch" defaultValue="2022 - 2026" disabled />
              <Input label="Cumulative CGPA" defaultValue="8.82" />
              <Input label="Current Semester" defaultValue="Semester 7" />
            </div>

            <div className="space-y-3 pt-4 border-t border-[#E5E7EB]">
              <h4 className="text-sm font-bold text-[#111827]">Semester-wise GPA Breakdown</h4>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
                {['Sem 1: 8.50', 'Sem 2: 8.65', 'Sem 3: 8.90', 'Sem 4: 9.10', 'Sem 5: 8.80', 'Sem 6: 8.95'].map((sem, idx) => (
                  <div key={idx} className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] text-center">
                    <p className="text-xs font-bold text-[#111827]">{sem.split(':')[0]}</p>
                    <p className="text-sm font-extrabold text-[#D4AF37]">{sem.split(':')[1]}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'skills' && (
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle>Technical & Soft Skills</CardTitle>
            <CardDescription>Tag technologies, programming languages, and competencies</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Tailwind CSS', 'Git & GitHub', 'Community Leadership', 'Event Coordination', 'Data Analysis'].map((skill, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FCF8FA] border border-[#E5E7EB] text-[#111827]">
                  {skill}
                  <button className="text-[#76777d] hover:text-red-500">×</button>
                </span>
              ))}
            </div>

            <div className="flex gap-2 max-w-md pt-4">
              <Input placeholder="Add a new skill (e.g. Docker, Figma)" />
              <Button variant="primary" size="md">Add</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'projects' && (
        <Card className="space-y-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Projects & Demos</CardTitle>
              <CardDescription>Showcase your academic and personal software projects</CardDescription>
            </div>
            <Button variant="gold" size="sm" icon={<Plus className="w-4 h-4" />}>
              Add Project
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-[#FCF8FA] rounded-2xl border border-[#E5E7EB] space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-[#111827]">Volunteer Work Log Tracker SPA</h4>
                <Badge variant="gold">React • TS • Node</Badge>
              </div>
              <p className="text-xs text-[#45464c]">Built a lightweight single-page application for real-time tracking of community volunteering metrics.</p>
              <p className="text-xs font-mono text-[#D4AF37]">github.com/ananya/volunteer-tracker</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'achievements' && (
        <Card className="space-y-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Certifications & Honours</CardTitle>
              <CardDescription>Verified course certificates, hackathons, and awards</CardDescription>
            </div>
            <Button variant="gold" size="sm" icon={<Plus className="w-4 h-4" />}>
              Add Certification
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="p-4 bg-[#FCF8FA] rounded-2xl border border-[#E5E7EB] flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#111827]">Full Stack Web Development Certification</h4>
                <p className="text-xs text-[#45464c]">Issued by Coursera / Meta • Issued June 2025</p>
              </div>
              <Badge variant="approved">Verified</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
