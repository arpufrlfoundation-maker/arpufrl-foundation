#!/usr/bin/env node

/**
 * Test script to verify commission distribution system
 * This script simulates a referral donation and checks if commissions are properly distributed
 */

const mongoose = require('mongoose')
require('dotenv').config({ path: '.env.local' })

// Import models and utilities
const { connectToDatabase } = require('./lib/db')
const { User } = require('./models/User')
const { Donation } = require('./models/Donation')
const { ReferralCode } = require('./models/ReferralCode')
const { CommissionLog } = require('./models/CommissionLog')
const { processCommissionDistribution } = require('./lib/commission-utils')

async function testCommissionSystem() {
  try {
    console.log('🔄 Connecting to database...')
    await connectToDatabase()
    console.log('✅ Connected to database\n')

    // Find a user with referral code
    console.log('🔍 Finding a coordinator with referral code...')
    const coordinator = await User.findOne({
      role: { $ne: 'ADMIN' }
    }).populate('parentCoordinatorId')

    if (!coordinator) {
      console.log('❌ No coordinator found. Please create a coordinator first.')
      process.exit(1)
    }

    console.log(`✅ Found coordinator: ${coordinator.name} (${coordinator.role})`)
    console.log(`   ID: ${coordinator._id}`)
    console.log(`   Parent: ${coordinator.parentCoordinatorId ? coordinator.parentCoordinatorId.name : 'None'}`)

    // Find their referral code
    const referralCode = await ReferralCode.findOne({ ownerUserId: coordinator._id })
    if (!referralCode) {
      console.log('❌ No referral code found for this coordinator.')
      process.exit(1)
    }

    console.log(`✅ Referral Code: ${referralCode.code}\n`)

    // Create a test donation
    const testAmount = 10000 // ₹10,000
    console.log(`💰 Creating test donation of ₹${testAmount}...`)
    
    const donation = await Donation.create({
      donorName: 'Test Donor',
      donorEmail: 'test@example.com',
      amount: testAmount,
      currency: 'INR',
      referralCodeId: referralCode._id,
      referredBy: coordinator._id,
      paymentStatus: 'SUCCESS',
      razorpayOrderId: `test_order_${Date.now()}`,
      razorpayPaymentId: `test_payment_${Date.now()}`,
      razorpaySignature: 'test_signature',
      paymentMethod: 'card',
      transactionId: `test_txn_${Date.now()}`,
      isAnonymous: false,
      privacyConsentGiven: true,
      dataProcessingConsent: true,
    })

    console.log(`✅ Test donation created: ${donation._id}\n`)

    // Process commission distribution
    console.log('🔄 Processing commission distribution...')
    const commissionResult = await processCommissionDistribution(
      donation._id,
      coordinator._id,
      testAmount
    )

    console.log('\n📊 COMMISSION DISTRIBUTION RESULTS:')
    console.log('=' .repeat(60))
    console.log(`Total Donation Amount: ₹${testAmount.toLocaleString()}`)
    console.log(`Total Commission: ₹${commissionResult.totalCommission.toLocaleString()}`)
    console.log(`Organization Fund: ₹${commissionResult.organizationFund.toLocaleString()}`)
    console.log(`\nPersonal Commission: ₹${commissionResult.summary.personalCommission.toLocaleString()}`)
    console.log(`Hierarchy Commissions: ₹${commissionResult.summary.hierarchyCommissions.toLocaleString()}`)
    console.log(`Levels Involved: ${commissionResult.summary.levelsInvolved}`)
    console.log('=' .repeat(60))

    console.log('\n💵 INDIVIDUAL DISTRIBUTIONS:')
    console.log('=' .repeat(60))
    commissionResult.distributions.forEach((dist, index) => {
      console.log(`\n${index + 1}. ${dist.userName} (${dist.userRole})`)
      console.log(`   Hierarchy Level: ${dist.hierarchyLevel}`)
      console.log(`   Commission: ₹${dist.commissionAmount.toLocaleString()} (${dist.commissionPercentage}%)`)
    })
    console.log('=' .repeat(60))

    // Verify commission logs were created
    console.log('\n🔍 Verifying commission logs...')
    const commissionLogs = await CommissionLog.find({ donationId: donation._id })
    console.log(`✅ ${commissionLogs.length} commission logs created`)

    // Check wallet updates
    console.log('\n💼 Checking wallet updates...')
    for (const dist of commissionResult.distributions) {
      const user = await User.findById(dist.userId)
      if (user) {
        console.log(`   ${user.name}: ₹${user.commission_wallet || 0}`)
      }
    }

    console.log('\n✅ Commission system test completed successfully!')
    console.log('\n⚠️  Note: This was a test donation. You may want to delete it from the database.')
    console.log(`   Donation ID: ${donation._id}`)

  } catch (error) {
    console.error('\n❌ Error testing commission system:', error)
    console.error(error.stack)
  } finally {
    await mongoose.connection.close()
    console.log('\n👋 Database connection closed')
  }
}

// Run the test
testCommissionSystem()
