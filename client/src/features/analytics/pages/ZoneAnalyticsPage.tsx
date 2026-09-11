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
  TrendingUp,
  X,
  Layers,
  GraduationCap,
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { TableLoader } from '@/components/ui/TableLoader'
import { getMediaUrl } from '@/utils/media'
import {
  analyticsApi,
  AnalyticsQueryParams,
  TopStudentItem,
  CollegePerformanceItem,
} from '@/api/analytics.api'

export const ZoneAnalyticsPage: React.FC = () => {
  // ─── Filter States ────────────────────────────────────────────────────────
  const [period, setPeriod] = useState<'total' | 'academicYear' | 'custom'>('total')
  const [academicYear, setAcademicYear] = useState<string>('2025-2026')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [studentYear, setStudentYear] = useState<'all' | '1' | '2' | '3' | '4'>('all')
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('all')

  // Drill-down Modal State
  const [selectedCollegeForDrillDown, setSelectedCollegeForDrillDown] = useState<string | null>(null)

  // ─── Query Parameters Construction ───────────────────────────────────────
  const queryParams: AnalyticsQueryParams = useMemo(() => {
    const params: AnalyticsQueryParams = {
      period,
      studentYear,
      collegeId: selectedCollegeId !== 'all' ? selectedCollegeId : undefined,
    }

    if (period === 'academicYear') {
      params.academicYear = academicYear
    } else if (period === 'custom') {
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate
    }

    return params
  }, [period, academicYear, fromDate, toDate, studentYear, selectedCollegeId])

  // ─── Fetch Live Zone Analytics ───────────────────────────────────────────
  const {
    data: analyticsRes,
    isLoading: isAnalyticsLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['zone-volunteering-analytics', queryParams],
    queryFn: () => analyticsApi.getVolunteeringAnalytics(queryParams),
  })

  const analytics = analyticsRes?.data
  const summary = analytics?.summary
  const topStudents = analytics?.topStudents || []
  const collegePerformance = analytics?.collegePerformance || []
  const zonePerformance = analytics?.zonePerformance || []
  const currentZone = zonePerformance[0]
  const availableAcademicYears = analytics?.availableAcademicYears || [
    '2025-2026',
    '2024-2025',
    '2023-2024',
    '2022-2023',
  ]

  // ─── Drill-Down Queries ──────────────────────────────────────────────────
  const { data: collegeDrillDownRes, isLoading: isCollegeDrillDownLoading } = useQuery({
    queryKey: ['zone-college-drilldown', selectedCollegeForDrillDown, queryParams],
    queryFn: () =>
      selectedCollegeForDrillDown
        ? analyticsApi.getCollegeDrillDown(selectedCollegeForDrillDown, queryParams)
        : null,
    enabled: !!selectedCollegeForDrillDown,
  })
  const collegeDrillDown = collegeDrillDownRes?.data

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
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 text-amber-50 font-black text-xs shadow-sm ring-1 ring-amber-600/30">
          3
        </span>
      )
    }
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold text-xs">
        {rank}
      </span>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-[#111827] tracking-tight">
              Zone Volunteering Analytics
            </h1>
            {currentZone && (
              <Badge variant="gold" className="text-xs font-mono font-black">
                {currentZone.zoneName} ({currentZone.zoneCode})
              </Badge>
            )}
          </div>
          <p className="text-xs text-[#45464c] mt-1">
            Real-time volunteering participation, student points, and college metrics across your assigned zone.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />}
          >
            {isFetching ? 'Refreshing...' : 'Live Refresh'}
          </Button>
        </div>
      </div>

      {/* ─── UNIFIED FILTER MATRIX ─── */}
      <Card className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-luxury space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#111827]">
            <Filter className="w-4 h-4 text-[#D4AF37]" />
            <span>Volunteering Filter Matrix</span>
          </div>

          <div className="flex items-center gap-1 bg-[#FCF8FA] p-1 rounded-xl border border-[#E5E7EB]">
            <button
              onClick={() => setPeriod('total')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                period === 'total'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-[#45464c] hover:text-[#111827]'
              }`}
            >
              Total Scope
            </button>
            <button
              onClick={() => setPeriod('academicYear')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                period === 'academicYear'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-[#45464c] hover:text-[#111827]'
              }`}
            >
              Academic Year
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                period === 'custom'
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-[#45464c] hover:text-[#111827]'
              }`}
            >
              Custom Range
            </button>
          </div>
        </div>

        {/* Dynamic Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
          {/* 1. Academic Year / Custom Range Inputs */}
          {period === 'academicYear' ? (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
                Target Academic Year
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

          {/* 3. College Filter (Scoped to Zone Colleges) */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#76777d]">
              Partner College in Zone
            </label>
            <select
              value={selectedCollegeId}
              onChange={(e) => setSelectedCollegeId(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#E5E7EB] rounded-xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
            >
              <option value="all">All Zone Partner Colleges ({collegePerformance.length} colleges)</option>
              {collegePerformance.map((c) => (
                <option key={c.collegeId} value={c.collegeId}>
                  {c.collegeName} ({c.collegeCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* ─── SUMMARY CARDS ─── */}
      {summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#76777d]">
                Active Scholars
              </span>
              <Users className="w-4 h-4 text-blue-900" />
            </div>
            <p className="text-2xl font-black text-[#111827]">{summary.totalActiveStudents.toLocaleString()}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Active scholars in zone</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-luxury space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#76777d]">
                Active Volunteers
              </span>
              <Activity className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">
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

      {/* ─── SECTION 1: TOP 5 VOLUNTEERING STUDENTS IN ZONE ─── */}
      <Card className="p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-luxury space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-black text-[#111827] tracking-tight">
                Top 5 Volunteering Scholars in Zone
              </h2>
            </div>
            <p className="text-xs text-[#76777d] font-semibold mt-0.5">
              Ranked strictly by cumulative approved volunteering points within this zone (equal points share rank).
            </p>
          </div>
          <Badge variant="gold" className="text-[11px] font-mono px-3 py-1">
            Zone Top Performers
          </Badge>
        </div>

        {isAnalyticsLoading ? (
          <TableLoader rows={3} columns={5} />
        ) : topStudents.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
            <AlertCircle className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No approved volunteering activity found in this zone</p>
            <p className="text-[11px] text-gray-400">
              No active students have approved volunteering logs for the selected filters.
            </p>
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
                  {/* Rank Crown/Badge Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      {renderRankBadge(st.rank)}
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                        Rank #{st.rank}
                      </span>
                    </div>
                    <Badge variant="neutral" className="text-[9px] font-bold py-0.5 px-2">
                      {st.zoneCode || st.zoneName}
                    </Badge>
                  </div>

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

      {/* ─── SECTION 2: COLLEGE PERFORMANCE IN ZONE ─── */}
      <Card className="p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-luxury space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-900" />
              <h2 className="text-lg font-black text-[#111827] tracking-tight">
                Zone Partner Colleges Performance
              </h2>
            </div>
            <p className="text-xs text-[#76777d] font-semibold mt-0.5">
              Ranked by Volunteering Participation Rate (%) followed by total points earned.
            </p>
          </div>
          <Badge variant="neutral" className="text-[11px] font-mono px-3 py-1">
            {collegePerformance.length} Colleges
          </Badge>
        </div>

        {isAnalyticsLoading ? (
          <TableLoader rows={4} columns={7} />
        ) : collegePerformance.length === 0 ? (
          <div className="py-12 text-center space-y-2 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
            <Building2 className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs font-bold text-gray-700">No college records found in zone</p>
            <p className="text-[11px] text-gray-400">No partner colleges are currently assigned to this zone.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#E5E7EB]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCF8FA] text-[#76777d] uppercase text-[10px] font-black tracking-wider border-b border-[#E5E7EB]">
                <tr>
                  <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                  <th className="py-3.5 px-4">Partner College</th>
                  <th className="py-3.5 px-4 text-center">Active Scholars</th>
                  <th className="py-3.5 px-4 text-center">Volunteers</th>
                  <th className="py-3.5 px-4 text-center">Participation %</th>
                  <th className="py-3.5 px-4 text-center">Activities</th>
                  <th className="py-3.5 px-4 text-right">Points</th>
                  <th className="py-3.5 px-4 text-center w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] font-medium text-[#111827]">
                {collegePerformance.map((col) => (
                  <tr key={col.collegeId} className="hover:bg-[#FCF8FA]/60 transition-colors">
                    <td className="py-3.5 px-4 text-center">{renderRankBadge(col.rank)}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#111827]">{col.collegeName}</div>
                      <div className="text-[10px] text-gray-400 font-mono">{col.collegeCode}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                      {col.activeStudents}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                      {col.volunteeringStudents}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 font-black text-xs text-[#D4AF37]">
                        <span>{col.participationPercentage.toFixed(1)}%</span>
                        <div className="w-12 bg-gray-200 rounded-full h-1.5 overflow-hidden hidden sm:block">
                          <div
                            className="bg-[#D4AF37] h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, col.participationPercentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-indigo-900">
                      {col.activities}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 font-black rounded-lg border border-amber-200">
                        {col.points} pts
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCollegeForDrillDown(col.collegeId)}
                        icon={<ExternalLink className="w-3 h-3" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── COLLEGE DRILL-DOWN MODAL ─── */}
      {selectedCollegeForDrillDown && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#E5E7EB]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-lg font-black text-[#111827]">
                    {collegeDrillDown?.college?.name || 'Partner College Overview'}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {collegeDrillDown?.college?.code} • {collegeDrillDown?.college?.location} • {collegeDrillDown?.college?.zoneName}
                </p>
              </div>
              <button
                onClick={() => setSelectedCollegeForDrillDown(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isCollegeDrillDownLoading ? (
                <TableLoader rows={3} columns={4} />
              ) : collegeDrillDown ? (
                <>
                  {/* College Summary Stat Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center space-y-1">
                      <p className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Active Scholars</p>
                      <p className="text-xl font-black text-gray-900">{collegeDrillDown.metrics.activeStudents}</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
                      <p className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">Volunteering</p>
                      <p className="text-xl font-black text-emerald-800">{collegeDrillDown.metrics.volunteeringStudents}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-1">
                      <p className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Participation</p>
                      <p className="text-xl font-black text-amber-800">{collegeDrillDown.metrics.participationPercentage.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-center space-y-1">
                      <p className="text-[10px] font-black uppercase text-indigo-700 tracking-wider">Total Points</p>
                      <p className="text-xl font-black text-indigo-900">{collegeDrillDown.metrics.points}</p>
                    </div>
                  </div>

                  {/* Top 5 Students in this College */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        Top Scholars in this College
                      </h4>
                      <Badge variant="gold" className="text-[10px] font-mono">
                        {collegeDrillDown.topStudents.length} Ranked
                      </Badge>
                    </div>

                    {collegeDrillDown.topStudents.length === 0 ? (
                      <p className="text-xs text-gray-400 py-4 text-center bg-gray-50 rounded-xl">
                        No approved volunteering logs recorded for students in this college.
                      </p>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500 uppercase text-[9px] font-black tracking-wider border-b border-gray-200">
                            <tr>
                              <th className="py-2.5 px-3 text-center w-12">Rank</th>
                              <th className="py-2.5 px-3">Scholar Name</th>
                              <th className="py-2.5 px-3">Reg #</th>
                              <th className="py-2.5 px-3 text-center">Activities</th>
                              <th className="py-2.5 px-3 text-right">Points</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-medium text-gray-900">
                            {collegeDrillDown.topStudents.map((st) => (
                              <tr key={st.studentId} className="hover:bg-gray-50/50">
                                <td className="py-2.5 px-3 text-center">{renderRankBadge(st.rank)}</td>
                                <td className="py-2.5 px-3 font-bold">{st.studentName}</td>
                                <td className="py-2.5 px-3 font-mono text-gray-500">{st.registrationNumber}</td>
                                <td className="py-2.5 px-3 text-center font-bold text-indigo-900">{st.activitiesCount}</td>
                                <td className="py-2.5 px-3 text-right font-black text-amber-700">{st.points} pts</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-xs text-red-500">Failed to load college analytics details.</div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedCollegeForDrillDown(null)}>
                Close Drill-Down
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ZoneAnalyticsPage
