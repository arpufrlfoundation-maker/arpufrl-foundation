/**
 * Unified Dashboard Route
 * Auto-redirects based on user role or displays universal dashboard
 */

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { UniversalDashboard } from '@/components/dashboard/UniversalDashboard'
import { UserRole } from '@/models/User'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  // All roles now use the universal dashboard
  // The dashboard adapts based on role automatically
  return (
    <div className="min-h-screen bg-gray-50">
      <UniversalDashboard />
    </div>
  )
}
