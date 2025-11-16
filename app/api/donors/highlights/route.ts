import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/db'
import { Donation, PaymentStatus, PublicDonationDisplay } from '@/models/Donation'
import { PrivacyAuditor, privacyAuditUtils } from '@/lib/privacy-audit'

// Make this route publicly accessible
export const dynamic = 'force-dynamic'

// Interface for donor highlight data (extended with privacy controls)
interface DonorHighlight {
  id: string
  name: string
  amount?: number
  isAnonymous: boolean
  createdAt?: Date
  displayFormat: string
  donationCount?: number
}

// GET /api/donors/highlights - Fetch donor highlights for public display with privacy enforcement and performance optimization
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100) // Cap at 100 for performance
    const page = Math.max(parseInt(searchParams.get('page') || '0'), 0)
    const mobile = searchParams.get('mobile') === 'true'

    // Get request metadata for audit logging
    const requestData = privacyAuditUtils.sanitizeRequestData(request)

    // Performance optimization: Use pagination with the privacy-aware method
    const skip = page * limit
    const publicDonations = await Donation.getPublicDonations(limit + skip)

    // Apply pagination after privacy filtering (more accurate than database skip)
    const paginatedDonations = publicDonations.slice(skip, skip + limit)

    // Get total count for audit purposes (cached for performance)
    const totalDonationsCount = await Donation.countDocuments({
      paymentStatus: PaymentStatus.SUCCESS
    })

    // Log privacy audit entry (throttled for performance)
    if (page === 0) { // Only log for first page to reduce audit overhead
      await PrivacyAuditor.logDonorHighlightsAccess(
        publicDonations.length,
        totalDonationsCount - publicDonations.length,
        requestData.ip,
        requestData.userAgent
      )
    }

    // Performance-optimized aggregation using Map for O(1) lookups
    const donorMap = new Map<string, DonorHighlight>()

    paginatedDonations.forEach((donation, index) => {
      const donorKey = donation.isAnonymous ? `anonymous-${page}-${index}` : donation.id

      if (donorMap.has(donorKey)) {
        const existing = donorMap.get(donorKey)!
        // Combine amounts if both donations show amounts publicly
        if (existing.amount && donation.amount) {
          existing.amount += donation.amount
        }
        existing.donationCount = (existing.donationCount || 1) + 1
        // Update to latest donation date
        if (donation.donationDate && (!existing.createdAt || donation.donationDate > existing.createdAt)) {
          existing.createdAt = donation.donationDate
        }
      } else {
        donorMap.set(donorKey, {
          id: donorKey,
          name: donation.displayName,
          amount: mobile && donation.displayFormat === 'anonymous' ? undefined : donation.amount,
          isAnonymous: donation.isAnonymous,
          createdAt: donation.donationDate,
          displayFormat: donation.displayFormat,
          donationCount: 1
        })
      }
    })

    // Convert map to array and sort by amount (performance optimized)
    const formattedDonors = Array.from(donorMap.values()).sort((a, b) => {
      // Primary sort: by amount (descending)
      if (a.amount && b.amount) {
        return b.amount - a.amount
      }
      if (a.amount && !b.amount) return -1
      if (!a.amount && b.amount) return 1

      // Secondary sort: by donation date (most recent first)
      if (a.createdAt && b.createdAt) {
        return b.createdAt.getTime() - a.createdAt.getTime()
      }

      // Tertiary sort: by name
      return a.name.localeCompare(b.name)
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(publicDonations.length / limit)
    const hasMore = (page + 1) * limit < publicDonations.length

    return NextResponse.json({
      success: true,
      data: {
        donors: formattedDonors,
        totalCount: publicDonations.length,
        currentPage: page,
        totalPages,
        hasMore,
        lastUpdated: new Date().toISOString(),
        privacyCompliant: true
      }
    }, {
      headers: {
        // Optimized caching for performance
        'Cache-Control': mobile
          ? 'public, s-maxage=60, stale-while-revalidate=120' // Longer cache for mobile
          : 'public, s-maxage=30, stale-while-revalidate=60',
        'Content-Type': 'application/json',
        // Add performance and pagination headers
        'X-Privacy-Compliant': 'true',
        'X-Donors-Filtered': (totalDonationsCount - publicDonations.length).toString(),
        'X-Total-Count': publicDonations.length.toString(),
        'X-Page': page.toString(),
        'X-Limit': limit.toString(),
        'X-Has-More': hasMore.toString(),
        'X-Mobile-Optimized': mobile.toString(),
        // Performance optimization headers
        'Vary': 'Accept-Encoding',
        'ETag': `"${page}-${limit}-${publicDonations.length}"`
      }
    })

  } catch (error) {
    console.error('Error fetching donor highlights:', error)

    // Log privacy error for audit (throttled)
    const requestData = privacyAuditUtils.sanitizeRequestData(request)
    await PrivacyAuditor.logPrivacyViolation(
      'donor_highlights_error',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      requestData.ip
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch donor highlights',
        message: error instanceof Error ? error.message : 'Unknown error',
        privacyCompliant: false,
        data: {
          donors: [],
          totalCount: 0,
          currentPage: 0,
          totalPages: 0,
          hasMore: false
        }
      },
      { status: 500 }
    )
  }
}

// POST /api/donors/highlights - Update privacy preferences for a donor
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase()

    const body = await request.json()
    const { donorEmail, privacyPreferences } = body

    if (!donorEmail || !privacyPreferences) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Update privacy consent for all donations from this donor
    const updatedCount = await Donation.updatePrivacyConsent(
      donorEmail,
      privacyPreferences.privacyConsentGiven || false
    )

    // If specific preferences provided, update individual donations
    if (privacyPreferences && updatedCount > 0) {
      await Donation.updateMany(
        { donorEmail: donorEmail.toLowerCase() },
        {
          $set: {
            isAnonymous: privacyPreferences.isAnonymous || false,
            hideFromPublicDisplay: privacyPreferences.hideFromPublicDisplay || false,
            displayName: privacyPreferences.displayName || undefined,
            allowPublicRecognition: privacyPreferences.allowPublicRecognition !== false,
            showAmountPublicly: privacyPreferences.showAmountPublicly !== false,
            showDatePublicly: privacyPreferences.showDatePublicly || false,
            preferredDisplayFormat: privacyPreferences.preferredDisplayFormat || 'name_amount',
            marketingConsent: privacyPreferences.marketingConsent || false
          }
        }
      )
    }

    // Audit log for privacy preference update
    const requestData = privacyAuditUtils.sanitizeRequestData(request)
    await PrivacyAuditor.logPrivacyPreferencesUpdate(
      donorEmail,
      updatedCount,
      privacyPreferences,
      requestData.ip
    )

    return NextResponse.json({
      success: true,
      data: {
        updatedDonations: updatedCount,
        message: 'Privacy preferences updated successfully'
      }
    })

  } catch (error) {
    console.error('Error updating privacy preferences:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update privacy preferences',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}