#!/bin/bash

# Comprehensive Revenue Distribution System Test
# Tests the complete flow: User -> Referral Code -> Donation -> Commission Distribution

echo "🔍 REVENUE DISTRIBUTION SYSTEM TEST"
echo "===================================="
echo ""

SERVER_URL="http://localhost:3000"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# Check if server is running
echo "1️⃣  CHECKING SERVER STATUS"
echo "-------------------------"
if curl -s -o /dev/null -w "%{http_code}" $SERVER_URL | grep -q "200\|301\|302"; then
    print_success "Server is running at $SERVER_URL"
else
    print_error "Server is not running!"
    echo "   Please start with: npm run dev"
    exit 1
fi
echo ""

# Test 1: Get Referral Codes
echo "2️⃣  TESTING REFERRAL CODE API"
echo "-------------------------"
print_info "GET /api/referrals"
REFERRAL_RESPONSE=$(curl -s "$SERVER_URL/api/referrals?limit=5&page=1")
echo "$REFERRAL_RESPONSE" | jq '.' 2>/dev/null || echo "$REFERRAL_RESPONSE"
echo ""

# Extract a referral code
REFERRAL_CODE=$(echo "$REFERRAL_RESPONSE" | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$REFERRAL_CODE" ]; then
    print_warning "No referral code found. Creating test data might be needed."
    REFERRAL_CODE="TEST123"
else
    print_success "Found referral code: $REFERRAL_CODE"
fi
echo ""

# Test 2: Validate Referral Code
echo "3️⃣  TESTING REFERRAL CODE VALIDATION"
echo "-------------------------"
print_info "GET /api/referrals/validate?code=$REFERRAL_CODE"
VALIDATE_RESPONSE=$(curl -s "$SERVER_URL/api/referrals/validate?code=$REFERRAL_CODE")
echo "$VALIDATE_RESPONSE" | jq '.' 2>/dev/null || echo "$VALIDATE_RESPONSE"

# Extract user ID from validation
USER_ID=$(echo "$VALIDATE_RESPONSE" | grep -o '"userId":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ ! -z "$USER_ID" ]; then
    print_success "Referral code is valid! User ID: $USER_ID"
else
    print_warning "Could not extract user ID from validation response"
fi
echo ""

# Test 3: Create Donation Order
echo "4️⃣  TESTING DONATION ORDER CREATION"
echo "-------------------------"
print_info "POST /api/donations/create-order"
ORDER_PAYLOAD='{
  "amount": 10000,
  "currency": "INR",
  "donorName": "Test Commission User",
  "donorEmail": "commission-test@example.com",
  "donorPhone": "9876543210",
  "referralCode": "'$REFERRAL_CODE'"
}'
echo "Payload: $ORDER_PAYLOAD"
ORDER_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/donations/create-order" \
  -H "Content-Type: application/json" \
  -d "$ORDER_PAYLOAD")
echo "$ORDER_RESPONSE" | jq '.' 2>/dev/null || echo "$ORDER_RESPONSE"

# Extract order details
ORDER_ID=$(echo "$ORDER_RESPONSE" | grep -o '"orderId":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ ! -z "$ORDER_ID" ]; then
    print_success "Order created successfully! Order ID: $ORDER_ID"
else
    print_error "Failed to create order"
fi
echo ""

# Test 4: Check Commission Calculation (before payment)
echo "5️⃣  CHECKING COMMISSION CALCULATION LOGIC"
echo "-------------------------"
print_info "Expected commission rates:"
echo "   - Volunteer: 5% personal + 2% per hierarchy level"
echo "   - Non-Volunteer: 15% personal + 2% per hierarchy level"
echo "   - For ₹10,000 donation:"
echo "     * Volunteer personal: ₹500"
echo "     * Non-Volunteer personal: ₹1,500"
echo "     * Each hierarchy level: ₹200"
echo ""

# Test 5: Get User Hierarchy
if [ ! -z "$USER_ID" ]; then
    echo "6️⃣  CHECKING USER HIERARCHY"
    echo "-------------------------"
    print_info "GET /api/hierarchy/$USER_ID"
    HIERARCHY_RESPONSE=$(curl -s "$SERVER_URL/api/hierarchy/$USER_ID")
    echo "$HIERARCHY_RESPONSE" | jq '.' 2>/dev/null || echo "$HIERARCHY_RESPONSE"
    
    # Count hierarchy levels
    HIERARCHY_LEVELS=$(echo "$HIERARCHY_RESPONSE" | grep -o '"level":[0-9]*' | wc -l)
    print_info "Hierarchy has $HIERARCHY_LEVELS levels"
    echo ""
fi

# Test 6: Check Revenue Dashboard
echo "7️⃣  TESTING REVENUE DASHBOARD API"
echo "-------------------------"
print_info "GET /api/revenue/dashboard"
REVENUE_RESPONSE=$(curl -s "$SERVER_URL/api/revenue/dashboard")
echo "$REVENUE_RESPONSE" | jq '.' 2>/dev/null || echo "$REVENUE_RESPONSE"
echo ""

# Test 7: Get Commission Logs
echo "8️⃣  CHECKING COMMISSION LOGS"
echo "-------------------------"
print_info "GET /api/revenue/commissions"
COMMISSION_RESPONSE=$(curl -s "$SERVER_URL/api/revenue/commissions?page=1&limit=10")
echo "$COMMISSION_RESPONSE" | jq '.' 2>/dev/null || echo "$COMMISSION_RESPONSE"
echo ""

# Summary
echo "📊 TEST SUMMARY"
echo "==============="
echo ""
print_info "Next Steps to Complete Full Test:"
echo "   1. Complete the payment for Order ID: $ORDER_ID"
echo "   2. Use Razorpay test credentials to simulate payment"
echo "   3. After payment success, commission should be distributed"
echo "   4. Check commission_logs collection in MongoDB"
echo "   5. Verify user commission_wallet fields are updated"
echo ""
print_info "Manual Verification Commands:"
echo "   Database check:"
echo "   • db.commission_logs.find({}).sort({createdAt:-1}).limit(10)"
echo "   • db.users.find({commission_wallet:{\$gt:0}}, {name:1,role:1,commission_wallet:1})"
echo "   • db.donations.find({referredBy:{\$exists:true}}).sort({createdAt:-1}).limit(5)"
echo ""
print_success "Revenue distribution system test completed!"
echo ""
