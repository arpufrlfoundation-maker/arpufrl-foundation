import { Donation, PaymentStatus, Currency, donationUtils } from '../../models/Donation'
import { User, UserRole, UserStatus } from '../../models/User'
import { Program } from '../../models/Program'
import { ReferralCode } from '../../models/ReferralCode'
import mongoose from 'mongoose'

describe('Donation Model', () => {
  let testUser: any
  let testProgram: any
  let testReferralCode: any

  beforeEach(async () => {
    // Create test data
    testUser = await User.create({
      name: 'Test Coordinator',
      email: 'coordinator@example.com',
      role: UserRole.COORDINATOR,
      status: UserStatus.ACTIVE,
      region: 'Mumbai'
    })

    testProgram = await Program.create({
      name: 'Test Program',
      slug: 'test-program',
      description: 'A test program for donations',
      targetAmount: 100000,
      active: true
    })

    testReferralCode = await ReferralCode.create({
      code: 'TEST-MUM-01',
      ownerUserId: testUser._id,
      type: 'COORDINATOR',
      region: 'Mumbai',
      active: true
    })
  })

  describe('Schema Validation', () => {
    it('should create a valid donation with required fields', async () => {
      const donationData = {
        donorName: 'John Donor',
        donorEmail: 'donor@example.com',
        amount: 1000,
        currency: Currency.INR,
        razorpayOrderId: 'order_test123',
        paymentStatus: PaymentStatus.PENDING,
        privacyConsentGiven: true,
        dataProcessingConsent: true
      }

      const donation = new Donation(donationData)
      await donation.save()

      expect(donation.donorName).toBe('John Donor')
      expect(donation.donorEmail).toBe('donor@example.com')
      expect(donation.amount).toBe(1000)
      expect(donation.currency).toBe(Currency.INR)
      expect(donation.paymentStatus).toBe(PaymentStatus.PENDING)
      expect(donation.createdAt).toBeDefined()
    })

    it('should enforce unique razorpay order ID', async () => {
      const donationData = {
        donorName: 'John Donor',
        amount: 1000,
        razorpayOrderId: 'order_duplicate123',
        paymentStatus: PaymentStatus.PENDING,
        privacyConsentGiven: true,
        dataProcessingConsent: true
      }

      await new Donation(donationData).save()

      // Try to create another donation with same order ID
      const duplicateDonation = new Donation({
        ...donationData,
        donorName: 'Jane Donor'
      })

      await expect(duplicateDonation.save()).rejects.toThrow()
    })

    it('should validate amount range', async () => {
      const invalidDonation = new Donation({
        donorName: 'John Donor',
        amount: 50, // Below minimum
        razorpayOrderId: 'order_test123',
        paymentStatus: PaymentStatus.PENDING
      })

      await expect(invalidDonation.save()).rejects.toThrow()
    })

    it('should validate donor name format', async () => {
      const invalidDonation = new Donation({
        donorName: 'J', // Too short
        amount: 1000,
        razorpayOrderId: 'order_test123',
        paymentStatus: PaymentStatus.PENDING
      })

      await expect(invalidDonation.save()).rejects.toThrow()
    })

    it('should validate email format when provided', async () => {
      const invalidDonation = new Donation({
        donorName: 'John Donor',
        donorEmail: 'invalid-email',
        amount: 1000,
        razorpayOrderId: 'order_test123',
        paymentStatus: PaymentStatus.PENDING
      })

      await expect(invalidDonation.save()).rejects.toThrow()
    })
  })

  describe('Instance Methods', () => {
    let donation: any

    beforeEach(async () => {
      donation = await Donation.create({
        donorName: 'John Donor',
        donorEmail: 'donor@example.com',
        amount: 1000,
        razorpayOrderId: 'order_test123',
        paymentStatus: PaymentStatus.PENDING,
        privacyConsentGiven: true,
        dataProcessingConsent: true
      })
    })

    it('should mark donation as successful', async () => {
      const updatedDonation = await donation.markAsSuccessful('pay_test123', 'signature_test')

      expect(updatedDonation.paymentStatus).toBe(PaymentStatus.SUCCESS)
      expect(updatedDonation.razorpayPaymentId).toBe('pay_test123')
      expect(updatedDonation.razorpaySignature).toBe('signature_test')
    })

    it('should mark donation as failed', async () => {
      const updatedDonation = await donation.markAsFailed('Payment declined')

      expect(updatedDonation.paymentStatus).toBe(PaymentStatus.FAILED)
    })

    it('should calculate fees correctly', () => {
      const fees = donation.calculateFees()
      const expectedFees = Math.round(1000 * 0.0236) // 2.36%

      expect(fees).toBe(expectedFees)
    })

    it('should generate receipt data', () => {
      donation.razorpayPaymentId = 'pay_test123'
      const receiptData = donation.toReceiptData()

      expect(receiptData.donationId).toBe(donation._id.toString())
      expect(receiptData.donorName).toBe('John Donor')
      expect(receiptData.donorEmail).toBe('donor@example.com')
      expect(receiptData.amount).toBe(1000)
      expect(receiptData.currency).toBe(Currency.INR)
      expect(receiptData.paymentId).toBe('pay_test123')
      expect(receiptData.donationDate).toBeDefined()
    })
  })

  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test donations
      await Donation.create([
        {
          donorName: 'John Donor',
          amount: 1000,
          razorpayOrderId: 'order_1',
          paymentStatus: PaymentStatus.SUCCESS,
          programId: testProgram._id,
          referralCodeId: testReferralCode._id,
          attributedToUserId: testUser._id,
          privacyConsentGiven: true,
          dataProcessingConsent: true
        },
        {
          donorName: 'Jane Donor',
          amount: 2000,
          razorpayOrderId: 'order_2',
          paymentStatus: PaymentStatus.SUCCESS,
          programId: testProgram._id,
          privacyConsentGiven: true,
          dataProcessingConsent: true
        },
        {
          donorName: 'Bob Donor',
          amount: 1500,
          razorpayOrderId: 'order_3',
          paymentStatus: PaymentStatus.FAILED,
          privacyConsentGiven: true,
          dataProcessingConsent: true
        }
      ])
    })

    it('should find donation by razorpay order ID', async () => {
      const donation = await Donation.findByRazorpayOrderId('order_1')

      expect(donation).toBeDefined()
      expect(donation?.donorName).toBe('John Donor')
    })

    it('should find donations by referral code', async () => {
      const donations = await Donation.findByReferralCode(testReferralCode._id.toString())

      expect(donations).toHaveLength(1)
      expect(donations[0].donorName).toBe('John Donor')
    })

    it('should find donations by program', async () => {
      const donations = await Donation.findByProgram(testProgram._id)

      expect(donations).toHaveLength(2) // Only successful donations
      expect(donations.every(d => d.paymentStatus === PaymentStatus.SUCCESS)).toBe(true)
    })

    it('should get successful donations only', async () => {
      const donations = await Donation.getSuccessfulDonations()

      expect(donations).toHaveLength(2)
      expect(donations.every(d => d.paymentStatus === PaymentStatus.SUCCESS)).toBe(true)
    })

    it('should calculate total amount by program', async () => {
      const totalAmount = await Donation.getTotalAmountByProgram(testProgram._id)

      expect(totalAmount).toBe(3000) // 1000 + 2000
    })

    it('should calculate total amount by referral', async () => {
      const totalAmount = await Donation.getTotalAmountByReferral(testUser._id)

      expect(totalAmount).toBe(1000) // Only one donation attributed
    })

    it('should generate donation statistics', async () => {
      const stats = await Donation.getDonationStats()

      expect(stats.totalCount).toBe(3)
      expect(stats.successfulCount).toBe(2)
      expect(stats.failedCount).toBe(1)
      expect(stats.totalAmount).toBe(3000)
      expect(stats.averageAmount).toBe(1500) // (1000 + 2000) / 2
    })
  })

  describe('Referral Attribution', () => {
    it('should automatically attribute donation to referral code owner', async () => {
      const donation = await Donation.create({
        donorName: 'John Donor',
        amount: 1000,
        razorpayOrderId: 'order_attribution_test',
        paymentStatus: PaymentStatus.PENDING,
        referralCodeId: testReferralCode._id,
        privacyConsentGiven: true,
        dataProcessingConsent: true
      })

      expect(donation.attributedToUserId?.toString()).toBe(testUser._id.toString())
    })
  })

  describe('Utility Functions', () => {
    it('should validate donation data with Zod', () => {
      const validData = {
        donorName: 'John Donor',
        donorEmail: 'donor@example.com',
        amount: 1000,
        currency: Currency.INR,
        razorpayOrderId: 'order_test123',
        paymentStatus: PaymentStatus.PENDING,
        privacyConsentGiven: true,
        dataProcessingConsent: true
      }

      const invalidData = {
        donorName: 'J',
        amount: 50,
        razorpayOrderId: ''
      }

      const validResult = donationUtils.validateDonationData(validData)
      const invalidResult = donationUtils.validateDonationData(invalidData)

      expect(validResult.success).toBe(true)
      expect(invalidResult.success).toBe(false)
    })

    it('should format amount correctly', () => {
      const formatted = donationUtils.formatAmount(1000, Currency.INR)

      expect(formatted).toMatch(/₹.*1,000/)
    })

    it('should calculate net amount after fees', () => {
      const netAmount = donationUtils.calculateNetAmount(1000)
      const expectedNet = 1000 - Math.round(1000 * 0.0236)

      expect(netAmount).toBe(expectedNet)
    })

    it('should generate receipt number', async () => {
      const donation = await Donation.create({
        donorName: 'John Donor',
        amount: 1000,
        razorpayOrderId: 'order_receipt_test',
        paymentStatus: PaymentStatus.SUCCESS,
        privacyConsentGiven: true,
        dataProcessingConsent: true
      })

      const receiptNumber = donationUtils.generateReceiptNumber(donation)

      expect(receiptNumber).toMatch(/^ARPU-\d{8}-[A-Z0-9]{6}$/)
    })
  })
})