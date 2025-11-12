# Testing Guide: Referral Code & Donation System

## Overview
This guide will help you test the complete referral code and donation attribution system to ensure everything is working correctly.

## Prerequisites
- Admin account access
- Coordinator/Sub-coordinator account access
- Development environment running (`npm run dev`)
- MongoDB connected
- Razorpay test keys configured

## Part 1: Testing Referral Code Generation

### 1.1 Generate Referral Code as Coordinator
1. Login as a coordinator user (STATE_PRESIDENT, ZONE_COORDINATOR, etc.)
2. Navigate to `/dashboard/coordinator/referrals`
3. Click "Generate Code" button
4. **Expected Results:**
   - Success confetti animation appears
   - New referral code displayed in the list
   - Code format: `{ROLE_PREFIX}-{REGION}-{RANDOM}`
   - Type should be `COORDINATOR` for high-level roles
   - Active status should be `true`
   - Total donations: 0
   - Total amount: ₹0

### 1.2 Generate Referral Code as Sub-Coordinator
1. Login as a sub-coordinator user (BLOCK_COORDINATOR, VOLUNTEER, etc.)
2. Navigate to `/dashboard/coordinator/referrals`
3. Click "Generate Code" button
4. **Expected Results:**
   - New referral code generated successfully
   - Type should be `SUB_COORDINATOR`
   - Same format and structure as coordinator codes

### 1.3 Copy Referral Code
1. Click the copy icon next to any referral code
2. **Expected Results:**
   - Checkmark icon appears briefly
   - Code copied to clipboard
   - Can paste the code elsewhere

## Part 2: Testing Donation with Referral Code

### 2.1 Create Test Donation (Test Mode)
1. Navigate to the public donation page (likely `/donate` or similar)
2. Fill in donation form:
   - **Donor Name:** Test Donor
   - **Donor Email:** testdonor@example.com
   - **Donor Phone:** 9876543210
   - **Amount:** 500 (₹5.00)
   - **Program:** Select any program (or leave as General)
   - **Referral Code:** Paste the code from Part 1
3. Click "Donate Now"
4. Complete Razorpay test payment:
   - Use test card: `4111 1111 1111 1111`
   - Any future expiry date
   - Any CVV (e.g., 123)
   - Any name

### 2.2 Verify Donation Record
1. Check MongoDB database:
   ```bash
   # Connect to MongoDB
   mongosh
   use arpufrl
   
   # Find the donation
   db.donations.find({ donorEmail: "testdonor@example.com" }).pretty()
   ```
2. **Expected Fields:**
   - `paymentStatus: "COMPLETED"`
   - `referralCodeId` populated with referral code ObjectId
   - `attributedToUserId` populated with coordinator user ObjectId
   - `amount: 500` (paise)
   - `createdAt` timestamp

## Part 3: Testing Referral Attribution

### 3.1 Check Referral Code Stats
1. Login as the coordinator whose code was used
2. Navigate to `/dashboard/coordinator/referrals`
3. **Expected Results:**
   - Stats cards show updated numbers:
     - Total Donations: 1 (or increased by 1)
     - Total Amount: ₹5.00 (or increased by ₹5.00)
     - This Month Donations: 1 (if first donation this month)
     - This Month Amount: ₹5.00
   - Referral code in list shows:
     - Total Donations: 1
     - Total Amount: ₹5.00
     - Last Used: Today's date

### 3.2 Check Recent Donations Table
1. Scroll to "Recent Donations" section
2. **Expected Results:**
   - New donation appears in the table
   - Shows: Donor name, amount, program, referral code, date
   - All information matches the test donation

### 3.3 Verify Hierarchy Attribution
If the coordinator has a parent coordinator:
1. Login as the parent coordinator
2. Check their referral stats
3. **Expected Results:**
   - Parent's total donations/amount should also include the donation
   - This tests the referral hierarchy system

## Part 4: Testing Multiple Donations

### 4.1 Create Multiple Test Donations
1. Repeat Part 2 with different amounts:
   - Donation 1: ₹10.00 (1000 paise)
   - Donation 2: ₹25.00 (2500 paise)
   - Donation 3: ₹50.00 (5000 paise)
2. Use the same referral code for all

### 4.2 Verify Cumulative Stats
1. Check referral management page
2. **Expected Results:**
   - Total Donations: 4 (including first test)
   - Total Amount: ₹90.00 (5 + 10 + 25 + 50)
   - All donations listed in Recent Donations table
   - Sorted by date (newest first)

## Part 5: Testing Without Referral Code

### 5.1 Donation Without Code
1. Create a donation without entering referral code
2. Complete payment
3. **Expected Results:**
   - Donation succeeds normally
   - `referralCodeId` is null/undefined
   - `attributedToUserId` is null/undefined
   - Does NOT appear in any coordinator's referral stats

## Part 6: Testing Referral Code API Endpoints

