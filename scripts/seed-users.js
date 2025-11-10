const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
const path = require('path')

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/arpufrl'

// User role and status enums
const UserRole = {
  ADMIN: 'ADMIN',
  NATIONAL_LEVEL: 'NATIONAL_LEVEL',
  STATE_ADHYAKSH: 'STATE_ADHYAKSH',
  STATE_COORDINATOR: 'STATE_COORDINATOR',
  MANDAL_COORDINATOR: 'MANDAL_COORDINATOR',
  JILA_ADHYAKSH: 'JILA_ADHYAKSH',
  JILA_COORDINATOR: 'JILA_COORDINATOR',
  BLOCK_COORDINATOR: 'BLOCK_COORDINATOR',
  NODEL: 'NODEL',
  PRERAK: 'PRERAK',
  PRERNA_SAKHI: 'PRERNA_SAKHI',
  DONOR: 'DONOR'
}

const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED'
}

// Define User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  hashedPassword: { type: String, required: true },
  phone: { type: String },
  fatherPhone: { type: String },
  motherPhone: { type: String },
  role: { type: String, required: true },
  status: { type: String, required: true, default: UserStatus.PENDING },
  region: { type: String },
  referralCode: { type: String, unique: true, sparse: true },
  parentCoordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

const User = mongoose.models.User || mongoose.model('User', userSchema)

async function seedUsers() {
  try {
    console.log('🔌 Connecting to database...')
    console.log('MongoDB URI:', MONGODB_URI.replace(/:[^:]*@/, ':****@'))
    
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to database')

    console.log('🗑️  Clearing existing users...')
    await User.deleteMany({})

    console.log('🌱 Creating test users...')

    const password = 'Test@123' // Common password for all test users
    const hashedPassword = await bcrypt.hash(password, 12)

    const users = [
      {
        name: 'Admin User',
        email: 'admin@arpufrl.org',
        hashedPassword,
        phone: '+919876543210',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        region: 'National',
        referralCode: 'ADMIN001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'National Coordinator',
        email: 'national@arpufrl.org',
        hashedPassword,
        phone: '+919876543211',
        role: UserRole.NATIONAL_LEVEL,
        status: UserStatus.ACTIVE,
        region: 'National',
        referralCode: 'NAT001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'State Adhyaksh Maharashtra',
        email: 'state.mh@arpufrl.org',
        hashedPassword,
        phone: '+919876543212',
        role: UserRole.STATE_ADHYAKSH,
        status: UserStatus.ACTIVE,
        region: 'Maharashtra',
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
        referralCode: 'STDL001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Jila Coordinator Mumbai',
        email: 'jila.mumbai@arpufrl.org',
        hashedPassword,
        phone: '+919876543214',
        role: UserRole.JILA_COORDINATOR,
        status: UserStatus.ACTIVE,
        region: 'Mumbai',
        referralCode: 'JLMB001',
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
        referralCode: 'PRK001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Pending User',
        email: 'pending@arpufrl.org',
        hashedPassword,
        phone: '+919876543217',
        role: UserRole.NODEL,
        status: UserStatus.PENDING,
        region: 'Mumbai',
        referralCode: 'PND001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Inactive User',
        email: 'inactive@arpufrl.org',
        hashedPassword,
        phone: '+919876543218',
        role: UserRole.PRERNA_SAKHI,
        status: UserStatus.INACTIVE,
        region: 'Delhi',
        referralCode: 'INA001',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Test Donor',
        email: 'donor@example.com',
        hashedPassword,
        phone: '+919876543219',
        role: UserRole.DONOR,
        status: UserStatus.ACTIVE,
        region: 'Mumbai',
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
    console.log('\n📝 Login Instructions:')
    console.log('   1. Go to http://localhost:3000/login')
    console.log('   2. Use any email above with password: Test@123')
    console.log('   3. Admin users go to /dashboard/admin')
    console.log('   4. Coordinator users go to /dashboard/coordinator')
    console.log('')

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
