import { Suspense } from 'react'
import CoordinatorDashboardLayout from '@/components/dashboard/CoordinatorDashboardLayout'
import ReferralManagement from '@/components/dashboard/ReferralManagement'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function CoordinatorReferralsPage() {
  return (
    <CoordinatorDashboardLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <ReferralManagement />
      </Suspense>
    </CoordinatorDashboardLayout>
  )
}
