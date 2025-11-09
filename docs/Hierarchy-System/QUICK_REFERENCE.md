# 🚀 Quick Reference Card

## 📁 Key Files to Know

### Models (Database Schemas)
```
models/User.ts          - User with 10-level hierarchy
models/Donation.ts      - Donations with referral tracking
models/Target.ts        - Target assignments
models/Program.ts       - Programs (existing)
models/ReferralCode.ts  - Referral codes (existing)
```

### Utilities
```
lib/referral-utils.ts   - Referral code & QR generation
lib/csv-export.ts       - CSV export functions
lib/auth.ts             - Authentication utilities
lib/db.ts               - Database connection
```

### Components
```
components/dashboard/HierarchyDashboard.tsx    - Universal dashboard
components/analytics/AnalyticsCharts.tsx       - Chart components
components/dashboard/StatsCard.tsx             - Stat cards
```

### API Routes
```
/api/dashboard/[userId]   - Dashboard data
/api/hierarchy/[userId]   - Hierarchy tree
/api/targets              - Target CRUD
/api/users                - User management
```

## 🎯 10-Level Hierarchy

```
Level  Role                    Code  Description
═════════════════════════════════════════════════════
0      ADMIN                   AD    Super administrator
1      NATIONAL_LEVEL          NL    National coordinator
2      STATE_ADHYAKSH          SA    State president
3      STATE_COORDINATOR       SC    State coordinator
4      MANDAL_COORDINATOR      MC    District coordinator
5      JILA_ADHYAKSH           JA    Division president
6      JILA_COORDINATOR        JC    Division coordinator
7      BLOCK_COORDINATOR       BC    Block coordinator
8      NODEL                   ND    Node coordinator
9      PRERAK                  PR    Motivator
10     PRERNA_SAKHI            PS    Female volunteer
11     DONOR                   DN    Regular donor
```

## 🔗 Referral Code Format

```
Example: JSCMUM1234
         │││  └──── Random 4 digits
         ││└─────── Region (3 chars): MUM (Mumbai)
         │└──────── Role (2 chars): SC (State Coordinator)
         └───────── Name (max 3): J (John)
```

## 📊 Target Types

```
DONATION_AMOUNT   - Total donation amount target (₹)
DONATION_COUNT    - Number of donations target
REFERRAL_COUNT    - Number of referrals target
NEW_DONORS        - New unique donors target
```

## 🎯 Target Status Flow

```
PENDING → IN_PROGRESS → COMPLETED
           ↓
        OVERDUE (if past end date)
        
Can be set to CANCELLED at any time
```

## 🔌 Common API Calls

### Get Dashboard Data
```bash
GET /api/dashboard/[userId]
Response: stats, trends, targets, donations, qrCode
```

### Get Hierarchy Tree
```bash
GET /api/hierarchy/[userId]
Response: tree, path, subordinates, aggregatedStats
```

### Create Target
```bash
POST /api/targets
Body: {
  assignedTo: "userId",
  assignedBy: "adminId",
  type: "DONATION_AMOUNT",
  targetValue: 100000,
  startDate: "2025-01-01",
  endDate: "2025-12-31"
}
```

### Get Users
```bash
GET /api/users?role=STATE_COORDINATOR&status=ACTIVE
```

### Create User
```bash
POST /api/users
Body: {
  name: "User Name",
  email: "user@email.com",
  role: "STATE_COORDINATOR",
  password: "SecurePass123!",
  parentCoordinatorId: "parentUserId",
  region: "Maharashtra"
}
```

## 💻 Key Functions

### Generate Referral Code
```typescript
import { generateReferralCode } from '@/lib/referral-utils'

const code = await generateReferralCode(
  'John Smith',      // name
  'STATE_COORDINATOR', // role
  'Mumbai'           // region (optional)
)
// Returns: "JSCMUM1234"
```

### Generate QR Code
```typescript
import { generateQRCodeDataURL } from '@/lib/referral-utils'

const qrDataURL = await generateQRCodeDataURL(
  'JSCMUM1234',                    // referral code
  'https://example.com'            // base URL
)
// Returns: "data:image/png;base64,..."
```

### Export to CSV
```typescript
import { donationsToCSV, downloadCSV } from '@/lib/csv-export'

const csv = donationsToCSV(donations)
downloadCSV(csv, 'donations-2025-01-01.csv')
```

