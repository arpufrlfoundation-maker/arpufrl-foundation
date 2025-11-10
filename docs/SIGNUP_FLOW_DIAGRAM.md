# Signup & Referral Code Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER SIGNUP FLOW                             │
└─────────────────────────────────────────────────────────────────┘

Step 1: User Visits Signup Page
┌─────────────────────────────────────┐
│  http://localhost:3000/signup       │
│                                     │
│  [Signup Form]                      │
│  • Name                             │
│  • Email                            │
│  • Password                         │
│  • Confirm Password                 │
│  • Phone                            │
│  • Role (dropdown) ◄────────────┐   │
│  • Region                       │   │
│  • Father Phone (optional)      │   │
│  • Mother Phone (optional)      │   │
│                                 │   │
│  Generated Referral Code: ──────┘   │
│  [SC7891] ◄ Auto-generated          │
│                                     │
│  [Create Account Button]            │
└─────────────────────────────────────┘
           ▼
Step 2: Form Validation (Client-Side)
┌─────────────────────────────────────┐
│  React Hook Form + Zod              │
│                                     │
│  ✓ Name: min 2 chars                │
│  ✓ Email: valid format              │
│  ✓ Password: min 8, strong          │
│  ✓ Confirm: matches password        │
│  ✓ Phone: 10-15 digits              │
│  ✓ Role: selected                   │
│  ✓ Region: min 2 chars              │
└─────────────────────────────────────┘
           ▼
Step 3: API Request
┌─────────────────────────────────────┐
│  POST /api/auth                     │
│                                     │
│  Headers:                           │
│  Content-Type: application/json     │
│                                     │
│  Body:                              │
│  {                                  │
│    "name": "John Doe",              │
│    "email": "john@example.com",     │
│    "password": "StrongPass123",     │
│    "confirmPassword": "StrongPass123"│
│    "phone": "9876543210",           │
│    "role": "STATE_COORDINATOR",     │
│    "region": "Mumbai",              │
│    "status": "PENDING",             │
│    "referralCode": "SC7891"         │
│  }                                  │
└─────────────────────────────────────┘
           ▼
Step 4: Server-Side Validation
┌─────────────────────────────────────┐
│  userRegistrationSchema.safeParse() │
│                                     │
│  ✓ All fields valid                 │
│  ✓ Email format correct             │
│  ✓ Password meets requirements      │
│  ✓ Passwords match                  │
│  ✓ Status is valid enum value       │
│  ✓ Role is valid enum value         │
└─────────────────────────────────────┘
           ▼
Step 5: Database Checks
┌─────────────────────────────────────┐
│  MongoDB Query                      │
│                                     │
│  1. Check if email exists           │
│     User.findByEmail(email)         │
│                                     │
│     If exists:                      │
│     ❌ Return 409 error              │
│                                     │
│     If not exists:                  │
│     ✓ Continue to create user       │
└─────────────────────────────────────┘
           ▼
Step 6: Password Hashing
┌─────────────────────────────────────┐
│  bcrypt.hash(password, 10)          │
│                                     │
│  "StrongPass123"                    │
│         ▼                           │
│  "$2a$10$xY3zAb..."                 │
│  (hashed password)                  │
└─────────────────────────────────────┘
           ▼
Step 7: Create User Document
┌─────────────────────────────────────┐
│  MongoDB Insert                     │
│                                     │
│  {                                  │
│    "_id": ObjectId("..."),          │
│    "name": "John Doe",              │
│    "email": "john@example.com",     │
│    "hashedPassword": "$2a$10$...",  │
│    "phone": "9876543210",           │
│    "role": "STATE_COORDINATOR",     │
│    "status": "PENDING",             │
│    "region": "Mumbai",              │
│    "referralCode": "SC7891",        │
│    "createdAt": ISODate("..."),     │
│    "updatedAt": ISODate("...")      │
│  }                                  │
└─────────────────────────────────────┘
           ▼
Step 8: Success Response
┌─────────────────────────────────────┐
│  HTTP 201 Created                   │
│                                     │
│  {                                  │
│    "message": "User registered      │
│                successfully",        │
│    "user": {                        │
│      "_id": "...",                  │
│      "name": "John Doe",            │
│      "email": "john@example.com",   │
│      "role": "STATE_COORDINATOR",   │
│      "status": "PENDING",           │
│      "referralCode": "SC7891",      │
│      ...                            │
│    }                                │
│  }                                  │
└─────────────────────────────────────┘
           ▼
Step 9: Redirect to Login
┌─────────────────────────────────────┐
│  http://localhost:3000/login        │
│  ?message=signup_success            │
│                                     │
│  [Login Form]                       │
│  • Email: john@example.com          │
│  • Password: StrongPass123          │
│                                     │
│  [Sign in Button]                   │
└─────────────────────────────────────┘
           ▼
