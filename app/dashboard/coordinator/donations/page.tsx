import { Suspense } from 'react'
import CoordinatorDashboardLayout from '@/components/dashboard/CoordinatorDashboardLayout'
import CoordinatorDonations from '@/components/dashboard/CoordinatorDonations'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function CoordinatorDonationsPage() {
  return (
    <CoordinatorDashboardLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <CoordinatorDonations />
      </Suspense>
    </CoordinatorDashboardLayout>
  )
}
