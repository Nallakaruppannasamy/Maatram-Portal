import React from 'react'
import { User, Shield, Mail, Phone, Building } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

export const ZoneProfilePage = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Zone Incharge Profile</h2>
        <p className="text-xs text-[#45464c]">Manage your account details and assigned zone administration settings.</p>
      </div>

      <Card className="p-8 space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#E5E7EB]">
          <div className="w-16 h-16 rounded-2xl bg-[#111827] text-white flex items-center justify-center font-bold text-2xl border border-slate-700">
            <span className="text-[#D4AF37]">RK</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-[#111827]">Dr. Ramesh Kumar</h3>
              <Badge variant="info">Zone Incharge</Badge>
            </div>
            <p className="text-xs text-[#76777d]">Assigned Region: Chennai Zone 1 (8 Colleges)</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input label="Full Name" defaultValue="Dr. Ramesh Kumar" />
          <Input label="Official Email Address" defaultValue="ramesh.kumar@zone1.maatram.org" />
          <Input label="Mobile Number" defaultValue="+91 94440 12345" />
          <Input label="Assigned Zone" defaultValue="Chennai & Kanchipuram Zone 1" disabled />
        </div>

        <Button variant="gold" size="md" className="w-full font-bold">
          Save Profile Updates
        </Button>
      </Card>
    </div>
  )
}
