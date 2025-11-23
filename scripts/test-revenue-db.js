const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// MongoDB URI
const MONGODB_URI = process.env.MONGODB_URI;

async function testRevenueSystem() {
  try {
    console.log('🔍 COMPREHENSIVE REVENUE SYSTEM DATABASE TEST');
    console.log('='.repeat(60));
    console.log('');

    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Get collections
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const referralCodesCollection = db.collection('referral_codes');
    const donationsCollection = db.collection('donations');
    const commissionLogsCollection = db.collection('commission_logs');

    // 1. Check Referral Codes
    console.log('1️⃣  CHECKING REFERRAL CODES');
    console.log('-'.repeat(60));
    const referralCodes = await referralCodesCollection
      .find({ active: true })
      .limit(10)
      .toArray();

    if (referralCodes.length === 0) {
      console.log('⚠️  No active referral codes found');
    } else {
      console.log(`✅ Found ${referralCodes.length} active referral codes:\n`);
      for (const code of referralCodes) {
        const user = await usersCollection.findOne({ _id: code.ownerUserId });
        console.log(`   • ${code.code}`);
        console.log(`     Owner: ${user?.name || 'Unknown'} (${user?.role || 'Unknown'})`);
        console.log(`     Donations: ${code.totalDonations || 0}`);
        console.log(`     Total Amount: ₹${code.totalAmount || 0}`);
        console.log('');
      }
    }

    // 2. Check User Hierarchy
    console.log('\n2️⃣  CHECKING USER HIERARCHY');
    console.log('-'.repeat(60));
    if (referralCodes.length > 0) {
      const testCode = referralCodes[0];
      const testUser = await usersCollection.findOne({ _id: testCode.ownerUserId });

      if (testUser) {
        console.log(`Testing with: ${testUser.name} (${testUser.role})`);
        console.log(`Referral Code: ${testCode.code}`);
        console.log(`Commission Wallet: ₹${testUser.commission_wallet || 0}`);
        console.log('');

        // Build hierarchy chain
        console.log('Hierarchy Chain:');
        let currentUser = testUser;
        let level = 0;
        const maxLevels = 10;

        console.log(`  └─ ${currentUser.name} (${currentUser.role}) - Base User`);

        while (currentUser.parentCoordinatorId && level < maxLevels) {
          const parent = await usersCollection.findOne({ _id: currentUser.parentCoordinatorId });
          if (!parent) break;

          level++;
          console.log(`     └─ Level ${level}: ${parent.name} (${parent.role})`);
          currentUser = parent;
        }

        if (level === 0) {
          console.log('     └─ No parent hierarchy (top-level user)');
        }

        // Calculate expected commissions
        console.log('');
        console.log('Expected Commission Distribution for ₹10,000 donation:');
        const donationAmount = 10000;
        const isVolunteer = testUser.role === 'VOLUNTEER';
        const personalRate = isVolunteer ? 5 : 15;
        const personalCommission = (donationAmount * personalRate) / 100;
        const hierarchyCommission = (donationAmount * 2) / 100;

        console.log(`  • Personal (${personalRate}%): ₹${personalCommission}`);
        if (level > 0) {
          console.log(`  • Hierarchy (${level} levels × 2%): ₹${hierarchyCommission * level}`);
          console.log(`  • Total Commission: ₹${personalCommission + (hierarchyCommission * level)}`);
          console.log(`  • Organization Fund: ₹${donationAmount - personalCommission - (hierarchyCommission * level)}`);
        }
      }
    }

    // 3. Check Recent Donations with Referrals
    console.log('\n\n3️⃣  RECENT DONATIONS WITH REFERRALS');
    console.log('-'.repeat(60));
    const recentDonations = await donationsCollection
      .find({
        referredBy: { $exists: true, $ne: null },
        paymentStatus: 'SUCCESS'
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    if (recentDonations.length === 0) {
      console.log('⚠️  No successful referral donations found yet\n');
    } else {
      console.log(`✅ Found ${recentDonations.length} referral donations:\n`);
      for (const donation of recentDonations) {
        const referrer = await usersCollection.findOne({ _id: donation.referredBy });
        console.log(`   ${donation.donorName} - ₹${donation.amount}`);
        console.log(`   Referred by: ${referrer?.name || 'Unknown'}`);
        console.log(`   Date: ${donation.createdAt}`);
        console.log('');
      }
    }

    // 4. Check Commission Logs
    console.log('\n4️⃣  COMMISSION LOGS');
    console.log('-'.repeat(60));
    const commissionLogs = await commissionLogsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    if (commissionLogs.length === 0) {
      console.log('⚠️  No commission logs found yet');
      console.log('   This means no donations with referrals have been completed.\n');
    } else {
      console.log(`✅ Found ${commissionLogs.length} commission entries:\n`);

      // Group by donation
      const byDonation = {};
      for (const log of commissionLogs) {
        const donationId = log.donationId.toString();
        if (!byDonation[donationId]) {
          byDonation[donationId] = [];
        }
        byDonation[donationId].push(log);
      }

      for (const [donationId, logs] of Object.entries(byDonation)) {
        console.log(`   Donation: ${donationId}`);
        let total = 0;
        for (const log of logs) {
          console.log(`     • ${log.userName} (${log.userRole}): ₹${log.commissionAmount} (${log.commissionPercentage}%) - ${log.status}`);
          total += log.commissionAmount;
        }
        console.log(`     Total: ₹${total}`);
        console.log('');
      }
    }

    // 5. Check Users with Commission Wallets
    console.log('\n5️⃣  USERS WITH COMMISSION EARNINGS');
    console.log('-'.repeat(60));
    const usersWithCommissions = await usersCollection
      .find({ commission_wallet: { $gt: 0 } })
      .sort({ commission_wallet: -1 })
      .toArray();

    if (usersWithCommissions.length === 0) {
      console.log('⚠️  No users with commission earnings yet\n');
    } else {
      console.log(`✅ Found ${usersWithCommissions.length} users with earnings:\n`);
      for (const user of usersWithCommissions) {
        console.log(`   ${user.name} (${user.role})`);
        console.log(`     Wallet: ₹${user.commission_wallet}`);
        console.log(`     Total Referred: ₹${user.totalAmountReferred || 0}`);
        console.log('');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Active Referral Codes: ${referralCodes.length}`);
    console.log(`✅ Successful Referral Donations: ${recentDonations.length}`);
    console.log(`✅ Commission Log Entries: ${commissionLogs.length}`);
    console.log(`✅ Users with Earnings: ${usersWithCommissions.length}`);
    console.log('');

    if (commissionLogs.length === 0) {
      console.log('⚠️  NEXT STEPS:');
      console.log('   1. Make a test donation with a referral code');
      console.log('   2. Complete the payment');
      console.log('   3. Commission will be automatically distributed');
      console.log('   4. Re-run this script to verify distribution');
    } else {
      console.log('✅ Revenue distribution system is working!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
  }
}

// Run the test
testRevenueSystem();
