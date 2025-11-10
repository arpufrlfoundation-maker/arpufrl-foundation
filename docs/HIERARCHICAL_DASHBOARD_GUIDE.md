# Samarpan Sahayog Abhiyan - Hierarchical Dashboard System

## 🌍 Overview

A comprehensive national-to-village level dashboard system with 11-tier hierarchy for leadership management, monitoring, and transparency.

---

## 📊 11-Level Hierarchy Structure

### Level 1: Central President (National President)
- **Access**: Views all states, state presidents, and all subordinate levels
- **Dashboard Features**:
  - National-level statistics
  - All state overviews
  - Complete organizational tree
  - Export capabilities for all data
  - System-wide analytics

### Level 2: State President
- **Access**: All members within their state
- **Dashboard Features**:
  - State-level statistics
  - Zone and district overviews
  - State coordinator management
  - State-wide reports

### Level 3: State Coordinator
- **Access**: All zones and district-level officers within their state
- **Dashboard Features**:
  - Zone-level statistics
  - District coordination view
  - Performance tracking per zone

### Level 4: Zone Coordinator
- **Access**: All district-level officers under their zone
- **Dashboard Features**:
  - Zone-wide statistics
  - District president/coordinator views
  - Zone performance metrics

### Level 5: District President (DP)
- **Access**: DCs, BCs, Nodal Officers, Preraks, Prerna Sakhis, and Volunteers in district
- **Dashboard Features**:
  - District-level statistics
  - Block coordinator management
  - District reports and analytics

### Level 6: District Coordinator (DC)
- **Access**: BCs, Nodal Officers, Preraks, Prerna Sakhis, and Volunteers within district
- **Dashboard Features**:
  - District coordination view
  - Block-level statistics
  - Team performance tracking

### Level 7: Block Coordinator (BC)
- **Access**: Nodal Officers, Preraks, Prerna Sakhis, and Volunteers within block
- **Dashboard Features**:
  - Block-level statistics
  - Panchayat-level views
  - Local team management

### Level 8: Nodal Officer (Nyay Panchayat Officer)
- **Access**: Preraks, Prerna Sakhis, and Volunteers under panchayat area
- **Dashboard Features**:
  - Panchayat-level statistics
  - Village coordinator views
  - Local activity tracking

### Level 9: Prerak (Gram Sabha Coordinator)
- **Access**: Prerna Sakhis and Volunteers within village
- **Dashboard Features**:
  - Village-level statistics
  - Prerna Sakhi management
  - Local contribution tracking

### Level 10: Prerna Sakhi (Revenue Village Representative)
- **Access**: Volunteers under them
- **Dashboard Features**:
  - Personal referral statistics
  - Volunteer list view
  - Contribution tracking

### Level 11: Volunteer (Member/Supporter)
- **Access**: Own profile and payment status only
- **Dashboard Features**:
  - Personal contribution history
  - Payment status
  - Referral code for donations
  - ID card download

---

## 🎯 Dashboard Features by Level

### Core Features (All Levels)

#### 1. Basic Information
- Name, designation, photo
- Area details (state/district/block/village)
- Login ID / Referral Code
- Hierarchy level indicator

#### 2. Payment & Contribution
- **Contribute Now Button** with predefined amounts:
  - ₹21, ₹51, ₹101, ₹251, ₹501, ₹1001, ₹2001, ₹5001
  - Custom amount option (minimum ₹21)
- Total donations received through referral
- Monthly contribution summary
- Payment history with receipts
- Razorpay integration for secure payments

#### 3. Referral System
- Unique referral code per user
- QR code generation for easy sharing
- Referral link with tracking
- Copy-to-clipboard functionality

### Advanced Features (Levels 1-10)

#### 4. Team & Network
- **My Team Section**:
  - Direct reports count
  - Total network size
  - Active members count
  - Pending approvals
- Team member list with filters:
  - By role
  - By status
  - By location
- Hierarchy tree visualization
- Geographical distribution view

#### 5. Reports & Analytics
- **Performance Graphs**:
  - Weekly donation trends
  - Monthly growth charts
  - Team expansion metrics
- **Statistics**:
  - Total members joined
  - Active members percentage
  - Contribution breakdown
- **Export Options**:
  - CSV export for team data
  - PDF reports
  - Excel spreadsheets

#### 6. Management Tools (Levels 1-7)
- User approval system
- Role assignment
- Geographical area management
- Subordinate performance review

### Leadership Features (Levels 1-4)

#### 7. Advanced Analytics
- State-wise comparison
- Zone performance ranking
- District-level insights
- Predictive analytics

#### 8. System Administration (Level 1 only)
- System-wide settings
- User management
- Audit logs
- Backup and restore

---

## 🔐 Visibility & Access Control Matrix

| Viewer Role | Can View Roles |
|-------------|----------------|
| Central President | All (1-11) |
| State President | 2-11 (within state) |
| State Coordinator | 3-11 (within state) |
| Zone Coordinator | 4-11 (within zone) |
| District President | 5-11 (within district) |
| District Coordinator | 6-11 (within district) |
| Block Coordinator | 7-11 (within block) |
| Nodal Officer | 8-11 (within panchayat) |
| Prerak | 9-11 (within gram sabha) |
| Prerna Sakhi | 10-11 (within village) |
| Volunteer | 11 (self only) |

---

## 💳 Payment Flow

### 1. Payment Initiation
- User clicks "Contribute Now" on any dashboard
- Selects predefined amount or enters custom amount
- Payment widget displays referral attribution

### 2. Razorpay Integration
```javascript
// Payment options
{
  amounts: [21, 51, 101, 251, 501, 1001, 2001, 5001],
  currency: 'INR',
  gateway: 'Razorpay'
}
```

