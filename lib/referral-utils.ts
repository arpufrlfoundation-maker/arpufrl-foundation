import { User, UserRoleType, RoleHierarchy } from '@/models/User'
import mongoose from 'mongoose'
import QRCode from 'qrcode'

/**
 * Generate a unique referral code based on user details
 */
export async function generateReferralCode(
  name: string,
  role: UserRoleType,
  region?: string
): Promise<string> {
  // Create base code from name and role
  const namePrefix = name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 3)

  const rolePrefix = getRolePrefix(role)
  const regionCode = region ? region.substring(0, 3).toUpperCase() : 'GEN'

  // Generate random suffix
  const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0')

  let referralCode = `${namePrefix}${rolePrefix}${regionCode}${randomSuffix}`

  // Ensure uniqueness
  let attempts = 0
  while (await User.findOne({ referralCode })) {
    if (attempts > 10) {
      // Fallback to fully random code
      referralCode = generateRandomCode()
    } else {
      const newSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
      referralCode = `${namePrefix}${rolePrefix}${regionCode}${newSuffix}`
    }
    attempts++
  }

  return referralCode
}

/**
 * Get role prefix for referral code
 */
function getRolePrefix(role: UserRoleType): string {
  const prefixes: Record<UserRoleType, string> = {
    ADMIN: 'AD',
    CENTRAL_PRESIDENT: 'CP',
    STATE_PRESIDENT: 'SP',
    STATE_COORDINATOR: 'SC',
    ZONE_COORDINATOR: 'ZC',
    DISTRICT_PRESIDENT: 'DP',
    DISTRICT_COORDINATOR: 'DC',
    BLOCK_COORDINATOR: 'BC',
    NODAL_OFFICER: 'NO',
    PRERAK: 'PR',
    PRERNA_SAKHI: 'PS',
    VOLUNTEER: 'VL'
  }
  return prefixes[role] || 'GN'
}

/**
 * Generate a random referral code
 */
function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Generate QR code data URL for referral code
 */
export async function generateQRCodeDataURL(
  referralCode: string,
  baseUrl: string = ''
): Promise<string> {
  try {
    const donationUrl = `${baseUrl}/donate?ref=${encodeURIComponent(referralCode)}`

    // Generate QR code as data URL
    const qrCodeDataURL = await QRCode.toDataURL(donationUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    // Fallback to API-based QR code
    const donationUrl = `${baseUrl}/donate?ref=${encodeURIComponent(referralCode)}`
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(donationUrl)}`
  }
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  // Basic validation: 8-20 alphanumeric characters
  return /^[A-Z0-9]{8,20}$/.test(code)
}

/**
 * Get hierarchy level from referral code
 */
export function getHierarchyLevelFromCode(code: string): number | null {
  const rolePrefix = code.substring(3, 5)

  const prefixToRole: Record<string, UserRoleType> = {
    AD: 'ADMIN',
    CP: 'CENTRAL_PRESIDENT',
    SP: 'STATE_PRESIDENT',
    SC: 'STATE_COORDINATOR',
    ZC: 'ZONE_COORDINATOR',
    DP: 'DISTRICT_PRESIDENT',
    DC: 'DISTRICT_COORDINATOR',
    BC: 'BLOCK_COORDINATOR',
    NO: 'NODAL_OFFICER',
    PR: 'PRERAK',
    PS: 'PRERNA_SAKHI',
    VL: 'VOLUNTEER'
  }

  const role = prefixToRole[rolePrefix]
  return role ? RoleHierarchy[role] : null
}

/**
 * Find user by referral code
 */
export async function findUserByReferralCode(referralCode: string): Promise<any | null> {
  try {
    const user = await User.findOne({
      referralCode,
      status: 'ACTIVE'
    }).select('-hashedPassword')

    return user
  } catch (error) {
    console.error('Error finding user by referral code:', error)
    return null
  }
}

/**
 * Get referral code usage statistics
 */
export async function getReferralCodeStats(referralCode: string) {
  try {
    const { Donation } = await import('@/models/Donation')
    const user = await User.findOne({ referralCode })

    if (!user) {
      return null
    }

    const donations = await Donation.find({
      attributedToUserId: user._id,
      paymentStatus: 'SUCCESS'
    })

    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)
    const totalCount = donations.length

    return {
      referralCode,
      userId: user._id,
      userName: user.name,
      userRole: user.role,
      totalDonations: totalCount,
      totalAmount,
      averageDonation: totalCount > 0 ? totalAmount / totalCount : 0,
      lastDonationDate: donations.length > 0
        ? donations[donations.length - 1].createdAt
        : null
    }
  } catch (error) {
    console.error('Error getting referral code stats:', error)
    return null
  }
}

/**
 * Get all referral codes in a hierarchy
 */
export async function getHierarchyReferralCodes(userId: mongoose.Types.ObjectId) {
  try {
    const user = await User.findById(userId)
    if (!user) return []

    // Get all subordinates recursively
    const subordinates: any[] = []
    const queue = [userId]

    while (queue.length > 0) {
      const currentId = queue.shift()!
      const children = await User.find({
        parentCoordinatorId: currentId,
        status: 'ACTIVE'
      }).select('name email role referralCode totalDonationsReferred totalAmountReferred')

      for (const child of children) {
        subordinates.push(child)
        queue.push(child._id)
      }
    }

    return subordinates
  } catch (error) {
    console.error('Error getting hierarchy referral codes:', error)
    return []
  }
}

/**
 * Bulk generate referral codes for users
 */
export async function bulkGenerateReferralCodes(
  userIds: mongoose.Types.ObjectId[]
): Promise<{ userId: mongoose.Types.ObjectId; referralCode: string }[]> {
  const results: { userId: mongoose.Types.ObjectId; referralCode: string }[] = []

  for (const userId of userIds) {
    try {
      const user = await User.findById(userId)
      if (!user || user.referralCode) continue

      const referralCode = await generateReferralCode(
        user.name,
        user.role,
        user.region
      )

      user.referralCode = referralCode
      await user.save()

      results.push({ userId: user._id, referralCode })
    } catch (error) {
      console.error(`Error generating referral code for user ${userId}:`, error)
    }
  }

  return results
}

/**
 * Generate referral link with tracking parameters
 */
export function generateReferralLink(
  referralCode: string,
  baseUrl: string = '',
  programId?: string
): string {
  const url = new URL('/donate', baseUrl || 'http://localhost:3000')
  url.searchParams.append('ref', referralCode)

  if (programId) {
    url.searchParams.append('program', programId)
  }

  // Add tracking parameters
  url.searchParams.append('utm_source', 'referral')
  url.searchParams.append('utm_medium', 'code')
  url.searchParams.append('utm_campaign', referralCode)

  return url.toString()
}

/**
 * Shorten referral URL (placeholder for URL shortening service)
 */
export async function shortenReferralUrl(longUrl: string): Promise<string> {
  // In production, integrate with a URL shortening service like bit.ly or TinyURL
  // For now, return the original URL
  return longUrl
}
