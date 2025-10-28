'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { AlertTriangle, Shield, Info } from 'lucide-react'

interface DemoAdminIndicatorProps {
  variant?: 'badge' | 'banner' | 'tooltip' | 'card'
  showDetails?: boolean
  className?: string
}

/**
 * Visual indicator component for demo admin accounts
 * Shows different visual cues to identify demo admin sessions
 */
export const DemoAdminIndicator: React.FC<DemoAdminIndicatorProps> = ({
  variant = 'badge',
  showDetails = false,
  className = ''
}) => {
  const { data: session } = useSession()

  // Only show for demo admin accounts
  if (!session?.user?.isDemoAccount) {
    return null
  }

  const baseClasses = 'flex items-center space-x-2'

  switch (variant) {
    case 'badge':
      return (
        <div className={`${baseClasses} bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium border border-amber-200 ${className}`}>
          <Shield className="w-3 h-3" />
          <span>Demo Admin</span>
        </div>
      )

    case 'banner':
      return (
        <div className={`${baseClasses} bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 p-4 mb-4 ${className}`}>
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-amber-800">Demo Administrator Account</h3>
            {showDetails && (
              <div className="mt-1 text-sm text-amber-700">
                <p>You are logged in as a demo administrator. All actions are logged for audit purposes.</p>
                <p className="mt-1 text-xs">
                  Demo accounts have full administrative privileges but are clearly identified for security.
                </p>
              </div>
            )}
          </div>
        </div>
      )

    case 'tooltip':
      return (
        <div className={`${baseClasses} relative group ${className}`}>
          <div className="bg-amber-500 text-white p-1 rounded-full">
            <Shield className="w-4 h-4" />
          </div>
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
            Demo Admin Account
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )

    case 'card':
      return (
        <div className={`bg-white border border-amber-200 rounded-lg shadow-sm p-4 ${className}`}>
          <div className={`${baseClasses} mb-3`}>
            <div className="bg-amber-100 p-2 rounded-full">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Demo Administrator</h3>
              <p className="text-sm text-gray-600">{session.user.email}</p>
            </div>
          </div>

          {showDetails && (
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">Demo Account Features:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    <li>• Full administrative access</li>
                    <li>• All actions are logged and audited</li>
                    <li>• Clearly identified in the interface</li>
                    <li>• Separate from production admin accounts</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">Security Notice:</p>
                  <p className="text-xs">
                    This is a demonstration account. Do not use for production data management.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )

    default:
      return null
  }
}

/**
 * Header component that shows demo admin status in navigation
 */
export const DemoAdminHeaderIndicator: React.FC = () => {
  const { data: session } = useSession()

  if (!session?.user?.isDemoAccount) {
    return null
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-500 text-white p-1 rounded-full">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-medium text-amber-800">Demo Administrator Mode</span>
            <span className="ml-2 text-xs text-amber-600">
              Logged in as: {session.user.email}
            </span>
          </div>
        </div>

        <div className="text-xs text-amber-600">
          All actions are logged for audit purposes
        </div>
      </div>
    </div>
  )
}

/**
 * Sidebar component that shows demo admin info
 */
export const DemoAdminSidebarIndicator: React.FC = () => {
  const { data: session } = useSession()

  if (!session?.user?.isDemoAccount) {
    return null
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-2 mb-2">
        <Shield className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-medium text-amber-800">Demo Admin</span>
      </div>
      <p className="text-xs text-amber-700">
        You have full administrative access. All actions are logged.
      </p>
    </div>
  )
}

/**
 * Hook to check if current user is demo admin
 */
export const useDemoAdmin = () => {
  const { data: session } = useSession()

  return {
    isDemoAdmin: session?.user?.isDemoAccount === true,
    demoAdminEmail: session?.user?.isDemoAccount ? session.user.email : null,
    demoAdminName: session?.user?.isDemoAccount ? session.user.name : null
  }
}

export default DemoAdminIndicator