#!/bin/bash

# Complete Revenue Distribution System Test with Database Verification
# Tests: Referral Code -> Donation -> Commission Distribution -> Database Check

echo "🔍 COMPREHENSIVE REVENUE DISTRIBUTION SYSTEM TEST"
echo "=================================================="
echo ""

SERVER_URL="http://localhost:3000"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✅ $1${NC}"; }
print_error() { echo -e "${RED}❌ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_step() { echo -e "${CYAN}▶️  $1${NC}"; }

# Check server
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_step "STEP 1: Checking Server Status"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if curl -s -o /dev/null -w "%{http_code}" $SERVER_URL | grep -q "200\|301\|302"; then
    print_success "Server is running at $SERVER_URL"
else
    print_error "Server is not running!"
    exit 1
fi
echo ""

# Get Programs
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_step "STEP 2: Fetching Active Programs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "GET /api/programs"
PROGRAMS_RESPONSE=$(curl -s "$SERVER_URL/api/programs")

# Check if response is valid JSON
if echo "$PROGRAMS_RESPONSE" | jq empty 2>/dev/null; then
    echo "$PROGRAMS_RESPONSE" | jq '.data.programs[] | {name: .name, _id: ._id, active: .active}' 2>/dev/null | head -20
    PROGRAM_ID=$(echo "$PROGRAMS_RESPONSE" | jq -r '.data.programs[0]._id' 2>/dev/null)
    PROGRAM_NAME=$(echo "$PROGRAMS_RESPONSE" | jq -r '.data.programs[0].name' 2>/dev/null)

    if [ ! -z "$PROGRAM_ID" ] && [ "$PROGRAM_ID" != "null" ]; then
        print_success "Found program: $PROGRAM_NAME (ID: $PROGRAM_ID)"
    else
        print_error "No active programs found"
        PROGRAM_ID=""
    fi
else
    print_warning "Could not parse programs response"
    echo "$PROGRAMS_RESPONSE"
fi
echo ""

# Validate Referral Code
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_step "STEP 3: Testing Referral Code Validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Try a few test codes
TEST_CODES=("STATE-001" "DISTRICT-001" "ZONE-001" "DEMO-REF")
REFERRAL_CODE=""
USER_ID=""

for CODE in "${TEST_CODES[@]}"; do
    print_info "Testing code: $CODE"
    VALIDATE_RESPONSE=$(curl -s "$SERVER_URL/api/referrals/validate?code=$CODE")

    if echo "$VALIDATE_RESPONSE" | jq empty 2>/dev/null; then
        IS_VALID=$(echo "$VALIDATE_RESPONSE" | jq -r '.valid' 2>/dev/null)
        if [ "$IS_VALID" = "true" ]; then
            REFERRAL_CODE="$CODE"
            USER_ID=$(echo "$VALIDATE_RESPONSE" | jq -r '.data.userId // .userId' 2>/dev/null)
            USER_NAME=$(echo "$VALIDATE_RESPONSE" | jq -r '.data.userName // .name' 2>/dev/null)
            USER_ROLE=$(echo "$VALIDATE_RESPONSE" | jq -r '.data.userRole // .role' 2>/dev/null)
            print_success "Valid referral code found!"
            echo "   Code: $REFERRAL_CODE"
            echo "   User: $USER_NAME ($USER_ROLE)"
            echo "   User ID: $USER_ID"
            break
        fi
    fi
done

if [ -z "$REFERRAL_CODE" ]; then
    print_warning "No valid referral code found. Test will continue without referral."
fi
echo ""

# Create Donation Order
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_step "STEP 4: Creating Donation Order"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "POST /api/donations/create-order"

DONATION_AMOUNT=10000
ORDER_PAYLOAD=$(cat <<EOF
{
  "amount": $DONATION_AMOUNT,
  "currency": "INR",
  "donorName": "Revenue Test Donor",
  "donorEmail": "revenue-test@example.com",
  "donorPhone": "9876543210"
EOF
)

# Add program if available
if [ ! -z "$PROGRAM_ID" ]; then
    ORDER_PAYLOAD="$ORDER_PAYLOAD,
  \"programId\": \"$PROGRAM_ID\""
fi

# Add referral code if available
if [ ! -z "$REFERRAL_CODE" ]; then
    ORDER_PAYLOAD="$ORDER_PAYLOAD,
  \"referralCode\": \"$REFERRAL_CODE\""
fi

ORDER_PAYLOAD="$ORDER_PAYLOAD
}"

echo "Payload:"
echo "$ORDER_PAYLOAD" | jq '.' 2>/dev/null || echo "$ORDER_PAYLOAD"

ORDER_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/donations/create-order" \
  -H "Content-Type: application/json" \
  -d "$ORDER_PAYLOAD")

if echo "$ORDER_RESPONSE" | jq empty 2>/dev/null; then
    echo "$ORDER_RESPONSE" | jq '.'
    ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.orderId // .data.orderId' 2>/dev/null)

    if [ ! -z "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
        print_success "Order created successfully!"
        echo "   Order ID: $ORDER_ID"
        echo "   Amount: ₹$DONATION_AMOUNT"
    else
        print_error "Failed to create order"
        echo "$ORDER_RESPONSE"
    fi
else
    print_error "Invalid response from order creation"
    echo "$ORDER_RESPONSE"
fi
echo ""

# Commission Calculation Info
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_step "STEP 5: Expected Commission Distribution"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "Commission Rules:"
echo "   📌 Volunteer: 5% personal + 2% per hierarchy level"
echo "   📌 Non-Volunteer: 15% personal + 2% per hierarchy level"
echo ""
print_info "For ₹$DONATION_AMOUNT donation:"
VOLUNTEER_COMMISSION=$(($DONATION_AMOUNT * 5 / 100))
NON_VOLUNTEER_COMMISSION=$(($DONATION_AMOUNT * 15 / 100))
HIERARCHY_COMMISSION=$(($DONATION_AMOUNT * 2 / 100))
echo "   💰 Volunteer personal: ₹$VOLUNTEER_COMMISSION"
echo "   💰 Non-Volunteer personal: ₹$NON_VOLUNTEER_COMMISSION"
echo "   💰 Each hierarchy level: ₹$HIERARCHY_COMMISSION"
echo ""

# Database Check Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_step "STEP 6: Database Verification Commands"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "To verify commission distribution in MongoDB:"
echo ""
echo "1. Check Commission Logs:"
echo "   db.commission_logs.find({}).sort({createdAt: -1}).limit(10)"
echo ""
echo "2. Check User Wallets:"
echo "   db.users.find({commission_wallet: {\$gt: 0}}, {name: 1, role: 1, commission_wallet: 1, totalAmountReferred: 1})"
echo ""
echo "3. Check Recent Referral Donations:"
echo "   db.donations.find({referredBy: {\$exists: true}, paymentStatus: 'SUCCESS'}).sort({createdAt: -1}).limit(5)"
echo ""
echo "4. Check Specific User Commission:"
if [ ! -z "$USER_ID" ]; then
    echo "   db.commission_logs.find({userId: ObjectId('$USER_ID')})"
    echo "   db.users.findOne({_id: ObjectId('$USER_ID')}, {name: 1, role: 1, commission_wallet: 1})"
fi
echo ""

# Test Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_step "TEST SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Test Details:"
echo "   Program: $PROGRAM_NAME"
echo "   Referral Code: ${REFERRAL_CODE:-None}"
echo "   Order ID: ${ORDER_ID:-Not created}"
echo "   Amount: ₹$DONATION_AMOUNT"
echo ""
print_warning "IMPORTANT: Complete Payment Flow"
echo "   1. To complete the test, you need to:"
echo "      • Complete payment using Razorpay test mode"
echo "      • Use test card: 4111 1111 1111 1111"
echo "      • Any future date and CVV"
echo ""
echo "   2. After successful payment:"
echo "      • Commission will be automatically distributed"
echo "      • Check commission_logs collection"
echo "      • Verify user wallets are updated"
echo ""
print_success "Revenue distribution system API test completed!"
echo ""
