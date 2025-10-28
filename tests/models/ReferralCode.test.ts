import { ReferralCode, ReferralCodeType, referralCodeUtils } from '../../models/ReferralCode'
import { User, UserRole, UserStatus } from '../../models/User'
import { Donation, PaymentStatus } from '../../models/Donation'
import mongoose from 'mongoose'

describe('ReferralCode Model', () => {
  let coordinatorUser: any
  let subCoordinatorUser: any
  let coordinatorCode: any

  beforeEach(async () => {
    // Create test users
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

    // Create coordinator referral code
    coordinatorCode = await ReferralCode.create({
      code: 'TEST-MUM-01',
      ownerUserId: coordinatorUser._id,
      type: ReferralCodeType.COORDINATOR,
      region: 'Mumbai',
      active: true
    })
  })

  describe('Schema Validation', () => {
    it('should create a valid referral code with required fields', async () => {
      const codeData = {
        code: 'VALID-CODE-01',
        ownerUserId: coordinatorUser._id,
        type: ReferralCodeType.COORDINATOR,
        region: 'Delhi',
        active: true
      }

      const referralCode = new ReferralCode(codeData)
      await referralCode.save()

      expect(referralCode.code).toBe('VALID-CODE-01')
      expect(referralCode.ownerUserId.toString()).toBe(coordinatorUser._id.toString())
      expect(referralCode.type).toBe(ReferralCodeType.COORDINATOR)
      expect(referralCode.region).toBe('Delhi')
      expect(referralCode.active).toBe(true)
      expect(referralCode.totalDonations).toBe(0)
      expect(referralCode.totalAmount).toBe(0)
    })

    it('should enforce unique code constraint', async () => {
      const codeData = {
        code: 'DUPLICATE-CODE',
        ownerUserId: coordinatorUser._id,
        type: ReferralCodeType.COORDINATOR,
        active: true
      }

      await new ReferralCode(codeData).save()

      // Try to create another code with same code string
      const duplicateCode = new ReferralCode({
        ...codeData,
        ownerUserId: subCoordinatorUser._id
      })

      await expect(duplicateCode.save()).rejects.toThrow()
    })

    it('should validate code format', async () => {
      const invalidCode = new ReferralCode({
        code: 'invalid code!', // Contains invalid characters
        ownerUserId: coordinatorUser._id,
        type: ReferralCodeType.COORDINATOR,
        active: true
      })

      await expect(invalidCode.save()).rejects.toThrow()
    })

    it('should validate code length', async () => {
      const invalidCode = new ReferralCode({
        code: 'AB', // Too short
        ownerUserId: coordinatorUser._id,
        type: ReferralCodeType.COORDINATOR,
        active: true
      })

      await expect(invalidCode.save()).rejects.toThrow()
    })

    it('should convert code to uppercase', async () => {
      const referralCode = new ReferralCode({
        code: 'lowercase-code',
        ownerUserId: coordinatorUser._id,
        type: ReferralCodeType.COORDINATOR,
        active: true
      })

      await referralCode.save()

      expect(referralCode.code).toBe('LOWERCASE-CODE')
    })
  })

  describe('Type Determination', () => {
    it('should set type as COORDINATOR for coordinator users', async () => {
      const referralCode = new ReferralCode({
        code: 'COORD-TEST-01',
        ownerUserId: coordinatorUser._id,
        active: true
      })

      await referralCode.save()

      expect(referralCode.type).toBe(ReferralCodeType.COORDINATOR)
    })

    it('should set type as SUB_COORDINATOR for sub-coordinator users', async () => {
      const referralCode = new ReferralCode({
        code: 'SUB-TEST-01',
        ownerUserId: subCoordinatorUser._id,
        parentCodeId: coordinatorCode._id,
        active: true
      })

      await referralCode.save()

      expect(referralCode.type).toBe(ReferralCodeType.SUB_COORDINATOR)
    })

    it('should require parent code for sub-coordinators', async () => {
      const referralCode = new ReferralCode({
        code: 'SUB-NO-PARENT',
        ownerUserId: subCoordinatorUser._id,
        active: true
        // Missing parentCodeId
      })

      await expect(referralCode.save()).rejects.toThrow()
    })

    it('should set region from owner if not provided', async () => {
      const referralCode = new ReferralCode({
        code: 'AUTO-REGION-01',
        ownerUserId: coordinatorUser._id,
        active: true
        // Region not provided, should use owner's region
      })

      await referralCode.save()

      expect(referralCode.region).toBe('Mumbai')
    })
  })

  describe('Instance Methods', () => {
    let referralCode: any

    beforeEach(async () => {
      referralCode = await ReferralCode.create({
        code: 'STATS-TEST-01',
        ownerUserId: coordinatorUser._id,
        type: ReferralCodeType.COORDINATOR,
        region: 'Mumbai',
        active: true
      })
    })

    it('should update stats correctly', async () => {
      // Create test donations
      await Donation.create([
        {
          donorName: 'John Donor',
          amount: 2000,
          razorpayOrderId: 'order_1',
          paymentStatus: PaymentStatus.SUCCESS,
          referralCodeId: referralCode._id
        },
        {
          donorName: 'Jane Donor',
          amount: 3000,
          razorpayOrderId: 'order_2',
          paymentStatus: PaymentStatus.SUCCESS,
          referralCodeId: referralCode._id
        },
        {
          donorName: 'Bob Donor',
          amount: 1000,
          razorpayOrderId: 'order_3',
          paymentStatus: PaymentStatus.FAILED,
          referralCodeId: referralCode._id
        }
      ])

      await referralCode.updateStats()

      expect(referralCode.totalAmount).toBe(5000) // Only successful donations
      expect(referralCode.totalDonations).toBe(2)
      expect(referralCode.lastUsed).toBeDefined()
    })

    it('should deactivate referral code', async () => {
      await referralCode.deactivate()

      expect(referralCode.active).toBe(false)
    })

    it('should activate referral code', async () => {
      referralCode.active = false
      await referralCode.save()

      await referralCode.activate()

      expect(referralCode.active).toBe(true)
    })

    it('should get hierarchy path', async () => {
      // Create sub-coordinator code
      const subCode = await ReferralCode.create({
        code: 'SUB-HIERARCHY-01',
        ownerUserId: subCoordinatorUser._id,
        parentCodeId: referralCode._id,
        type: ReferralCodeType.SUB_COORDINATOR,
        active: true
      })

      const hierarchy = await subCode.getHierarchy()

      expect(hierarchy).toHaveLength(2)
      expect(hierarchy[0]._id.toString()).toBe(referralCode._id.toString())
      expect(hierarchy[1]._id.toString()).toBe(subCode._id.toString())
    })

    it('should get sub codes', async () => {
      // Create sub-coordinator codes
      await ReferralCode.create([
        {
          code: 'SUB-1',
          ownerUserId: subCoordinatorUser._id,
          parentCodeId: referralCode._id,
          type: ReferralCodeType.SUB_COORDINATOR,
          active: true
        },
        {
          code: 'SUB-2',
          ownerUserId: subCoordinatorUser._id,
          parentCodeId: referralCode._id,
          type: ReferralCodeType.SUB_COORDINATOR,
          active: true
        }
      ])

      const subCodes = await referralCode.getSubCodes()

      expect(subCodes).toHaveLength(2)
      expect(subCodes.every(code => code.parentCodeId?.toString() === referralCode._id.toString())).toBe(true)
    })
  })

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test referral codes
      await ReferralCode.create([
        {
          code: 'ACTIVE-CODE-01',
          ownerUserId: coordinatorUser._id,
          type: ReferralCodeType.COORDINATOR,
          region: 'Mumbai',
          active: true,
          totalAmount: 5000,
          totalDonations: 3
        },
        {
          code: 'ACTIVE-CODE-02',
          ownerUserId: coordinatorUser._id,
          type: ReferralCodeType.COORDINATOR,
          region: 'Delhi',
          active: true,
          totalAmount: 8000,
          totalDonations: 4
        },
        {
          code: 'INACTIVE-CODE',
          ownerUserId: coordinatorUser._id,
          type: ReferralCodeType.COORDINATOR,
          region: 'Mumbai',
          active: false,
          totalAmount: 2000,
          totalDonations: 1
        }
      ])
    })

    it('should find referral code by code string', async () => {
      const code = await ReferralCode.findByCode('ACTIVE-CODE-01')

      expect(code).toBeDefined()
      expect(code?.totalAmount).toBe(5000)
    })

    it('should not find inactive code by code string', async () => {
      const code = await ReferralCode.findByCode('INACTIVE-CODE')

      expect(code).toBeNull()
    })

    it('should find codes by owner', async () => {
      const codes = await ReferralCode.findByOwner(coordinatorUser._id)

      expect(codes.length).toBeGreaterThanOrEqual(3) // Including the one from beforeEach
    })

    it('should find active code by owner', async () => {
      const code = await ReferralCode.findActiveByOwner(coordinatorUser._id)

      expect(code).toBeDefined()
      expect(code?.active).toBe(true)
    })

    it('should generate unique code', async () => {
      const uniqueCode = await ReferralCode.generateUniqueCode('John Doe', 'Mumbai')

      expect(uniqueCode).toMatch(/^[A-Z0-9-]+$/)
      expect(uniqueCode).toContain('MUM')
    })

    it('should create referral code for user', async () => {
      const newUser = await User.create({
        name: 'New Coordinator',
        email: 'new@example.com',
        role: UserRole.COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Bangalore'
      })

      const referralCode = await ReferralCode.createForUser(newUser._id)

      expect(referralCode.ownerUserId.toString()).toBe(newUser._id.toString())
      expect(referralCode.type).toBe(ReferralCodeType.COORDINATOR)
      expect(referralCode.region).toBe('Bangalore')
      expect(referralCode.active).toBe(true)
    })

    it('should not create duplicate code for user', async () => {
      // User already has a code from beforeEach
      await expect(ReferralCode.createForUser(coordinatorUser._id)).rejects.toThrow()
    })

    it('should get top performers', async () => {
      const performers = await ReferralCode.getTopPerformers(2)

      expect(performers).toHaveLength(2)
      expect(performers[0].totalAmount).toBeGreaterThanOrEqual(performers[1].totalAmount)
      expect(performers[0].ownerName).toBeDefined()
    })

    it('should update all stats', async () => {
      // This method would update stats for all codes
      // We'll just verify it doesn't throw an error
      await expect(ReferralCode.updateAllStats()).resolves.not.toThrow()
    })
  })

  describe('Utility Functions', () => {
    it('should validate referral code data with Zod', () => {
      const validData = {
        code: 'VALID-CODE-01',
        ownerUserId: coordinatorUser._id.toString(),
        type: ReferralCodeType.COORDINATOR,
        region: 'Mumbai',
        active: true
      }

      const invalidData = {
        code: 'AB', // Too short
        ownerUserId: 'invalid-id',
        type: 'INVALID_TYPE'
      }

      const validResult = referralCodeUtils.validateReferralCodeData(validData)
      const invalidResult = referralCodeUtils.validateReferralCodeData(invalidData)

      expect(validResult.success).toBe(true)
      expect(invalidResult.success).toBe(false)
    })

    it('should resolve referral code from string', async () => {
      const code = await referralCodeUtils.resolveReferralCode('test-mum-01')

      expect(code).toBeDefined()
      expect(code?.code).toBe('TEST-MUM-01')
    })

    it('should return null for invalid code string', async () => {
      const code = await referralCodeUtils.resolveReferralCode('NONEXISTENT')

      expect(code).toBeNull()
    })

    it('should build hierarchy tree', async () => {
      // Create sub-coordinator code
      const subCode = await ReferralCode.create({
        code: 'SUB-TREE-01',
        ownerUserId: subCoordinatorUser._id,
        parentCodeId: coordinatorCode._id,
        type: ReferralCodeType.SUB_COORDINATOR,
        active: true,
        totalAmount: 2000,
        totalDonations: 1
      })

      const tree = await referralCodeUtils.buildHierarchyTree(coordinatorCode._id)

      expect(tree.code._id.toString()).toBe(coordinatorCode._id.toString())
      expect(tree.subCodes).toHaveLength(1)
      expect(tree.subCodes[0].code._id.toString()).toBe(subCode._id.toString())
      expect(tree.totalAmount).toBe(coordinatorCode.totalAmount + subCode.totalAmount)
    })

    it('should get attribution chain', async () => {
      // Create sub-coordinator code
      const subCode = await ReferralCode.create({
        code: 'SUB-CHAIN-01',
        ownerUserId: subCoordinatorUser._id,
        parentCodeId: coordinatorCode._id,
        type: ReferralCodeType.SUB_COORDINATOR,
        active: true
      })

      const chain = await referralCodeUtils.getAttributionChain(subCode._id)

      expect(chain).toHaveLength(2)
      expect(chain[0]._id.toString()).toBe(coordinatorCode._id.toString())
      expect(chain[1]._id.toString()).toBe(subCode._id.toString())
    })
  })
})