### 3. Attribution Chain
When a payment is made through a volunteer's link:
```
Volunteer → Prerna Sakhi → Prerak → Nodal Officer →
Block Coordinator → District Coordinator → District President →
Zone Coordinator → State Coordinator → State President → Central President
```

All levels in the chain see the donation reflected in their dashboards.

### 4. Payment Tracking
- Real-time payment status updates
- Automatic receipt generation
- Email notifications
- SMS confirmations (optional)

---

## 📈 Analytics & Reporting

### Available Metrics

#### Donation Metrics
- Total donations (count and amount)
- Personal vs. team contributions
- Daily/weekly/monthly trends
- Average donation amount
- Top performers

#### Team Metrics
- Team size (direct and indirect)
- Active vs. inactive members
- Growth rate
- Retention rate
- Geographical distribution

#### Performance Metrics
- Completion percentage
- Target vs. achievement
- Comparative analysis
- Role-based performance

### Report Types

1. **Summary Reports**
   - Dashboard overview
   - Quick stats
   - Recent activity

2. **Detailed Reports**
   - Complete team roster
   - Donation history
   - Performance analysis

3. **Analytical Reports**
   - Trend analysis
   - Predictive insights
   - Comparative studies

---

## 🗺️ Geographical Hierarchy

```
National (India)
├── State (e.g., Uttar Pradesh)
│   ├── Zone/Mandal (e.g., Lucknow Zone)
│   │   ├── District/Jila (e.g., Lucknow District)
│   │   │   ├── Block (e.g., Mohanlalganj)
│   │   │   │   ├── Panchayat (Nyay Panchayat)
│   │   │   │   │   ├── Gram Sabha (Village)
│   │   │   │   │   │   └── Revenue Village
```

---

## 🔧 Technical Implementation

### API Endpoints

1. **Dashboard Data**: `GET /api/dashboard/hierarchy`
   - Returns role-specific dashboard statistics
   - Includes team, donations, and hierarchy info

2. **Team Data**: `GET /api/dashboard/team`
   - Returns team members with pagination
   - Supports filters (role, status, location)
   - Tree view option available

3. **Analytics**: `GET /api/dashboard/analytics`
   - Returns performance metrics
   - Supports different time periods
   - Multiple analytics types (donations, members, performance)

### Key Components

1. **UniversalDashboard.tsx**
   - Adapts to all 11 hierarchy levels
   - Role-based feature display
   - Responsive design

2. **DashboardStatsCards.tsx**
   - Reusable metric cards
   - Trend indicators
   - Icon customization

3. **PaymentWidget.tsx**
   - Predefined amounts
   - Custom amount input
   - Razorpay integration
   - Referral code attribution

4. **TeamNetworkView.tsx**
   - Paginated member list
   - Search and filter
   - Role and status badges
   - Performance metrics per member

### Utility Functions

Location: `lib/hierarchy-utils.ts`

- `canViewDashboard()` - Access control
- `getDashboardStats()` - Fetch dashboard data
- `getHierarchyTree()` - Build organizational tree
- `getAllSubordinates()` - Get team members recursively
- `getTeamMembers()` - Paginated team list
- `getGeographicalScope()` - Determine user's area
- `getDashboardFeatures()` - Get role-based features

---

## 🚀 Usage Examples

### For Central President
```typescript
// View all states overview
GET /api/dashboard/hierarchy
// Response includes:
{
  user: { role: 'CENTRAL_PRESIDENT', ... },
  donations: { total: 50000, amount: 5000000 },
  team: { total: 10000, active: 8500 },
  hierarchy: { level: 1, levelName: 'Central President' }
}
```

### For Volunteer
```typescript
// View personal stats only
GET /api/dashboard/hierarchy
// Response includes:
{
  user: { role: 'VOLUNTEER', ... },
  donations: { personal: 10, personalAmount: 5000 },
  team: { total: 0 }, // No subordinates
  hierarchy: { level: 11, levelName: 'Volunteer' }
}
```

---

## 📱 Mobile Responsiveness

- Fully responsive design
- Mobile-first approach
- Touch-friendly interface
- Optimized charts for small screens
- Progressive Web App (PWA) support

---

## 🎨 UI/UX Features

- Clean, modern design
- Intuitive navigation
- Color-coded roles
- Status badges
- Loading states
- Error handling
- Empty states
- Success notifications
- Contextual help

---

## 🔒 Security Features

- Role-based access control (RBAC)
- Hierarchical visibility enforcement
- Secure payment processing
- Data encryption
- Session management
- Audit logging

---

## 📊 Performance Optimization

- Lazy loading components
- Pagination for large datasets
- Caching strategies
- Optimized database queries
- CDN integration
- Image optimization

---

## 🛠️ Setup Instructions

1. **Environment Variables**
```bash
MONGODB_URI=your_mongodb_uri
NEXTAUTH_SECRET=your_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

2. **Install Dependencies**
```bash
npm install
```

3. **Run Development Server**
```bash
npm run dev
```

4. **Access Dashboard**
```
http://localhost:3000/dashboard
```

---

## 📝 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Offline support
- [ ] Real-time notifications
- [ ] Video conferencing integration
- [ ] Document management
- [ ] Reward point system
- [ ] Gamification elements
- [ ] Multi-language support
- [ ] WhatsApp integration
- [ ] Automated reports via email

---

## 🤝 Support

For issues or questions:
- Email: support@samarpansahayog.org
- Phone: +91-XXXX-XXXXXX

---

**Built with ❤️ for Samarpan Sahayog Abhiyan**
