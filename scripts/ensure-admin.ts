import { connectToDatabase } from '../lib/db'
import { User, UserRole, UserStatus } from '../models/User'

async function ensureAdminExists() {
  try {
    await connectToDatabase()

    const admin = await User.findOne({ role: UserRole.ADMIN })

    if (admin) {
      console.log('✓ ADMIN user found:', admin.name, '(' + admin.email + ')')
      return
    }

    console.log('✗ No ADMIN user found in database')
    console.log('Creating default ADMIN user...')

    const newAdmin = await User.createUser({
      name: 'System Administrator',
      email: 'admin@arpufrl.org',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      region: 'National'
    }, 'Admin@123456')

    console.log('✓ ADMIN user created successfully!')
    console.log('  Email:', newAdmin.email)
    console.log('  Password: Admin@123456')
    console.log('  Please change the password after first login.')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  process.exit(0)
}

ensureAdminExists()
