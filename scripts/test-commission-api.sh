#!/bin/bash

# Test Commission System with Real API Calls
# This script tests the commission distribution for referral donations

echo "🔄 Testing Commission Distribution System"
echo "=========================================="
echo ""

# Check if server is running
echo "1. Checking if dev server is running..."
SERVER_URL="http://localhost:3000"
if ! curl -s -o /dev/null -w "%{http_code}" $SERVER_URL | grep -q "200\|301\|302"; then
    echo "❌ Dev server is not running at $SERVER_URL"
    echo "   Please start the server with: npm run dev"
    exit 1
fi
echo "✅ Server is running"
echo ""

# Get a referral code from the API
echo "2. Fetching an active referral code..."
REFERRAL_RESPONSE=$(curl -s "$SERVER_URL/api/referrals?limit=1")
echo "Response: $REFERRAL_RESPONSE"
echo ""

# Extract referral code (you may need to adjust this based on your API response)
REFERRAL_CODE=$(echo $REFERRAL_RESPONSE | grep -o '"code":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$REFERRAL_CODE" ]; then
    echo "❌ No referral code found. Please create a coordinator with a referral code first."
    exit 1
fi

echo "✅ Found referral code: $REFERRAL_CODE"
echo ""

# Create a test donation order
echo "3. Creating test donation order..."
ORDER_RESPONSE=$(curl -s -X POST "$SERVER_URL/api/donations/create-order" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "currency": "INR",
    "donorName": "Test Commission Donor",
    "donorEmail": "commission-test@example.com",
    "donorPhone": "9999999999",
    "programId": null,
    "referralCode": "'$REFERRAL_CODE'"
  }')

echo "Order Response: $ORDER_RESPONSE"
echo ""

# Extract order ID
ORDER_ID=$(echo $ORDER_RESPONSE | grep -o '"orderId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ORDER_ID" ]; then
    echo "❌ Failed to create order"
    exit 1
fi

echo "✅ Order created: $ORDER_ID"
echo ""

echo "📊 COMMISSION DISTRIBUTION TEST"
echo "================================"
echo ""
echo "To complete the test:"
echo "1. A donation order has been created with referral code: $REFERRAL_CODE"
echo "2. Order ID: $ORDER_ID"
echo "3. Amount: ₹10,000"
echo ""
echo "Next steps:"
echo "- Check the database for commission_logs collection"
echo "- Verify commission distribution was calculated"
echo "- Check user commission_wallet fields"
echo ""
echo "Database queries to run:"
echo "  db.commission_logs.find({}).sort({createdAt: -1}).limit(10)"
echo "  db.users.find({commission_wallet: {\$gt: 0}}, {name: 1, role: 1, commission_wallet: 1})"
echo ""
echo "✅ Test setup complete!"
