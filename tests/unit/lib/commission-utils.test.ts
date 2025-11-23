/**
 * Unit Tests: Commission Calculation
 * Tests the core commission distribution logic
 */

import { calculateHierarchyCommissions } from '@/lib/commission-utils'
import { User } from '@/models/User'

// Mock User model
jest.mock('@/models/User')

describe('Commission Utilities', () => {
  describe('calculateHierarchyCommissions', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should calculate 0% for volunteer, 5% for parent, 2% for upper levels, 15% for coordinator', async () => {
      // Setup 5-level hierarchy
      const mockUsers = [
        { _id: 'user1', role: 'VOLUNTEER', parentCoordinatorId: 'user2' },
        { _id: 'user2', role: 'DISTRICT_COORDINATOR', parentCoordinatorId: 'user3' },
        { _id: 'user3', role: 'ZONE_COORDINATOR', parentCoordinatorId: 'user4' },
        { _id: 'user4', role: 'STATE_COORDINATOR', parentCoordinatorId: 'user5' },
        { _id: 'user5', role: 'NATIONAL_PRESIDENT', parentCoordinatorId: null }
      ]

      // Mock User.findById to return hierarchy
      ;(User.findById as jest.Mock).mockImplementation((id) => {
        return Promise.resolve(mockUsers.find(u => u._id === id))
      })

      const donationAmount = 10000
      const attributedUserId = 'user1'

      const commissions = await calculateHierarchyCommissions(donationAmount, attributedUserId)

      expect(commissions).toHaveLength(5)

      // Volunteer gets 0%
      expect(commissions[0]).toMatchObject({
        userId: 'user1',
        amount: 0,
        percentage: 0
      })

      // Volunteer's parent gets 5%
      expect(commissions[1]).toMatchObject({
        userId: 'user2',
        amount: 500,
        percentage: 5
      })

      // Upper level gets 2%
      expect(commissions[2]).toMatchObject({
        userId: 'user3',
        amount: 200,
        percentage: 2
      })

      // Upper level gets 2%
      expect(commissions[3]).toMatchObject({
        userId: 'user4',
        amount: 200,
        percentage: 2
      })

      // Top coordinator gets 15%
      expect(commissions[4]).toMatchObject({
        userId: 'user5',
        amount: 1500,
        percentage: 15
      })

      // Total should be 24%
      const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0)
      expect(totalAmount).toBe(2400)
    })

    it('should handle circular reference (safety check)', async () => {
      const mockUsers = [
        { _id: 'user1', role: 'VOLUNTEER', parentCoordinatorId: 'user2' },
        { _id: 'user2', role: 'DISTRICT_COORDINATOR', parentCoordinatorId: 'user3' },
        { _id: 'user3', role: 'ZONE_COORDINATOR', parentCoordinatorId: 'user1' } // Circular!
      ]

      ;(User.findById as jest.Mock).mockImplementation((id) => {
        return Promise.resolve(mockUsers.find(u => u._id === id))
      })

      const commissions = await calculateHierarchyCommissions(10000, 'user1')

      // Should stop after detecting circular reference
      expect(commissions.length).toBeLessThanOrEqual(20) // Max depth
    })

    it('should handle single user with no parent', async () => {
      ;(User.findById as jest.Mock).mockResolvedValueOnce({
        _id: 'user1',
        role: 'VOLUNTEER',
        parentCoordinatorId: null
      })

      const commissions = await calculateHierarchyCommissions(10000, 'user1')

      expect(commissions).toHaveLength(1)
      expect(commissions[0]).toMatchObject({
        userId: 'user1',
        amount: 0,
        percentage: 0
      })
    })

    it('should correctly identify isFirstParent for volunteer parent', async () => {
      const mockUsers = [
        { _id: 'user1', role: 'VOLUNTEER', parentCoordinatorId: 'user2' },
        { _id: 'user2', role: 'DISTRICT_COORDINATOR', parentCoordinatorId: 'user3' }
      ]

      ;(User.findById as jest.Mock).mockImplementation((id) => {
        return Promise.resolve(mockUsers.find(u => u._id === id))
      })

      const commissions = await calculateHierarchyCommissions(10000, 'user1')

      // user2 should get 5% as first parent of volunteer
      const parentCommission = commissions.find(c => c.userId === 'user2')
      expect(parentCommission?.percentage).toBe(5)
      expect(parentCommission?.amount).toBe(500)
    })
  })
})
