import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { zoneApi } from '@/api/zone.api'

export const ZoneManagementPage = () => {
  const { data: zonesRes, isLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneApi.list(),
  })

  const zones = zonesRes?.data || []

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Assigned Zone Colleges</h2>
          <p className="text-xs text-[#45464c]">Colleges, campuses, and departments under zone governance.</p>
        </div>
        <CardSkeleton count={2} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Assigned Zone Colleges</h2>
          <p className="text-xs text-[#45464c]">Colleges, campuses, and departments under zone governance.</p>
        </div>
      </div>

      {zones.length === 0 ? (
        <Card className="text-center py-12 text-xs text-gray-500">
          No zone details or colleges currently configured in the database.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {zones.map((zone: any) => (
            <Card key={zone.id} hoverable className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="gold" className="mb-2 font-mono">{zone.code || zone.id.slice(0, 8)}</Badge>
                  <h3 className="text-lg font-bold text-[#111827]">{zone.name}</h3>
                  <p className="text-xs text-[#76777d] flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> {zone.location || 'Regional Zone'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E5E7EB] text-xs">
                <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                  <span className="text-[#76777d] block text-[10px] uppercase font-bold">Zone Status</span>
                  <span className="text-sm font-extrabold text-emerald-600">{zone.status || 'ACTIVE'}</span>
                </div>
                <div className="p-3 bg-[#FCF8FA] rounded-xl border border-[#E5E7EB]">
                  <span className="text-[#76777d] block text-[10px] uppercase font-bold">State / District</span>
                  <span className="text-sm font-extrabold text-[#111827]">{zone.district || 'Tamil Nadu'}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default ZoneManagementPage
