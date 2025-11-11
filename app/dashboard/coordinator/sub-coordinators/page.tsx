import { Suspense } from 'react'
import CoordinatorDashboardLayout from '@/components/dashboard/CoordinatorDashboardLayout'
import SubCoordinatorManagement from '@/components/dashboard/SubCoordinatorManagement'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function SubCoordinatorsPage() {
  return (
    <CoordinatorDashboardLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <SubCoordinatorManagement />
      </Suspense>
    </CoordinatorDashboardLayout>
  )
}