### 6.1 Test Stats API
```bash
# Login first and get session cookie
# Then make request with credentials

curl http://localhost:3000/api/coordinators/referrals/stats \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "totalReferrals": 1,
  "activeReferrals": 1,
  "totalDonations": 4,
  "totalAmount": 9000,
  "thisMonthDonations": 4,
  "thisMonthAmount": 9000
}
```

### 6.2 Test Codes API
```bash
curl http://localhost:3000/api/coordinators/referrals/codes \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "codes": [
    {
      "id": "...",
      "code": "SP-DELHI-AB12CD",
      "type": "COORDINATOR",
      "active": true,
      "totalDonations": 4,
      "totalAmount": 9000,
      "lastUsed": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-10T08:00:00.000Z"
    }
  ]
}
```

### 6.3 Test Donations API
```bash
curl http://localhost:3000/api/coordinators/referrals/donations?limit=10 \
  -H "Cookie: your-session-cookie" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "donations": [
    {
      "id": "...",
      "donorName": "Test Donor",
      "amount": 5000,
      "programName": "Education Support",
      "referralCode": "SP-DELHI-AB12CD",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

## Part 7: Testing Profile Photos

### 7.1 Upload Profile Photo
1. Login to any account
2. Navigate to `/profile` (Edit Profile page)
3. Upload a profile photo (JPEG/PNG, max 5MB)
4. **Expected Results:**
   - Image preview shows before saving
   - Upload progress indicator appears
   - Photo uploaded to Cloudinary
   - Profile updated with photo URL

### 7.2 Verify Avatar Display
1. Check dashboard header (top right)
2. Check dashboard sidebar (bottom left)
3. **Expected Results:**
   - Profile photo displays in both locations
   - Falls back to initials if no photo
   - Image properly sized and circular
   - No distortion (object-cover CSS)

### 7.3 Test Avatar Fallback
1. Create account without profile photo
2. Login and view dashboard
3. **Expected Results:**
   - Shows first letter of name
   - Colored background (blue for admin, green for coordinator)
   - Clear and readable

## Part 8: Admin Verification

### 8.1 Admin Donation View
1. Login as admin
2. Navigate to `/dashboard/admin/donations`
3. **Expected Results:**
   - All test donations visible
   - Can filter by referral code
   - Shows attributed coordinator
   - Export functionality works

### 8.2 Admin Referral Code View
1. Navigate to coordinator management
2. View coordinator details
3. **Expected Results:**
   - Can see coordinator's referral codes
   - Can see donation attribution
   - Can deactivate/reactivate codes

## Part 9: Edge Cases

### 9.1 Invalid Referral Code
1. Try donation with code: `INVALID-CODE-123`
2. **Expected Results:**
   - Donation proceeds normally
   - Warning message: "Referral code not found, proceeding without attribution"
   - No attribution to any coordinator

### 9.2 Inactive Referral Code
1. Admin deactivates a referral code
2. Try donation with that code
3. **Expected Results:**
   - Should either reject or proceed without attribution
   - Check specific business logic

### 9.3 Expired/Deleted User
1. Delete or deactivate coordinator user
2. Check their referral codes
3. **Expected Results:**
   - Codes may become inactive
   - Historical donations remain attributed
   - New donations shouldn't use their codes

## Part 10: Performance Testing

### 10.1 Load Test
1. Create 100+ test donations
2. Check dashboard load time
3. **Expected Results:**
   - Page loads within 2 seconds
   - Pagination works smoothly
   - Stats calculated correctly
   - No memory leaks

### 10.2 Concurrent Donations
1. Simulate multiple donations at same time
2. Use same referral code
3. **Expected Results:**
   - All donations processed correctly
   - Stats update accurately
   - No race conditions
   - Proper transaction handling

## Troubleshooting

### Issue: Referral codes not visible after generation
**Solution:** Check the ReferralManagement component fetchReferralData function. Verify API returns codes in correct format: `{ codes: [...] }`

### Issue: Donations not attributed
**Solution:** Check:
1. Referral code exists in database
2. Code is active
3. Attribution logic in donation creation
4. ReferralCode.updateStats() is called

### Issue: Stats not updating
**Solution:** 
1. Check MongoDB aggregation pipeline
2. Verify totalDonations/totalAmount fields update
3. Check date range filters for "this month" stats

### Issue: Profile photos not showing
**Solution:**
1. Verify Cloudinary credentials
2. Check session includes profilePhoto field
3. Verify User model has profilePhoto
4. Check auth.ts callbacks include profilePhoto

## Success Criteria

✅ All referral code types generate correctly (COORDINATOR/SUB_COORDINATOR)
✅ Donations properly attributed to referral codes
✅ Stats update in real-time
✅ Hierarchy attribution works (parent coordinators)
✅ Recent donations display correctly
✅ Profile photos display in dashboards
✅ Fallback to initials works
✅ Copy functionality works
✅ API endpoints return correct data
✅ Edge cases handled gracefully
✅ Performance acceptable under load

## Next Steps

After successful testing:
1. Deploy to staging environment
2. Repeat critical tests in staging
3. User acceptance testing (UAT)
4. Production deployment
5. Monitor logs and analytics
6. Gather user feedback
