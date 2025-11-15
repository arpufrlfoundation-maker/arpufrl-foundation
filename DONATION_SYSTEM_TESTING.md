# Donation System Testing Guide

## ✅ Completed Implementation

### Overview
All donation endpoints now require **mandatory program selection**. This affects:
- Payment Widget (Razorpay donations)
- Transaction Recording (offline collections)
- Public donation forms

### What Was Fixed
1. ✅ **Service Worker caching issues** - Updates now reflect immediately
2. ✅ **Missing API endpoints** - `/api/donations/create-order` and `/api/donations/verify-payment`
3. ✅ **Program selection enforcement** - Required at API level with validation
4. ✅ **Transaction verification display** - Coordinators can see accepted transactions
5. ✅ **TypeError fixes** - Null-safety added to ranking displays

---

## 🧪 Testing Instructions

### Option 1: Automated curl Testing

Run the automated test script:
```bash
./scripts/test-donations.sh
```

This will test:
- ✅ Programs API (`GET /api/programs?active=true`)
- ✅ Order creation validation (fails without program)
- ✅ Order creation success (with program)
- ℹ️  Transaction recording structure

### Option 2: Manual curl Commands

#### 1. Fetch Available Programs
```bash
curl http://localhost:3000/api/programs?active=true | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "programs": [
    {
      "_id": "program_id_here",
      "name": "Program Name",
      "description": "...",
      "active": true
    }
  ]
}
```

#### 2. Test Program Validation (Should Fail)
```bash
curl -X POST http://localhost:3000/api/donations/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 101,
    "referralCode": "TEST123"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": false,
  "error": "Please select a program for your donation"
}
```

#### 3. Create Order with Program (Should Succeed)
```bash
curl -X POST http://localhost:3000/api/donations/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 101,
    "programId": "REPLACE_WITH_ACTUAL_PROGRAM_ID",
    "referralCode": "TEST123",
    "donorName": "Test Donor",
    "donorEmail": "test@example.com",
    "donorPhone": "9876543210"
  }' | jq '.'
```

**Expected Response:**
```json
{
  "success": true,
  "orderId": "order_XXXXXXXXXXXXX",
  "amount": 101,
  "currency": "INR",
  "key": "rzp_test_XXXXXXXXXX"
}
```

---

## 🌐 Browser Testing

### Clear Service Worker Cache First
Open browser console and run:
```javascript
// Unregister old service workers
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
  console.log('Service workers cleared');
});

// Clear all caches
caches.keys().then(keys => {
  keys.forEach(key => caches.delete(key));
  console.log('All caches cleared');
});
```

Then restart the dev server:
```bash
rm -rf .next && npm run dev
```

### Test Flow 1: Payment Widget (Razorpay)

1. **Login** to dashboard at `http://localhost:3000/dashboard`
2. Navigate to **Payment Widget**
3. **Verify:** Program dropdown appears (required field)
4. Select a program
5. Enter amount (₹21 - ₹1,000,000)
6. Click **Contribute**
7. Complete Razorpay test payment:
   - Card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date

**Expected Result:**
- Payment succeeds
- Donation record created with program association
- Success message displayed

### Test Flow 2: Transaction Recording (Coordinator)

1. **Login** as coordinator
2. Navigate to **Targets → Record Collection**
3. **Verify:** Program dropdown appears (required field)
4. Fill in transaction details:
   - Amount: ₹500
   - Payment Mode: Cash/UPI/Check
   - Program: Select from dropdown
   - Receipt Number: RCP-12345
   - Donor Name: Test Donor
   - Donor Contact: 9876543210
   - Collection Date: Today
5. Submit transaction

**Expected Result:**
- Transaction created with status "pending"
- Shows in transaction history

### Test Flow 3: View Accepted Transactions

1. In **Record Collection** page
2. Click **View Accepted Transactions** button
3. **Verify:** Shows green-themed section with:
   - List of verified transactions
   - Total accepted amount
   - Individual transaction details (program, donor, verifier)
   - Note: "These amounts are added to your collection total"

**Expected Result:**
- Accepted transactions display correctly
- Total calculation is accurate
- Program names shown for each transaction

---

## 🔍 Verification Checklist

