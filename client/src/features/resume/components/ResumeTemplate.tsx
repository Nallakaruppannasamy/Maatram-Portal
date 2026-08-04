import React from 'react'
import { Mail, Phone, MapPin, Globe, Github, Award, CheckCircle2, BookOpen, GraduationCap, Briefcase } from 'lucide-react'

export interface ResumeTemplateProps {
  data: {
    id: string
    firstName: string
    middleName?: string | null
    lastName: string
    fullName?: string
    registrationNumber: string
    gender?: string | null
    dateOfBirth?: string | null
    bloodGroup?: string | null
    nationality?: string | null
    mobile?: string | null
    careerObjective?: string | null
    profileImage?: string | null
    course?: string | null
    batch?: string | null
    academicYear?: string | null
    semester?: string | null
    cgpa?: number | string | null
    user?: {
      email: string
    }
    college?: {
      name: string
    } | null
    department?: {
      name: string
    } | null
    program?: {
      name: string
    } | null
    zone?: {
      name: string
    } | null
    semesterGrades?: Array<{
      id: string
      semesterNumber: number
      gpa: number | string
    }>
    skills?: Array<{
      id: string
      skillName: string
    }>
    projects?: Array<{
      id: string
      title: string
      description: string
      techStack: string
      githubUrl?: string | null
      demoUrl?: string | null
    }>
    certifications?: Array<{
      id: string
      title: string
      issuer: string
      issueDate: string
      certificateUrl?: string | null
    }>
    volunteerSubmissions?: Array<{
      id: string
      title: string
      category: string
      count?: number | null
      eventDate: string
      description: string
    }>
  }
}

