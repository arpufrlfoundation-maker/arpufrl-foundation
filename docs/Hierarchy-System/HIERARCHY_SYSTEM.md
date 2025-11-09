# NGO Management System - Hierarchical Roles & Referral Tracking

A comprehensive NGO management platform with 10-level hierarchical roles and referral-based donation tracking system.

## 📋 Features

### Hierarchical Role Management
- **10-Level Hierarchy**: National Level → State Adhyaksh → State Coordinator → Mandal Coordinator → Jila Adhyaksh → Jila Coordinator → Block Coordinator → Nodel → Prerak → Prerna Sakhi
- Role-based access control and permissions
- Automatic referral code generation for each coordinator level
- QR code generation for easy donation attribution

### Donation Tracking
- Referral-based donation attribution
- Automatic progress updates across entire hierarchy chain
- Real-time statistics and performance metrics
- Privacy-compliant donor information handling

### Target Management
- Assign targets to users at any hierarchy level
- Track progress automatically based on donations
- Multiple target types:
  - Donation Amount
  - Donation Count
  - Referral Count
  - New Donors
- Status tracking (Pending, In Progress, Completed, Overdue)

### Analytics & Reporting
- Interactive charts and graphs using Recharts
- Donation trend analysis
- Target progress visualization
- Hierarchy performance metrics
- CSV export functionality for all data types

### Dashboard Features
- Role-specific dashboards for all hierarchy levels
- Real-time statistics
- Team performance overview
- Recent activity tracking
- Referral link sharing with QR codes

## 🗂️ Project Structure

```
arpufrl/
├── app/
│   ├── api/
│   │   ├── dashboard/[userId]/        # Dashboard data endpoint
│   │   ├── hierarchy/[userId]/        # Hierarchy tree endpoint
│   │   ├── targets/                   # Target management APIs
│   │   └── users/                     # User management APIs
│   ├── dashboard/
│   │   ├── admin/                     # Admin dashboard
│   │   └── coordinator/               # Coordinator dashboards
│   └── ...
├── components/
│   ├── analytics/
│   │   └── AnalyticsCharts.tsx       # Reusable chart components
│   ├── dashboard/
│   │   ├── HierarchyDashboard.tsx    # Universal dashboard component
│   │   └── StatsCard.tsx             # Statistics card component
│   └── ...
├── lib/
│   ├── csv-export.ts                  # CSV export utilities
│   ├── referral-utils.ts              # Referral code & QR utilities
│   ├── auth.ts                        # Authentication utilities
│   └── db.ts                          # Database connection
├── models/
│   ├── User.ts                        # User model with hierarchy
│   ├── Donation.ts                    # Donation model with referral tracking
│   ├── Target.ts                      # Target assignment model
│   ├── Program.ts                     # Program model
│   └── ReferralCode.ts                # Referral code model
└── ...
```

## 🎯 Models

### User Model
```typescript
{
  name: string
  email: string
  phone?: string
  role: UserRoleType  // 10 hierarchy levels + ADMIN + DONOR
  status: UserStatusType  // ACTIVE, INACTIVE, PENDING, SUSPENDED
  parentCoordinatorId?: ObjectId  // Reference to parent in hierarchy
  referralCode?: string  // Unique referral code
  
  // Location hierarchy
  region?: string
  state?: string
  mandal?: string
  jila?: string
  block?: string
  
  // Performance tracking
  totalDonationsReferred: number
  totalAmountReferred: number
}
```

### Donation Model
```typescript
{
  donorName: string
  donorEmail?: string
  donorPhone?: string
  amount: number
  currency: CurrencyType
  
  // Payment tracking
  paymentStatus: PaymentStatusType
  razorpayOrderId: string
  razorpayPaymentId?: string
  
  // Referral tracking
  referralCodeId?: ObjectId
  attributedToUserId?: ObjectId  // Auto-updates hierarchy
  
  // Privacy settings
  isAnonymous?: boolean
  privacyConsentGiven: boolean
  dataProcessingConsent: boolean
}
```

### Target Model
```typescript
{
  assignedTo: ObjectId
  assignedBy: ObjectId
  type: TargetTypeType  // DONATION_AMOUNT, DONATION_COUNT, etc.
  targetValue: number
  currentValue: number
  status: TargetStatusType
  startDate: Date
  endDate: Date
  
  // Virtuals
  progressPercentage: number
  daysRemaining: number
  isOverdue: boolean
}
```

## 🚀 API Endpoints

### Dashboard API
```
GET /api/dashboard/[userId]
```
Returns comprehensive dashboard data including:
- Total donations and amount
- Active and completed targets
- Team statistics
- Donation trends
- Referral QR code

### Hierarchy API
```
GET /api/hierarchy/[userId]
```
Returns:
- Full hierarchy tree
- Path to root
- Direct subordinates
- Aggregated statistics

### Targets API
```
GET    /api/targets?userId=xxx&status=xxx
POST   /api/targets
PUT    /api/targets
DELETE /api/targets?targetId=xxx
```

