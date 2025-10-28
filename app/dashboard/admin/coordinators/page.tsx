import { Suspense } from 'react'
import { AdminOnly } from '../../../../components/auth/RoleGuard'
import AdminDashboardLayout from '../../../../components/dashboard/AdminDashboardLayout'
import CoordinatorManagement from '../../../../components/dashboard/CoordinatorManagement'
import LoadingSpinner from '../../../../components/common/LoadingSpinner'

export default function AdminCoordinatorsPage() {
  return (
    <AdminOnly fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    }>
      <AdminDashboardLayout>
        <Suspense fallback={<LoadingSpinner />}>
          <CoordinatorManagement />
        </Suspense>
      </AdminDashboardLayout>
    </AdminOnly>
  )
}