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

export const AuditLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [actionFilter, setActionFilter] = useState<string>('All')
  const [roleFilter, setRoleFilter] = useState<string>('All')
  const [zoneFilter, setZoneFilter] = useState<string>('All')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const debouncedSearch = useDebounce(searchTerm, 400)

  // Fetch Master Zones
  const { data: zonesRes } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneApi.list(),
  })
  const zones = zonesRes?.data || []

  // Fetch Distinct Actions
  const { data: actionsRes } = useQuery({
    queryKey: ['audit-actions'],
    queryFn: () => auditApi.getActions(),
  })
  const availableActions = actionsRes?.data || []

  // Fetch Paginated Audit Logs
  const { data: logsRes, isLoading } = useQuery({
    queryKey: [
      'audit-logs',
      debouncedSearch,
      currentPage,
      actionFilter,
      roleFilter,
      zoneFilter,
      fromDate,
      toDate,
    ],
    queryFn: () =>
      auditApi.list({
        search: debouncedSearch || undefined,
        action: actionFilter !== 'All' ? actionFilter : undefined,
        actorRole: roleFilter !== 'All' ? roleFilter : undefined,
        zoneId: zoneFilter !== 'All' ? zoneFilter : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        page: currentPage,
        limit: 20,
      }),
  })

  const logs = logsRes?.data || []
  const meta = logsRes?.meta || { total: 0, page: currentPage, totalPages: 1 }

  // Quick Clear Filters
  const handleClearFilters = () => {
    setSearchTerm('')
    setActionFilter('All')
    setRoleFilter('All')
    setZoneFilter('All')
    setFromDate('')
    setToDate('')
    setCurrentPage(1)
  }

  const isFiltering =
    searchTerm !== '' ||
    actionFilter !== 'All' ||
    roleFilter !== 'All' ||
    zoneFilter !== 'All' ||
    fromDate !== '' ||
    toDate !== ''

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
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Activity className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Logs</p>
              <p className="text-xl font-bold text-gray-900">{meta.total.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin Events</p>
              <p className="text-xl font-bold text-gray-900">
                {logs.filter((l) => l.actorRole === 'admin').length} (Page)
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Zone Events</p>
              <p className="text-xl font-bold text-gray-900">
                {logs.filter((l) => l.actorRole === 'zone').length} (Page)
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Page</p>
              <p className="text-xl font-bold text-gray-900">
                {meta.page} of {Math.max(meta.totalPages, 1)}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="relative grow">
              <input
                type="text"
                placeholder="Search audit records by actor name, email, action, details, or target..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-800 outline-none"
              />
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Actions Dropdown */}
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-800 outline-none max-w-xs"
            >
              <option value="All">All Actions / Events</option>
              {availableActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>

            {/* Role Dropdown */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-800 outline-none"
            >
              <option value="All">All Roles</option>
              <option value="admin">Super Admin</option>
              <option value="zone">Zone Incharge</option>
              <option value="student">Student</option>
              <option value="system">System</option>
            </select>

            {/* Zone Dropdown */}
            <select
              value={zoneFilter}
              onChange={(e) => {
                setZoneFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-800 outline-none"
            >
              <option value="All">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          {/* Secondary Row: Date Range & Clear */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                <Calendar size={14} /> Date Range:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-800 outline-none"
                  title="From Date"
                />
                <span className="text-xs text-gray-400">to</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-slate-800 outline-none"
                  title="To Date"
                />
              </div>
            </div>

            {isFiltering && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-xs font-semibold transition cursor-pointer"
              >
                <X size={14} /> Clear All Filters
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="grow">
          {isLoading ? (
            <TableLoader rows={8} columns={8} />
          ) : logs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
              <ShieldAlert size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 font-bold text-base">No Audit Records Found</p>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No system audit events match your current search, action, role, or date criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3.5 text-left font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Date & Time
                    </th>
                    <th className="px-4 py-3.5 text-left font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Actor
                    </th>
                    <th className="px-3 py-3.5 text-center font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Role
                    </th>
                    <th className="px-4 py-3.5 text-left font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Action Event
                    </th>
                    <th className="px-4 py-3.5 text-left font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Target Entity
                    </th>
                    <th className="px-4 py-3.5 text-left font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Zone
                    </th>
                    <th className="px-4 py-3.5 text-left font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      IP Address
                    </th>
                    <th className="px-3 py-3.5 text-center font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {logs.map((log) => {
                    const actorName = log.actor?.fullName || 'System'
                    const actorIdentifier =
                      log.actor?.email || log.actor?.registerNumber || log.actor?.employeeId || 'N/A'
                    const zoneName = log.actor?.zoneName || log.zone?.name || 'N/A'

                    return (
                      <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* Timestamp */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 font-mono">
                          {formatDateTime(log.createdAt)}
                        </td>

                        {/* Actor */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900">{actorName}</span>
                            <span className="text-[11px] text-gray-400">{actorIdentifier}</span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-3 py-3.5 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getRoleBadgeClass(
                              log.actorRole
                            )}`}
                          >
                            {log.actorRole?.toUpperCase()}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold border ${getActionBadgeClass(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Target Entity */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col max-w-xs truncate">
                            <span className="font-semibold text-gray-800 truncate">
                              {log.targetLabel || 'N/A'}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                              {log.targetEntityType}
                            </span>
                          </div>
                        </td>

                        {/* Zone */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-gray-600">
                          {zoneName}
                        </td>

                        {/* IP Address */}
                        <td className="px-4 py-3.5 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>

                        {/* View Button */}
                        <td className="px-3 py-3.5 whitespace-nowrap text-center">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-800 hover:text-white transition font-semibold text-xs cursor-pointer"
                            title="Inspect Audit Details"
                          >
                            <Eye size={12} /> View
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <p className="text-xs text-gray-500">
            Showing {(meta.page - 1) * 20 + 1} to{' '}
            {Math.min(meta.page * 20, meta.total)} of {meta.total} audit events
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={meta.page <= 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={meta.page <= 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-4 py-2 text-xs font-semibold text-gray-700">
              Page {meta.page} of {Math.max(meta.totalPages, 1)}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, meta.totalPages))}
              disabled={meta.page >= meta.totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(meta.totalPages)}
              disabled={meta.page >= meta.totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>

        {/* Audit Record Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-2xl w-full overflow-hidden">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <div>
                    <h3 className="font-bold text-sm">Audit Record Detail</h3>
                    <p className="text-[11px] text-gray-400 font-mono">{selectedLog.logCode}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock size={10} /> Timestamp
                    </span>
                    <p className="font-semibold text-gray-900 mt-0.5">
                      {formatDateTime(selectedLog.createdAt)}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <User size={10} /> Actor Role
                    </span>
                    <p className="mt-0.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getRoleBadgeClass(
                          selectedLog.actorRole
                        )}`}
                      >
                        {selectedLog.actorRole?.toUpperCase()}
                      </span>
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <MapPin size={10} /> Assigned Zone
                    </span>
                    <p className="font-semibold text-gray-900 mt-0.5">
                      {selectedLog.actor?.zoneName || selectedLog.zone?.name || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Globe size={10} /> IP Address
                    </span>
                    <p className="font-mono text-gray-900 mt-0.5">{selectedLog.ipAddress || '127.0.0.1'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <FileText size={10} /> Entity Type
                    </span>
                    <p className="font-semibold text-gray-900 mt-0.5 uppercase">
                      {selectedLog.targetEntityType}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Target ID
                    </span>
                    <p className="font-mono text-[10px] text-gray-600 truncate mt-0.5" title={selectedLog.targetEntityId || ''}>
                      {selectedLog.targetEntityId || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Actor Info Card */}
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-900 text-xs mb-2 flex items-center gap-1.5">
                    <User size={14} className="text-slate-600" /> Actor Identification
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 text-[10px]">Full Name:</span>
                      <p className="font-semibold text-gray-900">{selectedLog.actor?.fullName}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px]">Email / Identifier:</span>
                      <p className="font-semibold text-gray-900">{selectedLog.actor?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px]">Register / Employee ID:</span>
                      <p className="font-mono text-gray-900">
                        {selectedLog.actor?.registerNumber || selectedLog.actor?.employeeId || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px]">User ID (UUID):</span>
                      <p className="font-mono text-[10px] text-gray-500 truncate" title={selectedLog.actorId}>
                        {selectedLog.actorId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action & Description */}
                <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900 text-xs">Event Action & Details</h4>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeClass(
                        selectedLog.action
                      )}`}
                    >
                      {selectedLog.action}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px]">Target Label:</span>
                    <p className="font-semibold text-gray-900">{selectedLog.targetLabel}</p>
                  </div>
                  <div>
                    <span className="text-gray-400 text-[10px]">Full Description / Details:</span>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 font-mono text-[11px] text-gray-800 break-words whitespace-pre-wrap mt-1">
                      {selectedLog.details}
                    </div>
                  </div>
                  {selectedLog.userAgent && (
                    <div>
                      <span className="text-gray-400 text-[10px]">User Agent:</span>
                      <p className="text-[10px] text-gray-500 font-mono break-words">{selectedLog.userAgent}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLogsPage
