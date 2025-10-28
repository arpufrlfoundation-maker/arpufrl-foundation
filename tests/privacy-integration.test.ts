// Integration test for privacy controls and donor preferences
import { Donation, donationUtils, PrivacyPreferences } from '@/models/Donation'
import { PrivacyAuditor, privacyAuditUtils } from '@/lib/privacy-audit'

describe('Privacy Controls Integration', () => {
  describe('Donation Privacy Methods', () => {
    const mockDonation = {
      _id: 'test-id',
      donorName: 'John Doe',
      donorEmail: 'john@example.com',
      amount: 1000,
      paymentStatus: 'SUCCESS',
      privacyConsentGiven: true,
      dataProcessingConsent: true,
      isAnonymous: false,
      hideFromPublicDisplay: false,
      allowPublicRecognition: true,
      showAmountPublicly: true,
      showDatePublicly: false,
      preferredDisplayFormat: 'name_amount',
      createdAt: new Date(),

      // Mock methods
      isEligibleForPublicDisplay: function () {
        return this.paymentStatus === 'SUCCESS' &&
          !this.hideFromPublicDisplay &&
          this.allowPublicRecognition &&
          this.privacyConsentGiven
      },

      getPublicDisplayName: function () {
        if (this.isAnonymous || this.preferredDisplayFormat === 'anonymous') {
          return 'Anonymous Donor'
        }
        return this.displayName || this.donorName
      },

      getPublicDisplayData: function () {
        return {
          id: this._id,
          displayName: this.getPublicDisplayName(),
          amount: this.showAmountPublicly && !this.isAnonymous ? this.amount : undefined,
          donationDate: this.showDatePublicly ? this.createdAt : undefined,
          isAnonymous: this.isAnonymous || this.preferredDisplayFormat === 'anonymous',
          displayFormat: this.preferredDisplayFormat || 'name_amount'
        }
      }
    }

    it('should correctly identify eligible donations for public display', () => {
      expect(mockDonation.isEligibleForPublicDisplay()).toBe(true)

      // Test privacy consent withdrawal
      mockDonation.privacyConsentGiven = false
      expect(mockDonation.isEligibleForPublicDisplay()).toBe(false)

      // Reset and test hide from public display
      mockDonation.privacyConsentGiven = true
      mockDonation.hideFromPublicDisplay = true
      expect(mockDonation.isEligibleForPublicDisplay()).toBe(false)
    })

    it('should respect anonymity preferences in display name', () => {
      // Normal display
      expect(mockDonation.getPublicDisplayName()).toBe('John Doe')

      // Anonymous display
      mockDonation.isAnonymous = true
      expect(mockDonation.getPublicDisplayName()).toBe('Anonymous Donor')

      // Anonymous via display format
      mockDonation.isAnonymous = false
      mockDonation.preferredDisplayFormat = 'anonymous'
      expect(mockDonation.getPublicDisplayName()).toBe('Anonymous Donor')
    })

    it('should generate privacy-compliant display data', () => {
      // Reset to normal state
      mockDonation.isAnonymous = false
      mockDonation.preferredDisplayFormat = 'name_amount'
      mockDonation.showAmountPublicly = true
      mockDonation.showDatePublicly = false

      const displayData = mockDonation.getPublicDisplayData()

      expect(displayData.displayName).toBe('John Doe')
      expect(displayData.amount).toBe(1000)
      expect(displayData.donationDate).toBeUndefined()
      expect(displayData.isAnonymous).toBe(false)

      // Test anonymous display
      mockDonation.isAnonymous = true
      const anonymousData = mockDonation.getPublicDisplayData()

      expect(anonymousData.displayName).toBe('Anonymous Donor')
      expect(anonymousData.amount).toBeUndefined() // Amount hidden for anonymous
      expect(anonymousData.isAnonymous).toBe(true)
    })
  })

  describe('Privacy Validation Utilities', () => {
    it('should validate privacy preferences correctly', () => {
      const validPreferences: PrivacyPreferences = {
        isAnonymous: false,
        hideFromPublicDisplay: false,
        allowPublicRecognition: true,
        showAmountPublicly: true
      }

      expect(donationUtils.validatePrivacyPreferences(validPreferences)).toBe(true)

      // Test inconsistent preferences
      const inconsistentPreferences: PrivacyPreferences = {
        hideFromPublicDisplay: true,
        allowPublicRecognition: true // Inconsistent with hiding
      }

      expect(donationUtils.validatePrivacyPreferences(inconsistentPreferences)).toBe(false)
    })

    it('should generate privacy-safe donor identifiers', () => {
      const email = 'john.doe@example.com'
      const safeId = privacyAuditUtils.generateSafeDonorId(email)

      expect(safeId).toBe('joh***@exa***')
      expect(safeId).not.toContain('john.doe')
      expect(safeId).not.toContain('example.com')
    })

    it('should check public display eligibility', () => {
      const eligibleDonation = {
        paymentStatus: 'SUCCESS',
        hideFromPublicDisplay: false,
        allowPublicRecognition: true,
        privacyConsentGiven: true
      }

      expect(privacyAuditUtils.isPublicDisplayEligible(eligibleDonation)).toBe(true)

      // Test ineligible donation
      const ineligibleDonation = {
        ...eligibleDonation,
        privacyConsentGiven: false
      }

      expect(privacyAuditUtils.isPublicDisplayEligible(ineligibleDonation)).toBe(false)
    })
  })

  describe('Privacy Compliance Validation', () => {
    it('should validate donor privacy compliance', () => {
      const compliantDonation = {
        privacyConsentGiven: true,
        dataProcessingConsent: true,
        isAnonymous: false,
        hideFromPublicDisplay: false,
        allowPublicRecognition: true,
        preferredDisplayFormat: 'name_amount'
      }

      const validation = PrivacyAuditor.validateDonorPrivacyCompliance(compliantDonation)

      expect(validation.isCompliant).toBe(true)
      expect(validation.violations).toHaveLength(0)

      // Test non-compliant donation
      const nonCompliantDonation = {
        privacyConsentGiven: false,
        dataProcessingConsent: false,
        isAnonymous: true,
        preferredDisplayFormat: 'name_amount' // Inconsistent with anonymous
      }

      const nonCompliantValidation = PrivacyAuditor.validateDonorPrivacyCompliance(nonCompliantDonation)

      expect(nonCompliantValidation.isCompliant).toBe(false)
      expect(nonCompliantValidation.violations.length).toBeGreaterThan(0)
      expect(nonCompliantValidation.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('Request Data Sanitization', () => {
    it('should safely sanitize request data', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((header: string) => {
            if (header === 'x-forwarded-for') return '192.168.1.1'
            if (header === 'user-agent') return 'Mozilla/5.0 Test Browser'
            return null
          })
        }
      }

      const sanitized = privacyAuditUtils.sanitizeRequestData(mockRequest)

      expect(sanitized.ip).toBe('192.168.1.1')
      expect(sanitized.userAgent).toBe('Mozilla/5.0 Test Browser')
    })

    it('should handle missing request data gracefully', () => {
      const invalidRequest = null

      const sanitized = privacyAuditUtils.sanitizeRequestData(invalidRequest)

      expect(sanitized.ip).toBe('unknown')
      expect(sanitized.userAgent).toBe('unknown')
    })
  })
})