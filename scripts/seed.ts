import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { User, UserRole, UserStatus } from '../models/User'
import { Program } from '../models/Program'
import { Donation } from '../models/Donation'
import { ReferralCode } from '../models/ReferralCode'
import Target from '../models/Target'
import { Survey } from '../models/Survey'
import Contact from '../models/Contact'
import VolunteerRequest from '../models/VolunteerRequest'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in environment variables')
  process.exit(1)
}

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI!)
    console.log('✅ Connected to MongoDB')
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  }
}

async function clearDatabase() {
  console.log('\n🗑️  Clearing existing data...')
  await User.deleteMany({})
  await Program.deleteMany({})
  await Donation.deleteMany({})
  await ReferralCode.deleteMany({})
  await Target.deleteMany({})
  await Survey.deleteMany({})
  await Contact.deleteMany({})
  await VolunteerRequest.deleteMany({})
  console.log('✅ Database cleared')
}

async function seedUsers() {
  console.log('\n👥 Seeding users...')

  const hashedPassword = await bcrypt.hash('Password123!', 12)

  // Create Admin
  const admin = await User.create({
    name: 'System Administrator',
    email: 'admin@arpufrl.org',
    hashedPassword,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    phone: '+919919003332',
    region: 'National',
    emailVerified: new Date()
  })
  console.log('  ✓ Created Admin')

  // Create Central President
  const centralPresident = await User.create({
    name: 'Rajesh Kumar',
    email: 'rajesh@arpufrl.org',
    hashedPassword,
    role: UserRole.CENTRAL_PRESIDENT,
    status: UserStatus.ACTIVE,
    phone: '+919876543210',
    region: 'National',
    state: 'Delhi',
    emailVerified: new Date()
  })
  console.log('  ✓ Created Central President')

  // Create State Presidents
  const statePresident1 = await User.create({
    name: 'Priya Sharma',
    email: 'priya@arpufrl.org',
    hashedPassword,
    role: UserRole.STATE_PRESIDENT,
    status: UserStatus.ACTIVE,
    phone: '+919876543211',
    region: 'North',
    state: 'Uttar Pradesh',
    parentCoordinatorId: centralPresident._id,
    emailVerified: new Date()
  })

  const statePresident2 = await User.create({
    name: 'Amit Patel',
    email: 'amit@arpufrl.org',
    hashedPassword,
    role: UserRole.STATE_PRESIDENT,
    status: UserStatus.ACTIVE,
    phone: '+919876543212',
    region: 'West',
    state: 'Maharashtra',
    parentCoordinatorId: centralPresident._id,
    emailVerified: new Date()
  })
  console.log('  ✓ Created State Presidents (2)')

  // Create State Coordinators
  const stateCoordinator = await User.create({
    name: 'Sunita Verma',
    email: 'sunita@arpufrl.org',
    hashedPassword,
    role: UserRole.STATE_COORDINATOR,
    status: UserStatus.ACTIVE,
    phone: '+919876543213',
    region: 'North',
    state: 'Uttar Pradesh',
    parentCoordinatorId: statePresident1._id,
    emailVerified: new Date()
  })
  console.log('  ✓ Created State Coordinator')

  // Create District Presidents
  const districtPresident = await User.create({
    name: 'Vikram Singh',
    email: 'vikram@arpufrl.org',
    hashedPassword,
    role: UserRole.DISTRICT_PRESIDENT,
    status: UserStatus.ACTIVE,
    phone: '+919876543214',
    region: 'North',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    parentCoordinatorId: stateCoordinator._id,
    emailVerified: new Date()
  })
  console.log('  ✓ Created District President')

  // Create Block Coordinators
  const blockCoordinator = await User.create({
    name: 'Meera Joshi',
    email: 'meera@arpufrl.org',
    hashedPassword,
    role: UserRole.BLOCK_COORDINATOR,
    status: UserStatus.ACTIVE,
    phone: '+919876543215',
    region: 'North',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    block: 'Malihabad',
    parentCoordinatorId: districtPresident._id,
    emailVerified: new Date()
  })
  console.log('  ✓ Created Block Coordinator')

  // Create Volunteers
  const volunteers = await User.create([
    {
      name: 'Rahul Kumar',
      email: 'rahul@example.com',
      hashedPassword,
      role: UserRole.VOLUNTEER,
      status: UserStatus.ACTIVE,
      phone: '+919876543216',
      region: 'North',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      parentCoordinatorId: blockCoordinator._id,
      emailVerified: new Date()
    },
    {
      name: 'Anjali Singh',
      email: 'anjali@example.com',
      hashedPassword,
      role: UserRole.VOLUNTEER,
      status: UserStatus.ACTIVE,
      phone: '+919876543217',
      region: 'North',
      state: 'Uttar Pradesh',
      district: 'Lucknow',
      parentCoordinatorId: blockCoordinator._id,
      emailVerified: new Date()
    }
  ])
  console.log('  ✓ Created Volunteers (2)')

  console.log(`✅ Total users created: ${await User.countDocuments()}`)

  return {
    admin,
    centralPresident,
    statePresident1,
    statePresident2,
    stateCoordinator,
    districtPresident,
    blockCoordinator,
    volunteers
  }
}

