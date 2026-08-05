import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Download,
  Check,
  X,
  RefreshCw,
  Users,
  Layers,
  GraduationCap,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { zoneApi } from '@/api/zone.api'
import { userApi } from '@/api/user.api'
import { notify } from '@/utils/toast'

interface College {
  id: string
  name: string
  code: string
  location: string
  departments: Array<{
    id: string
    name: string
    programs: Array<{
      id: string
      name: string
      durationYears: number
    }>
  }>
}

export const ZoneManagementPage: React.FC = () => {
  const queryClient = useQueryClient()
  const [selectedZoneId, setSelectedZoneId] = useState<string>('')
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('')
  const [collegeSearch, setCollegeSearch] = useState('')

  // Modal / Inline Form States
  const [collegeForm, setCollegeForm] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; id?: string; name: string; code: string; location: string }>({
    isOpen: false,
    mode: 'add',
    name: '',
    code: '',
    location: '',
  })

  const [deptForm, setDeptForm] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; id?: string; name: string }>({
    isOpen: false,
    mode: 'add',
    name: '',
  })

  const [progForm, setProgForm] = useState<{ isOpen: boolean; mode: 'add' | 'edit'; id?: string; name: string; durationYears: number }>({
    isOpen: false,
    mode: 'add',
    name: '',
    durationYears: 4,
  })

  const [assignInchargeId, setAssignInchargeId] = useState<string>('')
  const [importFile, setImportFile] = useState<File | null>(null)

  // ─── Queries ──────────────────────────────────────────────────────────────
  const { data: zonesRes, isLoading: isZonesLoading } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneApi.list(),
  })

  const zones = zonesRes?.data || []
  const activeZone = zones.find((z) => z.id === selectedZoneId)

  React.useEffect(() => {
    if (zones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(zones[0].id)
    }
  }, [zones, selectedZoneId])

  // Fetch colleges under selected zone
  const { data: collegesRes, isLoading: isCollegesLoading } = useQuery({
    queryKey: ['zone-colleges', selectedZoneId],
    queryFn: () => zoneApi.getColleges(selectedZoneId),
    enabled: !!selectedZoneId,
  })
  const colleges = collegesRes?.data || []
  const activeCollege = colleges.find((c) => c.id === selectedCollegeId)

  React.useEffect(() => {
    if (colleges.length > 0) {
      const exists = colleges.some((c: any) => c.id === selectedCollegeId)
      if (!exists) {
        setSelectedCollegeId(colleges[0].id)
      }
    } else {
      setSelectedCollegeId('')
    }
  }, [colleges, selectedCollegeId])

  // Fetch all staff users to identify unassigned incharges
  const { data: staffRes } = useQuery({
    queryKey: ['users', 'zone'],
    queryFn: () => userApi.list({ role: 'zone' }),
  })
  const zoneIncharges = staffRes?.data || []
  const unassignedIncharges = zoneIncharges.filter((u) => !u.zoneId && u.isActive)

  // ─── Mutations ────────────────────────────────────────────────────────────
  // 1. Assign Incharge
  const assignInchargeMutation = useMutation({
    mutationFn: ({ zoneId, inchargeId }: { zoneId: string; inchargeId: string | null }) =>
      zoneApi.update(zoneId, { inchargeId } as any),
    onSuccess: () => {
      notify.success('Zone incharge updated successfully')
      queryClient.invalidateQueries({ queryKey: ['zones'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setAssignInchargeId('')
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Assignment failed'),
  })

  // 2. College Mutations
  const addCollegeMutation = useMutation({
    mutationFn: (payload: { name: string; code: string; location: string }) =>
      zoneApi.addCollege(selectedZoneId, payload),
    onSuccess: () => {
      notify.success('College added successfully')
      queryClient.invalidateQueries({ queryKey: ['zone-colleges', selectedZoneId] })
      setCollegeForm({ isOpen: false, mode: 'add', name: '', code: '', location: '' })
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to add college'),
  })

  const updateCollegeMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; location: string } }) =>
      zoneApi.updateCollege(id, payload),
    onSuccess: () => {
      notify.success('College updated successfully')
      queryClient.invalidateQueries({ queryKey: ['zone-colleges', selectedZoneId] })
      setCollegeForm({ isOpen: false, mode: 'add', name: '', code: '', location: '' })
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to update college'),
  })

  const deleteCollegeMutation = useMutation({
    mutationFn: (id: string) => zoneApi.delete(id),
    onSuccess: () => {
      notify.success('College deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['zone-colleges', selectedZoneId] })
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to delete college'),
  })

  // 3. Department Mutations
  const addDeptMutation = useMutation({
    mutationFn: (name: string) => zoneApi.addDepartment(selectedCollegeId, { name }),
    onSuccess: () => {
      notify.success('Department created')
      queryClient.invalidateQueries({ queryKey: ['zone-colleges', selectedZoneId] })
      setDeptForm({ isOpen: false, mode: 'add', name: '' })
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to add department'),
  })

  const updateDeptMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => zoneApi.updateDepartment(id, { name }),
    onSuccess: () => {
      notify.success('Department updated')
      queryClient.invalidateQueries({ queryKey: ['zone-colleges', selectedZoneId] })
      setDeptForm({ isOpen: false, mode: 'add', name: '' })
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to update department'),
  })

  const deleteDeptMutation = useMutation({
    mutationFn: (id: string) => zoneApi.deleteDepartment(id),
    onSuccess: () => {
      notify.success('Department deleted')
      queryClient.invalidateQueries({ queryKey: ['zone-colleges', selectedZoneId] })
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to delete department'),
  })

  // 4. Program Mutations
  const addProgMutation = useMutation({
    mutationFn: ({ deptId, name, durationYears }: { deptId: string; name: string; durationYears: number }) =>
      zoneApi.addProgram(deptId, { name, durationYears }),
    onSuccess: () => {
      notify.success('Degree program created')
      queryClient.invalidateQueries({ queryKey: ['zone-colleges', selectedZoneId] })
      setProgForm({ isOpen: false, mode: 'add', name: '', durationYears: 4 })
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to add program'),
  })

  const updateProgMutation = useMutation({
    mutationFn: ({ id, name, durationYears }: { id: string; name: string; durationYears: number }) =>
      zoneApi.updateProgram(id, { name, durationYears }),
    onSuccess: () => {
      notify.success('Degree program updated')
      queryClient.invalidateQueries({ queryKey: ['zone-colleges', selectedZoneId] })
      setProgForm({ isOpen: false, mode: 'add', name: '', durationYears: 4 })
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to update program'),
  })

  const deleteProgMutation = useMutation({
    mutationFn: (id: string) => zoneApi.deleteProgram(id),
    onSuccess: () => {
      notify.success('Degree program deleted')
      queryClient.invalidateQueries({ queryKey: ['zone-colleges', selectedZoneId] })
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Failed to delete program'),
  })

  // 5. Excel Import Mutations
  const importMutation = useMutation({
    mutationFn: (file: File) => zoneApi.importStructure(selectedZoneId, file),
    onSuccess: (res) => {
      notify.success(`Import success! Created ${res.data.collegesCreated} colleges, ${res.data.departmentsCreated} departments, and ${res.data.programsCreated} programs.`)
      queryClient.invalidateQueries({ queryKey: ['zone-colleges', selectedZoneId] })
      setImportFile(null)
    },
    onError: (err: any) => notify.error(err?.response?.data?.message || 'Excel import failed'),
  })

  // ─── Actions ──────────────────────────────────────────────────────────────
  const handleAssignIncharge = () => {
    if (!assignInchargeId) return
    assignInchargeMutation.mutate({ zoneId: selectedZoneId, inchargeId: assignInchargeId })
  }

  const handleRemoveIncharge = () => {
    if (window.confirm('Are you sure you want to remove the assigned incharge for this zone?')) {
      assignInchargeMutation.mutate({ zoneId: selectedZoneId, inchargeId: null })
    }
  }

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!importFile) return
    importMutation.mutate(importFile)
  }

  const handleDownloadTemplate = async () => {
    try {
      const blob = await zoneApi.downloadTemplate()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'zone-structure-template.xlsx'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      notify.error('Failed to download template')
    }
  }

  // Filter colleges
  const filteredColleges = colleges.filter((c: any) =>
    c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    c.location.toLowerCase().includes(collegeSearch.toLowerCase())
  )

  if (isZonesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCF8FA] text-[#76777d] font-bold text-xs uppercase tracking-widest gap-2">
        <RefreshCw className="animate-spin text-[#D4AF37]" size={16} /> Loading Zone Management...
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 font-sans max-w-7xl mx-auto min-h-screen select-none">
      {/* Page Title */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Zone Operational Framework</h2>
          <p className="text-xs text-[#76777d] font-semibold mt-0.5">
            Configure dynamic zones, map college structures, design degrees, and import academic structures.
          </p>
        </div>
      </div>

      {/* ─── 1. ZONE SELECTOR CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((zone: any) => {
          const isSelected = zone.id === selectedZoneId
          return (
            <div
              key={zone.id}
              onClick={() => {
                setSelectedZoneId(zone.id)
                setCollegeSearch('')
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                isSelected
                  ? 'bg-white border-[#D4AF37] shadow-lg shadow-[#D4AF37]/5 ring-2 ring-[#D4AF37]/20'
                  : 'bg-white border-[#E5E7EB] hover:border-gray-300 shadow-luxury'
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase font-black tracking-wider text-[#76777d]">
                    {zone.code}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                  )}
                </div>
                <h3 className="text-sm font-extrabold text-[#111827] mt-1 line-clamp-1">{zone.name}</h3>
                <p className="text-[11px] font-semibold text-[#45464c] mt-0.5 line-clamp-1 flex items-center gap-1">
                  <Users size={12} className="text-gray-400" />
                  {zone.incharge?.userProfile?.fullName || 'No Incharge Assigned'}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-[#F0EDEE] pt-3 text-[10px] font-black uppercase text-[#76777d]">
                <span>Colleges</span>
                <span className="text-xs font-black text-[#111827]">{zone.colleges?.length || 0}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Currently Managing Header */}
      {activeZone && (
        <div className="bg-[#FEF3C7]/40 border border-[#FEF3C7] px-5 py-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="text-[#D97706]" size={16} />
            <span className="text-xs font-extrabold text-[#92400E]">
              Currently Managing: <strong className="text-[#D97706]">{activeZone.name} ({activeZone.code})</strong>
            </span>
          </div>
        </div>
      )}

      {/* ─── 2. OPERATIONAL PANEL (Incharge + Bulk Import) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incharge Assignment */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-luxury space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-[#111827] tracking-tight">Assign Zone Incharge</h3>
            <p className="text-[10px] text-[#76777d] font-semibold">Associate a field manager to govern this zone.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {activeZone?.incharge ? (
              <div className="flex-1 p-3.5 bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-[#111827]">
                    {(activeZone.incharge as any).userProfile?.fullName || activeZone.incharge.email}
                  </p>
                  <p className="text-[10px] text-[#76777d] font-bold">
                    {activeZone.incharge.email} • {(activeZone.incharge as any).userProfile?.mobile || 'No Mobile'}
                  </p>
                </div>
                <button
                  onClick={handleRemoveIncharge}
                  className="p-1.5 hover:bg-red-50 text-red-600 rounded-lg cursor-pointer transition-all"
                  title="Remove Assignment"
                >
                  <X size={15} />
                </button>
              </div>
            ) : (
              <div className="flex-1 flex gap-2">
                <select
                  value={assignInchargeId}
                  onChange={(e) => setAssignInchargeId(e.target.value)}
                  className="flex-1 h-10 px-2 bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-[#D4AF37] transition-all"
                >
                  <option value="">— Select Available Incharge —</option>
                  {unassignedIncharges.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.userProfile?.fullName || u.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAssignIncharge}
                  disabled={!assignInchargeId || assignInchargeMutation.isPending}
                  className="px-4 bg-[#D4AF37] hover:bg-[#b8972e] disabled:opacity-40 text-white rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
                >
                  Assign
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bulk Import */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-luxury space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#111827] tracking-tight">Bulk Import Zone Structure</h3>
              <p className="text-[10px] text-[#76777d] font-semibold">Upload college hierarchy spreadsheets.</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1 text-[10px] font-black uppercase text-[#D4AF37] hover:text-[#b8972e] cursor-pointer"
            >
              <Download size={13} /> Template
            </button>
          </div>

          <form onSubmit={handleImportSubmit} className="flex gap-2 items-center pt-2">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="flex-1 text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-gray-100 file:text-[#45464c] hover:file:bg-gray-200 file:cursor-pointer border border-[#E5E7EB] rounded-xl p-1 bg-[#FCF8FA]"
            />
            <button
              type="submit"
              disabled={!importFile || importMutation.isPending}
              className="h-10 px-4 bg-[#111827] hover:bg-black disabled:opacity-40 text-white rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1.5"
            >
              {importMutation.isPending ? 'Importing...' : 'Upload'}
            </button>
          </form>
        </div>
      </div>

      {/* ─── 3. COLLEGE & CONFIGURATOR SECTIONS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* College Management */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-luxury space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-[#111827] tracking-tight">College Management</h3>
              <p className="text-[10px] text-[#76777d] font-semibold">{filteredColleges.length} colleges governed</p>
            </div>
            <button
              onClick={() => setCollegeForm({ isOpen: true, mode: 'add', name: '', code: '', location: '' })}
              className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] hover:bg-[#FDE68A] flex items-center justify-center cursor-pointer transition-all"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Search bar */}
          <input
            type="text"
            placeholder="Search colleges..."
            value={collegeSearch}
            onChange={(e) => setCollegeSearch(e.target.value)}
            className="w-full h-10 px-3 bg-[#FCF8FA] border border-[#E5E7EB] rounded-xl text-xs font-bold outline-none focus:border-[#D4AF37] transition-all"
          />

          {/* College Form Modal (Inline overlay for clean UX) */}
          {collegeForm.isOpen && (
            <div className="p-4 bg-[#FCF8FA] border border-[#FEF3C7] rounded-2xl space-y-3 animate-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-xs font-extrabold text-[#111827]">
                  {collegeForm.mode === 'add' ? 'Add New College' : 'Edit College'}
                </span>
                <button
                  onClick={() => setCollegeForm({ isOpen: false, mode: 'add', name: '', code: '', location: '' })}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="College Name"
                  value={collegeForm.name}
                  onChange={(e) => setCollegeForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-8 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold"
                />
                {collegeForm.mode === 'add' && (
                  <input
                    type="text"
                    placeholder="College Code (e.g. MIT-CHE)"
                    value={collegeForm.code}
                    onChange={(e) => setCollegeForm((prev) => ({ ...prev, code: e.target.value }))}
                    className="w-full h-8 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold"
                  />
                )}
                <input
                  type="text"
                  placeholder="Location"
                  value={collegeForm.location}
                  onChange={(e) => setCollegeForm((prev) => ({ ...prev, location: e.target.value }))}
                  className="w-full h-8 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold"
                />
                <button
                  onClick={() => {
                    if (collegeForm.mode === 'add') {
                      addCollegeMutation.mutate({
                        name: collegeForm.name,
                        code: collegeForm.code,
                        location: collegeForm.location,
                      })
                    } else {
                      updateCollegeMutation.mutate({
                        id: collegeForm.id!,
                        payload: { name: collegeForm.name, location: collegeForm.location },
                      })
                    }
                  }}
                  className="w-full h-8 bg-[#D4AF37] hover:bg-[#b8972e] text-white rounded-lg font-black text-xs uppercase"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Colleges list */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredColleges.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-500 italic">No colleges found.</p>
            ) : (
              filteredColleges.map((c: any) => {
                const isSelected = c.id === selectedCollegeId
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCollegeId(c.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-white border-[#D4AF37] shadow-md'
                        : 'bg-white border-[#E5E7EB] hover:border-gray-300'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-extrabold text-[#111827]">{c.name}</p>
                      <p className="text-[10px] text-[#76777d] flex items-center gap-1 font-semibold mt-0.5">
                        <MapPin size={11} className="text-[#D4AF37]" /> {c.location}
                      </p>
                    </div>

                    <div className="flex gap-1.5 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setCollegeForm({
                            isOpen: true,
                            mode: 'edit',
                            id: c.id,
                            name: c.name,
                            code: c.code,
                            location: c.location,
                          })
                        }}
                        className="p-1 hover:bg-gray-100 text-gray-500 hover:text-[#111827] rounded cursor-pointer"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (window.confirm(`Delete college "${c.name}"?`)) {
                            deleteCollegeMutation.mutate(c.id)
                          }
                        }}
                        className="p-1 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Degree & Department Configurator */}
        <div className="lg:col-span-2 bg-white border border-[#E5E7EB] rounded-2xl p-6 shadow-luxury space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-sm text-[#111827] tracking-tight">
                {activeCollege ? `${activeCollege.name} Structure` : 'Degree & Department Configurator'}
              </h3>
              <p className="text-[10px] text-[#76777d] font-semibold">
                Manage degrees and departments for this college.
              </p>
            </div>
            {activeCollege && (
              <button
                onClick={() => setDeptForm({ isOpen: true, mode: 'add', name: '' })}
                className="h-8 px-3 bg-[#FEF3C7] text-[#D97706] hover:bg-[#FDE68A] rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center gap-1"
              >
                <Plus size={14} /> Add Dept
              </button>
            )}
          </div>

          {!activeCollege ? (
            <div className="text-center py-12 text-xs text-gray-500 italic bg-[#FCF8FA] rounded-2xl border border-dashed border-[#E5E7EB]">
              Select a college from the list to manage its configuration structure.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Add/Edit Dept Form inline */}
              {deptForm.isOpen && (
                <div className="p-3 bg-[#FCF8FA] border border-[#FEF3C7] rounded-xl flex gap-2 items-center animate-in slide-in-from-top-2 duration-200">
                  <input
                    type="text"
                    placeholder="Department Name (e.g. Mechanical Engineering)"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="flex-1 h-9 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold"
                  />
                  <button
                    onClick={() => {
                      if (deptForm.mode === 'add') {
                        addDeptMutation.mutate(deptForm.name)
                      } else {
                        updateDeptMutation.mutate({ id: deptForm.id!, name: deptForm.name })
                      }
                    }}
                    className="h-9 px-4 bg-[#D4AF37] hover:bg-[#b8972e] text-white rounded-lg font-black text-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setDeptForm({ isOpen: false, mode: 'add', name: '' })}
                    className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 cursor-pointer"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Add/Edit Program Form inline */}
              {progForm.isOpen && (
                <div className="p-3 bg-[#FCF8FA] border border-[#FEF3C7] rounded-xl flex flex-col sm:flex-row gap-2 items-center animate-in slide-in-from-top-2 duration-200">
                  <input
                    type="text"
                    placeholder="Degree/Program Name (e.g. B.E. Mechanical Engineering)"
                    value={progForm.name}
                    onChange={(e) => setProgForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="flex-1 h-9 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold w-full"
                  />
                  <input
                    type="number"
                    placeholder="Duration Years"
                    value={progForm.durationYears}
                    onChange={(e) => setProgForm((prev) => ({ ...prev, durationYears: parseInt(e.target.value) || 4 }))}
                    className="w-full sm:w-24 h-9 px-2 bg-white border border-[#E5E7EB] rounded-lg text-xs font-bold"
                  />
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        if (progForm.mode === 'add') {
                          addProgMutation.mutate({ deptId: progForm.id!, name: progForm.name, durationYears: progForm.durationYears })
                        } else {
                          updateProgMutation.mutate({ id: progForm.id!, name: progForm.name, durationYears: progForm.durationYears })
                        }
                      }}
                      className="flex-1 sm:flex-initial h-9 px-4 bg-[#111827] hover:bg-black text-white rounded-lg font-black text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setProgForm({ isOpen: false, mode: 'add', name: '', durationYears: 4 })}
                      className="p-2 hover:bg-gray-200 rounded-lg text-gray-500 cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* Departments grid list */}
              <div className="space-y-3">
                {!activeCollege.departments || activeCollege.departments.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-4">No departments configured yet.</p>
                ) : (
                  activeCollege.departments.map((dept: any) => (
                    <div key={dept.id} className="border border-[#E5E7EB] rounded-xl p-4 bg-[#FCF8FA] space-y-3">
                      <div className="flex justify-between items-center border-b pb-2 border-dashed border-[#E5E7EB]">
                        <span className="text-xs font-extrabold text-[#111827] flex items-center gap-1.5">
                          <BookOpen size={13} className="text-[#D4AF37]" /> {dept.name}
                        </span>
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => setProgForm({ isOpen: true, mode: 'add', id: dept.id, name: '', durationYears: 4 })}
                            className="p-1 hover:bg-gray-200 text-[#D4AF37] rounded cursor-pointer"
                            title="Add Program"
                          >
                            <Plus size={13} />
                          </button>
                          <button
                            onClick={() => setDeptForm({ isOpen: true, mode: 'edit', id: dept.id, name: dept.name })}
                            className="p-1 hover:bg-gray-200 text-gray-500 rounded cursor-pointer"
                            title="Rename Department"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete department "${dept.name}"?`)) {
                                deleteDeptMutation.mutate(dept.id)
                              }
                            }}
                            className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                            title="Delete Department"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Programs inside Department */}
                      <div className="pl-4 space-y-1.5">
                        {!dept.programs || dept.programs.length === 0 ? (
                          <span className="text-[10px] text-gray-400 italic">No degrees or programs added yet.</span>
                        ) : (
                          dept.programs.map((prog: any) => (
                            <div key={prog.id} className="flex justify-between items-center bg-white border border-[#E5E7EB] px-3 py-1.5 rounded-lg text-xs">
                              <span className="font-semibold text-gray-700 flex items-center gap-1">
                                <GraduationCap size={13} className="text-gray-400" />
                                {prog.name} ({prog.durationYears} Years)
                              </span>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setProgForm({ isOpen: true, mode: 'edit', id: prog.id, name: prog.name, durationYears: prog.durationYears })}
                                  className="p-1 hover:bg-gray-100 text-gray-500 rounded cursor-pointer"
                                >
                                  <Edit2 size={11} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete program "${prog.name}"?`)) {
                                      deleteProgMutation.mutate(prog.id)
                                    }
                                  }}
                                  className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Visual Hierarchy Preview Tree */}
              <div className="bg-gray-50 border border-[#E5E7EB] p-4 rounded-xl space-y-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#76777d] block pb-2 border-b border-gray-200">
                  Hierarchy Preview
                </span>
                <div className="text-xs space-y-1 pt-1">
                  <div className="font-extrabold text-[#111827] flex items-center gap-1">
                    <Layers size={13} className="text-[#D4AF37]" /> {activeCollege.name}
                  </div>
                  {activeCollege.departments?.map((dept: any) => (
                    <div key={dept.id} className="pl-4 border-l border-gray-300">
                      <div className="text-gray-900 font-bold flex items-center gap-1">
                        <ChevronRight size={12} className="text-gray-400" /> {dept.name}
                      </div>
                      {dept.programs?.map((prog: any) => (
                        <div key={prog.id} className="pl-6 text-gray-500 font-medium flex items-center gap-1">
                          • {prog.name} ({prog.durationYears} Years)
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ZoneManagementPage
