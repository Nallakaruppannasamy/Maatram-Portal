import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Download, Building2, Layers, GraduationCap, Users, ArrowUpDown, ArrowUp, ArrowDown, X, MapPin } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { zoneApi } from '@/api/zone.api'
import { useAuth } from '@/context/AuthContext'
import { useDebounce } from '@/hooks/useDebounce'
import { notify } from '@/utils/toast'

export const AssignedCollegesPage: React.FC = () => {
  const { user } = useAuth()
  const [selectedZoneId, setSelectedZoneId] = useState<string>((user as any)?.zone?.id || (user as any)?.zoneId || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'studentCount'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const debouncedSearch = useDebounce(searchTerm, 400)

  // Fetch zones list if user is admin to allow switching
  const { data: zonesRes } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneApi.list(),
    enabled: user?.role === 'admin',
  })
  const zones = zonesRes?.data || []

  useEffect(() => {
    if (user?.role === 'admin' && !selectedZoneId && zones.length > 0) {
      setSelectedZoneId(zones[0].id)
    }
  }, [user, zones, selectedZoneId])

  // Fetch colleges assigned to the selected zone or authenticated zone incharge
  const isZoneRole = user?.role === 'zone'
  const { data: collegesRes, isLoading } = useQuery({
    queryKey: ['zone-colleges', isZoneRole ? 'my' : selectedZoneId],
    queryFn: () => (isZoneRole ? zoneApi.getMyColleges() : zoneApi.getColleges(selectedZoneId)),
    enabled: isZoneRole || !!selectedZoneId,
  })

  const colleges = collegesRes?.data || []

  // Filter & Search
  const filteredColleges = colleges.filter((col: any) => {
    if (!debouncedSearch) return true
    const q = debouncedSearch.toLowerCase()
    return (
      col.name.toLowerCase().includes(q) ||
      (col.code || '').toLowerCase().includes(q) ||
      (col.location || '').toLowerCase().includes(q)
    )
  })

  // Sorting
  const sortedColleges = [...filteredColleges].sort((a: any, b: any) => {
    let valA = a[sortBy]
    let valB = b[sortBy]

    if (sortBy === 'name') {
      valA = String(valA).toLowerCase()
      valB = String(valB).toLowerCase()
    } else {
      valA = Number(valA) || 0
      valB = Number(valB) || 0
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (field: 'name' | 'studentCount') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  // Summary Metrics
  const totalColleges = colleges.length
  const totalDepartments = colleges.reduce((sum: number, c: any) => sum + (c.departmentCount || 0), 0)
  const totalScholars = colleges.reduce((sum: number, c: any) => sum + (c.studentCount || 0), 0)

  // Export
  const handleExport = async (format: 'csv' | 'xlsx') => {
    if (!isZoneRole && !selectedZoneId) return notify.error('No zone selected.')
    if (sortedColleges.length === 0) return notify.info('No colleges found to export.')

    try {
      const blob = isZoneRole
        ? await zoneApi.exportMyColleges({ format })
        : await zoneApi.exportColleges(selectedZoneId, { format })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const activeZone = zones.find((z) => z.id === selectedZoneId) || { name: 'Zone' }
      const zoneNameSanitized = (user?.zoneName || activeZone.name || 'Zone').replace(/\s+/g, '_')
      a.download = `${zoneNameSanitized}_Assigned_Colleges_${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      notify.success(`Colleges list exported in ${format.toUpperCase()} format!`)
    } catch (err) {
      notify.error('Export failed. Please try again.')
    }
  }

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
    <div className="space-y-8 animate-in fade-in duration-300 font-sans">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#111827] tracking-tight">Assigned Zone Colleges</h2>
          <p className="text-xs text-[#45464c]">Colleges, campuses, and departments under zone governance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Admin Zone Selector */}
          {user?.role === 'admin' && zones.length > 0 && (
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-none"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          )}
          <Button
            onClick={() => handleExport('xlsx')}
            variant="gold"
            size="md"
            icon={<Download className="w-4 h-4" />}
          >
            Export Assigned Colleges
          </Button>
        </div>
      </div>

      {/* Zone Colleges Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border border-[#E5E7EB] rounded-xl">
          <span className="text-[#76777d] block text-[10px] uppercase font-bold">Colleges</span>
          <span className="text-2xl font-black text-[#111827]">{totalColleges}</span>
        </Card>
        <Card className="p-4 bg-white border border-[#E5E7EB] rounded-xl">
          <span className="text-[#76777d] block text-[10px] uppercase font-bold">Degrees</span>
          <span className="text-2xl font-black text-[#111827]">{totalDepartments}</span>
        </Card>
        <Card className="p-4 bg-white border border-[#E5E7EB] rounded-xl">
          <span className="text-[#76777d] block text-[10px] uppercase font-bold">Assigned Scholars</span>
          <span className="text-2xl font-black text-blue-900">{totalScholars}</span>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search college by name, code or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-none"
          />
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleSort('name')}
            className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer transition ${
              sortBy === 'name' ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            Name {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
            {sortBy !== 'name' && <ArrowUpDown size={12} />}
          </button>
          <button
            onClick={() => handleSort('studentCount')}
            className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg text-xs font-semibold cursor-pointer transition ${
              sortBy === 'studentCount' ? 'bg-blue-50 text-blue-900 border-blue-200' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            Student Count {sortBy === 'studentCount' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
            {sortBy !== 'studentCount' && <ArrowUpDown size={12} />}
          </button>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition text-xs cursor-pointer"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Cards List */}
      {sortedColleges.length === 0 ? (
        <Card className="text-center py-12 text-xs text-gray-500">
          {colleges.length === 0
            ? 'No colleges assigned to your zone.'
            : 'No matching colleges found for your search criteria.'}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedColleges.map((col: any) => (
            <Card key={col.id} hoverable className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="gold" className="mb-2 font-mono text-[10px]">
                    {col.code}
                  </Badge>
                  <h3 className="text-base font-bold text-[#111827]">{col.name}</h3>
                  <p className="text-xs text-[#76777d] flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> {col.location || 'Zone'}
                  </p>
                </div>
              </div>

              {/* Organization Hierarchy Tree Breakdown */}
              <div className="bg-[#FAF9F6] p-3.5 rounded-xl border border-[#E5E7EB] space-y-2 text-xs">
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-[#D4AF37]" /> Organization Hierarchy Breakdown
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Total Students:</span>
                    <span className="font-bold text-blue-900">{col.studentCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Active Students:</span>
                    <span className="font-bold text-emerald-700">{col.studentCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Degrees:</span>
                    <span className="font-bold text-gray-900">{col.departmentCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Departments:</span>
                    <span className="font-bold text-gray-900">{col.programCount}</span>
                  </div>
                </div>
              </div>

              {/* Department & Program lists */}
              <div className="space-y-3.5 pt-1 text-xs">
                {col.departmentList?.length > 0 && (
                  <div>
                    <span className="text-[#76777d] block font-bold text-[10px] uppercase mb-1.5">Degrees</span>
                    <div className="flex flex-wrap gap-1">
                      {col.departmentList.map((deptName: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-700 rounded text-[10px] font-medium"
                        >
                          {deptName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {col.programList?.length > 0 && (
                  <div>
                    <span className="text-[#76777d] block font-bold text-[10px] uppercase mb-1.5">Departments</span>
                    <div className="flex flex-wrap gap-1">
                      {col.programList.map((progName: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-50/50 border border-blue-100 text-blue-800 rounded text-[10px] font-medium"
                        >
                          {progName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Batch Distribution */}
                {Object.keys(col.batchDistribution || {}).length > 0 && (
                  <div>
                    <span className="text-[#76777d] block font-bold text-[10px] uppercase mb-1.5">Batch Distribution</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(col.batchDistribution).map(([batch, count]: any) => (
                        <span
                          key={batch}
                          className="px-2.5 py-0.5 bg-purple-50 border border-purple-100 text-purple-800 rounded-full text-[10px] font-bold"
                        >
                          {batch}: {count}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AssignedCollegesPage
