/**
 * Database Migration Script
 * Run this script to update existing users with referral codes and hierarchy support
 *
 * Usage: node scripts/migrate-hierarchy.js
 */

const mongoose = require('mongoose')
const { User, UserRole } = require('../models/User')
const { generateReferralCode } = require('../lib/referral-utils')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function migrateDatabase() {
  try {
    console.log('🔄 Starting database migration...')

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    console.log('✅ Connected to MongoDB')

    // Step 1: Update role enum for existing users
    console.log('\n📝 Step 1: Updating user roles...')
    await updateUserRoles()

    // Step 2: Generate referral codes for users without them
    console.log('\n📝 Step 2: Generating referral codes...')
    await generateMissingReferralCodes()

    // Step 3: Update donation attribution
    console.log('\n📝 Step 3: Updating donation attribution...')
    await updateDonationAttribution()

    // Step 4: Initialize performance tracking
    console.log('\n📝 Step 4: Initializing performance tracking...')
    await initializePerformanceTracking()

    // Step 5: Create indexes
    console.log('\n📝 Step 5: Creating database indexes...')
    await createIndexes()

    console.log('\n✅ Migration completed successfully!')
    console.log('\n📊 Summary:')
    const stats = await getMigrationStats()
    console.log(stats)

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n👋 Disconnected from MongoDB')
  }
}

async function updateUserRoles() {
  // Map old roles to new hierarchy
  const roleMapping = {
    'COORDINATOR': 'STATE_COORDINATOR',
    'SUB_COORDINATOR': 'BLOCK_COORDINATOR'
  }

  for (const [oldRole, newRole] of Object.entries(roleMapping)) {
    const result = await User.updateMany(
      { role: oldRole },
      { $set: { role: newRole } }
    )
    console.log(`  ✓ Updated ${result.modifiedCount} users from ${oldRole} to ${newRole}`)
  }
}

async function generateMissingReferralCodes() {
  const usersWithoutCodes = await User.find({
    referralCode: { $exists: false },
    role: { $ne: UserRole.DONOR }
  })

  console.log(`  Found ${usersWithoutCodes.length} users without referral codes`)

  for (const user of usersWithoutCodes) {
    try {
      const referralCode = await generateReferralCode(
        user.name,
        user.role,
        user.region
      )
      user.referralCode = referralCode
      await user.save()
      console.log(`  ✓ Generated code ${referralCode} for ${user.name}`)
    } catch (error) {
      console.error(`  ✗ Failed to generate code for ${user.name}:`, error.message)
    }
  }
}

async function updateDonationAttribution() {
  const { Donation } = require('../models/Donation')

  // Find donations with referralCodeId but no attributedToUserId
  const donations = await Donation.find({
    referralCodeId: { $exists: true },
    attributedToUserId: { $exists: false }
  })

  console.log(`  Found ${donations.length} donations to attribute`)

  for (const donation of donations) {
    try {
      const { ReferralCode } = require('../models/ReferralCode')
      const referralCode = await ReferralCode.findById(donation.referralCodeId)

      if (referralCode) {
        donation.attributedToUserId = referralCode.ownerUserId
        await donation.save()
        console.log(`  ✓ Attributed donation ${donation._id} to user ${referralCode.ownerUserId}`)
      }
    } catch (error) {
      console.error(`  ✗ Failed to attribute donation ${donation._id}:`, error.message)
    }
  }
}

async function initializePerformanceTracking() {
  const users = await User.find({
    role: { $ne: UserRole.DONOR }
  })

  console.log(`  Initializing tracking for ${users.length} users`)

  for (const user of users) {
    try {
      const { Donation } = require('../models/Donation')
      const donations = await Donation.find({
        attributedToUserId: user._id,
        paymentStatus: 'SUCCESS'
      })

      user.totalDonationsReferred = donations.length
      user.totalAmountReferred = donations.reduce((sum, d) => sum + d.amount, 0)
      await user.save()

      console.log(`  ✓ ${user.name}: ${donations.length} donations, ₹${user.totalAmountReferred}`)
    } catch (error) {
      console.error(`  ✗ Failed for ${user.name}:`, error.message)
    }
  }
}

async function createIndexes() {
  try {
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true })
    await User.collection.createIndex({ referralCode: 1 }, { sparse: true, unique: true })
    await User.collection.createIndex({ parentCoordinatorId: 1 })
    await User.collection.createIndex({ role: 1, status: 1 })
    console.log('  ✓ Created User indexes')

    // Donation indexes
    const { Donation } = require('../models/Donation')
    await Donation.collection.createIndex({ attributedToUserId: 1 })
    await Donation.collection.createIndex({ paymentStatus: 1 })
    await Donation.collection.createIndex({ createdAt: -1 })
    console.log('  ✓ Created Donation indexes')

    // Target indexes
    const { Target } = require('../models/Target')
    await Target.collection.createIndex({ assignedTo: 1, status: 1 })
    await Target.collection.createIndex({ endDate: 1, status: 1 })
    console.log('  ✓ Created Target indexes')

  } catch (error) {
    console.error('  ✗ Failed to create indexes:', error.message)
  }
}

async function getMigrationStats() {
  const userCount = await User.countDocuments()
  const usersWithReferralCodes = await User.countDocuments({
    referralCode: { $exists: true }
  })

  const { Donation } = require('../models/Donation')
  const totalDonations = await Donation.countDocuments()
  const attributedDonations = await Donation.countDocuments({
    attributedToUserId: { $exists: true }
  })

  const { Target } = require('../models/Target')
  const totalTargets = await Target.countDocuments()

  return `
  Total Users: ${userCount}
  Users with Referral Codes: ${usersWithReferralCodes}
  Total Donations: ${totalDonations}
  Attributed Donations: ${attributedDonations}
  Total Targets: ${totalTargets}
  `
}

// Run migration
migrateDatabase()
