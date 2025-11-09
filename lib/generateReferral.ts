/**
 * Generate a referral code based on role
 * Format: ROLEPREFIX + 4 random digits
 */
export function generateReferralCode(role: string): string {
  // Map roles to prefixes
  const rolePrefix: Record<string, string> = {
    'NATIONAL_LEVEL': 'NL',
    'STATE_ADHYAKSH': 'SA',
    'STATE_COORDINATOR': 'SC',
    'MANDAL_COORDINATOR': 'MC',
    'JILA_ADHYAKSH': 'JA',
    'JILA_COORDINATOR': 'JC',
    'BLOCK_COORDINATOR': 'BC',
    'NODEL': 'ND',
    'PRERAK': 'PR',
    'PRERNA_SAKHI': 'PS'
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
