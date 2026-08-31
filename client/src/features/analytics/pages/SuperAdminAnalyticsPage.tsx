import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy,
  Building2,
  MapPin,
  Users,
  Award,
  Calendar,
  Filter,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  X,
  Layers,
  GraduationCap,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableLoader } from '@/components/ui/TableLoader'
import { zoneApi } from '@/api/zone.api'
import { profileApi } from '@/api/profile.api'
import { getMediaUrl } from '@/utils/media'
import {
  analyticsApi,
  AnalyticsQueryParams,
  TopStudentItem,
  CollegePerformanceItem,
  ZonePerformanceItem,
} from '@/api/analytics.api'

export const SuperAdminAnalyticsPage: React.FC = () => {
  // ─── Filter States ────────────────────────────────────────────────────────
  const [period, setPeriod] = useState<'total' | 'academicYear' | 'custom'>('total')
  const [academicYear, setAcademicYear] = useState<string>('2025-2026')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [studentYear, setStudentYear] = useState<'all' | '1' | '2' | '3' | '4'>('all')
  const [selectedZoneId, setSelectedZoneId] = useState<string>('all')
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('all')

  // Drill-Down Modal States
  const [selectedCollegeForDrillDown, setSelectedCollegeForDrillDown] = useState<string | null>(null)
  const [selectedZoneForDrillDown, setSelectedZoneForDrillDown] = useState<string | null>(null)

  // ─── Fetch Master Data ───────────────────────────────────────────────────
  const { data: zonesRes } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneApi.list({ limit: 100 }),
  })
  const zones = zonesRes?.data || []

  const { data: collegesRes } = useQuery({
    queryKey: ['colleges'],
    queryFn: () => profileApi.getColleges(),
  })
  const allColleges = collegesRes?.data || []

  // Filter available colleges based on selected Zone
  const availableColleges = useMemo(() => {
    if (selectedZoneId === 'all') return allColleges
    return allColleges.filter((c: any) => c.zoneId === selectedZoneId)
  }, [allColleges, selectedZoneId])

  // Handle Zone Change: auto-reset college if not inside selected zone
  const handleZoneChange = (newZoneId: string) => {
    setSelectedZoneId(newZoneId)
    if (newZoneId !== 'all' && selectedCollegeId !== 'all') {
      const existsInZone = allColleges.some(
        (c: any) => c.id === selectedCollegeId && c.zoneId === newZoneId
      )
      if (!existsInZone) {
        setSelectedCollegeId('all')
      }
    }
  }

  // ─── Query Parameters Construction ───────────────────────────────────────
  const queryParams: AnalyticsQueryParams = useMemo(() => {
    const params: AnalyticsQueryParams = {
      period,
      studentYear,
      zoneId: selectedZoneId !== 'all' ? selectedZoneId : undefined,
      collegeId: selectedCollegeId !== 'all' ? selectedCollegeId : undefined,
    }

    if (period === 'academicYear') {
      params.academicYear = academicYear
    } else if (period === 'custom') {
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate
    }

    return params
  }, [period, academicYear, fromDate, toDate, studentYear, selectedZoneId, selectedCollegeId])

  // ─── Fetch Live Analytics ────────────────────────────────────────────────
  const {
    data: analyticsRes,
    isLoading: isAnalyticsLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['volunteering-analytics', queryParams],
    queryFn: () => analyticsApi.getVolunteeringAnalytics(queryParams),
  })

  const analytics = analyticsRes?.data
  const summary = analytics?.summary
  const topStudents = analytics?.topStudents || []
  const collegePerformance = analytics?.collegePerformance || []
  const zonePerformance = analytics?.zonePerformance || []
  const availableAcademicYears = analytics?.availableAcademicYears || [
    '2025-2026',
    '2024-2025',
    '2023-2024',
    '2022-2023',
  ]

  // ─── Drill-Down Queries ──────────────────────────────────────────────────
  const { data: collegeDrillDownRes, isLoading: isCollegeDrillDownLoading } = useQuery({
    queryKey: ['college-drilldown', selectedCollegeForDrillDown, queryParams],
    queryFn: () =>
      selectedCollegeForDrillDown
        ? analyticsApi.getCollegeDrillDown(selectedCollegeForDrillDown, queryParams)
        : null,
    enabled: !!selectedCollegeForDrillDown,
  })
  const collegeDrillDown = collegeDrillDownRes?.data

  const { data: zoneDrillDownRes, isLoading: isZoneDrillDownLoading } = useQuery({
    queryKey: ['zone-drilldown', selectedZoneForDrillDown, queryParams],
    queryFn: () =>
      selectedZoneForDrillDown
        ? analyticsApi.getZoneDrillDown(selectedZoneForDrillDown, queryParams)
        : null,
    enabled: !!selectedZoneForDrillDown,
  })
  const zoneDrillDown = zoneDrillDownRes?.data

  // ─── Rank Badge Helper ────────────────────────────────────────────────────
  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 font-black text-xs shadow-md ring-2 ring-amber-300/40">
          1
        </span>
      )
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 font-black text-xs shadow-sm ring-1 ring-slate-300">
          2
        </span>
      )
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black text-xs shadow-sm">
          3
        </span>
      )
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-[#111827] font-bold text-xs border border-gray-200">
        {rank}
      </span>
    )
  }

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto min-h-screen pb-16 animate-in fade-in duration-300 select-none">
      {/* ─── PAGE TITLE & ACTIONS ─── */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-luxury flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-[#111827] tracking-tight">
              Volunteering Performance Analytics
            </h1>
            <Badge variant="gold" className="text-[10px] font-bold uppercase tracking-wider">
              Live Database
            </Badge>
          </div>
          <p className="text-xs text-[#45464c] font-medium mt-1">
            Super Admin multi-dimensional performance intelligence across active scholars, partner colleges, and operational zones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#D4AF37]' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* ─── UNIFIED FILTER TOOLBAR ─── */}
      <Card className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#111827] border-b border-gray-100 pb-3">
          <Filter className="w-4 h-4 text-[#D4AF37]" />
          <span>Unified Filter Matrix (All Filters Apply Together)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Analytics Period */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
              Analytics Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            >
              <option value="total">Total (All-Time Historical)</option>
              <option value="academicYear">Academic Year (June → May)</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Conditional Period Sub-Filter */}
          {period === 'academicYear' ? (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
                Select Academic Year
              </label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
              >
                {availableAcademicYears.map((ay) => (
                  <option key={ay} value={ay}>
                    {ay} (Jun {ay.split('-')[0]} - May {ay.split('-')[1]})
                  </option>
                ))}
              </select>
            </div>
          ) : period === 'custom' ? (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  placeholder="From"
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-[11px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  placeholder="To"
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl px-2 py-1.5 text-[11px] font-semibold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 opacity-60">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
                Period Range
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 font-medium">
                Full Historical Scope
              </div>
            </div>
          )}

          {/* 2. Student Year Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
              Student Academic Year
            </label>
            <select
              value={studentYear}
              onChange={(e) => setStudentYear(e.target.value as any)}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            >
              <option value="all">All Student Years</option>
              <option value="1">1st Year Only</option>
              <option value="2">2nd Year Only</option>
              <option value="3">3rd Year Only</option>
              <option value="4">4th Year Only</option>
            </select>
          </div>

          {/* 3. Zone Filter */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
              Operational Zone
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => handleZoneChange(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            >
              <option value="all">All Operational Zones</option>
              {zones.map((z: any) => (
                <option key={z.id} value={z.id}>
                  {z.name} ({z.code})
                </option>
              ))}
            </select>
          </div>

          {/* 4. College Filter */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
              Partner College
            </label>
            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            >
              <option value="all">
                {selectedZoneId === 'all'
                  ? 'All Partner Colleges'
                  : `All Colleges in Selected Zone (${availableColleges.length} colleges)`}
              </option>
              {availableColleges.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) - {c.location}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* ─── SUMMARY STAT CARDS ─── */}
      {isAnalyticsLoading ? (
        <TableLoader rows={2} columns={5} />
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#76777d]">
                Active Scholars
              </span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-[#111827]">{summary.totalActiveStudents.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Total active enrolled</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#76777d]">
                Volunteering Scholars
              </span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600">
              {summary.totalVolunteeringStudents.toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-500 font-semibold">Distinct active volunteers</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#76777d]">
                Overall Participation
              </span>
              <TrendingUp className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-2xl font-black text-[#D4AF37]">
              {summary.overallParticipationPercentage.toFixed(2)}%
            </p>
            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#D4AF37] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, summary.overallParticipationPercentage)}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#76777d]">
                Approved Activities
              </span>
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-indigo-900">{summary.totalActivities.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Total verified submissions</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#76777d]">
                Total Points Earned
              </span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600">{summary.totalPoints.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Cumulative approved points</p>
          </div>
        </div>
      ) : null}

      {/* ─── SECTION 1: TOP 5 VOLUNTEERING STUDENTS ─── */}
      <Card className="p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-luxury space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-black text-[#111827] tracking-tight">
                Top 5 Volunteering Scholars
              </h2>
            </div>
            <p className="text-xs text-[#76777d] font-semibold mt-0.5">
              Ranked strictly by cumulative approved volunteering points within current filter scope (equal points share rank).
            </p>
          </div>
          <Badge variant="gold" className="text-[11px] font-mono px-3 py-1">
            Top Performers
          </Badge>
        </div>

        {isAnalyticsLoading ? (
          <TableLoader rows={3} columns={5} />
        ) : topStudents.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No approved volunteering activity found</p>
            <p className="text-[11px] text-gray-400">No active students have approved volunteering logs for the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {topStudents.map((st) => {
              const avatarUrl = st.profileImage ? getMediaUrl(st.profileImage) : null
              const initials = st.studentName
                ? st.studentName
                    .split(' ')
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'ST'

              return (
                <div
                  key={st.studentId}
                  className="bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB] hover:border-[#D4AF37]/60 hover:shadow-lg transition-all duration-300 p-5 flex flex-col justify-between relative group overflow-hidden"
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    {/* Portrait Profile Photo matching reference image */}
                    <div className="w-full h-40 rounded-xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 border border-[#E5E7EB] relative flex items-center justify-center shadow-inner group-hover:border-[#D4AF37]/50 transition-colors">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={st.studentName}
                          className="w-full h-full object-cover object-top"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#111827] to-slate-800 text-[#D4AF37] font-black text-2xl flex items-center justify-center">
                          {initials}
                        </div>
                      )}
                      {st.rank === 1 && (
                        <span
                          className="absolute top-2 right-2 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-md text-[10px] font-black flex items-center gap-1"
                          title="Top Rank Scholar"
                        >
                          👑 Top 1
                        </span>
                      )}
                    </div>

                    <div className="w-full px-1">
                      <h3
                        className="text-xs font-black uppercase text-[#111827] truncate tracking-tight"
                        title={st.studentName}
                      >
                        {st.studentName}
                      </h3>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                          {st.registrationNumber}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-400">{st.studentYear}</span>
                      </div>
                    </div>
                  </div>

                  {/* College Details */}
                  <div className="mt-2 pt-2 border-t border-gray-100 text-center space-y-0.5">
                    <p className="text-[11px] font-bold text-gray-800 line-clamp-1" title={st.collegeName}>
                      {st.collegeName}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono font-medium">
                      {st.collegeCode} • {st.zoneName}
                    </p>
                  </div>

                  {/* Metrics Banner */}
                  <div className="mt-3 pt-2 border-t border-gray-100 grid grid-cols-2 gap-2 text-center bg-[#FCF8FA] -mx-5 -mb-5 p-3 rounded-b-2xl">
                    <div className="space-y-0.5 border-r border-gray-200">
                      <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">Activities</p>
                      <p className="text-xs font-black text-indigo-900">{st.activitiesCount}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase tracking-wider text-amber-600">Points</p>
                      <p className="text-xs font-black text-amber-700">{st.points} pts</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* ─── SECTION 2: COLLEGE PERFORMANCE ─── */}
      <Card className="p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-luxury space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-black text-[#111827] tracking-tight">
                College Performance & Participation
              </h2>
            </div>
            <p className="text-xs text-[#76777d] font-semibold mt-0.5">
              Ranked by volunteering participation % (distinct active volunteers / active students × 100). Click any college for detailed drill-down.
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            {collegePerformance.length} Colleges in Scope
          </span>
        </div>

        {isAnalyticsLoading ? (
          <TableLoader rows={4} columns={7} />
        ) : collegePerformance.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
            <Building2 className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No partner colleges match current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCF8FA] text-[#76777d] uppercase text-[10px] font-black tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Partner College</th>
                  <th className="py-3.5 px-4">Zone</th>
                  <th className="py-3.5 px-4 text-center">Active Scholars</th>
                  <th className="py-3.5 px-4 text-center">Volunteering</th>
                  <th className="py-3.5 px-4 min-w-44">Participation %</th>
                  <th className="py-3.5 px-4 text-center">Activities</th>
                  <th className="py-3.5 px-4 text-right">Points</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-medium text-[#111827]">
                {collegePerformance.map((col) => (
                  <tr
                    key={col.collegeId}
                    onClick={() => setSelectedCollegeForDrillDown(col.collegeId)}
                    className="hover:bg-[#FCF8FA] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 text-center">{renderRankBadge(col.rank)}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827] group-hover:text-blue-900 transition-colors">
                        {col.collegeName}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">{col.collegeCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="neutral" className="text-[10px] font-bold">
                        {col.zoneName}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                      {col.activeStudents}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                      {col.volunteeringStudents}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className={col.participationPercentage > 0 ? 'text-[#D4AF37]' : 'text-gray-400'}>
                            {col.participationPercentage.toFixed(2)}%
                          </span>
                          <span className="text-gray-400 font-normal text-[10px]">
                            {col.volunteeringStudents}/{col.activeStudents}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#D4AF37] h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, col.participationPercentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-900">
                      {col.activities}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-amber-600">
                      {col.points}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCollegeForDrillDown(col.collegeId)
                        }}
                        className="p-1.5 text-xs text-blue-900 hover:bg-blue-50 rounded-lg transition font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        Drill Down <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── SECTION 3: ZONE PERFORMANCE ─── */}
      <Card className="p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-luxury space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-black text-[#111827] tracking-tight">
                Operational Zone Performance
              </h2>
            </div>
            <p className="text-xs text-[#76777d] font-semibold mt-0.5">
              Ranked by volunteering participation % across active scholars in each operational zone. Click any zone for detailed breakdown.
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
            {zonePerformance.length} Zones in Scope
          </span>
        </div>

        {isAnalyticsLoading ? (
          <TableLoader rows={3} columns={7} />
        ) : zonePerformance.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
            <MapPin className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No operational zones match current filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCF8FA] text-[#76777d] uppercase text-[10px] font-black tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Zone & Code</th>
                  <th className="py-3.5 px-4">Assigned Incharge</th>
                  <th className="py-3.5 px-4 text-center">Active Scholars</th>
                  <th className="py-3.5 px-4 text-center">Volunteering</th>
                  <th className="py-3.5 px-4 min-w-44">Participation %</th>
                  <th className="py-3.5 px-4 text-center">Activities</th>
                  <th className="py-3.5 px-4 text-right">Points</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-medium text-[#111827]">
                {zonePerformance.map((zn) => (
                  <tr
                    key={zn.zoneId}
                    onClick={() => setSelectedZoneForDrillDown(zn.zoneId)}
                    className="hover:bg-[#FCF8FA] transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 text-center">{renderRankBadge(zn.rank)}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827] group-hover:text-blue-900 transition-colors">
                        {zn.zoneName}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">{zn.zoneCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        {zn.inchargeName}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                      {zn.activeStudents}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                      {zn.volunteeringStudents}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className={zn.participationPercentage > 0 ? 'text-[#D4AF37]' : 'text-gray-400'}>
                            {zn.participationPercentage.toFixed(2)}%
                          </span>
                          <span className="text-gray-400 font-normal text-[10px]">
                            {zn.volunteeringStudents}/{zn.activeStudents}
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#D4AF37] h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, zn.participationPercentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-900">
                      {zn.activities}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-amber-600">
                      {zn.points}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedZoneForDrillDown(zn.zoneId)
                        }}
                        className="p-1.5 text-xs text-blue-900 hover:bg-blue-50 rounded-lg transition font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        Drill Down <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── DRILL-DOWN MODAL: COLLEGE ─── */}
      {selectedCollegeForDrillDown && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="gold" className="text-[10px] uppercase font-bold">
                    College Intelligence
                  </Badge>
                  <span className="text-xs text-gray-400 font-mono">
                    {collegeDrillDown?.college.code || ''}
                  </span>
                </div>
                <h3 className="text-xl font-black mt-1">
                  {collegeDrillDown?.college.name || 'Loading College Details...'}
                </h3>
                <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-2">
                  <span>{collegeDrillDown?.college.location}</span>
                  <span>•</span>
                  <span>Zone: {collegeDrillDown?.college.zoneName}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCollegeForDrillDown(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {isCollegeDrillDownLoading ? (
                <TableLoader rows={3} columns={4} />
              ) : collegeDrillDown ? (
                <>
                  {/* Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                      <p className="text-[10px] font-black uppercase text-gray-400">Active Scholars</p>
                      <p className="text-lg font-black text-gray-900">
                        {collegeDrillDown.metrics.activeStudents}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                      <p className="text-[10px] font-black uppercase text-emerald-600">Volunteers</p>
                      <p className="text-lg font-black text-emerald-700">
                        {collegeDrillDown.metrics.volunteeringStudents}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                      <p className="text-[10px] font-black uppercase text-amber-600">Participation</p>
                      <p className="text-lg font-black text-amber-700">
                        {collegeDrillDown.metrics.participationPercentage.toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                      <p className="text-[10px] font-black uppercase text-indigo-600">Activities</p>
                      <p className="text-lg font-black text-indigo-900">
                        {collegeDrillDown.metrics.activities}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-xl border border-amber-300 text-center col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-black uppercase text-amber-800">Total Points</p>
                      <p className="text-lg font-black text-amber-900">
                        {collegeDrillDown.metrics.points}
                      </p>
                    </div>
                  </div>

                  {/* Top 5 Scholars in this College */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <h4 className="text-sm font-black text-gray-900">
                        Top 5 Volunteering Scholars in this College
                      </h4>
                    </div>

                    {collegeDrillDown.topStudents.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No approved volunteering records found for active scholars in this college.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-black border-b border-gray-200">
                            <tr>
                              <th className="py-2.5 px-3 w-14 text-center">Rank</th>
                              <th className="py-2.5 px-3">Scholar Name</th>
                              <th className="py-2.5 px-3">Reg #</th>
                              <th className="py-2.5 px-3">Year</th>
                              <th className="py-2.5 px-3 text-center">Activities</th>
                              <th className="py-2.5 px-3 text-right">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 font-medium">
                            {collegeDrillDown.topStudents.map((st) => (
                              <tr key={st.studentId} className="hover:bg-gray-50/80">
                                <td className="py-2.5 px-3 text-center">{renderRankBadge(st.rank)}</td>
                                <td className="py-2.5 px-3 font-bold text-gray-900">{st.studentName}</td>
                                <td className="py-2.5 px-3 font-mono text-gray-500">{st.registrationNumber}</td>
                                <td className="py-2.5 px-3 text-gray-600">{st.studentYear}</td>
                                <td className="py-2.5 px-3 text-center font-bold text-indigo-900">
                                  {st.activitiesCount}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-amber-600">
                                  {st.points} pts
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCollegeForDrillDown(null)}
                className="font-bold text-xs"
              >
                Close Drill Down
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DRILL-DOWN MODAL: ZONE ─── */}
      {selectedZoneForDrillDown && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl border border-gray-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="gold" className="text-[10px] uppercase font-bold">
                    Zone Intelligence
                  </Badge>
                  <span className="text-xs text-gray-400 font-mono">
                    {zoneDrillDown?.zone.code || ''}
                  </span>
                </div>
                <h3 className="text-xl font-black mt-1">
                  {zoneDrillDown?.zone.name || 'Loading Zone Details...'}
                </h3>
                <p className="text-xs text-gray-300 mt-0.5 flex items-center gap-2">
                  <span>Region: {zoneDrillDown?.zone.regionLabel}</span>
                  <span>•</span>
                  <span>Incharge: {zoneDrillDown?.zone.inchargeName}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedZoneForDrillDown(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {isZoneDrillDownLoading ? (
                <TableLoader rows={3} columns={4} />
              ) : zoneDrillDown ? (
                <>
                  {/* Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-center">
                      <p className="text-[10px] font-black uppercase text-gray-400">Active Scholars</p>
                      <p className="text-lg font-black text-gray-900">
                        {zoneDrillDown.metrics.activeStudents}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                      <p className="text-[10px] font-black uppercase text-emerald-600">Volunteers</p>
                      <p className="text-lg font-black text-emerald-700">
                        {zoneDrillDown.metrics.volunteeringStudents}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-center">
                      <p className="text-[10px] font-black uppercase text-amber-600">Participation</p>
                      <p className="text-lg font-black text-amber-700">
                        {zoneDrillDown.metrics.participationPercentage.toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                      <p className="text-[10px] font-black uppercase text-indigo-600">Activities</p>
                      <p className="text-lg font-black text-indigo-900">
                        {zoneDrillDown.metrics.activities}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-100 rounded-xl border border-amber-300 text-center col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-black uppercase text-amber-800">Total Points</p>
                      <p className="text-lg font-black text-amber-900">
                        {zoneDrillDown.metrics.points}
                      </p>
                    </div>
                  </div>

                  {/* Colleges Inside this Zone */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-sm font-black text-gray-900">
                          Colleges in this Zone ({zoneDrillDown.colleges.length})
                        </h4>
                      </div>
                    </div>

                    {zoneDrillDown.colleges.length === 0 ? (
                      <p className="text-xs text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        No colleges registered under this zone.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-black border-b border-gray-200">
                            <tr>
                              <th className="py-2.5 px-3 w-14 text-center">Rank</th>
                              <th className="py-2.5 px-3">College Name & Code</th>
                              <th className="py-2.5 px-3 text-center">Active</th>
                              <th className="py-2.5 px-3 text-center">Volunteering</th>
                              <th className="py-2.5 px-3 min-w-36">Participation %</th>
                              <th className="py-2.5 px-3 text-center">Activities</th>
                              <th className="py-2.5 px-3 text-right">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 font-medium">
                            {zoneDrillDown.colleges.map((c) => (
                              <tr key={c.collegeId} className="hover:bg-gray-50/80">
                                <td className="py-2.5 px-3 text-center">{renderRankBadge(c.rank)}</td>
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-gray-900">{c.collegeName}</div>
                                  <div className="text-[10px] text-gray-400 font-mono">{c.collegeCode}</div>
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-gray-700">
                                  {c.activeStudents}
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                                  {c.volunteeringStudents}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex justify-between text-[10px] font-bold mb-0.5">
                                    <span className={c.participationPercentage > 0 ? 'text-[#D4AF37]' : 'text-gray-400'}>
                                      {c.participationPercentage.toFixed(2)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-[#D4AF37] h-1.5 rounded-full"
                                      style={{ width: `${Math.min(100, c.participationPercentage)}%` }}
                                    />
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center font-bold text-indigo-900">
                                  {c.activities}
                                </td>
                                <td className="py-2.5 px-3 text-right font-black text-amber-600">
                                  {c.points}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedZoneForDrillDown(null)}
                className="font-bold text-xs"
              >
                Close Drill Down
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperAdminAnalyticsPage
