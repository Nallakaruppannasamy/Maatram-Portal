import React from 'react'
import { ShieldCheck, Plus, Mail, UserCheck, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'

export const TeamManagementPage = () => {
  const teamMembers = [
    { name: 'Dr. Ramesh Kumar', email: 'ramesh.kumar@zone1.maatram.org', role: 'Zone Incharge', zone: 'Zone 1 (Chennai)', status: 'Active' },
    { name: 'Prof. S. Lakshmi', email: 's.lakshmi@zone2.maatram.org', role: 'Zone Incharge', zone: 'Zone 2 (Coimbatore)', status: 'Active' },
    { name: 'Arun Sundaram', email: 'arun.s@maatram.org', role: 'Super Admin', zone: 'Global Access', status: 'Active' },
    { name: 'Kavitha Nathan', email: 'kavitha.n@zone3.maatram.org', role: 'Zone Incharge', zone: 'Zone 3 (Madurai)', status: 'Pending Invite' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Team & Admin Management</h2>
          <p className="text-xs text-[#45464c]">Create zone incharges, assign administrative access, and manage credentials dispatch.</p>
        </div>
        <Button variant="gold" size="md" icon={<Plus className="w-4 h-4" />}>
          Add New Team Member
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administrative Team Directory</CardTitle>
          <CardDescription>Zone incharges and system administrators managing foundation portals</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#111827]">
              <thead>
                <tr className="border-b border-[#E5E7EB] text-[#76777d] uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3 font-bold">Member Name</th>
                  <th className="py-3 px-3 font-bold">Email Address</th>
                  <th className="py-3 px-3 font-bold">Assigned Role</th>
                  <th className="py-3 px-3 font-bold">Assigned Zone Scope</th>
                  <th className="py-3 px-3 font-bold">Status</th>
                  <th className="py-3 px-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {teamMembers.map((member, idx) => (
                  <tr key={idx} className="hover:bg-[#FCF8FA] transition-colors">
                    <td className="py-3.5 px-3 font-bold text-[#111827]">{member.name}</td>
                    <td className="py-3.5 px-3 text-[#45464c]">{member.email}</td>
                    <td className="py-3.5 px-3">
                      <Badge variant={member.role === 'Super Admin' ? 'gold' : 'info'}>
                        {member.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#111827]">{member.zone}</td>
                    <td className="py-3.5 px-3">
                      <Badge variant={member.status === 'Active' ? 'approved' : 'pending'}>
                        {member.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3">
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
