/**
 * Generate a referral code based on role
 * Format: ROLEPREFIX + 4 random digits
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
  return `${prefix}${random}`
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  return /^[A-Z]{2,3}\d{4}$/.test(code)
}
