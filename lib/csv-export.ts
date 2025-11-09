import { IDonation } from '@/models/Donation'
import { IUser } from '@/models/User'
import { ITarget } from '@/models/Target'

/**
 * Convert donations to CSV format
 */
export function donationsToCSV(donations: IDonation[]): string {
  const headers = [
    'Date',
    'Donor Name',
    'Email',
    'Phone',
    'Amount',
    'Currency',
    'Payment Status',
    'Payment ID',
    'Referral Code',
    'Program ID',
    'Is Anonymous'
  ]

  const rows = donations.map(donation => [
    new Date(donation.createdAt).toISOString(),
    donation.donorName,
    donation.donorEmail || '',
    donation.donorPhone || '',
    donation.amount.toString(),
    donation.currency,
    donation.paymentStatus,
    donation.razorpayPaymentId || '',
    donation.referralCodeId?.toString() || '',
    donation.programId?.toString() || '',
    donation.isAnonymous ? 'Yes' : 'No'
  ])

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}

/**
 * Convert users to CSV format
 */
export function usersToCSV(users: IUser[]): string {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Role',
    'Status',
    'Region',
    'State',
    'Referral Code',
    'Total Donations Referred',
    'Total Amount Referred',
    'Created At'
  ]

  const rows = users.map(user => [
    user.name,
    user.email,
    user.phone || '',
    user.role,
    user.status,
    user.region || '',
    user.state || '',
    user.referralCode || '',
    (user.totalDonationsReferred || 0).toString(),
    (user.totalAmountReferred || 0).toString(),
    new Date(user.createdAt).toISOString()
  ])

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}

/**
 * Convert targets to CSV format
 */
export function targetsToCSV(targets: ITarget[]): string {
  const headers = [
    'Assigned To',
    'Assigned By',
    'Type',
    'Target Value',
    'Current Value',
    'Progress %',
    'Status',
    'Start Date',
    'End Date',
    'Days Remaining',
    'Description'
  ]

  const rows = targets.map(target => [
    target.assignedTo?.toString() || '',
    target.assignedBy?.toString() || '',
    target.type,
    target.targetValue.toString(),
    target.currentValue.toString(),
    target.progressPercentage.toFixed(2),
    target.status,
    new Date(target.startDate).toISOString().split('T')[0],
    new Date(target.endDate).toISOString().split('T')[0],
    target.daysRemaining.toString(),
    target.description || ''
  ])

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}

/**
 * Convert hierarchy data to CSV format
 */
export function hierarchyToCSV(
  hierarchyData: Array<{
    name: string
    email: string
    role: string
    level: number
    referralCode?: string
    totalDonations: number
    totalAmount: number
    subordinates: number
  }>
): string {
  const headers = [
    'Name',
    'Email',
    'Role',
    'Hierarchy Level',
    'Referral Code',
    'Total Donations',
    'Total Amount',
    'Direct Subordinates'
  ]

  const rows = hierarchyData.map(item => [
    item.name,
    item.email,
    item.role,
    item.level.toString(),
    item.referralCode || '',
    item.totalDonations.toString(),
    item.totalAmount.toString(),
    item.subordinates.toString()
  ])

  return [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Generate CSV filename with timestamp
 */
export function generateCSVFilename(prefix: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  return `${prefix}_${timestamp}.csv`
}

/**
 * Convert performance report to CSV
 */
export function performanceReportToCSV(data: {
  userId: string
  userName: string
  role: string
  period: string
  targets: {
    total: number
    completed: number
    inProgress: number
    overdue: number
  }
  donations: {
    count: number
    amount: number
    averageAmount: number
  }
  referrals: {
    directReferrals: number
    totalInHierarchy: number
  }
}): string {
  const lines = [
    'Performance Report',
    '',
    'User Information',
    `Name,${data.userName}`,
    `Role,${data.role}`,
    `Period,${data.period}`,
    '',
    'Target Performance',
    `Total Targets,${data.targets.total}`,
    `Completed,${data.targets.completed}`,
    `In Progress,${data.targets.inProgress}`,
    `Overdue,${data.targets.overdue}`,
    '',
    'Donation Performance',
    `Total Donations,${data.donations.count}`,
    `Total Amount,${data.donations.amount}`,
    `Average Donation,${data.donations.averageAmount.toFixed(2)}`,
    '',
    'Referral Performance',
    `Direct Referrals,${data.referrals.directReferrals}`,
    `Total in Hierarchy,${data.referrals.totalInHierarchy}`
  ]

  return lines.join('\n')
}
