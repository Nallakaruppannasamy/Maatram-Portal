import React from 'react'
import { Building2, Plus, Users, MapPin, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const ZoneManagementPage = () => {
  const colleges = [
    { name: 'Madras Institute of Technology (MIT)', code: 'MIT-CHE', location: 'Chromepet, Chennai', students: 140, depts: 6 },
    { name: 'College of Engineering Guindy (CEG)', code: 'CEG-CHE', location: 'Guindy, Chennai', students: 180, depts: 8 },
    { name: 'SSN College of Engineering', code: 'SSN-CHE', location: 'Kalavakkam, Chennai', students: 110, depts: 5 },
    { name: 'Loyola Institute of Technology', code: 'LIT-CHE', location: 'Palanchur, Kanchipuram', students: 50, depts: 4 },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Assigned Zone Colleges</h2>
          <p className="text-xs text-[#45464c]">Colleges, campuses, and departments under Chennai Zone 1 governance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {colleges.map((col, idx) => (
          <Card key={idx} hoverable className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <Badge variant="gold" className="mb-2 font-mono">{col.code}</Badge>
                <h3 className="text-lg font-bold text-[#111827]">{col.name}</h3>
                <p className="text-xs text-[#76777d] flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> {col.location}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E5E7EB] text-xs">
              <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                <span className="text-[#76777d] block text-[10px] uppercase font-bold">Enrolled Students</span>
                <span className="text-lg font-extrabold text-[#111827]">{col.students}</span>
              </div>
              <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                <span className="text-[#76777d] block text-[10px] uppercase font-bold">Active Departments</span>
                <span className="text-lg font-extrabold text-[#111827]">{col.depts}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
