import { ReferralAttributionService } from '../../lib/referral-attribution'
import { ReferralCode, ReferralCodeType } from '../../models/ReferralCode'
import { User, UserRole, UserStatus } from '../../models/User'
import { Donation, PaymentStatus } from '../../models/Donation'
import { Program } from '../../models/Program'
import mongoose from 'mongoose'

describe('ReferralAttributionService', () => {
  let adminUser: any
  let coordinatorUser: any
  let subCoordinatorUser: any
  let coordinatorCode: any
  let subCoordinatorCode: any
  let program: any

  beforeEach(async () => {
    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE
    })

    coordinatorUser = await User.create({
      name: 'Test Coordinator',
      email: 'coordinator@example.com',
      role: UserRole.COORDINATOR,
      status: UserStatus.ACTIVE,
      region: 'Mumbai'
    })

    subCoordinatorUser = await User.create({
      name: 'Test Sub Coordinator',
      email: 'sub@example.com',
      role: UserRole.SUB_COORDINATOR,
      status: UserStatus.ACTIVE,
      region: 'Mumbai',
      parentCoordinatorId: coordinatorUser._id
    })

    // Create referral codes
    coordinatorCode = await ReferralCode.create({
      code: 'COORD-MUM-01',
      ownerUserId: coordinatorUser._id,
      type: ReferralCodeType.COORDINATOR,
      region: 'Mumbai',
      active: true
    })

    subCoordinatorCode = await ReferralCode.create({
      code: 'SUB-MUM-01',
      ownerUserId: subCoordinatorUser._id,
      parentCodeId: coordinatorCode._id,
      type: ReferralCodeType.SUB_COORDINATOR,
      region: 'Mumbai',
      active: true
    })

    // Create test program
    program = await Program.create({
      name: 'Test Program',
      slug: 'test-program',
      description: 'Test program description',
      targetAmount: 100000,
      raisedAmount: 0,
      donationCount: 0,
      active: true,
      featured: false,
      priority: 1
    })
  })

  describe('attributeDonation', () => {
    it('should attribute donation to referral code', async () => {
      const donation = await Donation.create({
        donorName: 'John Donor',
        amount: 5000,
        razorpayOrderId: 'order_test_001',
        paymentStatus: PaymentStatus.SUCCESS,
        programId: program._id
      })

      const attribution = await ReferralAttributionService.attributeDonation(
        donation._id,
        'SUB-MUM-01'
      )

      expect(attribution).toBeDefined()
      expect(attribution?.referralCodeId.toString()).toBe(subCoordinatorCode._id.toString())
      expect(attribution?.attributedToUserId._id.toString()).toBe(subCoordinatorUser._id.toString())
      expect(attribution?.hierarchyChain).toHaveLength(2)
      expect(attribution?.attributionPercentages).toHaveLength(3) // Direct, parent, organization
    })

    it('should return null for invalid referral code', async () => {
      const donation = await Donation.create({
        donorName: 'John Donor',
        amount: 5000,
        razorpayOrderId: 'order_test_002',
        paymentStatus: PaymentStatus.SUCCESS
      })

      const attribution = await ReferralAttributionService.attributeDonation(
        donation._id,
        'INVALID-CODE'
      )

      expect(attribution).toBeNull()
    })

    it('should return null when no referral code provided', async () => {
      const donation = await Donation.create({
        donorName: 'John Donor',
        amount: 5000,
        razorpayOrderId: 'order_test_003',
        paymentStatus: PaymentStatus.SUCCESS
      })

      const attribution = await ReferralAttributionService.attributeDonation(donation._id)

      expect(attribution).toBeNull()
    })

    it('should calculate correct attribution percentages', async () => {
      const donation = await Donation.create({
        donorName: 'John Donor',
        amount: 10000,
        razorpayOrderId: 'order_test_004',
        paymentStatus: PaymentStatus.SUCCESS
      })

      const attribution = await ReferralAttributionService.attributeDonation(
        donation._id,
        'SUB-MUM-01'
      )

      expect(attribution?.attributionPercentages).toHaveLength(3)

      const directAttribution = attribution?.attributionPercentages.find(a => a.percentage === 70)
      const parentAttribution = attribution?.attributionPercentages.find(a => a.percentage === 20)
      const orgAttribution = attribution?.attributionPercentages.find(a => a.percentage === 10)

      expect(directAttribution?.amount).toBe(7000)
      expect(parentAttribution?.amount).toBe(2000)
      expect(orgAttribution?.amount).toBe(1000)
    })
  })

  describe('updateReferralStats', () => {
    it('should update referral code statistics', async () => {
      // Create donations for the referral code
      await Donation.create([
        {
          donorName: 'John Donor',
          amount: 2000,
          razorpayOrderId: 'order_stats_001',
          paymentStatus: PaymentStatus.SUCCESS,
          referralCodeId: coordinatorCode._id
        },
        {
          donorName: 'Jane Donor',
          amount: 3000,
          razorpayOrderId: 'order_stats_002',
          paymentStatus: PaymentStatus.SUCCESS,
          referralCodeId: coordinatorCode._id
        },
        {
          donorName: 'Bob Donor',
          amount: 1000,
          razorpayOrderId: 'order_stats_003',
          paymentStatus: PaymentStatus.FAILED,
          referralCodeId: coordinatorCode._id
        }
      ])

      await ReferralAttributionService.updateReferralStats(coordinatorCode._id)

      const updatedCode = await ReferralCode.findById(coordinatorCode._id)
      expect(updatedCode?.totalAmount).toBe(5000) // Only successful donations
      expect(updatedCode?.totalDonations).toBe(2)
    })

    it('should handle non-existent referral code gracefully', async () => {
      const fakeId = new mongoose.Types.ObjectId()

      await expect(
        ReferralAttributionService.updateReferralStats(fakeId)
      ).resolves.not.toThrow()
    })
  })

  describe('getPerformanceMetrics', () => {
    beforeEach(async () => {
      // Create test donations
      const baseDate = new Date('2024-01-15')

      await Donation.create([
        {
          donorName: 'Alice Donor',
          amount: 5000,
          razorpayOrderId: 'order_perf_001',
          paymentStatus: PaymentStatus.SUCCESS,
          referralCodeId: coordinatorCode._id,
          programId: program._id,
          createdAt: baseDate
        },
        {
          donorName: 'Bob Donor',
          amount: 3000,
          razorpayOrderId: 'order_perf_002',
          paymentStatus: PaymentStatus.SUCCESS,
          referralCodeId: subCoordinatorCode._id,
          programId: program._id,
          createdAt: new Date(baseDate.getTime() + 86400000) // Next day
        },
        {
          donorName: 'Charlie Donor',
          amount: 2000,
          razorpayOrderId: 'order_perf_003',
          paymentStatus: PaymentStatus.FAILED,
          referralCodeId: coordinatorCode._id,
          createdAt: baseDate
        }
      ])
    })

    it('should get performance metrics for coordinator', async () => {
      const metrics = await ReferralAttributionService.getPerformanceMetrics(
        coordinatorUser._id
      )

      expect(metrics.totalDonations).toBe(1) // Only coordinator's direct donations
      expect(metrics.totalAmount).toBe(5000)
      expect(metrics.averageDonation).toBe(5000)
      expect(metrics.conversionRate).toBeGreaterThan(0)
      expect(metrics.monthlyTrends).toBeDefined()
      expect(metrics.topPrograms).toBeDefined()
      expect(metrics.hierarchyPerformance).toBeDefined()
    })

    it('should include hierarchy performance for coordinators', async () => {
      const metrics = await ReferralAttributionService.getPerformanceMetrics(
        coordinatorUser._id,
        undefined,
        undefined,
        true // Include hierarchy
      )

      expect(metrics.totalDonations).toBe(2) // Coordinator + sub-coordinator donations
      expect(metrics.totalAmount).toBe(8000)
      expect(metrics.hierarchyPerformance.length).toBeGreaterThan(0)
    })

    it('should filter by date range', async () => {
      const startDate = new Date('2024-01-16')
      const endDate = new Date('2024-01-17')

      const metrics = await ReferralAttributionService.getPerformanceMetrics(
        coordinatorUser._id,
        startDate,
        endDate,
        true
      )

      expect(metrics.totalDonations).toBe(1) // Only sub-coordinator donation in range
      expect(metrics.totalAmount).toBe(3000)
    })

    it('should return empty metrics for user with no referral codes', async () => {
      const donorUser = await User.create({
        name: 'Donor User',
        email: 'donor@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      })

      const metrics = await ReferralAttributionService.getPerformanceMetrics(donorUser._id)

      expect(metrics.totalDonations).toBe(0)
      expect(metrics.totalAmount).toBe(0)
      expect(metrics.monthlyTrends).toEqual([])
      expect(metrics.topPrograms).toEqual([])
    })

    it('should throw error for non-existent user', async () => {
      const fakeUserId = new mongoose.Types.ObjectId()

      await expect(
        ReferralAttributionService.getPerformanceMetrics(fakeUserId)
      ).rejects.toThrow('User not found')
    })
  })

  describe('buildPerformanceHierarchy', () => {
    beforeEach(async () => {
      // Create donations for hierarchy testing
      await Donation.create([
        {
          donorName: 'David Donor',
          amount: 5000,
          razorpayOrderId: 'order_hier_001',
          paymentStatus: PaymentStatus.SUCCESS,
          referralCodeId: coordinatorCode._id
        },
        {
          donorName: 'Eve Donor',
          amount: 3000,
          razorpayOrderId: 'order_hier_002',
          paymentStatus: PaymentStatus.SUCCESS,
          referralCodeId: subCoordinatorCode._id
        }
      ])
    })

    it('should build hierarchy tree with performance data', async () => {
      const hierarchy = await ReferralAttributionService.buildPerformanceHierarchy(
        coordinatorUser._id
      )

      expect(hierarchy).toBeDefined()
      expect(hierarchy?.code._id.toString()).toBe(coordinatorCode._id.toString())
      expect(hierarchy?.totalAmount).toBe(8000) // Coordinator + sub-coordinator
      expect(hierarchy?.totalDonations).toBe(2)
      expect(hierarchy?.subCodes).toHaveLength(1)
      expect(hierarchy?.subCodes[0].totalAmount).toBe(3000)
    })

    it('should return null for user without referral code', async () => {
      const donorUser = await User.create({
        name: 'Donor User',
        email: 'donor@example.com',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE
      })

      const hierarchy = await ReferralAttributionService.buildPerformanceHierarchy(
        donorUser._id
      )

      expect(hierarchy).toBeNull()
    })

    it('should filter hierarchy by date range', async () => {
      // Create donation outside date range
      await Donation.create({
        donorName: 'Henry Donor',
        amount: 1000,
        razorpayOrderId: 'order_old_001',
        paymentStatus: PaymentStatus.SUCCESS,
        referralCodeId: coordinatorCode._id,
        createdAt: new Date('2023-12-01')
      })

      const startDate = new Date('2024-01-01')
      const hierarchy = await ReferralAttributionService.buildPerformanceHierarchy(
        coordinatorUser._id,
        startDate
      )

      expect(hierarchy?.totalAmount).toBe(8000) // Should not include old donation
    })
  })

  describe('updateAllReferralStats', () => {
    it('should update all referral code statistics', async () => {
      // Create donations for multiple codes
      await Donation.create([
        {
          donorName: 'Frank Donor',
          amount: 2000,
          razorpayOrderId: 'order_all_001',
          paymentStatus: PaymentStatus.SUCCESS,
          referralCodeId: coordinatorCode._id
        },
        {
          donorName: 'Grace Donor',
          amount: 1500,
          razorpayOrderId: 'order_all_002',
          paymentStatus: PaymentStatus.SUCCESS,
          referralCodeId: subCoordinatorCode._id
        }
      ])

      await ReferralAttributionService.updateAllReferralStats()

      const [updatedCoordCode, updatedSubCode] = await Promise.all([
        ReferralCode.findById(coordinatorCode._id),
        ReferralCode.findById(subCoordinatorCode._id)
      ])

      expect(updatedCoordCode?.totalAmount).toBe(2000)
      expect(updatedCoordCode?.totalDonations).toBe(1)
      expect(updatedSubCode?.totalAmount).toBe(1500)
      expect(updatedSubCode?.totalDonations).toBe(1)
    })
  })
})