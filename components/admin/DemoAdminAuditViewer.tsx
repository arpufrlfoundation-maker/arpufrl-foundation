'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import {
  Clock,
  User,
  Activity,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Search,
  Calendar,
  BarChart3
} from 'lucide-react'
import {
  DemoAdminAuditLog,
  DemoAdminAuditActionType,
  getDemoAdminAuditLogs,
  getDemoAdminAuditStats,
  exportDemoAdminAuditLogs,
  DemoAdminAuditActions
} from '../../lib/demo-admin-audit'

interface DemoAdminAuditViewerProps {
  className?: string
}

/**
 * Component to view and manage demo admin audit logs
 */
export const DemoAdminAuditViewer: React.FC<DemoAdminAuditViewerProps> = ({
  className = ''
}) => {
  const { data: session } = useSession()
  const [logs, setLogs] = useState<DemoAdminAuditLog[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    startDate: '',
    endDate: '',
    limit: 50
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLog, setSelectedLog] = useState<DemoAdminAuditLog | null>(null)

  // Only show for demo admin accounts
  if (!session?.user?.isDemoAccount) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">Audit logs are only available for demo admin accounts.</p>
      </div>
    )
  }

  const loadAuditData = () => {
    setLoading(true)
    try {
      // Get filtered logs
      const filterOptions: any = {
        limit: filters.limit
      }

      if (filters.action) filterOptions.action = filters.action as DemoAdminAuditActionType
      if (filters.resource) filterOptions.resource = filters.resource
      if (filters.startDate) filterOptions.startDate = new Date(filters.startDate)
      if (filters.endDate) filterOptions.endDate = new Date(filters.endDate)

      const auditLogs = getDemoAdminAuditLogs(filterOptions)
      const auditStats = getDemoAdminAuditStats()

      // Apply search filter
      let filteredLogs = auditLogs
      if (searchTerm) {
        filteredLogs = auditLogs.filter(log =>
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (log.resource && log.resource.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (log.resourceId && log.resourceId.toLowerCase().includes(searchTerm.toLowerCase()))
        )
      }

      setLogs(filteredLogs)
      setStats(auditStats)
    } catch (error) {
      console.error('Failed to load audit data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuditData()
  }, [filters, searchTerm])

  const handleExport = () => {
    const exportData = exportDemoAdminAuditLogs()
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `demo-admin-audit-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString()
  }

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'text-red-600 bg-red-50'
    if (action.includes('CREATE')) return 'text-green-600 bg-green-50'
    if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50'
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'text-purple-600 bg-purple-50'
    return 'text-gray-600 bg-gray-50'
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Demo Admin Audit Logs
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Track and monitor all demo administrator actions
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadAuditData}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={handleExport}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-blue-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Total Logs</p>
                  <p className="text-lg font-semibold">{stats.totalLogs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <Activity className="w-5 h-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Unique Actions</p>
                  <p className="text-lg font-semibold">{Object.keys(stats.actionCounts).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-purple-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Recent Activity</p>
                  <p className="text-lg font-semibold">{stats.recentActivity.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center">
                <User className="w-5 h-5 text-orange-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600">Top Action</p>
                  <p className="text-sm font-semibold">
                    {stats.topActions[0]?.action || 'None'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Actions</option>
              {Object.values(DemoAdminAuditActions).map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Resource
            </label>
            <input
              type="text"
              value={filters.resource}
              onChange={(e) => setFilters(prev => ({ ...prev, resource: e.target.value }))}
              placeholder="Resource type"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limit
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={25}>25 entries</option>
              <option value={50}>50 entries</option>
              <option value={100}>100 entries</option>
              <option value={200}>200 entries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">No audit logs found matching your criteria.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 text-gray-400 mr-2" />
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {log.resource && (
                      <div>
                        <div className="font-medium">{log.resource}</div>
                        {log.resourceId && (
                          <div className="text-xs text-gray-500">{log.resourceId}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="font-medium">{log.userEmail}</div>
                        <div className="text-xs text-gray-500">{log.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.details && (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="flex items-center text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">Audit Log Details</h3>
            </div>
            <div className="p-6">
              <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                {JSON.stringify(selectedLog, null, 2)}
              </pre>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
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

export default DemoAdminAuditViewer