### API Endpoints
- ✅ `/api/programs?active=true` - Returns active programs
- ✅ `/api/donations/create-order` - Requires programId
- ✅ `/api/donations/verify-payment` - Validates and creates donation
- ✅ `/api/transactions/create` - Requires programId
- ✅ `/api/targets/stats` - Returns target statistics
- ✅ `/api/targets/hierarchy-ranking` - Returns peer ranking

### Frontend Components
- ✅ `PaymentWidget.tsx` - Fetches programs, shows dropdown
- ✅ `TransactionRecording.tsx` - Program selection + verified transactions view
- ✅ `TargetDashboard.tsx` - Null-safety for ranking display

### Data Models
- ✅ `Donation` - Includes programId field
- ✅ `Transaction` - Includes programId field
- ✅ `Program` - Active flag for filtering
- ✅ `Target` - assignedBy accepts mixed types

### Validation Rules
- ✅ Amount: ₹21 - ₹1,000,000
- ✅ Program: Required for all donations
- ✅ Referral code: Optional but tracked
- ✅ Transaction status: pending → verified → rejected

---

## 🐛 Common Issues & Solutions

### Issue 1: "Method not allowed" error
**Solution:** Clear Service Worker and restart dev server
```bash
# In browser console
navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(reg => reg.unregister()));

# In terminal
rm -rf .next && npm run dev
```

### Issue 2: Changes not reflecting
**Solution:** Service Worker disabled in development mode
- Check `/lib/pwa.ts` - SW registration skipped in dev
- Force refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### Issue 3: TypeError in ranking display
**Solution:** Null-safety added
- Changed `entry.totalCollected.toLocaleString()`
- To `(entry.totalCollected || 0).toLocaleString()`

### Issue 4: Razorpay order creation fails
**Solution:** Check environment variables
```bash
# Verify these are set in .env.local
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXX
```

---

## 📊 Expected Database Changes

### After Donation via Razorpay:
```javascript
// New Donation record
{
  _id: ObjectId,
  amount: 101,
  programId: ObjectId,
  donorName: "Test Donor",
  donorEmail: "test@example.com",
  razorpayOrderId: "order_XXXX",
  razorpayPaymentId: "pay_XXXX",
  status: "completed",
  createdAt: ISODate
}

// Program stats updated
{
  totalRaised: +101,
  donorCount: +1
}

// User stats updated (if authenticated)
{
  totalDonations: +101
}
```

### After Transaction Recording:
```javascript
// New Transaction record
{
  _id: ObjectId,
  amount: 500,
  paymentMode: "cash",
  programId: ObjectId,
  status: "pending",
  coordinatorId: ObjectId,
  receiptNumber: "RCP-12345",
  createdAt: ISODate
}

// After verification (by admin/state-coordinator)
{
  status: "verified",
  verifiedBy: ObjectId,
  verifiedAt: ISODate
}
```

---

## 🎯 Success Criteria

All of the following should work:

1. ✅ Payment Widget requires program selection
2. ✅ Transaction Recording requires program selection
3. ✅ Razorpay payment flow completes successfully
4. ✅ Verified transactions appear in "Accepted Transactions"
5. ✅ Total accepted amount calculated correctly
6. ✅ Program names displayed in transaction lists
7. ✅ API validation prevents donations without programs
8. ✅ Service Worker doesn't interfere with updates in dev mode
9. ✅ Ranking displays handle undefined values gracefully
10. ✅ cURL tests pass for all endpoints

---

## 📝 Notes

- **Service Worker:** Version `v2-fresh` - only active in production
- **Development Mode:** SW disabled, no HTML/API caching
- **Production Mode:** SW active with cache-first for static assets
- **Razorpay Test Mode:** Use test keys and test cards
- **Transaction Flow:** create → pending → verified → added to totals
- **Program Selection:** Enforced at both frontend and API levels

---

## 🚀 Next Steps

If all tests pass:
1. Deploy to staging/production
2. Update Razorpay keys to live keys
3. Monitor transaction verification workflow
4. Train coordinators on new program selection requirement
5. Document program creation process for admins

If tests fail:
1. Check browser console for errors
2. Verify environment variables
3. Check MongoDB connection
4. Review API logs for error details
5. Ensure dev server is running on port 3000
