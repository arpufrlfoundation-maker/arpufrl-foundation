/**
 * Database Indexes Configuration
 * Run this script to create all necessary indexes for production
 * 
 * Usage: npm run create-indexes
 * Or: node scripts/create-indexes.js
 */

import mongoose from 'mongoose'
import { connectToDatabase } from '../lib/db'
import { logger } from '../lib/logger'

async function createIndexes() {
  try {
    await connectToDatabase()
    const db = mongoose.connection.db

    if (!db) {
      throw new Error('Database connection not established')
    }

    logger.info('Creating database indexes...')

    // Users collection indexes
    await db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true, name: 'email_unique' },
      { key: { phone: 1 }, sparse: true, name: 'phone_index' },
      { key: { uniqueId: 1 }, unique: true, sparse: true, name: 'uniqueId_unique' },
      { key: { role: 1, status: 1 }, name: 'role_status_index' },
      { key: { parentCoordinatorId: 1 }, sparse: true, name: 'parent_coordinator_index' },
      { key: { 'referralCode.code': 1 }, unique: true, sparse: true, name: 'referral_code_unique' },
      { key: { state: 1, district: 1 }, sparse: true, name: 'location_index' },
      { key: { createdAt: -1 }, name: 'created_at_index' }
    ])
    logger.info('✓ Users indexes created')

    // Donations collection indexes
    await db.collection('donations').createIndexes([
      { key: { razorpayOrderId: 1 }, unique: true, name: 'razorpay_order_unique' },
      { key: { razorpayPaymentId: 1 }, sparse: true, name: 'razorpay_payment_index' },
      { key: { paymentStatus: 1 }, name: 'payment_status_index' },
      { key: { donorEmail: 1 }, sparse: true, name: 'donor_email_index' },
      { key: { programId: 1 }, sparse: true, name: 'program_id_index' },
      { key: { referralCodeId: 1 }, sparse: true, name: 'referral_code_id_index' },
      { key: { attributedToUserId: 1 }, sparse: true, name: 'attributed_user_index' },
      { key: { createdAt: -1 }, name: 'created_at_desc_index' },
      { key: { paymentStatus: 1, createdAt: -1 }, name: 'status_date_compound_index' },
      { key: { amount: -1 }, name: 'amount_desc_index' }
    ])
    logger.info('✓ Donations indexes created')

    // Programs collection indexes
    await db.collection('programs').createIndexes([
      { key: { slug: 1 }, unique: true, name: 'slug_unique' },
      { key: { isActive: 1 }, name: 'active_programs_index' },
      { key: { createdAt: -1 }, name: 'programs_created_index' }
    ])
    logger.info('✓ Programs indexes created')

    // Referral Codes collection indexes
    await db.collection('referralcodes').createIndexes([
      { key: { code: 1 }, unique: true, name: 'code_unique' },
      { key: { userId: 1 }, unique: true, sparse: true, name: 'user_id_unique' },
      { key: { isActive: 1 }, name: 'active_codes_index' },
      { key: { expiresAt: 1 }, sparse: true, name: 'expires_at_index' }
    ])
    logger.info('✓ Referral codes indexes created')

    // Surveys collection indexes
    await db.collection('surveys').createIndexes([
      { key: { phoneNumber: 1 }, name: 'phone_number_index' },
      { key: { state: 1, district: 1 }, name: 'survey_location_index' },
      { key: { submittedAt: -1 }, name: 'submitted_at_index' },
      { key: { referralCode: 1 }, sparse: true, name: 'survey_referral_index' }
    ])
    logger.info('✓ Surveys indexes created')

    // Targets collection indexes
    await db.collection('targets').createIndexes([
      { key: { userId: 1, targetType: 1 }, name: 'user_target_type_index' },
      { key: { startDate: 1, endDate: 1 }, name: 'date_range_index' },
      { key: { status: 1 }, name: 'target_status_index' }
    ])
    logger.info('✓ Targets indexes created')

    // Commission Logs collection indexes
    await db.collection('commissionlogs').createIndexes([
      { key: { donationId: 1 }, name: 'donation_id_index' },
      { key: { userId: 1, status: 1 }, name: 'user_status_index' },
      { key: { level: 1 }, name: 'commission_level_index' },
      { key: { createdAt: -1 }, name: 'commission_created_index' }
    ])
    logger.info('✓ Commission logs indexes created')

    // Transactions collection indexes
    await db.collection('transactions').createIndexes([
      { key: { razorpayOrderId: 1 }, unique: true, name: 'transaction_order_unique' },
      { key: { status: 1 }, name: 'transaction_status_index' },
      { key: { userId: 1 }, sparse: true, name: 'transaction_user_index' },
      { key: { createdAt: -1 }, name: 'transaction_created_index' }
    ])
    logger.info('✓ Transactions indexes created')

    // Contact collection indexes
    await db.collection('contacts').createIndexes([
      { key: { email: 1 }, name: 'contact_email_index' },
      { key: { status: 1 }, name: 'contact_status_index' },
      { key: { createdAt: -1 }, name: 'contact_created_index' }
    ])
    logger.info('✓ Contacts indexes created')

    // Volunteer Requests collection indexes
    await db.collection('volunteerrequests').createIndexes([
      { key: { email: 1 }, name: 'volunteer_email_index' },
      { key: { status: 1 }, name: 'volunteer_status_index' },
      { key: { createdAt: -1 }, name: 'volunteer_created_index' }
    ])
    logger.info('✓ Volunteer requests indexes created')

    logger.info('✅ All database indexes created successfully!')

    // Print index information
    const collections = await db.listCollections().toArray()
    for (const collection of collections) {
      const indexes = await db.collection(collection.name).indexes()
      logger.info(`\n${collection.name} indexes:`)
      indexes.forEach(index => {
        logger.info(`  - ${index.name}: ${JSON.stringify(index.key)}`)
      })
    }

  } catch (error) {
    logger.error('Error creating indexes', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    logger.info('\nDatabase connection closed')
    process.exit(0)
  }
}

// Run if called directly
if (require.main === module) {
  createIndexes()
}

export default createIndexes