### Users API
```
GET    /api/users?role=xxx&status=xxx&search=xxx
POST   /api/users
PUT    /api/users
DELETE /api/users?userId=xxx
```

## 📊 Hierarchy System

### Role Hierarchy Levels
```
0  - ADMIN (Super admin)
1  - NATIONAL_LEVEL
2  - STATE_ADHYAKSH
3  - STATE_COORDINATOR
4  - MANDAL_COORDINATOR
5  - JILA_ADHYAKSH
6  - JILA_COORDINATOR
7  - BLOCK_COORDINATOR
8  - NODEL
9  - PRERAK
10 - PRERNA_SAKHI
11 - DONOR (No hierarchy)
```

### Permission Rules
- Admins can manage all users
- Users can only manage subordinates in their hierarchy
- Each level can assign targets to subordinates
- Donation attribution flows up the entire hierarchy chain

## 🔐 Authentication & Permissions

The system uses role-based access control with:
- JWT authentication
- Middleware for route protection
- Permission checks at every API level
- Automatic referral code validation

## 📈 Analytics Features

### Available Charts
1. **Donation Trend Chart** - Line/Area chart showing donation patterns
2. **Target Progress Chart** - Bar chart comparing current vs target
3. **Referral Distribution** - Pie chart showing referral sources
4. **Hierarchy Performance** - Horizontal bar chart by role
5. **Monthly Comparison** - Line chart comparing periods
6. **Progress Gauge** - Semi-circle progress indicator
7. **Top Performers** - Bar chart of top contributors

### CSV Exports
- Donations export with all details
- Users export with hierarchy information
- Targets export with progress data
- Performance reports with aggregated stats

## 🎨 Components

### HierarchyDashboard
Universal dashboard component that adapts to any hierarchy level:
- Overview tab with statistics
- Targets tab with progress tracking
- Referrals tab with donation list
- Team tab with subordinate performance

### AnalyticsCharts
Reusable chart components built with Recharts:
- Responsive design
- Customizable colors
- Tooltip support
- Legend display

## 🛠️ Utilities

### Referral Code Generation
```typescript
generateReferralCode(name, role, region?)
// Example: "JSCMUM1234" (John + State Coordinator + Mumbai + Random)
```

### QR Code Generation
```typescript
generateQRCodeDataURL(referralCode, baseUrl)
// Returns: Data URL for QR code image
```

### CSV Export
```typescript
donationsToCSV(donations)
targetsToCSV(targets)
usersToCSV(users)
hierarchyToCSV(hierarchyData)
```

## 📦 Installation

```bash
# Install dependencies
npm install --legacy-peer-deps

# Required packages
- next@16.0.0
- mongoose@^8.19.2
- recharts (for charts)
- qrcode (for QR generation)
- date-fns (for date handling)
```

## 🔧 Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
NEXTAUTH_SECRET=your_nextauth_secret
```

## 🚀 Getting Started

1. **Create First Admin User**
```typescript
// Use MongoDB Compass or script
{
  name: "Admin User",
  email: "admin@ngo.org",
  role: "ADMIN",
  status: "ACTIVE"
}
```

2. **Create Hierarchy**
- Admin creates National Level users
- Each level creates subordinates
- Referral codes are auto-generated

3. **Assign Targets**
- Navigate to user management
- Select user and assign target
- Track progress automatically

4. **Monitor Performance**
- Check dashboards at each level
- View aggregated statistics
- Export reports as needed

## 📱 Features Implementation

### Auto-Update Hierarchy
When a donation is successful:
1. Update direct referrer's statistics
2. Walk up parent chain
3. Update each parent's statistics
4. Update all relevant targets

### QR Code Workflow
1. User gets unique referral code
2. QR code is generated with donation link
3. Donor scans QR code
4. Referral code is pre-filled
5. Donation is attributed to referrer

### Target Progress
Targets auto-update when:
- Donation is successful
- Attribution matches target user
- Target type matches donation type

## 🎯 Best Practices

1. **Always assign parent coordinator** for non-top-level users
2. **Generate referral codes** immediately after user creation
3. **Set realistic targets** with appropriate timeframes
4. **Monitor hierarchy depth** to maintain manageable structure
5. **Regular exports** for backup and analysis

## 🐛 Troubleshooting

### Referral Code Not Working
- Verify user has active status
- Check referral code exists in database
- Ensure code is correctly formatted

### Hierarchy Not Updating
- Check parentCoordinatorId is set correctly
- Verify role hierarchy levels
- Ensure all users in chain are active

### Targets Not Progressing
- Verify target type matches donation criteria
- Check donation attribution is correct
- Ensure donation status is SUCCESS

## 📄 License

MIT License - Feel free to use for your NGO

## 🤝 Contributing

Contributions welcome! Please follow the existing code structure and patterns.

## 📞 Support

For issues and questions, please create an issue in the repository.

---

Built with ❤️ using Next.js, MongoDB, and TypeScript
