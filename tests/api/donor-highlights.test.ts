import { NextRequest } from 'next/server'
import { GET } from '@/app/api/donors/highlights/route'
import { connectToDatabase } from '@/lib/db'
import { Donation } from '@/models/Donation'
import { PrivacyAuditor, privacyAuditUtils } from '@/lib/privacy-audit'

// Mock the database connection and privacy auditor
jest.mock('@/lib/db')
jest.mock('@/models/Donation')
jest.mock('@/lib/privacy-audit', () => ({
  PrivacyAuditor: {
    logDonorHighlightsAccess: jest.fn().mockResolvedValue(undefined),
    logPrivacyViolation: jest.fn().mockResolvedValue(undefined)
  },
  privacyAuditUtils: {
    sanitizeRequestData: jest.fn().mockReturnValue({
      ip: 'test-ip',
      userAgent: 'test-user-agent'
    })
  }
}))

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>
const mockDonation = Donation as jest.Mocked<typeof Donation>
const mockPrivacyAuditor = PrivacyAuditor as jest.Mocked<typeof PrivacyAuditor>
const mockPrivacyAuditUtils = privacyAuditUtils as jest.Mocked<typeof privacyAuditUtils>

describe('/api/donors/highlights', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('should return donor highlights successfully', async () => {
      // Mock database connection
      mockConnectToDatabase.mockResolvedValue(undefined)

      // Mock the new privacy-compliant methods
      const mockPublicDonations = [
        {
          id: 'donor1@example.com',
          displayName: 'John Doe',
          amount: 5000,
          isAnonymous: false,
          displayFormat: 'name_amount',
          donationDate: new Date('2024-01-15')
        },
        {
          id: 'donor2@example.com',
          displayName: 'Anonymous Donor',
          amount: 3000,
          isAnonymous: true,
          displayFormat: 'anonymous',
          donationDate: new Date('2024-01-10')
        }
      ]

      mockDonation.getPublicDonations = jest.fn().mockResolvedValue(mockPublicDonations)
      mockDonation.countDocuments = jest.fn().mockResolvedValue(10)

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/donors/highlights')

      // Call the API
      const response = await GET(request)
      const data = await response.json()

      // Assertions
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.privacyCompliant).toBe(true)
      expect(data.data.donors).toHaveLength(2)
      expect(data.data.donors[0].name).toBe('John Doe')
      expect(data.data.donors[1].name).toBe('Anonymous Donor')
      expect(data.data.donors[0].amount).toBe(5000)
      expect(data.data.donors[1].amount).toBe(3000)

      // Verify privacy audit was called
      expect(mockPrivacyAuditor.logDonorHighlightsAccess).toHaveBeenCalledWith(
        2, // donor count
        8, // filtered count (10 total - 2 public)
        expect.any(String), // IP
        expect.any(String)  // User agent
      )
    })

    it('should handle database errors gracefully', async () => {
      // Mock database connection failure
      mockConnectToDatabase.mockRejectedValue(new Error('Database connection failed'))

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/donors/highlights')

      // Call the API
      const response = await GET(request)
      const data = await response.json()

      // Assertions
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to fetch donor highlights')
      expect(data.privacyCompliant).toBe(false)

      // Verify privacy violation was logged
      expect(mockPrivacyAuditor.logPrivacyViolation).toHaveBeenCalledWith(
        'donor_highlights_error',
        { error: 'Database connection failed' },
        expect.any(String)
      )
    })

    it('should respect limit parameter', async () => {
      // Mock database connection
      mockConnectToDatabase.mockResolvedValue(undefined)

      // Mock the privacy-compliant method
      mockDonation.getPublicDonations = jest.fn().mockResolvedValue([])
      mockDonation.countDocuments = jest.fn().mockResolvedValue(0)

      // Create mock request with limit
      const request = new NextRequest('http://localhost:3000/api/donors/highlights?limit=10')

      // Call the API
      await GET(request)

      // Check that getPublicDonations was called with correct limit
      expect(mockDonation.getPublicDonations).toHaveBeenCalledWith(10)
    })

    it('should use privacy-compliant donation filtering', async () => {
      // Mock database connection
      mockConnectToDatabase.mockResolvedValue(undefined)

      // Mock privacy-compliant method that handles filtering internally
      mockDonation.getPublicDonations = jest.fn().mockResolvedValue([])
      mockDonation.countDocuments = jest.fn().mockResolvedValue(5)

      // Create mock request
      const request = new NextRequest('http://localhost:3000/api/donors/highlights')

      // Call the API
      await GET(request)

      // Verify that the privacy-compliant method was used
      expect(mockDonation.getPublicDonations).toHaveBeenCalledWith(50) // default limit

      // Verify privacy audit was called with filtered count
      expect(mockPrivacyAuditor.logDonorHighlightsAccess).toHaveBeenCalledWith(
        0, // no public donations returned
        5, // total donations filtered out
        expect.any(String),
        expect.any(String)
      )
    })
  })
})