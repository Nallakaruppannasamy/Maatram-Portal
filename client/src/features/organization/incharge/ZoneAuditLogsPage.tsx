import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  ShieldAlert,
  ShieldCheck,
  Eye,
  Calendar,
  Clock,
  User,
  MapPin,
  Globe,
  FileText,
  Activity,
  Building2,
  Users,
} from 'lucide-react'
import { TableLoader } from '@/components/ui/TableLoader'
import { auditApi } from '@/api/audit.api'
import { zoneApi } from '@/api/zone.api'
import { AuditLog } from '@/types/api'
import { useDebounce } from '@/hooks/useDebounce'

const formatDateTime = (dateStr: string) => {
  if (!dateStr) return 'N/A'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return dateStr
  }
}

const getRoleBadgeClass = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'zone':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'student':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'system':
      return 'bg-slate-100 text-slate-800 border-slate-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getActionBadgeClass = (action: string) => {
  if (!action) return 'bg-gray-100 text-gray-700'
  if (action.includes('APPROVED') || action.includes('ACTIVATED') || action.includes('SPOC')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
  if (action.includes('REJECTED') || action.includes('DEACTIVATED') || action.includes('DELETED')) {
    return 'bg-rose-50 text-rose-700 border-rose-200'
  }
  if (action.includes('CREATED') || action.includes('SUBMITTED') || action.includes('IMPORTED')) {
    return 'bg-blue-50 text-blue-700 border-blue-200'
  }
  if (action.includes('UPDATED') || action.includes('COMMENT')) {
    return 'bg-amber-50 text-amber-700 border-amber-200'
  }
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

export const ZoneAuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('All')
  const [roleFilter, setRoleFilter] = useState<string>('All')
  const [collegeFilter, setCollegeFilter] = useState<string>('All')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const debouncedSearch = useDebounce(searchTerm, 400)

  // Fetch Assigned Colleges strictly for authenticated Zone Incharge
  const { data: collegesRes } = useQuery({
    queryKey: ['my-assigned-colleges'],
    queryFn: () => zoneApi.getMyColleges(),
  })
  const colleges = collegesRes?.data || []

  // Fetch Distinct Actions
  const { data: actionsRes } = useQuery({
    queryKey: ['audit-actions'],
    queryFn: () => auditApi.getActions(),
  })
  const availableActions = actionsRes?.data || []

  // Fetch Paginated Zone-Scoped Audit Logs
  const { data: logsRes, isLoading } = useQuery({
    queryKey: [
      'zone-audit-logs',
      debouncedSearch,
      currentPage,
      actionFilter,
      roleFilter,
      collegeFilter,
      fromDate,
      toDate,
    ],
    queryFn: () =>
      auditApi.list({
        search: debouncedSearch || undefined,
        action: actionFilter !== 'All' ? actionFilter : undefined,
        actorRole: roleFilter !== 'All' ? roleFilter : undefined,
        collegeId: collegeFilter !== 'All' ? collegeFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page: currentPage,
        limit: 20,
      }),
  })

  const logs = logsRes?.data || []
  const meta = logsRes?.meta || { total: 0, page: currentPage, totalPages: 1, limit: 20, stats: undefined }

  // Quick Clear Filters
  const handleClearFilters = () => {
    setSearchTerm('')
    setActionFilter('All')
    setRoleFilter('All')
    setCollegeFilter('All')
    setFromDate('')
    setToDate('')
    setCurrentPage(1)
  }

  const isFiltering =
    searchTerm !== '' ||
    actionFilter !== 'All' ||
    roleFilter !== 'All' ||
    collegeFilter !== 'All' ||
    fromDate !== '' ||
    toDate !== ''

  const stats = meta.stats || {
    totalLogs: meta.total || 0,
    adminEvents: 0,
    zoneEvents: 0,
    studentEvents: 0,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-gray-900">System Audit & Compliance Log</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <ShieldCheck size={12} /> Compliance Ready
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Traceable system audit trail logging administrative actions, data changes, and approvals.
            </p>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TOTAL LOGS</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalLogs.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ADMIN / ZONE EVENTS</p>
              <p className="text-xl font-bold text-gray-900">
                {(stats.adminEvents + stats.zoneEvents).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">STUDENT EVENTS</p>
              <p className="text-xl font-bold text-gray-900">{stats.studentEvents.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CURRENT PAGE</p>
              <p className="text-xl font-bold text-gray-900">
                {meta.page} of {Math.max(meta.totalPages, 1)}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="relative md:col-span-2">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search actor, action, target student, details..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Action Filter */}
            <div>
              <select
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              >
                <option value="All">All Actions</option>
                {availableActions.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              >
                <option value="All">All Roles</option>
                <option value="admin">Super Admin</option>
                <option value="zone">Zone Incharge</option>
                <option value="student">Student</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* College Filter */}
            <div>
              <select
                value={collegeFilter}
                onChange={(e) => {
                  setCollegeFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition truncate"
              >
                <option value="All">All Colleges</option>
                {colleges.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Button */}
            {isFiltering && (
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="w-full px-3 py-2 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <X size={14} /> Clear
                </button>
              </div>
            )}
          </div>

          {/* Date Filters Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 text-xs">
            <span className="text-gray-500 font-medium">Date Range:</span>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[11px]">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[11px]">To</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-50/80 sticky top-0 z-10 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-semibold text-gray-600">DATE & TIME</th>
                  <th className="py-3 px-4 font-semibold text-gray-600">ACTOR</th>
                  <th className="py-3 px-4 font-semibold text-gray-600">ROLE</th>
                  <th className="py-3 px-4 font-semibold text-gray-600">ACTION EVENT</th>
                  <th className="py-3 px-4 font-semibold text-gray-600">TARGET ENTITY</th>
                  <th className="py-3 px-4 font-semibold text-gray-600">COLLEGE / ZONE</th>
                  <th className="py-3 px-4 font-semibold text-gray-600 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="p-4">
                      <TableLoader rows={6} columns={7} />
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={32} className="text-gray-300 mb-2" />
                        <p className="font-medium text-gray-500">No audit log records found.</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {isFiltering
                            ? 'Try refining or clearing your filter criteria.'
                            : 'All system activities in your zone will be recorded here.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-indigo-50/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-gray-400" />
                          <span className="font-mono text-[11px]">{formatDateTime(log.createdAt)}</span>
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{log.actor?.fullName || 'System'}</div>
                        <div className="text-[11px] text-gray-400">
                          {log.actor?.email || log.actor?.registerNumber || log.actor?.employeeId || 'System Process'}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getRoleBadgeClass(
                            log.actorRole
                          )}`}
                        >
                          {log.actorRole?.toUpperCase()}
                        </span>
                      </td>

                      {/* Action Event */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border font-mono ${getActionBadgeClass(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Target Entity */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{log.targetLabel || 'N/A'}</div>
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                          {log.targetEntityType || 'System'}
                        </div>
                      </td>

                      {/* College / Zone */}
                      <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <MapPin size={12} className="text-indigo-400" />
                          <span>{log.zone?.name || log.actor?.zoneName || 'Assigned Zone'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedLog(log)
                          }}
                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                          title="Inspect audit record"
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 bg-gray-50/80 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div>
              Showing <span className="font-semibold text-gray-700">{logs.length}</span> of{' '}
              <span className="font-semibold text-gray-700">{meta.total.toLocaleString()}</span> compliance records
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">
                Page {meta.page} of {Math.max(meta.totalPages, 1)}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage(1)}
                  className="p-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="First Page"
                >
                  <ChevronsLeft size={14} />
                </button>
                <button
                  type="button"
                  disabled={currentPage <= 1 || isLoading}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="p-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= meta.totalPages || isLoading}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, meta.totalPages))}
                  className="p-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= meta.totalPages || isLoading}
                  onClick={() => setCurrentPage(meta.totalPages)}
                  className="p-1 rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Last Page"
                >
                  <ChevronsRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Audit Record Details</h3>
                  <p className="text-[11px] font-mono text-gray-400">{selectedLog.logCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Event Summary Grid */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Action Event</span>
                  <span className="font-mono font-semibold text-gray-900 text-[11px]">
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Actor Role</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border mt-0.5 ${getRoleBadgeClass(
                      selectedLog.actorRole
                    )}`}
                  >
                    {selectedLog.actorRole.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Actor Name</span>
                  <span className="font-medium text-gray-800">{selectedLog.actor?.fullName || 'System'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Actor Identifier</span>
                  <span className="font-mono text-gray-600">
                    {selectedLog.actor?.email || selectedLog.actor?.registerNumber || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Target Entity</span>
                  <span className="font-medium text-gray-800">
                    {selectedLog.targetEntityType} ({selectedLog.targetLabel || 'N/A'})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Timestamp</span>
                  <span className="font-mono text-gray-600">{formatDateTime(selectedLog.createdAt)}</span>
                </div>
              </div>

              {/* Action Details */}
              <div>
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Event Details</span>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-gray-700 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedLog.details || 'No additional event details provided.'}
                </div>
              </div>

              {/* Network / Client Metadata */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Globe size={13} className="text-gray-400" />
                  <span>IP Address: </span>
                  <span className="font-mono text-gray-700">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 truncate">
                  <Activity size={13} className="text-gray-400" />
                  <span className="truncate">Client: {selectedLog.userAgent || 'Web Browser'}</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ZoneAuditLogsPage