async function seedPrograms() {
  console.log('\n📚 Seeding programs...')

  const programs = await Program.create([
    {
      name: 'Child & Women Welfare',
      slug: 'child-women-welfare',
      description: 'Programs for safety, health, and growth initiated for women and children. Uplifting lives with care and empowerment.',
      longDescription: 'Comprehensive programs focusing on maternal health, child nutrition, education for girls, women empowerment through skill development, and protection against violence and discrimination.',
      category: 'Social Welfare',
      goalAmount: 500000,
      raisedAmount: 125000,
      images: [],
      status: 'active',
      startDate: new Date('2024-01-01'),
      beneficiariesCount: 500
    },
    {
      name: 'Education & Empowerment',
      slug: 'education-empowerment',
      description: 'Workshops and classes conducted for youth and women. Boosting confidence, knowledge, and future independence together.',
      longDescription: 'Educational programs including digital literacy, vocational training, leadership development, and scholarship programs for underprivileged students.',
      category: 'Education',
      goalAmount: 750000,
      raisedAmount: 300000,
      images: [],
      status: 'active',
      startDate: new Date('2024-02-01'),
      beneficiariesCount: 1000
    },
    {
      name: 'Health & Hygiene',
      slug: 'health-hygiene',
      description: 'Awareness campaigns and health camps conducted regularly. Ensuring basic hygiene practices and improved community well-being always.',
      longDescription: 'Mobile health clinics, free medical camps, sanitation awareness, clean water initiatives, and preventive healthcare programs for rural communities.',
      category: 'Healthcare',
      goalAmount: 1000000,
      raisedAmount: 450000,
      images: [],
      status: 'active',
      startDate: new Date('2024-01-15'),
      beneficiariesCount: 2000
    },
    {
      name: 'Community Development',
      slug: 'community-development',
      description: 'Infrastructure, training, and sanitation efforts extended for underdeveloped regions. Ensuring dignity, progress, and basic human rights.',
      longDescription: 'Building community centers, improving infrastructure, providing clean water access, toilet construction, and community leadership training.',
      category: 'Infrastructure',
      goalAmount: 2000000,
      raisedAmount: 800000,
      images: [],
      status: 'active',
      startDate: new Date('2024-03-01'),
      beneficiariesCount: 5000
    },
    {
      name: 'Environmental Sustainability',
      slug: 'environmental-sustainability',
      description: 'Tree planting and clean-up drives conducted for eco-awareness. Dedicated work for a greener, cleaner environment.',
      longDescription: 'Plantation drives, waste management initiatives, renewable energy promotion, and environmental education programs.',
      category: 'Environment',
      goalAmount: 300000,
      raisedAmount: 150000,
      images: [],
      status: 'active',
      startDate: new Date('2024-04-01'),
      beneficiariesCount: 10000
    },
    {
      name: 'Senior Citizen Engagement',
      slug: 'senior-citizen-engagement',
      description: 'Wellness checkups and social activities arranged for elders. Ensuring a joyful, active, and respected life ahead.',
      longDescription: 'Regular health checkups, recreational activities, companionship programs, and elderly care facilities for senior citizens.',
      category: 'Senior Care',
      goalAmount: 400000,
      raisedAmount: 100000,
      images: [],
      status: 'active',
      startDate: new Date('2024-05-01'),
      beneficiariesCount: 300
    },
    {
      name: 'Employment & Livelihood',
      slug: 'employment-livelihood',
      description: 'Vocational training and placement support offered for youth. Creating sustainable income sources and boosting rural employment potential.',
      longDescription: 'Skill development programs, job placement assistance, entrepreneurship training, and support for small businesses.',
      category: 'Livelihood',
      goalAmount: 600000,
      raisedAmount: 200000,
      images: [],
      status: 'active',
      startDate: new Date('2024-02-15'),
      beneficiariesCount: 750
    }
  ])

  console.log(`✅ Programs created: ${programs.length}`)
  return programs
}

