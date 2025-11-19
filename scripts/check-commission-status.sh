#!/bin/bash

# Check Commission System Status
# This script queries the database to verify commission distribution

echo "📊 Commission System Status Check"
echo "=================================="
echo ""

# Get MongoDB URI from .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

if [ -z "$MONGODB_URI" ]; then
    echo "❌ MONGODB_URI not found in .env.local"
    exit 1
fi

echo "1. Checking Commission Logs..."
echo "-----------------------------"
mongosh "$MONGODB_URI" --quiet --eval '
  const logs = db.commission_logs.find({}).sort({createdAt: -1}).limit(10).toArray();
  if (logs.length === 0) {
    print("⚠️  No commission logs found yet");
  } else {
    print(`✅ Found ${logs.length} recent commission logs:\n`);
    logs.forEach((log, i) => {
      print(`${i + 1}. ${log.userName} (${log.userRole})`);
      print(`   Commission: ₹${log.commissionAmount} (${log.commissionPercentage}%)`);
      print(`   Status: ${log.status}`);
      print(`   Donation: ${log.donationId}`);
      print("");
    });
  }
'

echo ""
echo "2. Checking User Commission Wallets..."
echo "--------------------------------------"
mongosh "$MONGODB_URI" --quiet --eval '
  const users = db.users.find(
    { commission_wallet: { $gt: 0 } },
    { name: 1, email: 1, role: 1, commission_wallet: 1 }
  ).sort({ commission_wallet: -1 }).toArray();
  
  if (users.length === 0) {
    print("⚠️  No users with commission wallet balance found");
  } else {
    print(`✅ Found ${users.length} users with commission earnings:\n`);
    users.forEach((user, i) => {
      print(`${i + 1}. ${user.name} (${user.role})`);
      print(`   Email: ${user.email}`);
      print(`   Wallet: ₹${user.commission_wallet || 0}`);
      print("");
    });
  }
'

echo ""
echo "3. Checking Recent Donations with Referrals..."
echo "----------------------------------------------"
mongosh "$MONGODB_URI" --quiet --eval '
  const donations = db.donations.find(
    { 
      referredBy: { $exists: true, $ne: null },
      paymentStatus: "SUCCESS"
    }
  ).sort({createdAt: -1}).limit(5).toArray();
  
  if (donations.length === 0) {
    print("⚠️  No successful donations with referrals found yet");
  } else {
    print(`✅ Found ${donations.length} recent referral donations:\n`);
    donations.forEach((donation, i) => {
      print(`${i + 1}. ${donation.donorName}`);
      print(`   Amount: ₹${donation.amount}`);
      print(`   Referred By: ${donation.referredBy}`);
      print(`   Status: ${donation.paymentStatus}`);
      print(`   Date: ${donation.createdAt}`);
      print("");
    });
  }
'

echo ""
echo "4. Commission System Summary..."
echo "-------------------------------"
mongosh "$MONGODB_URI" --quiet --eval '
  const totalCommissions = db.commission_logs.aggregate([
    { $group: { 
      _id: null, 
      total: { $sum: "$commissionAmount" },
      count: { $sum: 1 }
    }}
  ]).toArray();
  
  const pendingCommissions = db.commission_logs.aggregate([
    { $match: { status: "PENDING" } },
    { $group: { 
      _id: null, 
      total: { $sum: "$commissionAmount" },
      count: { $sum: 1 }
    }}
  ]).toArray();
  
  const paidCommissions = db.commission_logs.aggregate([
    { $match: { status: "PAID" } },
    { $group: { 
      _id: null, 
      total: { $sum: "$commissionAmount" },
      count: { $sum: 1 }
    }}
  ]).toArray();
  
  print("Total Commissions:");
  print(`  Amount: ₹${totalCommissions[0]?.total || 0}`);
  print(`  Count: ${totalCommissions[0]?.count || 0} transactions`);
  print("");
  
  print("Pending Commissions:");
  print(`  Amount: ₹${pendingCommissions[0]?.total || 0}`);
  print(`  Count: ${pendingCommissions[0]?.count || 0} transactions`);
  print("");
  
  print("Paid Commissions:");
  print(`  Amount: ₹${paidCommissions[0]?.total || 0}`);
  print(`  Count: ${paidCommissions[0]?.count || 0} transactions`);
'

echo ""
echo "✅ Commission system status check complete!"
