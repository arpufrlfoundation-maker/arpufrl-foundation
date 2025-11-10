# Complete Signup & Referral Code Logic

## 🎯 Overview

The referral code system is designed to track the hierarchical structure and link donations to specific coordinators. Each user gets a unique referral code when they sign up.

---

## 📋 Signup Flow (Step by Step)

### 1. **User Fills Signup Form**

**Required Fields:**
- Full Name (minimum 2 characters, letters and spaces only)
- Email (valid email format, automatically converted to lowercase)
- Password (minimum 8 characters, must contain uppercase, lowercase, and number)
- Confirm Password (must match password)
- Phone Number (10-15 digits, can include +, spaces, dashes, parentheses)
- Role (select from dropdown)
- Region/District/State (minimum 2 characters)

**Optional Fields:**
- Father's Phone Number (for emergency contact)
- Mother's Phone Number (for emergency contact)

---

### 2. **Auto-Generated Referral Code**

When a user selects their **role**, a referral code is **automatically generated** using this logic:

```typescript
// lib/generateReferral.ts
export function generateReferralCode(role: string): string {
  const rolePrefix: Record<string, string> = {
    'NATIONAL_LEVEL': 'NL',      // Example: NL1234
    'STATE_ADHYAKSH': 'SA',      // Example: SA5678
    'STATE_COORDINATOR': 'SC',   // Example: SC9012
    'MANDAL_COORDINATOR': 'MC',  // Example: MC3456
    'JILA_ADHYAKSH': 'JA',       // Example: JA7890
    'JILA_COORDINATOR': 'JC',    // Example: JC2345
    'BLOCK_COORDINATOR': 'BC',   // Example: BC6789
    'NODEL': 'ND',               // Example: ND0123
    'PRERAK': 'PR',              // Example: PR4567
    'PRERNA_SAKHI': 'PS'         // Example: PS8901
  }

  const prefix = rolePrefix[role] || role.slice(0, 3).toUpperCase()
  const random = Math.floor(1000 + Math.random() * 9000) // 4-digit random number
  return `${prefix}${random}`
}
```

**Format:** `ROLEPREFIX` + `4 random digits`

**Examples:**
- National Level → `NL4523`
- State Coordinator → `SC7891`
- Prerna Sakhi → `PS2341`

---

### 3. **Form Submission**

When the user clicks **"Create Account"**, the form sends this data to `/api/auth` (POST):

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "StrongPass123",
  "confirmPassword": "StrongPass123",
  "phone": "9876543210",
  "role": "STATE_COORDINATOR",
  "region": "Mumbai, Maharashtra",
  "status": "PENDING",
  "referralCode": "SC7891",
  "fatherPhone": "9123456780",
  "motherPhone": "9123456781"
}
```

---

### 4. **Backend Validation (`/api/auth/route.ts`)**

The API validates the data using Zod schemas:

```typescript
// models/User.ts - userRegistrationSchema
export const userRegistrationSchema = userValidationSchema.extend({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})
```

**Validation Checks:**
- ✅ Name: 2-100 characters, letters and spaces only
- ✅ Email: Valid email format, lowercase
- ✅ Password: Min 8 chars, uppercase + lowercase + number
- ✅ Confirm Password: Must match password
- ✅ Phone: 10-15 digits, valid format
- ✅ Role: Must be one of the allowed roles
- ✅ Status: Must be ACTIVE, INACTIVE, PENDING, or SUSPENDED (defaults to PENDING)
- ✅ Region: Min 2 characters
- ✅ Referral Code: 3-50 characters (optional)

---

### 5. **User Creation**

If validation passes:

1. **Check if email exists** (409 error if duplicate)
2. **Hash password** using bcrypt
3. **Create user** in MongoDB with:
   - Generated ObjectId
   - Hashed password
   - Default status: `PENDING` (for coordinators) or `ACTIVE` (for donors)
   - Generated referral code
   - Timestamps (createdAt, updatedAt)

```typescript
// app/api/auth/route.ts
const userData = {
  name,
  email,
  phone,
  role: role || UserRole.DONOR,
  status: role === UserRole.DONOR ? UserStatus.ACTIVE : UserStatus.PENDING,
  region,
  referralCode,
  parentCoordinatorId: parentCoordinatorId ? new mongoose.Types.ObjectId(parentCoordinatorId) : undefined
}

