import { Suspense } from 'react'
import { AdminOnly } from '../../../../components/auth/RoleGuard'
import AdminDashboardLayout from '../../../../components/dashboard/AdminDashboardLayout'
import ContactMessagesManagement from '../../../../components/admin/ContactMessagesManagement'
import LoadingSpinner from '../../../../components/common/LoadingSpinner'

export default function AdminContactMessagesPage() {
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
          <ContactMessagesManagement />
        </Suspense>
      </AdminDashboardLayout>
    </AdminOnly>
  )
}
