import React, { useState, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  ChevronRight,
  ChevronDown,
  Building2,
  Layers,
  Users,
  Search,
  X,
  RefreshCw,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { organizationApi } from '@/api/organization.api'
import { zoneApi } from '@/api/zone.api'
import { studentApi } from '@/api/student.api'
import { notify } from '@/utils/toast'

interface CollegeNode {
  name: string
  code?: string
  studentCount: number
  departments: Set<string>
}

interface ZoneNode {
  id: string
  name: string
  code: string
  regionLabel: string
  inchargeName: string
  colleges: Map<string, CollegeNode>
  totalStudents: number
}

export const OrganizationHierarchyPage: React.FC = () => {
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState<string>('')
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({})

  // Modal State for Adding New Zone
  const [showAddZoneModal, setShowAddZoneModal] = useState<boolean>(false)
  const [newZoneData, setNewZoneData] = useState({
    name: '',
    code: '',
    regionLabel: '',
    organizationId: '',
  })

  // Queries
  const { data: orgsRes, isLoading: isOrgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationApi.list(),
  })

  const { data: zonesRes, isLoading: isZonesLoading, refetch: refetchZones } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneApi.list(),
  })

  const { data: studentsRes, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => studentApi.list(),
  })

  const organizations = orgsRes?.data || []
  const zones = zonesRes?.data || []
  const students = studentsRes?.data || []

  const createZoneMutation = useMutation({
    mutationFn: (data: any) => zoneApi.create(data),
    onSuccess: (res) => {
      if (res.success) {
        notify.success('Zone created successfully!')
        queryClient.invalidateQueries({ queryKey: ['zones'] })
        setShowAddZoneModal(false)
        setNewZoneData({ name: '', code: '', regionLabel: '', organizationId: '' })
      } else {
        notify.error(res.message || 'Failed to create zone.')
      }
    },
    onError: (err: any) => {
      notify.error(err?.response?.data?.message || err?.message || 'Error creating zone.')
    },
  })

  const buildHierarchyTree = (): ZoneNode[] => {
    const zoneMap = new Map<string, ZoneNode>()

    zones.forEach((z: any) => {
      const key = z.code || z.id
      zoneMap.set(key, {
        id: z.id,
        name: z.name,
        code: z.code,
        regionLabel: z.regionLabel || z.name,
        inchargeName: z.incharge?.fullName || 'Not Assigned',
        colleges: new Map<string, CollegeNode>(),
        totalStudents: 0,
      })
    })

    students.forEach((st: any) => {
      let zoneCode = st.zone?.code || st.operationalZone || 'ZONE-1'
      let zoneNode = zoneMap.get(zoneCode)
      if (!zoneNode) {
        zoneNode = {
          id: zoneCode,
          name: zoneCode,
          code: zoneCode,
          regionLabel: `${zoneCode} Region`,
          inchargeName: 'Unassigned',
          colleges: new Map<string, CollegeNode>(),
          totalStudents: 0,
        }
        zoneMap.set(zoneCode, zoneNode)
      }

      const collegeName = st.collegeName || 'General College'
      const deptName = st.department || 'General'

      zoneNode.totalStudents += 1

      let collegeNode = zoneNode.colleges.get(collegeName)
      if (!collegeNode) {
        collegeNode = {
          name: collegeName,
          code: collegeName.substring(0, 4).toUpperCase(),
          studentCount: 0,
          departments: new Set<string>(),
        }
        zoneNode.colleges.set(collegeName, collegeNode)
      }

      collegeNode.studentCount += 1
      if (deptName) collegeNode.departments.add(deptName)
    })

    return Array.from(zoneMap.values())
  }

  const hierarchyTree = buildHierarchyTree()
  const rootOrgName = organizations.length > 0 ? organizations[0].name : 'Maatram Foundation'
  const totalActiveZones = hierarchyTree.length
  const totalPartnerColleges = hierarchyTree.reduce((sum, z) => sum + z.colleges.size, 0)
  const totalEnrolledScholars = hierarchyTree.reduce((sum, z) => sum + z.totalStudents, 0) || students.length

  const filteredTree = hierarchyTree.filter((z) => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return (
      z.name.toLowerCase().includes(q) ||
      z.regionLabel.toLowerCase().includes(q) ||
      z.code.toLowerCase().includes(q) ||
      Array.from(z.colleges.values()).some((col) => col.name.toLowerCase().includes(q))
    )
  })

  const toggleExpand = (zoneKey: string) => {
    setExpandedZones((prev) => ({ ...prev, [zoneKey]: !prev[zoneKey] }))
  }

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newZoneData.name || !newZoneData.code) {
      return notify.error('Please provide Zone Name and Zone Code.')
    }

    const orgId = newZoneData.organizationId || (organizations.length > 0 ? organizations[0].id : '')
    if (!orgId) {
      return notify.error('Parent organization required.')
    }

    createZoneMutation.mutate({
      name: newZoneData.name,
      code: newZoneData.code.toUpperCase(),
      regionLabel: newZoneData.regionLabel || newZoneData.name,
      organizationId: orgId,
    })
  }

  const loading = isOrgsLoading || isZonesLoading || isStudentsLoading

  return (
    <Fragment>
      <div className="space-y-8 animate-in fade-in duration-300 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">
              Normalized Organization Hierarchy Tree
            </h2>
            <p className="text-xs text-[#45464c] mt-0.5">
              Live hierarchy mapping: Organization &rarr; Zone &rarr; College &rarr; Department.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetchZones()}
              className="p-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-sm cursor-pointer"
              title="Refresh Hierarchy Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-900' : ''}`} />
            </button>
            <Button variant="gold" size="md" onClick={() => setShowAddZoneModal(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add New Zone
            </Button>
          </div>
        </div>

        {/* Root Organization Header Card */}
        <Card className="p-6 bg-gradient-to-r from-[#111827] via-[#141b2b] to-[#111827] text-white rounded-2xl shadow-xl border border-gray-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center p-2 border border-amber-400/40 shadow-lg shrink-0 backdrop-blur-xs font-black text-xl text-[#D4AF37]">
                M
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-white tracking-wide">{rootOrgName}</h3>
                  <Badge variant="gold" className="text-[10px] uppercase font-bold">
                    Root Organization
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 mt-1">Centralized Enterprise Governance</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-gray-700/80 pt-4 lg:pt-0 lg:pl-8 text-center">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Active Zones</p>
                <p className="text-2xl font-black text-[#D4AF37]">{totalActiveZones}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Partner Colleges</p>
                <p className="text-2xl font-black text-emerald-400">{totalPartnerColleges}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Enrolled Scholars</p>
                <p className="text-2xl font-black text-blue-400">{totalEnrolledScholars.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Search Toolbar */}
        <div className="flex justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="relative grow max-w-md">
            <input
              type="text"
              placeholder="Search zones, regional label, or partner college..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-900 outline-none"
            />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-2 text-xs bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600 rounded-lg transition cursor-pointer flex items-center gap-1"
            >
              <X size={14} /> Clear Search
            </button>
          )}
        </div>

        {/* Interactive Tree Section */}
        <Card className="p-6 space-y-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="animate-spin h-10 w-10 text-blue-900" />
              <p className="text-xs text-gray-500 font-medium">Constructing live normalized tree view from database...</p>
            </div>
          ) : filteredTree.length === 0 ? (
            <p className="text-center py-16 text-xs text-gray-400 font-medium">
              No zones or colleges match your search query.
            </p>
          ) : (
            <div className="pl-4 sm:pl-6 border-l-2 border-dashed border-[#D4AF37]/60 space-y-6">
              {filteredTree.map((zoneNode) => {
                const zoneKey = zoneNode.code || zoneNode.id
                const isExpanded = expandedZones[zoneKey] ?? true
                const collegeList = Array.from(zoneNode.colleges.values())

                return (
                  <div key={zoneNode.id} className="space-y-4 transition-all">
                    <div
                      onClick={() => toggleExpand(zoneKey)}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FCF8FA] hover:bg-[#F6F3F4] rounded-2xl border border-[#E5E7EB] cursor-pointer transition shadow-sm group"
                    >
                      <div className="flex items-center gap-3">
                        <button className="p-1 rounded-md text-gray-500 group-hover:text-blue-900 transition">
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <Badge variant="gold" className="font-mono text-xs px-2.5 py-0.5">
                          {zoneNode.code}
                        </Badge>
                        <h4 className="text-sm font-bold text-[#111827] group-hover:text-blue-900 transition flex items-center gap-2">
                          {zoneNode.name}
                          <span className="text-xs font-normal text-gray-500">({zoneNode.regionLabel})</span>
                        </h4>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-[#76777d] ml-8 sm:ml-auto">
                        <span className="flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                          <Users className="w-3.5 h-3.5 text-[#D4AF37]" /> Incharge: <strong className="text-gray-900">{zoneNode.inchargeName}</strong>
                        </span>
                        <span className="font-bold text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                          {collegeList.length} Partner Colleges • {zoneNode.totalStudents} Scholars
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="pl-6 sm:pl-8 border-l-2 border-[#E5E7EB] space-y-3">
                        {collegeList.length === 0 ? (
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-400 italic">
                            No partner colleges recorded under this zone.
                          </div>
                        ) : (
                          collegeList.map((col, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 bg-white hover:bg-slate-50 rounded-xl border border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 transition shadow-2xs"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                                  <Building2 className="w-4 h-4 text-[#D4AF37]" />
                                </div>
                                <div>
                                  <span className="font-bold text-[#111827] text-sm block">{col.name}</span>
                                  <span className="text-[10px] text-gray-400 font-mono">Code: {col.code}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4 text-gray-600">
                                <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> {col.departments.size} Departments
                                </span>
                                <span className="font-extrabold text-[#111827] bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded border border-emerald-200">
                                  {col.studentCount} Active Scholars
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Modal Add Zone */}
        {showAddZoneModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-lg font-bold text-gray-900">Add New Zone</h3>
                </div>
                <button onClick={() => setShowAddZoneModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateZone} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Zone Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. ZONE-5"
                    value={newZoneData.code}
                    onChange={(e) => setNewZoneData({ ...newZoneData, code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900 uppercase font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Zone Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Zone 5"
                    value={newZoneData.name}
                    onChange={(e) => setNewZoneData({ ...newZoneData, name: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Region Label / Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Madurai Region"
                    value={newZoneData.regionLabel}
                    onChange={(e) => setNewZoneData({ ...newZoneData, regionLabel: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setShowAddZoneModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createZoneMutation.isPending}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg font-medium hover:bg-blue-950 transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    {createZoneMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Zone'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Fragment>
  )
}

export default OrganizationHierarchyPage
