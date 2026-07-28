import React from 'react'
import { FolderGit2, Plus, ChevronRight, Building2, Layers, Award } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const OrganizationHierarchyPage = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Normalized Organization Hierarchy Tree</h2>
          <p className="text-xs text-[#45464c]">Hierarchy mapping: Organization $\rightarrow$ Zone $\rightarrow$ College $\rightarrow$ Department $\rightarrow$ Program $\rightarrow$ Batch.</p>
        </div>
        <Button variant="gold" size="md" icon={<Plus className="w-4 h-4" />}>
          Add New Zone / College
        </Button>
      </div>

      {/* Visual Hierarchy Tree Mockup */}
      <Card className="p-8 space-y-6 bg-white border border-[#E5E7EB] rounded-2xl">
        <div className="flex items-center gap-3 p-4 bg-[#111827] text-white rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#111827] flex items-center justify-center font-extrabold text-xl">
            M
          </div>
          <div>
            <h3 className="text-lg font-bold">Maatram Foundation (Root Organization)</h3>
            <p className="text-xs text-slate-300">14 Active Zones • 120 Partner Colleges • 2,480 Enrolled Scholars</p>
          </div>
        </div>

        {/* Tree Nodes */}
        <div className="pl-6 border-l-2 border-dashed border-[#D4AF37]/50 space-y-6">
          {/* Zone 1 Branch */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#FCF8FA] rounded-2xl border border-[#E5E7EB]">
              <Badge variant="gold">Zone 1</Badge>
              <h4 className="text-sm font-bold text-[#111827]">Chennai & Kanchipuram Region</h4>
              <span className="text-xs text-[#76777d] ml-auto">Incharge: Dr. Ramesh Kumar • 8 Colleges</span>
            </div>

            {/* Colleges Branch */}
            <div className="pl-6 border-l-2 border-[#E5E7EB] space-y-3">
              <div className="p-3 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-bold text-[#111827]">Madras Institute of Technology (MIT)</span>
                </div>
                <span className="text-[#76777d]">6 Departments • 140 Students</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-bold text-[#111827]">College of Engineering Guindy (CEG)</span>
                </div>
                <span className="text-[#76777d]">8 Departments • 180 Students</span>
              </div>
            </div>
          </div>

          {/* Zone 2 Branch */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#FCF8FA] rounded-2xl border border-[#E5E7EB]">
              <Badge variant="info">Zone 2</Badge>
              <h4 className="text-sm font-bold text-[#111827]">Coimbatore & Tiruppur Region</h4>
              <span className="text-xs text-[#76777d] ml-auto">Incharge: Prof. S. Lakshmi • 12 Colleges</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
