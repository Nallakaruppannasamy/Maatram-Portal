import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users,
  Building2,
  MapPin,
  HeartHandshake,
  FileSpreadsheet,
  FolderGit2,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Award,
  Trophy,
  AlertTriangle,
  RefreshCw,
  GraduationCap,
  Sparkles,
  BarChart3,
  Percent,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/CardSkeleton'
import { analyticsApi } from '@/api/analytics.api'
import { getMediaUrl } from '@/utils/media'

export const SuperAdminDashboardPage: React.FC = () => {
  const {
    data: dashRes,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['super-admin-dashboard'],
    queryFn: () => analyticsApi.getSuperAdminDashboard(),
  })

  const data = dashRes?.data

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div>
          <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight">Super Admin Executive Dashboard</h2>
          <p className="text-xs text-[#45464c]">Organization-wide live analytics and governance.</p>
        </div>
        <CardSkeleton count={4} />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Card className="p-8 text-center space-y-4 max-w-xl mx-auto my-12 bg-red-50/50 border-red-200">
        <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
        <div>
          <h3 className="text-lg font-bold text-red-900">Failed to load Dashboard data</h3>
          <p className="text-xs text-red-700 mt-1">An unexpected error occurred while fetching global metrics.</p>
        </div>
        <Button
          variant="gold"
          size="sm"
          onClick={() => refetch()}
          icon={<RefreshCw className="w-4 h-4" />}
          className="mx-auto font-semibold"
        >
          Retry Connection
        </Button>
      </Card>
    )
  }

  const {
    overview,
    volunteeringActivities,
    categoryDistribution,
    monthlyTrends,
    yearDistribution,
    conversionRate,
    highlights,
  } = data

  const categoryChartData = Object.entries(categoryDistribution || {}).map(([category, count]) => ({
    category,
    count,
  }))

  const yearDistributionData = [
    { name: '1st Year', count: yearDistribution?.['1st Year'] || 0 },
    { name: '2nd Year', count: yearDistribution?.['2nd Year'] || 0 },
    { name: '3rd Year', count: yearDistribution?.['3rd Year'] || 0 },
    { name: '4th Year', count: yearDistribution?.['4th Year'] || 0 },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300 font-sans pb-12">
      {/* ─── Super Admin Welcome Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="gold">Executive System Portal</Badge>
            <span className="text-xs text-[#76777d]">Global Foundation Governance</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#111827] tracking-tight mt-1">
            Super Admin Executive Dashboard
          </h2>
          <p className="text-xs text-[#45464c]">
            Organization-wide live analytics, volunteering metrics, and performance governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#D4AF37]' : ''}`} />
            Refresh
          </Button>
          <Link to="/admin/provisioning">
            <Button variant="gold" size="sm" icon={<FileSpreadsheet className="w-4 h-4" />}>
              Student Provisioning
            </Button>
          </Link>
          <Link to="/admin/team">
            <Button variant="outline" size="sm" icon={<Shield className="w-4 h-4" />}>
              Admin Team
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── SECTION 1: OVERVIEW STATISTICS ─── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#76777d] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#D4AF37]" />
            Overview Statistics
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
          <Card className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Total Students</span>
            <p className="text-2xl font-black text-[#111827] mt-1">{overview.totalStudents}</p>
            <span className="text-[10px] font-medium text-blue-600 mt-1">Enrolled</span>
          </Card>
          <Card className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Active Students</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{overview.activeStudents}</p>
            <span className="text-[10px] font-medium text-emerald-600 mt-1">Active Accounts</span>
          </Card>
          <Card className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Inactive Students</span>
            <p className="text-2xl font-black text-amber-600 mt-1">{overview.inactiveStudents}</p>
            <span className="text-[10px] font-medium text-amber-600 mt-1">Deactivated</span>
          </Card>
          <Card className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Active Zones</span>
            <p className="text-2xl font-black text-[#111827] mt-1">{overview.activeZones}</p>
            <span className="text-[10px] font-medium text-indigo-600 mt-1">Operational</span>
          </Card>
          <Card className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Total Colleges</span>
            <p className="text-2xl font-black text-[#111827] mt-1">{overview.totalColleges}</p>
            <span className="text-[10px] font-medium text-purple-600 mt-1">Partner Inst.</span>
          </Card>
          <Card className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Zone Incharges</span>
            <p className="text-2xl font-black text-[#111827] mt-1">{overview.zoneIncharges}</p>
            <span className="text-[10px] font-medium text-blue-600 mt-1">Zone Admins</span>
          </Card>
          <Card className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Super Admins</span>
            <p className="text-2xl font-black text-[#111827] mt-1">{overview.superAdmins}</p>
            <span className="text-[10px] font-medium text-slate-600 mt-1">Executive</span>
          </Card>
          <Card className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Total SPOCs</span>
            <p className="text-2xl font-black text-[#111827] mt-1">{overview.totalSpocs}</p>
            <span className="text-[10px] font-medium text-amber-600 mt-1">Student SPOCs</span>
          </Card>
          <Card className="p-3.5 bg-white border border-[#E5E7EB] rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-bold text-[#76777d] uppercase tracking-wider">Active Volunteers</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">{overview.activeVolunteers}</p>
            <span className="text-[10px] font-medium text-emerald-600 mt-1">With Points</span>
          </Card>
        </div>
      </div>

      {/* ─── SECTION 2: VOLUNTEERING ACTIVITIES & CONVERSION RATE ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Volunteering Activities Breakdown */}
        <Card className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-sm font-black text-[#111827] uppercase tracking-wider">Volunteering Activities</h3>
            </div>
            <span className="text-xs font-bold text-gray-500">Live Status Breakdown</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Activities</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{volunteeringActivities.total}</p>
              <span className="text-[11px] text-slate-500 font-medium">All submissions</span>
            </div>
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved
              </span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{volunteeringActivities.approved}</p>
              <span className="text-[11px] text-emerald-600 font-medium">Points Awarded</span>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Pending
              </span>
              <p className="text-2xl font-black text-amber-700 mt-1">{volunteeringActivities.pending}</p>
              <span className="text-[11px] text-amber-600 font-medium">Under Review</span>
            </div>
            <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-4">
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Rejected
              </span>
              <p className="text-2xl font-black text-rose-700 mt-1">{volunteeringActivities.rejected}</p>
              <span className="text-[11px] text-rose-600 font-medium">Declined</span>
            </div>
          </div>
        </Card>

        {/* Student-to-Volunteer Conversion Rate */}
        <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] flex items-center gap-1.5">
                <Percent className="w-4 h-4" /> Conversion
              </span>
              <Badge variant="gold" className="text-[10px]">Active Ratio</Badge>
            </div>
            <h4 className="text-sm font-bold text-slate-200 mt-2">Student-to-Volunteer Conversion Rate</h4>
            <p className="text-4xl font-black text-white mt-4">{conversionRate}%</p>
          </div>
          <div className="pt-3 border-t border-slate-700/60 text-xs text-slate-300">
            <p>
              <strong className="text-[#D4AF37]">{overview.activeVolunteers}</strong> of{' '}
              <strong className="text-white">{overview.activeStudents}</strong> active students have earned volunteering points.
            </p>
          </div>
        </Card>
      </div>

      {/* ─── SECTION 3: CHARTS (Category Distribution, Monthly Trend, Year Distribution) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Bar Chart */}
        <Card className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-black text-[#111827] uppercase tracking-wider">
                Volunteering Category Distribution
              </h3>
            </div>
            <span className="text-xs font-semibold text-gray-500">5 Standard Categories</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: '#4B5563', fontWeight: 600 }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  cursor={{ fill: '#F3F4F6' }}
                />
                <Bar dataKey="count" fill="#D4AF37" radius={[4, 4, 0, 0]} name="Activities" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Volunteering Trend Line Chart */}
        <Card className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-[#111827] uppercase tracking-wider">
                Monthly Volunteering Trend
              </h3>
            </div>
            <span className="text-xs font-semibold text-gray-500">Activities, Volunteers & Points</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} allowDecimals={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line
                  type="monotone"
                  dataKey="activities"
                  name="Activities"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="volunteers"
                  name="Volunteers"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  name="Points"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Year-wise Student Distribution */}
      <Card className="p-5 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-black text-[#111827] uppercase tracking-wider">
              Year-wise Student Distribution
            </h3>
          </div>
          <span className="text-xs font-semibold text-gray-500">Active Student Cohorts</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {yearDistributionData.map((yd) => (
            <div key={yd.name} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{yd.name}</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{yd.count}</p>
              <span className="text-[10px] text-gray-500 font-medium">Students</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ─── SECTION 4: PERFORMANCE HIGHLIGHTS ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-black text-[#111827] uppercase tracking-wider">Performance Highlights</h3>
          </div>
          <Link to="/admin/analytics">
            <Button variant="outline" size="sm" className="text-xs font-bold">
              View Detailed Analytics →
            </Button>
          </Link>
        </div>

        {/* Top & Lowest Performing Zones and Colleges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Top Zone */}
          <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/60 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Top Zone
              </span>
              <Badge variant="approved" className="text-[10px]">Rank #1</Badge>
            </div>
            {highlights?.topZone ? (
              <div>
                <h4 className="text-base font-black text-slate-900">{highlights.topZone.zoneName}</h4>
                <p className="text-xs font-mono text-emerald-800 font-semibold">{highlights.topZone.zoneCode}</p>
                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-emerald-200">
                  <span className="text-gray-600">Participation:</span>
                  <span className="font-bold text-emerald-900">{highlights.topZone.participationPercentage}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Points:</span>
                  <span className="font-bold text-emerald-900">{highlights.topZone.points} pts</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic pt-2">No zone data available</p>
            )}
          </Card>

          {/* Top College */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-100/60 border border-blue-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-800 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-600" /> Top College
              </span>
              <Badge variant="info" className="text-[10px]">Rank #1</Badge>
            </div>
            {highlights?.topCollege ? (
              <div>
                <h4 className="text-base font-black text-slate-900 line-clamp-1" title={highlights.topCollege.collegeName}>
                  {highlights.topCollege.collegeName}
                </h4>
                <p className="text-xs font-mono text-blue-800 font-semibold">
                  {highlights.topCollege.collegeCode} • {highlights.topCollege.zoneName}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-blue-200">
                  <span className="text-gray-600">Participation:</span>
                  <span className="font-bold text-blue-900">{highlights.topCollege.participationPercentage}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Points:</span>
                  <span className="font-bold text-blue-900">{highlights.topCollege.points} pts</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic pt-2">No college data available</p>
            )}
          </Card>

          {/* Lowest Zone */}
          <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800">Lowest-Performing Zone</span>
              <Badge variant="pending" className="text-[10px]">Attention</Badge>
            </div>
            {highlights?.lowestZone ? (
              <div>
                <h4 className="text-base font-black text-slate-900">{highlights.lowestZone.zoneName}</h4>
                <p className="text-xs font-mono text-amber-800 font-semibold">{highlights.lowestZone.zoneCode}</p>
                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-amber-200">
                  <span className="text-gray-600">Participation:</span>
                  <span className="font-bold text-amber-900">{highlights.lowestZone.participationPercentage}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Points:</span>
                  <span className="font-bold text-amber-900">{highlights.lowestZone.points} pts</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic pt-2">No zone data available</p>
            )}
          </Card>

          {/* Lowest College */}
          <Card className="p-4 bg-gradient-to-br from-rose-50 to-rose-100/60 border border-rose-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-800">Lowest-Performing College</span>
              <Badge variant="rejected" className="text-[10px]">Attention</Badge>
            </div>
            {highlights?.lowestCollege ? (
              <div>
                <h4 className="text-base font-black text-slate-900 line-clamp-1" title={highlights.lowestCollege.collegeName}>
                  {highlights.lowestCollege.collegeName}
                </h4>
                <p className="text-xs font-mono text-rose-800 font-semibold">
                  {highlights.lowestCollege.collegeCode} • {highlights.lowestCollege.zoneName}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-rose-200">
                  <span className="text-gray-600">Participation:</span>
                  <span className="font-bold text-rose-900">{highlights.lowestCollege.participationPercentage}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Points:</span>
                  <span className="font-bold text-rose-900">{highlights.lowestCollege.points} pts</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic pt-2">No college data available</p>
            )}
          </Card>
        </div>

        {/* Top 5 Students Portrait Cards (Existing Portrait Design) */}
        <Card className="p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-luxury space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-black text-[#111827] tracking-tight">Top 5 Volunteering Scholars</h3>
              </div>
              <p className="text-xs text-[#76777d] font-semibold mt-0.5">
                Ranked strictly by cumulative approved volunteering points (equal points share rank).
              </p>
            </div>
            <Badge variant="gold" className="text-[11px] font-mono px-3 py-1">Top Performers</Badge>
          </div>

          {(highlights?.topStudents || []).length === 0 ? (
            <div className="py-12 text-center space-y-2 bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
              <Trophy className="w-8 h-8 text-gray-400 mx-auto" />
              <p className="text-xs font-bold text-gray-700">No approved volunteering activity found</p>
              <p className="text-[11px] text-gray-400">No active students have approved volunteering logs yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {highlights.topStudents.map((st: any) => {
                const avatarUrl = st.profileImage ? getMediaUrl(st.profileImage) : null
                const initials = st.studentName
                  ? st.studentName
                      .split(' ')
                      .filter(Boolean)
                      .map((n: string) => n[0])
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
                      {/* Portrait Profile Photo */}
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
                        <h4
                          className="text-xs font-black uppercase text-[#111827] truncate tracking-tight"
                          title={st.studentName}
                        >
                          {st.studentName}
                        </h4>
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
      </div>
    </div>
  )
}
