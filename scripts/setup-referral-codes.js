const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function setupTestData() {
  try {
    console.log('🔧 SETTING UP TEST DATA FOR REVENUE SYSTEM');
    console.log('='.repeat(60));
    console.log('');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const referralCodesCollection = db.collection('referral_codes');

    // 1. Check existing users
    console.log('1️⃣  CHECKING EXISTING USERS');
    console.log('-'.repeat(60));
    const users = await usersCollection
      .find({ role: { $ne: 'ADMIN' }, status: 'ACTIVE' })
      .limit(10)
      .toArray();

    if (users.length === 0) {
      console.log('⚠️  No active users found (except admin)');
      console.log('   Need to create users first through the application\n');
      return;
    }

    console.log(`✅ Found ${users.length} active users:\n`);
    for (const user of users) {
      console.log(`   ${user.name} (${user.role}) - ${user.email}`);
    }

    // 2. Create referral codes for users
    console.log('\n2️⃣  CREATING REFERRAL CODES');
    console.log('-'.repeat(60));

    let created = 0;
    for (const user of users) {
      // Check if already has a referral code
      const existing = await referralCodesCollection.findOne({ ownerUserId: user._id });

      if (existing) {
        console.log(`   ⏭️  ${user.name} already has code: ${existing.code}`);
        continue;
      }

      // Generate code based on role and name
      const rolePrefix = {
        'STATE_COORDINATOR': 'STATE',
        'DISTRICT_COORDINATOR': 'DIST',
        'ZONE_COORDINATOR': 'ZONE',
        'BLOCK_COORDINATOR': 'BLOCK',
        'VOLUNTEER': 'VOL'
      }[user.role] || 'REF';

      const namePart = user.name.split(' ')[0].toUpperCase().substring(0, 4);
      const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const code = `${rolePrefix}-${namePart}-${randomPart}`;

      // Create referral code
      await referralCodesCollection.insertOne({
        code: code,
        ownerUserId: user._id,
        active: true,
        totalDonations: 0,
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`   ✅ Created ${code} for ${user.name}`);
      created++;
    }

    console.log(`\n✅ Created ${created} new referral codes`);

    // 3. Display all codes
    console.log('\n3️⃣  ALL ACTIVE REFERRAL CODES');
    console.log('-'.repeat(60));
    const allCodes = await referralCodesCollection
      .find({ active: true })
      .toArray();

    for (const code of allCodes) {
      const user = await usersCollection.findOne({ _id: code.ownerUserId });
      console.log(`   ${code.code} → ${user?.name || 'Unknown'} (${user?.role || 'Unknown'})`);
    }

    console.log('\n✅ Test data setup complete!');
    console.log('\nYou can now test donations with these referral codes.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

setupTestData();