## 🔐 Permission Checks

```typescript
// Check if user can manage another user
const canManage = await user.canManageUser(targetUserId)

// Get hierarchy path (all parents up to root)
const path = await user.getHierarchyPath()

// Get direct subordinates
const subs = await user.getSubordinates()
```

## 📈 Chart Types Available

```
DonationTrendChart         - Area chart (donations over time)
TargetProgressChart        - Bar chart (target vs current)
ReferralDistributionChart  - Pie chart (referral sources)
HierarchyPerformanceChart  - Horizontal bars (by role)
MonthlyComparisonChart     - Line chart (year comparison)
ProgressGauge              - Semi-circle (percentage)
TopPerformersChart         - Bar chart (top contributors)
```

## 🎨 Using Dashboard Component

```typescript
import HierarchyDashboard from '@/components/dashboard/HierarchyDashboard'

<HierarchyDashboard
  userId={userId}
  userRole={userRole}
  userName={userName}
  referralCode={referralCode}
/>
```

## 🗄️ Database Models

### User Fields
```typescript
{
  name: string
  email: string (unique)
  role: UserRoleType (10 levels)
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED'
  parentCoordinatorId: ObjectId
  referralCode: string (unique)
  region, state, mandal, jila, block: string
  totalDonationsReferred: number
  totalAmountReferred: number
}
```

### Donation Fields
```typescript
{
  donorName: string
  amount: number
  paymentStatus: 'SUCCESS' | 'PENDING' | 'FAILED'
  referralCodeId: ObjectId
  attributedToUserId: ObjectId  // Auto-updates hierarchy
  isAnonymous: boolean
  privacyConsentGiven: boolean
}
```

### Target Fields
```typescript
{
  assignedTo: ObjectId
  assignedBy: ObjectId
  type: TargetTypeType
  targetValue: number
  currentValue: number
  status: TargetStatusType
  startDate: Date
  endDate: Date
  progressPercentage: number (virtual)
  daysRemaining: number (virtual)
}
```

## 🔧 npm Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run migrate       # Run database migration
npm run db:backup     # Backup MongoDB
npm run db:restore    # Restore MongoDB
```

## 🐛 Quick Troubleshooting

### Issue: Referral code not working
```bash
# Check user status
GET /api/users?referralCode=CODE

# Verify code exists and user is ACTIVE
```

### Issue: Hierarchy not updating
```bash
# Check parent relationships
GET /api/hierarchy/[userId]

# Verify parentCoordinatorId is set
# Ensure all users in chain are ACTIVE
```

### Issue: Target not progressing
```bash
# Check donation attribution
GET /api/donations?userId=XXX

# Verify attributedToUserId matches target assignee
# Ensure donation paymentStatus is SUCCESS
```

## 📝 Common Queries

### Get all users in a hierarchy
```typescript
const tree = await User.getHierarchyTree(userId)
```

### Get donation stats for user
```typescript
const stats = await getReferralCodeStats(referralCode)
```

### Get target summary
```typescript
const summary = await Target.getTargetSummary(userId)
```

### Find overdue targets
```typescript
const overdue = await Target.findOverdueTargets()
```

## 🎯 Useful Filters

```bash
# Active coordinators in Maharashtra
GET /api/users?role=STATE_COORDINATOR&status=ACTIVE&search=Maharashtra

# Successful donations this month
GET /api/donations?status=SUCCESS&from=2025-01-01

# In-progress targets
GET /api/targets?status=IN_PROGRESS

# Users without parent
GET /api/users?noParent=true
```

## 📚 Documentation Files

```
HIERARCHY_SYSTEM.md       - Complete system documentation
SETUP_GUIDE.md            - Installation and setup
IMPLEMENTATION_SUMMARY.md - What was built
README.md                 - Project overview
```

## 🎓 Training Resources

1. Read SETUP_GUIDE.md first
2. Review HIERARCHY_SYSTEM.md for details
3. Check IMPLEMENTATION_SUMMARY.md for features
4. Test with sample data
5. Export and analyze CSV files

## 📞 Need Help?

1. Check inline code comments
2. Review error messages in console
3. Check MongoDB logs
4. Refer to documentation files
5. Test with Postman/Thunder Client

---

**Pro Tip**: Bookmark this file for quick reference during development!

**Created**: 2025-11-09
**Version**: 1.0.0
**Status**: Production Ready ✅
