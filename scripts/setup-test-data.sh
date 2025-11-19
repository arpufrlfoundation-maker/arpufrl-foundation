#!/bin/bash

# Create Test Users and Referral Codes for Revenue System Testing

echo "🔧 SETTING UP TEST DATA FOR REVENUE SYSTEM"
echo "==========================================="
echo ""

# MongoDB connection
MONGODB_URI="mongodb+srv://ronakkumar20062006:6a3Z2VCGkXH0ZtL4@cluster0.969t4yr.mongodb.net/?appName=Cluster0"

print_success() { echo -e "\033[0;32m✅ $1\033[0m"; }
print_error() { echo -e "\033[0;31m❌ $1\033[0m"; }
print_info() { echo -e "\033[0;34mℹ️  $1\033[0m"; }

# Check if we can connect to MongoDB
print_info "Checking database connection..."

# Create test users with hierarchy using MongoDB compass or shell
cat << 'EOF'

To set up test data, run these MongoDB commands:

// 1. Create State Coordinator (Parent)
db.users.insertOne({
  name: "State Coordinator Test",
  email: "state-test@example.com",
  password: "$2a$10$dummy", // You need to hash this properly
  role: "STATE_COORDINATOR",
  state: "Test State",
  status: "ACTIVE",
  commission_wallet: 0,
  parentCoordinatorId: null,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Get the ID of the state coordinator
var stateId = db.users.findOne({email: "state-test@example.com"})._id

// 2. Create District Coordinator (Child)
db.users.insertOne({
  name: "District Coordinator Test",
  email: "district-test@example.com",
  password: "$2a$10$dummy",
  role: "DISTRICT_COORDINATOR",
  state: "Test State",
  district: "Test District",
  status: "ACTIVE",
  commission_wallet: 0,
  parentCoordinatorId: stateId,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Get the ID of the district coordinator
var districtId = db.users.findOne({email: "district-test@example.com"})._id

// 3. Create Volunteer (Grandchild)
db.users.insertOne({
  name: "Volunteer Test",
  email: "volunteer-test@example.com",
  password: "$2a$10$dummy",
  role: "VOLUNTEER",
  state: "Test State",
  district: "Test District",
  status: "ACTIVE",
  commission_wallet: 0,
  parentCoordinatorId: districtId,
  createdAt: new Date(),
  updatedAt: new Date()
})

// Get the ID of the volunteer
var volunteerId = db.users.findOne({email: "volunteer-test@example.com"})._id

// 4. Create Referral Codes
db.referral_codes.insertOne({
  code: "STATE-TEST-001",
  ownerUserId: stateId,
  active: true,
  totalDonations: 0,
  totalAmount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})

db.referral_codes.insertOne({
  code: "DISTRICT-TEST-001",
  ownerUserId: districtId,
  active: true,
  totalDonations: 0,
  totalAmount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})

db.referral_codes.insertOne({
  code: "VOLUNTEER-TEST-001",
  ownerUserId: volunteerId,
  active: true,
  totalDonations: 0,
  totalAmount: 0,
  createdAt: new Date(),
  updatedAt: new Date()
})

// 5. Verify the setup
print("\n=== VERIFICATION ===")
print("\nUsers:")
db.users.find(
  {email: {$in: ["state-test@example.com", "district-test@example.com", "volunteer-test@example.com"]}},
  {name: 1, email: 1, role: 1, parentCoordinatorId: 1, commission_wallet: 1}
).pretty()

print("\nReferral Codes:")
db.referral_codes.find(
  {code: {$regex: /TEST/}},
  {code: 1, ownerUserId: 1, active: 1, totalDonations: 1, totalAmount: 1}
).pretty()

print("\n=== TEST SETUP COMPLETE ===")
print("\nYou can now test with these referral codes:")
print("- STATE-TEST-001 (State Coordinator, 15% + hierarchy)")
print("- DISTRICT-TEST-001 (District Coordinator, 15% + hierarchy)")
print("- VOLUNTEER-TEST-001 (Volunteer, 5% + hierarchy)")

EOF

echo ""
print_info "To create test data, connect to MongoDB and run the commands above"
echo ""
print_info "Alternative: Check existing referral codes"
echo "Run this query to find existing codes:"
echo "  db.referral_codes.find({active: true}).limit(5)"
echo ""
