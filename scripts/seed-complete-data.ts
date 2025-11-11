/**
 * Comprehensive Seed Data Script
 * Seeds the database with realistic data for testing and development:
 * - Users (including coordinators at different hierarchy levels)
 * - Programs
 * - Donations
 * - Referral Codes
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectToDatabase } from '../lib/db'
import { User, UserRole, UserStatus } from '../models/User'
import { Program } from '../models/Program'
import { Donation, PaymentStatus, Currency } from '../models/Donation'
import { ReferralCode } from '../models/ReferralCode'

// Seed configuration
const SEED_CONFIG = {
  users: 50, // Total users to create
  coordinators: 20, // Coordinators at various levels
  volunteers: 30, // Volunteers
  programs: 8, // Programs to create
  donations: 100, // Total donations
  daysBack: 90 // Historical data range in days
}

// Indian names for realistic data
const INDIAN_FIRST_NAMES = [
  'Rahul', 'Priya', 'Amit', 'Sneha', 'Rajesh', 'Anjali', 'Vikram', 'Pooja',
  'Arjun', 'Divya', 'Suresh', 'Kavita', 'Anil', 'Meera', 'Karan', 'Nisha',
  'Ravi', 'Shalini', 'Manoj', 'Rani', 'Deepak', 'Sunita', 'Ajay', 'Rekha',
  'Sandeep', 'Geeta', 'Mohit', 'Shilpa', 'Ramesh', 'Preeti', 'Nitin', 'Swati',
  'Vishal', 'Madhuri', 'Sachin', 'Pallavi', 'Rohit', 'Neha', 'Ashok', 'Vidya'
]

const INDIAN_LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Kumar', 'Singh', 'Patel', 'Reddy', 'Joshi',
  'Nair', 'Rao', 'Desai', 'Mehta', 'Shah', 'Agarwal', 'Chopra', 'Kapoor',
  'Malhotra', 'Sinha', 'Iyer', 'Menon', 'Kulkarni', 'Pandey', 'Mishra', 'Tiwari'
]

const INDIAN_STATES = [
  'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan',
  'Uttar Pradesh', 'West Bengal', 'Delhi', 'Punjab', 'Haryana'
]

const DISTRICTS_BY_STATE: Record<string, string[]> = {
  'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
  'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum'],
  'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem'],
  'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar'],
  'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer'],
  'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi'],
  'West Bengal': ['Kolkata', 'Howrah', 'Siliguri', 'Durgapur', 'Asansol'],
  'Delhi': ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
  'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda'],
  'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Karnal']
}

const PROGRAM_DATA = [
  {
    name: 'Education for All',
    description: 'Providing quality education to underprivileged children across India',
    longDescription: 'Our Education for All program aims to bridge the educational gap by providing free schooling, books, uniforms, and nutritious meals to children from economically disadvantaged backgrounds. We believe every child deserves access to quality education.',
    targetAmount: 5000000,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    featured: true,
    priority: 10
  },
  {
    name: 'Healthcare Access',
    description: 'Bringing healthcare services to rural and underserved communities',
    longDescription: 'The Healthcare Access program establishes mobile medical units and health camps in remote villages, providing free medical consultations, medicines, and health awareness programs to communities with limited access to healthcare facilities.',
    targetAmount: 3000000,
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
    featured: true,
    priority: 9
  },
  {
    name: 'Women Empowerment',
    description: 'Skill development and entrepreneurship for women',
    longDescription: 'This program focuses on empowering women through vocational training, financial literacy workshops, and support for small business ventures. We provide the tools and resources needed for women to achieve economic independence.',
    targetAmount: 2500000,
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800',
    featured: false,
    priority: 8
  },
  {
    name: 'Clean Water Initiative',
    description: 'Ensuring access to safe drinking water in rural areas',
    longDescription: 'Installing water purification systems and building sustainable water infrastructure in villages lacking clean water access. This program has already benefited over 50,000 families.',
    targetAmount: 4000000,
    image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800',
    featured: true,
    priority: 9
  },
  {
    name: 'Rural Development',
    description: 'Infrastructure and livelihood development in rural India',
    longDescription: 'Comprehensive rural development program focusing on road infrastructure, sanitation facilities, and sustainable agriculture practices to improve the quality of life in rural communities.',
    targetAmount: 6000000,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
    featured: false,
    priority: 7
  },
  {
    name: 'Digital Literacy',
    description: 'Teaching computer and internet skills to youth and adults',
    longDescription: 'Bridging the digital divide by establishing computer centers in rural areas and providing free training in basic computing, internet usage, and digital payment systems.',
    targetAmount: 2000000,
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
    featured: false,
    priority: 6
  },
  {
    name: 'Elderly Care',
    description: 'Support and healthcare services for senior citizens',
    longDescription: 'Providing medical care, companionship, and social activities for elderly individuals who lack family support. Includes regular health check-ups and assistance with daily living activities.',
    targetAmount: 1500000,
    image: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=800',
    featured: false,
    priority: 5
  },
  {
    name: 'Environmental Conservation',
    description: 'Tree plantation and waste management initiatives',
    longDescription: 'Large-scale tree plantation drives, waste segregation awareness programs, and plastic-free community initiatives to combat climate change and promote environmental sustainability.',
    targetAmount: 3500000,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
    featured: true,
    priority: 8
  }
]

// Helper functions
function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(daysBack: number): Date {
  const now = new Date()
  const pastDate = new Date(now.getTime() - (Math.random() * daysBack * 24 * 60 * 60 * 1000))
  return pastDate
}

function generatePhone(): string {
  return `${randomInt(7, 9)}${randomInt(100000000, 999999999)}`
}

function generateEmail(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`
}

function generateAddress(district: string, state: string): string {
  const streetNum = randomInt(1, 500)
  const areas = ['Sector', 'Block', 'Lane', 'Street', 'Colony', 'Nagar']
  const area = randomElement(areas)
  return `${streetNum} ${area} ${randomInt(1, 50)}, ${district}, ${state}`
}

// Role distribution for coordinators (following hierarchy)
const COORDINATOR_ROLES = [
  { role: UserRole.CENTRAL_PRESIDENT, count: 1 },
  { role: UserRole.STATE_PRESIDENT, count: 2 },
  { role: UserRole.STATE_COORDINATOR, count: 2 },
  { role: UserRole.ZONE_COORDINATOR, count: 3 },
  { role: UserRole.DISTRICT_PRESIDENT, count: 3 },
  { role: UserRole.DISTRICT_COORDINATOR, count: 3 },
  { role: UserRole.BLOCK_COORDINATOR, count: 3 },
  { role: UserRole.NODAL_OFFICER, count: 1 },
  { role: UserRole.PRERAK, count: 1 },
  { role: UserRole.PRERNA_SAKHI, count: 1 }
]

async function seedUsers() {
  console.log('🌱 Seeding users...')

  const password = await bcrypt.hash('Password@123', 12)
  const createdUsers: any[] = []

  // Create coordinators with proper hierarchy
  // First, create Central President (no parent needed)
  const centralPresident = {
    name: 'Rajesh Kumar',
    fatherName: 'Suresh Kumar',
    email: 'rajesh.kumar@example.com',
    phone: generatePhone(),
    hashedPassword: password,
    role: UserRole.CENTRAL_PRESIDENT,
    status: UserStatus.ACTIVE,
    address: generateAddress('New Delhi', 'Delhi'),
    district: 'New Delhi',
    state: 'Delhi',
    region: 'New Delhi, Delhi',
    uniqueId: `AF${Date.now()}${randomInt(1000, 9999)}`,
    referralCode: `CP${randomInt(100, 999)}`,
    profilePhoto: 'https://ui-avatars.com/api/?name=Rajesh+Kumar&background=random',
    createdAt: randomDate(SEED_CONFIG.daysBack)
  }

  const cpUser = await User.create(centralPresident)
  createdUsers.push(cpUser)
  console.log('  ✓ Created Central President')

  // Create State Presidents under Central President
  const statePresidents: any[] = []
  for (let i = 0; i < 2; i++) {
    const firstName = randomElement(INDIAN_FIRST_NAMES)
    const lastName = randomElement(INDIAN_LAST_NAMES)
    const state = INDIAN_STATES[i]
    const district = DISTRICTS_BY_STATE[state][0]

    const sp = await User.create({
      name: `${firstName} ${lastName}`,
      fatherName: `${randomElement(INDIAN_FIRST_NAMES)} ${lastName}`,
      email: generateEmail(`${firstName}_${lastName}_sp`),
      phone: generatePhone(),
      hashedPassword: password,
      role: UserRole.STATE_PRESIDENT,
      status: UserStatus.ACTIVE,
      address: generateAddress(district, state),
      district: district,
      state: state,
      region: `${district}, ${state}`,
      uniqueId: `AF${Date.now()}${randomInt(1000, 9999)}`,
      referralCode: `SP${randomInt(100, 999)}`,
      parentCoordinatorId: cpUser._id,
      profilePhoto: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
      createdAt: randomDate(SEED_CONFIG.daysBack)
    })
    statePresidents.push(sp)
    createdUsers.push(sp)
  }
  console.log('  ✓ Created State Presidents')

  // Create State Coordinators
  const stateCoordinators: any[] = []
  for (let i = 0; i < 2; i++) {
    const firstName = randomElement(INDIAN_FIRST_NAMES)
    const lastName = randomElement(INDIAN_LAST_NAMES)
    const parent = statePresidents[i % statePresidents.length]

    const sc = await User.create({
      name: `${firstName} ${lastName}`,
      fatherName: `${randomElement(INDIAN_FIRST_NAMES)} ${lastName}`,
      email: generateEmail(`${firstName}_${lastName}_sc`),
      phone: generatePhone(),
      hashedPassword: password,
      role: UserRole.STATE_COORDINATOR,
      status: UserStatus.ACTIVE,
      address: parent.address,
      district: parent.district,
      state: parent.state,
      region: parent.region,
      uniqueId: `AF${Date.now()}${randomInt(1000, 9999)}`,
      referralCode: `SC${randomInt(100, 999)}`,
      parentCoordinatorId: parent._id,
      profilePhoto: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
      createdAt: randomDate(SEED_CONFIG.daysBack)
    })
    stateCoordinators.push(sc)
    createdUsers.push(sc)
  }
  console.log('  ✓ Created State Coordinators')

  // Create lower-level coordinators
  const lowerCoordinators: any[] = []
  const lowerRoles = [
    { role: UserRole.ZONE_COORDINATOR, count: 3, prefix: 'ZC' },
    { role: UserRole.DISTRICT_PRESIDENT, count: 3, prefix: 'DP' },
    { role: UserRole.DISTRICT_COORDINATOR, count: 3, prefix: 'DC' },
    { role: UserRole.BLOCK_COORDINATOR, count: 3, prefix: 'BC' },
    { role: UserRole.NODAL_OFFICER, count: 2, prefix: 'NO' },
    { role: UserRole.PRERAK, count: 2, prefix: 'PR' },
    { role: UserRole.PRERNA_SAKHI, count: 2, prefix: 'PS' }
  ]

  let parentPool = [...stateCoordinators]

  for (const roleConfig of lowerRoles) {
    for (let i = 0; i < roleConfig.count; i++) {
      const firstName = randomElement(INDIAN_FIRST_NAMES)
      const lastName = randomElement(INDIAN_LAST_NAMES)
      const parent = randomElement(parentPool.length > 0 ? parentPool : stateCoordinators)

      const user = await User.create({
        name: `${firstName} ${lastName}`,
        fatherName: `${randomElement(INDIAN_FIRST_NAMES)} ${lastName}`,
        email: generateEmail(`${firstName}_${lastName}_${roleConfig.prefix.toLowerCase()}`),
        phone: generatePhone(),
        hashedPassword: password,
        role: roleConfig.role,
        status: UserStatus.ACTIVE,
        address: parent.address,
        district: parent.district,
        state: parent.state,
        region: parent.region,
        uniqueId: `AF${Date.now()}${randomInt(1000, 9999)}`,
        referralCode: `${roleConfig.prefix}${randomInt(100, 999)}`,
        parentCoordinatorId: parent._id,
        profilePhoto: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
        createdAt: randomDate(SEED_CONFIG.daysBack)
      })
      lowerCoordinators.push(user)
      createdUsers.push(user)
    }
    console.log(`  ✓ Created ${roleConfig.role}s`)
    // Update parent pool for next level
    if (lowerCoordinators.length > 0) {
      parentPool = [...lowerCoordinators]
    }
  }

  // Create volunteers (no parent required)
  for (let i = 0; i < SEED_CONFIG.volunteers; i++) {
    const firstName = randomElement(INDIAN_FIRST_NAMES)
    const lastName = randomElement(INDIAN_LAST_NAMES)
    const state = randomElement(INDIAN_STATES)
    const district = randomElement(DISTRICTS_BY_STATE[state])

    const volunteer = await User.create({
      name: `${firstName} ${lastName}`,
      fatherName: `${randomElement(INDIAN_FIRST_NAMES)} ${lastName}`,
      email: generateEmail(`${firstName}_${lastName}_vol_${i}`),
      phone: generatePhone(),
      hashedPassword: password,
      role: UserRole.VOLUNTEER,
      status: i < 25 ? UserStatus.ACTIVE : UserStatus.PENDING,
      address: generateAddress(district, state),
      district: district,
      state: state,
      region: `${district}, ${state}`,
      uniqueId: `AF${Date.now()}${randomInt(1000, 9999)}`,
      profilePhoto: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`,
      createdAt: randomDate(SEED_CONFIG.daysBack)
    })
    createdUsers.push(volunteer)
  }
  console.log('  ✓ Created Volunteers')

  console.log(`✅ Created ${createdUsers.length} users`)
  return createdUsers
}async function seedPrograms() {
  console.log('🌱 Seeding programs...')

  const programs = []

  for (const programData of PROGRAM_DATA) {
    const slug = programData.name.toLowerCase().replace(/\s+/g, '-')
    programs.push({
      ...programData,
      slug,
      raisedAmount: 0,
      donationCount: 0,
      active: true,
      createdAt: randomDate(SEED_CONFIG.daysBack)
    })
  }

  const createdPrograms = await Program.insertMany(programs)
  console.log(`✅ Created ${createdPrograms.length} programs`)
  return createdPrograms
}

async function seedDonations(users: any[], programs: any[]) {
  console.log('🌱 Seeding donations...')

  const donations = []

  // Get only active coordinators for referral codes
  const activeCoordinators = users.filter(u =>
    u.status === UserStatus.ACTIVE && u.role !== UserRole.VOLUNTEER
  )

  for (let i = 0; i < SEED_CONFIG.donations; i++) {
    const firstName = randomElement(INDIAN_FIRST_NAMES)
    const lastName = randomElement(INDIAN_LAST_NAMES)
    const donorName = `${firstName} ${lastName}`
    const program = randomElement(programs)
    const coordinator = randomElement(activeCoordinators)

    const amount = [500, 1000, 2000, 5000, 10000, 25000, 50000][randomInt(0, 6)]
    const createdAt = randomDate(SEED_CONFIG.daysBack)

    donations.push({
      donorName,
      donorEmail: generateEmail(donorName),
      donorPhone: generatePhone(),
      amount,
      currency: Currency.INR,
      programId: program._id,
      referralCode: coordinator.referralCode,
      coordinatorId: coordinator._id,
      paymentStatus: PaymentStatus.SUCCESS,
      razorpayOrderId: `order_${Date.now()}${randomInt(10000, 99999)}`,
      razorpayPaymentId: `pay_${Date.now()}${randomInt(10000, 99999)}`,
      razorpaySignature: `sig_${Date.now()}${randomInt(10000, 99999)}`,
      isAnonymous: Math.random() < 0.1,
      hideFromPublicDisplay: Math.random() < 0.05,
      privacyConsentGiven: true,
      dataProcessingConsent: true,
      marketingConsent: Math.random() < 0.7,
      showAmountPublicly: Math.random() < 0.9,
      createdAt,
      updatedAt: createdAt
    })
  }

  const createdDonations = await Donation.insertMany(donations)
  console.log(`✅ Created ${createdDonations.length} donations`)

  // Update program funding stats
  console.log('📊 Updating program statistics...')
  for (const program of programs) {
    await program.updateFundingStats()
  }
  console.log('✅ Updated program statistics')

  return createdDonations
}

async function seedReferralCodes(users: any[]) {
  console.log('🌱 Seeding referral codes...')

  const referralCodes = []
  const coordinators = users.filter(u => u.role !== UserRole.VOLUNTEER)

  for (const coordinator of coordinators) {
    if (coordinator.referralCode) {
      referralCodes.push({
        code: coordinator.referralCode,
        ownerUserId: coordinator._id,
        type: 'COORDINATOR',
        region: coordinator.region,
        active: coordinator.status === UserStatus.ACTIVE,
        totalDonations: 0,
        totalAmount: 0,
        createdAt: coordinator.createdAt
      })
    }
  }

  const createdCodes = await ReferralCode.insertMany(referralCodes)
  console.log(`✅ Created ${createdCodes.length} referral codes`)

  // Update referral code stats
  console.log('📊 Updating referral code statistics...')
  await ReferralCode.updateAllStats()
  console.log('✅ Updated referral code statistics')

  return createdCodes
}

async function main() {
  try {
    console.log('🚀 Starting comprehensive database seeding...\n')

    // Connect to database
    await connectToDatabase()
    console.log('✅ Connected to database\n')

    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await User.deleteMany({ email: { $regex: '@example.com$' } })
    await Program.deleteMany({})
    await Donation.deleteMany({})
    await ReferralCode.deleteMany({})
    console.log('✅ Cleared existing seed data\n')

    // Seed data in order
    const users = await seedUsers()
    console.log()

    const programs = await seedPrograms()
    console.log()

    const donations = await seedDonations(users, programs)
    console.log()

    const referralCodes = await seedReferralCodes(users)
    console.log()

    // Summary
    console.log('━'.repeat(50))
    console.log('📈 SEEDING SUMMARY')
    console.log('━'.repeat(50))
    console.log(`👥 Users: ${users.length}`)
    console.log(`   ├─ Coordinators: ${users.filter(u => u.role !== UserRole.VOLUNTEER).length}`)
    console.log(`   └─ Volunteers: ${users.filter(u => u.role === UserRole.VOLUNTEER).length}`)
    console.log(`📋 Programs: ${programs.length}`)
    console.log(`💰 Donations: ${donations.length}`)
    const totalRaised = donations.reduce((sum, d) => sum + d.amount, 0)
    console.log(`   └─ Total Amount: ₹${totalRaised.toLocaleString('en-IN')}`)
    console.log(`🔗 Referral Codes: ${referralCodes.length}`)
    console.log('━'.repeat(50))
    console.log('\n✨ Database seeding completed successfully!')
    console.log('\n📝 Test Credentials:')
    console.log('   Email: Any user email ending with @example.com')
    console.log('   Password: Password@123')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('\n👋 Disconnected from database')
  }
}

// Run the seeding script
main()
