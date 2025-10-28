'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import LoadingSpinner from '@/components/common/LoadingSpinner'

interface CoordinatorNode {
  id: string
  name: string
  email: string
  region?: string
  role: 'COORDINATOR' | 'SUB_COORDINATOR'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  referralCode?: {
    code: string
    totalDonations: number
    totalAmount: number
  }
  children: CoordinatorNode[]
  performance?: {
    totalAmount: number
    totalDonations: number
    averageDonation: number
  }
}

interface TreeNodeProps {
  node: CoordinatorNode
  level: number
  isLast: boolean
  parentLines: boolean[]
}

function TreeNode({ node, level, isLast, parentLines }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const hasChildren = node.children && node.children.length > 0

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600'
      case 'INACTIVE':
        return 'text-red-600'
      case 'PENDING':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'COORDINATOR' ? '👑' : '👤'
  }

  return (
    <div className="relative">
      {/* Tree Lines */}
      <div className="flex items-center">
        {/* Vertical lines from parent levels */}
        {parentLines.map((showLine, index) => (
          <div key={index} className="w-6 flex justify-center">
            {showLine && <div className="w-px h-8 bg-gray-300" />}
          </div>
        ))}

        {/* Current level connector */}
        {level > 0 && (
          <div className="w-6 flex items-center justify-center relative">
            <div className={`w-px bg-gray-300 ${isLast ? 'h-4' : 'h-8'}`} />
            <div className="w-4 h-px bg-gray-300 absolute top-4" />
          </div>
        )}

        {/* Node Content */}
        <div className="flex-1 ml-2">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{getRoleIcon(node.role)}</span>
                  <h4 className="font-medium text-gray-900">{node.name}</h4>
                  <span className={`text-sm font-medium ${getStatusColor(node.status)}`}>
                    ({node.status})
                  </span>
                  {hasChildren && (
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                  )}
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Email:</strong> {node.email}</p>
                  {node.region && <p><strong>Region:</strong> {node.region}</p>}
                  {node.referralCode && (
                    <p><strong>Referral Code:</strong> {node.referralCode.code}</p>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="text-right text-sm">
                {node.referralCode && (
                  <div className="space-y-1">
                    <p className="font-medium text-gray-900">
                      ₹{node.referralCode.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      {node.referralCode.totalDonations} donations
                    </p>
                    {node.performance && node.performance.averageDonation > 0 && (
                      <p className="text-gray-500 text-xs">
                        Avg: ₹{Math.round(node.performance.averageDonation).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sub-coordinators count */}
            {hasChildren && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  {node.children.length} sub-coordinator{node.children.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-0">
          {node.children.map((child, index) => {
            const isLastChild = index === node.children.length - 1
            const newParentLines = [...parentLines, !isLast]

            return (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                isLast={isLastChild}
                parentLines={newParentLines}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function CoordinatorHierarchyTree() {
  const { data: session } = useSession()
  const [hierarchyData, setHierarchyData] = useState<CoordinatorNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchHierarchyData()
    }
  }, [session])

  const fetchHierarchyData = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      setError(null)

      // Fetch current coordinator details with sub-coordinators
      const response = await fetch(`/api/coordinators/${session.user.id}`)

      if (!response.ok) {
        throw new Error('Failed to fetch hierarchy data')
      }

      const data = await response.json()

      // Transform the data into tree structure
      const treeNode: CoordinatorNode = {
        id: data.id,
        name: data.name,
        email: data.email,
        region: data.region,
        role: data.role,
        status: data.status,
        referralCode: data.referralCodes?.[0] ? {
          code: data.referralCodes[0].code,
          totalDonations: data.referralCodes[0].totalDonations,
          totalAmount: data.referralCodes[0].totalAmount
        } : undefined,
        performance: data.performance,
        children: data.subCoordinators?.map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          email: sub.email,
          region: sub.region,
          role: sub.role,
          status: sub.status,
          referralCode: sub.referralCode,
          children: [] // Sub-coordinators don't have children in this implementation
        })) || []
      }

      setHierarchyData(treeNode)
    } catch (error) {
      console.error('Error fetching hierarchy data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load hierarchy data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 text-red-400">⚠️</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">Error Loading Hierarchy</h4>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchHierarchyData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!hierarchyData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">🌳</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Hierarchy Data</h4>
          <p className="text-gray-600">Unable to load coordinator hierarchy information.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Coordinator Hierarchy</h3>
            <p className="text-sm text-gray-600 mt-1">
              Visual representation of your coordination network and performance
            </p>
          </div>
          <button
            onClick={fetchHierarchyData}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tree Visualization */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <TreeNode
              node={hierarchyData}
              level={0}
              isLast={true}
              parentLines={[]}
            />
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Network Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">
                {hierarchyData.children.length}
              </div>
              <div className="text-sm text-blue-800">Sub-Coordinators</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                ₹{(hierarchyData.referralCode?.totalAmount || 0).toLocaleString()}
              </div>
              <div className="text-sm text-green-800">Total Raised</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">
                {hierarchyData.referralCode?.totalDonations || 0}
              </div>
              <div className="text-sm text-purple-800">Total Donations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}