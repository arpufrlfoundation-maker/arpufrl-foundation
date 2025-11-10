import { connectToDatabase } from '../lib/db'
import { User, UserRole, UserStatus } from '../models/User'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

async function seedUsers() {
  try {
    console.log('🔌 Connecting to database...')
    await connectToDatabase()

    console.log('🗑️  Clearing existing users...')
    await User.deleteMany({})

    console.log('🌱 Creating test users...')

    const password = 'Test@123' // Common password for all test users
    const hashedPassword = await bcrypt.hash(password, 12)

    const users = [
      {
        name: 'Central President',
        email: 'central@arpufrl.org',
        hashedPassword,
        phone: '+919876543211',
        role: UserRole.CENTRAL_PRESIDENT,
        status: UserStatus.ACTIVE,
        region: 'National',
        referralCode: 'NAT001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'State President Maharashtra',
        email: 'state.mh@arpufrl.org',
        hashedPassword,
        phone: '+919876543212',
        role: UserRole.STATE_PRESIDENT,
        status: UserStatus.ACTIVE,
        region: 'Maharashtra',
        state: 'Maharashtra',
        referralCode: 'STMH001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'State Coordinator Delhi',
        email: 'state.dl@arpufrl.org',
        hashedPassword,
        phone: '+919876543213',
        role: UserRole.STATE_COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Delhi',
        state: 'Delhi',
        referralCode: 'STDL001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'District Coordinator Mumbai',
        email: 'district.mumbai@arpufrl.org',
        hashedPassword,
        phone: '+919876543214',
        role: UserRole.DISTRICT_COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Mumbai',
        state: 'Maharashtra',
        district: 'Mumbai',
        referralCode: 'DCMB001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Block Coordinator Andheri',
        email: 'block.andheri@arpufrl.org',
        hashedPassword,
        phone: '+919876543215',
        role: UserRole.BLOCK_COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Andheri, Mumbai',
        state: 'Maharashtra',
        district: 'Mumbai',
        block: 'Andheri',
        referralCode: 'BKAN001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Prerak Test User',
        email: 'prerak@arpufrl.org',
        hashedPassword,
        phone: '+919876543216',
        role: UserRole.PRERAK,
        status: UserStatus.ACTIVE,
        region: 'Mumbai',
        state: 'Maharashtra',
        district: 'Mumbai',
        referralCode: 'PRK001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Pending Nodal Officer',
        email: 'pending@arpufrl.org',
        hashedPassword,
        phone: '+919876543217',
        role: UserRole.NODAL_OFFICER,
        status: UserStatus.PENDING,
        region: 'Mumbai',
        state: 'Maharashtra',
        referralCode: 'PND001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Inactive Prerna Sakhi',
        email: 'inactive@arpufrl.org',
        hashedPassword,
        phone: '+919876543218',
        role: UserRole.PRERNA_SAKHI,
        status: UserStatus.INACTIVE,
        region: 'Delhi',
        state: 'Delhi',
        referralCode: 'INA001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Test Volunteer',
        email: 'volunteer@example.com',
        hashedPassword,
        phone: '+919876543219',
        role: UserRole.VOLUNTEER,
        status: UserStatus.ACTIVE,
        region: 'Mumbai',
        state: 'Maharashtra',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    const createdUsers = await User.insertMany(users)
    console.log(`✅ Created ${createdUsers.length} test users`)

    console.log('\n📋 Test Users Created:')
    console.log('==========================================')
    console.log(`Password for all users: ${password}`)
    console.log('==========================================\n')

    createdUsers.forEach((user) => {
      console.log(`📧 ${user.email}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   Status: ${user.status}`)
      console.log(`   Region: ${user.region}`)
      if (user.referralCode) {
        console.log(`   Referral Code: ${user.referralCode}`)
      }
      console.log('')
    })

    console.log('\n✨ Seeding completed successfully!')
    console.log('\nYou can now login with any of the above emails and password: Test@123')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Run the seed function
seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
