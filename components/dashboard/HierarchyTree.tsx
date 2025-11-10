/**
 * Hierarchy Tree Visualizer Component
 * Interactive organizational chart view
 */

'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Users, MapPin, DollarSign } from 'lucide-react'

interface TreeNode {
  _id: string
  name: string
  email: string
  role: string
  region?: string
  state?: string
  zone?: string
  district?: string
  totalDonationsReferred?: number
  totalAmountReferred?: number
  children?: TreeNode[]
}

interface HierarchyTreeProps {
  userId: string
  className?: string
}

function TreeNodeComponent({ node, level = 0 }: { node: TreeNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2) // Expand first 2 levels by default
  const hasChildren = node.children && node.children.length > 0

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      CENTRAL_PRESIDENT: 'bg-purple-100 border-purple-300 text-purple-800',
      STATE_PRESIDENT: 'bg-blue-100 border-blue-300 text-blue-800',
      STATE_COORDINATOR: 'bg-indigo-100 border-indigo-300 text-indigo-800',
      ZONE_COORDINATOR: 'bg-cyan-100 border-cyan-300 text-cyan-800',
      DISTRICT_PRESIDENT: 'bg-green-100 border-green-300 text-green-800',
      DISTRICT_COORDINATOR: 'bg-emerald-100 border-emerald-300 text-emerald-800',
      BLOCK_COORDINATOR: 'bg-teal-100 border-teal-300 text-teal-800',
      NODAL_OFFICER: 'bg-lime-100 border-lime-300 text-lime-800',
      PRERAK: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      PRERNA_SAKHI: 'bg-orange-100 border-orange-300 text-orange-800',
      VOLUNTEER: 'bg-gray-100 border-gray-300 text-gray-800'
    }
    return colors[node.role] || 'bg-gray-100 border-gray-300 text-gray-800'
  }

  return (
    <div className="relative">
      {/* Node Card */}
      <div
        className={`relative ${level > 0 ? 'ml-8' : ''}`}
        style={{ marginLeft: level > 0 ? `${level * 2}rem` : 0 }}
      >
        {/* Connection Line */}
        {level > 0 && (
          <div className="absolute left-0 top-1/2 w-8 h-px bg-gray-300 -ml-8" />
        )}

        <div
          className={`inline-block min-w-[300px] max-w-[400px] border-2 rounded-lg p-4 mb-4 transition-all hover:shadow-md ${getRoleColor(node.role)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {hasChildren && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-1 hover:bg-white/50 rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                <h4 className="font-semibold text-sm">{node.name}</h4>
              </div>

              <p className="text-xs mt-1 opacity-75">
                {node.role.replace(/_/g, ' ')}
              </p>

              {node.region && (
                <div className="flex items-center mt-2 text-xs opacity-75">
                  <MapPin className="h-3 w-3 mr-1" />
                  {node.region}
                </div>
              )}

              {(node.totalDonationsReferred || node.totalAmountReferred) && (
                <div className="flex items-center mt-2 text-xs font-medium">
                  <DollarSign className="h-3 w-3 mr-1" />
                  ₹{(node.totalAmountReferred || 0).toLocaleString()}
                  <span className="ml-2 opacity-75">
                    ({node.totalDonationsReferred || 0})
                  </span>
                </div>
              )}
            </div>

            {hasChildren && (
              <div className="ml-2 bg-white/50 rounded-full px-2 py-1 text-xs font-medium">
                <Users className="h-3 w-3 inline mr-1" />
                {node.children?.length || 0}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Children Nodes */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Vertical Line */}
          {level >= 0 && (
            <div
              className="absolute left-4 top-0 bottom-0 w-px bg-gray-300"
              style={{ left: `${level * 2 + 0.5}rem` }}
            />
          )}

          <div>
            {node.children?.map((child, index) => (
              <TreeNodeComponent
                key={child._id}
                node={child}
                level={level + 1}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function HierarchyTree({ userId, className = '' }: HierarchyTreeProps) {
  const [treeData, setTreeData] = useState<TreeNode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHierarchyTree()
  }, [userId])

  const fetchHierarchyTree = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/dashboard/team?view=tree`)
      const data = await response.json()

      if (data.success) {
        setTreeData(data.data.tree)
      } else {
        throw new Error(data.error || 'Failed to load hierarchy tree')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p className="ml-3 text-gray-600">Loading hierarchy tree...</p>
        </div>
      </div>
    )
  }

  if (error || !treeData) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error || 'Failed to load tree'}</p>
          <button
            onClick={fetchHierarchyTree}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Users className="h-6 w-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Organization Hierarchy</h3>
        </div>
        <button
          onClick={fetchHierarchyTree}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <TreeNodeComponent node={treeData} level={0} />
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Tip:</strong> Click on nodes with children to expand/collapse branches.
          The number badge shows direct subordinates.
        </p>
      </div>
    </div>
  )
}