async function seedReferralCodes(users: any) {
  console.log('\n🔗 Seeding referral codes...')

  const usersToCreateCodes = [
    { user: users.centralPresident, type: 'COORDINATOR', prefix: 'CP' },
    { user: users.statePresident1, type: 'COORDINATOR', prefix: 'SP1' },
    { user: users.statePresident2, type: 'COORDINATOR', prefix: 'SP2' },
    { user: users.stateCoordinator, type: 'COORDINATOR', prefix: 'SC' },
    { user: users.districtPresident, type: 'COORDINATOR', prefix: 'DP' },
    { user: users.blockCoordinator, type: 'COORDINATOR', prefix: 'BC' }
  ]

  const codes = []
  for (const { user, type, prefix } of usersToCreateCodes) {
    const code = await ReferralCode.create({
      code: `${prefix}${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      type,
      ownerUserId: user._id,
      active: true,
      totalDonations: 0,
      totalAmount: 0
    })
    codes.push(code)
  }

  console.log(`✅ Referral codes created: ${codes.length}`)
  return codes
}

async function seedDonations(programs: any[], referralCodes: any[]) {
  console.log('\n💰 Seeding donations...')

  const donorNames = [
    'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Singh', 'Vikram Reddy',
    'Anjali Gupta', 'Rohit Verma', 'Meera Iyer', 'Sanjay Nair', 'Kavita Desai',
    'Rahul Mehta', 'Pooja Joshi', 'Arun Kumar', 'Neha Kapoor', 'Karan Singh',
    'Divya Rao', 'Suresh Pandey', 'Lakshmi Menon', 'Manoj Agarwal', 'Rekha Pillai'
  ]

  const donations = []

  // Create sample donations for different programs
  for (let i = 0; i < 20; i++) {
    const program = programs[i % programs.length]
    const referralCode = referralCodes[i % referralCodes.length]
    const amount = [1000, 2000, 5000, 10000, 25000][i % 5]
    const paymentMethods = ['RAZORPAY', 'CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE']

    const donation = await Donation.create({
      donorName: donorNames[i],
      donorEmail: `donor${i + 1}@example.com`,
      donorPhone: `+9198765432${String(i).padStart(2, '0')}`,
      amount,
      programId: program._id,
      paymentMethod: paymentMethods[i % paymentMethods.length],
      paymentStatus: 'SUCCESS',
      razorpayOrderId: `order_${Date.now()}${i}`,
      razorpayPaymentId: `pay_${Date.now()}${i}`,
      referralCodeId: referralCode._id,
      panCard: i % 3 === 0 ? `ABCDE${String(1000 + i).substring(0, 4)}F` : undefined,
      receiptGenerated: true,
      receiptNumber: `ARPU${new Date().getFullYear()}${String(1000 + i).padStart(4, '0')}`,
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
    })
    donations.push(donation)
  }

  console.log(`✅ Donations created: ${donations.length}`)
  return donations
}

async function seedTargets(users: any) {
  console.log('\n🎯 Seeding targets...')

  const targets = await Target.create([
    {
      assignedTo: users.statePresident1._id,
      assignedBy: users.admin._id,
      targetAmount: 500000,
      personalCollection: 125000,
      teamCollection: 0,
      totalCollection: 125000,
      level: 'state',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
      description: 'Monthly fundraising target for State President'
    },
    {
      assignedTo: users.stateCoordinator._id,
      assignedBy: users.statePresident1._id,
      targetAmount: 250000,
      personalCollection: 80000,
      teamCollection: 0,
      totalCollection: 80000,
      level: 'state_coord',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
      description: 'Monthly fundraising target for State Coordinator'
    },
    {
      assignedTo: users.districtPresident._id,
      assignedBy: users.stateCoordinator._id,
      targetAmount: 100000,
      personalCollection: 45000,
      teamCollection: 0,
      totalCollection: 45000,
      level: 'district_pres',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
      description: 'Monthly fundraising target for District President'
    },
    {
      assignedTo: users.blockCoordinator._id,
      assignedBy: users.districtPresident._id,
      targetAmount: 50000,
      personalCollection: 20000,
      teamCollection: 0,
      totalCollection: 20000,
      level: 'block',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: 'IN_PROGRESS',
      description: 'Monthly fundraising target for Block Coordinator'
    }
  ])

  console.log(`✅ Targets created: ${targets.length}`)
  return targets
}

async function seedSurveys(users: any) {
  console.log('\n📋 Seeding surveys...')

  const surveys = await Survey.create([
    {
      surveyType: 'HOSPITAL',
      status: 'SUBMITTED',
      location: 'Government Hospital, Block A',
      district: 'Lucknow',
      state: 'Uttar Pradesh',
      surveyorName: users.stateCoordinator.name,
      surveyorContact: users.stateCoordinator.phone,
      surveyDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      submittedBy: users.stateCoordinator._id,
      data: {
        hospitalName: 'Government Hospital Lucknow',
        totalBeds: 150,
        occupiedBeds: 120,
        facilities: ['Emergency', 'ICU', 'OPD'],
        staffCount: 45,
        needsAssessment: {
          medicalEquipment: 'High priority',
          medicines: 'Medium priority',
          infrastructure: 'Low priority'
        }
      }
    },
    {
      surveyType: 'SCHOOL',
      status: 'REVIEWED',
      location: 'Primary School, Village Rampur',
      district: 'Kanpur',
      state: 'Uttar Pradesh',
      surveyorName: users.blockCoordinator.name,
      surveyorContact: users.blockCoordinator.phone,
      surveyDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      submittedBy: users.blockCoordinator._id,
      reviewedBy: users.districtPresident._id,
      reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      data: {
        schoolName: 'Government Primary School',
        totalStudents: 250,
        teachers: 8,
        classrooms: 6,
        infrastructure: {
          library: false,
          playground: true,
          computerLab: false,
          drinkingWater: true
        },
        requirements: ['Books', 'Computers', 'Sports equipment']
      }
    },
    {
      surveyType: 'HEALTH_CAMP',
      status: 'SUBMITTED',
      location: 'Community Center, Sector 12',
      district: 'Varanasi',
      state: 'Uttar Pradesh',
      surveyorName: users.volunteers[0].name,
      surveyorContact: users.volunteers[0].phone,
      surveyDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      submittedBy: users.volunteers[0]._id,
      data: {
        campDate: new Date(),
        patientsAttended: 85,
        commonIssues: ['Diabetes', 'Hypertension', 'Eye problems'],
        medicinesDistributed: true,
        followUpRequired: 12
      }
    },
    {
      surveyType: 'COMMUNITY_WELFARE',
      status: 'SUBMITTED',
      location: 'Ward 5, Municipal Area',
      district: 'Prayagraj',
      state: 'Uttar Pradesh',
      surveyorName: users.volunteers[1].name,
      surveyorContact: users.volunteers[1].phone,
      surveyDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      submittedBy: users.volunteers[1]._id,
      data: {
        population: 5000,
        households: 850,
        mainIssues: ['Sanitation', 'Water supply', 'Street lights'],
        communityNeeds: {
          education: 'Computer training center',
          health: 'Regular health checkups',
          employment: 'Skill development programs'
        }
      }
    }
  ])

  console.log(`✅ Surveys created: ${surveys.length}`)
  return surveys
}

async function seedContacts() {
  console.log('\n📧 Seeding contact messages...')

  const contacts = await Contact.create([
    {
      name: 'Sanjay Gupta',
      email: 'sanjay@example.com',
      phone: '+919876543220',
      subject: 'Partnership Inquiry',
      message: 'I would like to discuss a partnership opportunity with your organization.',
      status: 'NEW'
    },
    {
      name: 'Neha Reddy',
      email: 'neha@example.com',
      phone: '+919876543221',
      subject: 'Volunteer Application',
      message: 'I am interested in volunteering for your education programs.',
      status: 'NEW'
    },
    {
      name: 'Karan Malhotra',
      email: 'karan@example.com',
      phone: '+919876543222',
      subject: 'General Inquiry',
      message: 'Can you provide more information about your ongoing programs?',
      status: 'RESOLVED'
    }
  ])

  console.log(`✅ Contact messages created: ${contacts.length}`)
  return contacts
}

async function seedVolunteerRequests(users: any) {
  console.log('\n🙋 Seeding volunteer requests...')

  const requests = await VolunteerRequest.create([
    {
      name: 'Deepak Sharma',
      email: 'deepak@example.com',
      phone: '9876543223',
      state: 'Uttar Pradesh',
      city: 'Lucknow',
      interests: ['TEACHING', 'SOCIAL_WORK'],
      message: 'I want to contribute to education in rural areas and help with community organizing',
      availability: 'Weekends',
      experience: '2 years of teaching experience',
      status: 'PENDING'
    },
    {
      name: 'Pooja Iyer',
      email: 'pooja@example.com',
      phone: '9876543224',
      state: 'Maharashtra',
      city: 'Mumbai',
      interests: ['HEALTHCARE', 'SOCIAL_WORK'],
      message: 'Passionate about healthcare for underprivileged communities',
      availability: 'Flexible',
      experience: 'Trained in first aid and healthcare basics',
      status: 'ACCEPTED',
      reviewedBy: users.admin._id,
      reviewedAt: new Date()
    },
    {
      name: 'Vikram Patel',
      email: 'vikram@example.com',
      phone: '9876543225',
      state: 'Gujarat',
      city: 'Ahmedabad',
      interests: ['FUNDRAISING', 'ADMINISTRATIVE'],
      message: 'I can help with fundraising activities and admin work',
      availability: 'Weekday evenings',
      status: 'REVIEWED'
    }
  ])

  console.log(`✅ Volunteer requests created: ${requests.length}`)
  return requests
}

async function seed() {
  try {
    console.log('🌱 Starting database seeding...\n')

    await connectDB()
    await clearDatabase()

    const users = await seedUsers()
    const programs = await seedPrograms()
    const referralCodes = await seedReferralCodes(users)
    await seedDonations(programs, referralCodes)
    await seedTargets(users)
    await seedSurveys(users)
    await seedContacts()
    await seedVolunteerRequests(users)

    console.log('\n✅ Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   Users: ${await User.countDocuments()}`)
    console.log(`   Programs: ${await Program.countDocuments()}`)
    console.log(`   Donations: ${await Donation.countDocuments()}`)
    console.log(`   Referral Codes: ${await ReferralCode.countDocuments()}`)
    console.log(`   Targets: ${await Target.countDocuments()}`)
    console.log(`   Surveys: ${await Survey.countDocuments()}`)
    console.log(`   Contacts: ${await Contact.countDocuments()}`)
    console.log(`   Volunteer Requests: ${await VolunteerRequest.countDocuments()}`)

    console.log('\n🔑 Login Credentials:')
    console.log('   Email: admin@arpufrl.org')
    console.log('   Password: Password123!')

  } catch (error) {
    console.error('❌ Seeding error:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('\n🔌 Database connection closed')
    process.exit(0)
  }
}

seed()