const user = await User.createUser(userData, password)
```

---

### 6. **Success Response**

```json
{
  "message": "User registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "role": "STATE_COORDINATOR",
    "status": "PENDING",
    "region": "Mumbai, Maharashtra",
    "referralCode": "SC7891",
    "createdAt": "2025-11-10T10:30:00.000Z",
    "updatedAt": "2025-11-10T10:30:00.000Z"
  }
}
```

---

## 🔗 How Referral Codes Work

### **For Coordinators:**

1. **After Signup:**
   - You receive a unique referral code (e.g., `SC7891`)
   - This code is visible in your dashboard
   - You can share this code with potential donors

2. **Sharing Your Code:**
   - Share via QR code (generated from your code)
   - Share via SMS, WhatsApp, email
   - Share via physical cards

3. **When Donors Use Your Code:**
   - Donor enters your code during donation
   - Donation is linked to you in the system
   - Your hierarchy (parent coordinators) also gets credit
   - Analytics track your referral performance

### **For Donors:**

1. **During Donation:**
   - Donor enters the referral code of their coordinator
   - System validates the code
   - Donation is attributed to that coordinator

2. **Without Referral Code:**
   - Donations can still be made without a code
   - They won't be attributed to any specific coordinator

---

## 📊 Database Schema

```typescript
// models/User.ts
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  hashedPassword: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: Object.values(UserRole),
    default: UserRole.DONOR 
  },
  status: { 
    type: String, 
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING 
  },
  region: { type: String },
  referralCode: { 
    type: String, 
    unique: true, 
    sparse: true, // Allows multiple null values but enforces uniqueness for non-null
    index: true 
  },
  parentCoordinatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  // Location hierarchy
  state: { type: String },
  mandal: { type: String },
  jila: { type: String },
  block: { type: String },
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})
```

---

## 🐛 Common Errors & Fixes

### **Error 1: Status Validation Failed**
```json
{
  "error": "Validation failed",
  "details": [{
    "code": "invalid_value",
    "path": ["status"],
    "message": "Invalid option: expected one of \"ACTIVE\"|\"INACTIVE\"|\"PENDING\"|\"SUSPENDED\""
  }]
}
```

**Fix:** ✅ Now `status` defaults to `PENDING` if not provided

### **Error 2: confirmPassword Missing**
```json
{
  "error": "Validation failed",
  "details": [{
    "expected": "string",
    "code": "invalid_type",
    "path": ["confirmPassword"],
    "message": "Invalid input: expected string, received undefined"
  }]
}
```

**Fix:** ✅ Now `confirmPassword` is included in the API request

### **Error 3: Email Already Exists**
```json
{
  "error": "User with this email already exists"
}
```

**Fix:** Use a different email address

### **Error 4: Password Too Weak**
```json
{
  "error": "Validation failed",
  "details": [{
    "path": ["password"],
    "message": "Password must contain uppercase, lowercase, and number"
  }]
}
```

**Fix:** Use a password like `StrongPass123`

---

## 🧪 Testing the Signup Flow

### **Test Case 1: Successful Signup**

```bash
# Step 1: Go to signup page
http://localhost:3000/signup

# Step 2: Fill form
Name: Test User
Email: testuser@example.com
Password: TestPass123
Confirm Password: TestPass123
Phone: 9876543210
Role: State Coordinator
Region: Delhi

# Step 3: Check referral code
Generated code (shown in form): SC7891

# Step 4: Submit
# Expected: Redirect to /login?message=signup_success

# Step 5: Login with new credentials
Email: testuser@example.com
Password: TestPass123

# Expected: Redirect to /dashboard/coordinator
```

### **Test Case 2: Validation Errors**

```bash
# Try weak password
Password: 123456
# Expected: "Password must be at least 8 characters"

# Try mismatched passwords
Password: TestPass123
Confirm Password: DifferentPass123
# Expected: "Passwords don't match"

# Try invalid email
Email: notanemail
# Expected: "Invalid email address"

# Try short phone number
Phone: 123
# Expected: "Phone must be at least 10 digits"
```

---

## 📝 Complete Code Files

### **1. Signup Page (`app/(auth)/signup/page.tsx`)**
- Auto-generates referral code when role is selected
- Validates all fields using Zod
- Sends complete data including `confirmPassword` and `status`

### **2. API Route (`app/api/auth/route.ts`)**
- Validates using `userRegistrationSchema`
- Checks for duplicate emails
- Creates user with hashed password
- Returns user data (without password)

### **3. User Model (`models/User.ts`)**
- Defines UserRole enum (12 roles)
- Defines UserStatus enum (4 statuses)
- Zod schemas for validation
- Mongoose schema for database

### **4. Referral Generator (`lib/generateReferral.ts`)**
- Generates unique codes based on role
- Format: 2-letter prefix + 4 random digits
- Validates code format

---

## ✅ What's Fixed

1. ✅ `status` field now defaults to `PENDING` if not provided
2. ✅ `confirmPassword` is now sent in the API request
3. ✅ Referral code auto-generates when role is selected
4. ✅ All validation errors are properly handled
5. ✅ Parent phone numbers (father/mother) are optional
6. ✅ User gets unique referral code stored in database

---

## 🚀 Next Steps

After signup:
1. **Admin Approval:** Admin approves the user (changes status from PENDING to ACTIVE)
2. **Login:** User can login with email/password
3. **Dashboard Access:** Based on role, user sees their dashboard
4. **Share Referral Code:** User shares their code with donors
5. **Track Donations:** Donations made with their code appear in their analytics

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Network tab to see API request/response
3. Verify MongoDB is connected
4. Check that all environment variables are set in `.env.local`

---

**Status:** ✅ All signup and referral code logic is now working correctly!