export const ResumeTemplate: React.FC<ResumeTemplateProps> = ({ data }) => {
  const {
    firstName = '',
    middleName = '',
    lastName = '',
    registrationNumber = 'N/A',
    mobile = 'N/A',
    careerObjective = '',
    profileImage = null,
    course = '',
    batch = '',
    academicYear = '',
    semester = '',
    cgpa = '',
    user,
    college,
    department,
    program,
    semesterGrades = [],
    skills = [],
    projects = [],
    certifications = [],
    volunteerSubmissions = []
  } = data

  const email = user?.email || 'N/A'
  const collegeName = college?.name || 'N/A'
  const departmentName = department?.name || 'N/A'
  const programName = program?.name || 'N/A'

  const displayName = [firstName, middleName, lastName].filter(Boolean).join(' ') || 'Scholar Student'

  // Image formatting
  const imageUrl = profileImage
    ? profileImage.startsWith('/')
      ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${profileImage}`
      : profileImage
    : null

  return (
    <div className="w-full max-w-4xl bg-white border border-[#E5E7EB] rounded-2xl shadow-xl p-8 sm:p-10 space-y-6 print:p-0 print:border-none print:shadow-none text-[#111827] font-sans">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start border-b-2 border-[#111827] pb-6 gap-6">
        <div className="space-y-3 grow">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#111827] px-2.5 py-1 rounded-md print:bg-black print:text-yellow-600">
              Maatram Foundation Scholar
            </span>
            <h1 className="text-3xl font-extrabold text-[#111827] tracking-tight uppercase mt-2">{displayName}</h1>
            <p className="text-sm font-semibold text-[#45464c] mt-0.5">
              {programName} in {departmentName} • Reg No: {registrationNumber}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#45464c]">
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" /> {email}</span>
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" /> {mobile}</span>
            <span className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" /> {collegeName}</span>
            <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" /> Batch: {batch || 'N/A'} (Sem: {semester || 'N/A'})</span>
          </div>
        </div>

        {/* Profile Picture */}
        {imageUrl ? (
          <div className="w-24 h-24 rounded-xl border border-[#E5E7EB] overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 shadow-inner">
            <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center shrink-0 text-gray-400 text-xs font-semibold uppercase">
            No Photo
          </div>
        )}
      </div>

      {/* Career Objective */}
      {careerObjective && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1">
            Career Objective
          </h3>
          <p className="text-xs text-[#45464c] leading-relaxed italic">{careerObjective}</p>
        </div>
      )}

      {/* Academic performance */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1">
          Academic Profile
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-[#FCF8FA] rounded-lg border border-[#E5E7EB]">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Course / Branch</p>
            <p className="font-bold text-[#111827] mt-0.5">{course || 'N/A'}</p>
          </div>
          <div className="p-3 bg-[#FCF8FA] rounded-lg border border-[#E5E7EB]">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Academic Year</p>
            <p className="font-bold text-[#111827] mt-0.5">{academicYear || 'N/A'}</p>
          </div>
          <div className="p-3 bg-[#FCF8FA] rounded-lg border border-[#E5E7EB]">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Current Semester</p>
            <p className="font-bold text-[#111827] mt-0.5">{semester || 'N/A'}</p>
          </div>
          <div className="p-3 bg-[#FCF8FA] rounded-lg border border-[#E5E7EB]">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Cumulative CGPA</p>
            <p className="font-extrabold text-[#D4AF37] mt-0.5 text-sm">{cgpa ? Number(cgpa).toFixed(2) : 'N/A'}</p>
          </div>
        </div>

        {/* Semester GPA Breakdown Table */}
        {semesterGrades.length > 0 && (
          <div className="mt-2 border border-[#E5E7EB] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCF8FA] border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-2 px-3 font-bold text-[#76777d]">Semester</th>
                  {semesterGrades.map((g) => (
                    <th key={g.id} className="py-2 px-3 text-center font-bold text-[#111827]">
                      Sem {g.semesterNumber}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-3 font-semibold text-[#76777d]">GPA / CGPA</td>
                  {semesterGrades.map((g) => (
                    <td key={g.id} className="py-2 px-3 text-center font-mono font-bold text-[#D4AF37]">
                      {Number(g.gpa).toFixed(2)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1">
            Technical & Professional Skills
          </h3>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {skills.map((s) => (
              <span
                key={s.id}
                className="text-xs font-semibold bg-[#FCF8FA] text-[#111827] px-2.5 py-1 rounded-md border border-[#E5E7EB] shadow-xs"
              >
                {s.skillName}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1">
            Academic & Capstone Projects
          </h3>
          <div className="space-y-3">
            {projects.map((p) => (
              <div key={p.id} className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] space-y-1.5">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-xs text-[#111827] flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#D4AF37]" /> {p.title}
                  </h4>
                  <div className="flex gap-2 text-[10px] font-bold no-print">
                    {p.githubUrl && (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-900 hover:underline flex items-center gap-0.5"
                      >
                        <Github className="w-3 h-3" /> GitHub
                      </a>
                    )}
                    {p.demoUrl && (
                      <a
                        href={p.demoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#D4AF37] hover:underline flex items-center gap-0.5"
                      >
                        <Globe className="w-3 h-3" /> Live Demo
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#45464c] leading-relaxed">{p.description}</p>
                <div className="text-[10px] text-gray-500">
                  <span className="font-semibold text-gray-700">Technologies:</span> {p.techStack}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1">
            Certifications & Training
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {certifications.map((c) => {
              const formattedDate = c.issueDate ? new Date(c.issueDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short'
              }) : ''
              return (
                <div key={c.id} className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#111827]">{c.title}</h4>
                    <p className="text-[10px] text-gray-500">
                      {c.issuer} {formattedDate && `• Issued ${formattedDate}`}
                    </p>
                    {c.certificateUrl && (
                      <a
                        href={c.certificateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-900 hover:underline mt-1 block no-print"
                      >
                        View Certificate
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Verified Volunteer Impact Section */}
      {volunteerSubmissions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#E5E7EB] pb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified volunteering & community outreach
          </h3>
          <div className="space-y-3 text-xs">
            {volunteerSubmissions.map((log) => {
              const formattedDate = log.eventDate ? new Date(log.eventDate).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : ''
              return (
                <div key={log.id} className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB] space-y-1">
                  <div className="flex justify-between font-bold text-[#111827]">
                    <span>{log.title}</span>
                    <span className="text-[#D4AF37]">{log.count ? `${log.count} Units` : 'Logged Activity'}</span>
                  </div>
                  <p className="text-[#45464c] text-[11px] leading-relaxed">{log.description}</p>
                  <p className="text-[9px] text-[#76777d] font-bold uppercase tracking-wider">
                    Category: {log.category.replace(/_/g, ' ')} {formattedDate && `• Date: ${formattedDate}`}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer System Verification */}
      <div className="pt-6 border-t border-[#E5E7EB] text-center text-[9px] text-gray-400 font-mono tracking-wider">
        Official Record • Verified via Maatram Foundation Student & Volunteer Management System
      </div>
    </div>
  )
}
