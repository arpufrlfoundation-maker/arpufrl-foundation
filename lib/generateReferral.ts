/**
 * Generate a unique referral code based on role
 * Format: ROLEPREFIX + 4 random digits + timestamp suffix for uniqueness
 */
export function generateReferralCode(role: string): string {
  // Map roles to prefixes
  const rolePrefix: Record<string, string> = {
    'CENTRAL_PRESIDENT': 'CP',
    'STATE_PRESIDENT': 'SP',
    'STATE_COORDINATOR': 'SC',
    'ZONE_COORDINATOR': 'ZC',
    'DISTRICT_PRESIDENT': 'DP',
    'DISTRICT_COORDINATOR': 'DC',
    'BLOCK_COORDINATOR': 'BC',
    'NODAL_OFFICER': 'NO',
    'PRERAK': 'PR',
    'PRERNA_SAKHI': 'PS',
    'VOLUNTEER': 'VL'
  }

  const prefix = rolePrefix[role] || role.slice(0, 3).toUpperCase()
  const random = Math.floor(1000 + Math.random() * 9000)
  // Add timestamp-based suffix for additional uniqueness
  const timestamp = Date.now().toString().slice(-3)
  return `${prefix}${random}${timestamp}`
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  return /^[A-Z]{2,3}\d{7}$/.test(code)
}