Step 10: User Logs In
┌─────────────────────────────────────┐
│  NextAuth signIn()                  │
│                                     │
│  1. Verify credentials              │
│  2. Create session                  │
│  3. Redirect to dashboard           │
│                                     │
│  Based on role:                     │
│  • ADMIN → /dashboard/admin         │
│  • Others → /dashboard/coordinator  │
└─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                REFERRAL CODE GENERATION                          │
└─────────────────────────────────────────────────────────────────┘

Input: User selects role
┌─────────────────────────────────────┐
│  Role Dropdown Changed              │
│                                     │
│  Selected: "STATE_COORDINATOR"      │
└─────────────────────────────────────┘
           ▼
Process: Generate Code
┌─────────────────────────────────────┐
│  generateReferralCode(role)         │
│                                     │
│  1. Map role to prefix              │
│     "STATE_COORDINATOR" → "SC"      │
│                                     │
│  2. Generate random 4 digits        │
│     Math.random() → 7891            │
│                                     │
│  3. Combine                         │
│     "SC" + "7891" = "SC7891"        │
└─────────────────────────────────────┘
           ▼
Output: Display Code
┌─────────────────────────────────────┐
│  Your Referral Code:                │
│  ┌─────────────────────────────┐    │
│  │        SC7891               │    │
│  │   [Copy Button] [QR Code]  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                   ROLE TO PREFIX MAPPING                         │
└─────────────────────────────────────────────────────────────────┘

NATIONAL_LEVEL       →  NL  →  NL4523
STATE_ADHYAKSH       →  SA  →  SA7891
STATE_COORDINATOR    →  SC  →  SC2341
MANDAL_COORDINATOR   →  MC  →  MC6789
JILA_ADHYAKSH        →  JA  →  JA0123
JILA_COORDINATOR     →  JC  →  JC4567
BLOCK_COORDINATOR    →  BC  →  BC8901
NODEL                →  ND  →  ND2345
PRERAK               →  PR  →  PR6789
PRERNA_SAKHI         →  PS  →  PS0123


┌─────────────────────────────────────────────────────────────────┐
│              REFERRAL CODE USAGE BY DONORS                       │
└─────────────────────────────────────────────────────────────────┘

Donor Makes Donation
┌─────────────────────────────────────┐
│  [Donation Form]                    │
│                                     │
│  Amount: ₹1000                      │
│  Name: Donor Name                   │
│  Email: donor@example.com           │
│  Phone: 9123456789                  │
│                                     │
│  Referral Code (optional):          │
│  [SC7891____________]               │
│                                     │
│  [Donate Button]                    │
└─────────────────────────────────────┘
           ▼
System Links Donation
┌─────────────────────────────────────┐
│  1. Find user with code "SC7891"    │
│  2. Link donation to that user      │
│  3. Update coordinator stats        │
│  4. Update hierarchy stats          │
│  5. Send notification               │
└─────────────────────────────────────┘
           ▼
Coordinator Dashboard Updates
┌─────────────────────────────────────┐
│  John Doe's Dashboard               │
│                                     │
│  Total Donations: ₹15,000           │
│  Via My Code: ₹5,000                │
│                                     │
│  Recent Donations:                  │
│  • ₹1000 - Donor Name (SC7891)      │
│  • ₹500 - Another Donor (SC7891)    │
└─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING                                │
└─────────────────────────────────────────────────────────────────┘

Error 1: Missing confirmPassword
┌─────────────────────────────────────┐
│  ❌ Problem:                         │
│  confirmPassword field not sent     │
│                                     │
│  ✅ Fixed:                           │
│  Now included in API request        │
└─────────────────────────────────────┘

Error 2: Invalid status value
┌─────────────────────────────────────┐
│  ❌ Problem:                         │
│  status field required but not sent │
│                                     │
│  ✅ Fixed:                           │
│  Defaults to "PENDING" if not sent  │
│  Now optional with default value    │
└─────────────────────────────────────┘

Error 3: Email already exists
┌─────────────────────────────────────┐
│  ❌ Problem:                         │
│  User tries to signup with          │
│  existing email                     │
│                                     │
│  ✅ Solution:                        │
│  Show error: "Email already exists" │
│  User must use different email      │
└─────────────────────────────────────┘

Error 4: Weak password
┌─────────────────────────────────────┐
│  ❌ Problem:                         │
│  Password doesn't meet requirements │
│                                     │
│  ✅ Solution:                        │
│  Show error with requirements       │
│  User creates stronger password     │
└─────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                       SUMMARY                                    │
└─────────────────────────────────────────────────────────────────┘

✅ Signup form validates all fields
✅ Referral code auto-generates based on role
✅ Backend validates with Zod schemas
✅ Password is securely hashed with bcrypt
✅ User stored in MongoDB with unique referral code
✅ User redirects to login after successful signup
✅ Donors can use referral codes to link donations
✅ Coordinators can track donations via their code
✅ All validation errors properly handled
✅ Status defaults to PENDING if not provided
✅ confirmPassword now included in API request
```
