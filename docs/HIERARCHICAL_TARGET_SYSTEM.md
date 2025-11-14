# Hierarchical Target Assignment and Fund Collection Tracking System

## 📋 Overview

A complete **Hierarchical Target Assignment and Fund Collection Tracking System** for **"Samarpan Sahayog Abhiyan"** that enables the Central President to assign fund collection targets to any level, with automatic division and tracking down through the entire hierarchy.

## 🎯 Key Features

### ✅ Completed Features

1. **Hierarchical Target Assignment**
   - Assign targets from any superior to subordinates
   - Single or bulk target assignment
   - Automatic subdivision support

2. **Collection Tracking**
   - Personal collection tracking
   - Team collection aggregation
   - Automatic upward propagation through hierarchy

3. **Real-Time Progress Monitoring**
   - Live progress calculation
   - Auto-update target status (Pending → In Progress → Completed/Overdue)
   - Days remaining calculation

4. **Dashboard Data**
   - User-specific statistics
   - Team performance breakdown
   - Recent activity tracking
   - Analytics with daily/weekly/monthly trends

5. **Leaderboard System**
   - Regional leaderboards
   - Top performers tracking
   - Achievement percentage ranking

## 🗂 Database Schema

### Target Model

```typescript
{
  assignedTo: ObjectId,           // User who received the target
  assignedBy: ObjectId,           // User who assigned the target
  targetAmount: Number,           // Total target amount

  // Collection tracking
  personalCollection: Number,     // Collected directly by this user
  teamCollection: Number,         // Collected by subordinates (aggregated)
  totalCollection: Number,        // personalCollection + teamCollection

  // Status
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE' | 'CANCELLED',
  startDate: Date,
  endDate: Date,

  // Hierarchy
  parentTargetId: ObjectId,       // Parent target if subdivided
  level: HierarchyLevel,          // National, State, Zone, etc.
  region: {
    state, zone, district, block, village
  },

  // Subdivision
  isDivided: Boolean,
  subdivisions: [ObjectId],       // Child target IDs

  // Calculated fields (auto-updated)
  progressPercentage: Number,
  remainingAmount: Number,
  daysRemaining: Number,
  isOverdue: Boolean
}
```

## 🔌 API Endpoints

### 1. Assign Target

**POST** `/api/targets/assign`

Assign a target to a user or subdivide among multiple users.

**Single Assignment:**
```json
{
  "assignedTo": "userId",
  "targetAmount": 200000,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "description": "Annual target 2025"
}
```

**Subdivision Assignment:**
```json
{
  "targetAmount": 200000,
  "subdivisions": [
    { "userId": "stateCoord1", "amount": 50000 },
    { "userId": "stateCoord2", "amount": 50000 },
    { "userId": "stateCoord3", "amount": 100000 }
  ],
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "description": "Divided state-wise target"
}
```

### 2. Record Collection

**POST** `/api/targets/collect`

Record a fund collection and automatically update hierarchy.

```json
{
  "amount": 5000,
  "paymentMode": "upi",
  "transactionId": "UPI123456",
  "receiptNumber": "RCP001",
  "donorName": "John Doe",
  "donorContact": "9876543210",
  "purpose": "Education support"
}
```

### 3. Get Dashboard Data

**GET** `/api/targets/dashboard`

Get comprehensive dashboard data for the current user.

### 4. Get Hierarchy Stats

**GET** `/api/targets/hierarchy`

Get hierarchical statistics and team breakdown.

### 5. Get Leaderboard

**GET** `/api/targets/leaderboard?limit=10`

Get leaderboard of top performers.

### 6. List Targets

**GET** `/api/targets?status=active&includeHistory=false`

Get targets for the current user.

### 7. Update Target

**PATCH** `/api/targets`

Update target status or notes.

## 🔄 How It Works

### Target Assignment Flow

1. **Central President assigns ₹200,000 to State President**
2. **State President subdivides to State Coordinators**
3. **State Coordinators further divide to zones/districts**

### Collection Propagation Flow

1. **Volunteer collects ₹1,000**
   - Volunteer's personal collection: ₹1,000

2. **System automatically updates upward**
   - Prerak's team collection: +₹1,000
   - Nodal Officer's team collection: +₹1,000
   - Block Coordinator's team collection: +₹1,000
   - [continues up to Central President]

3. **All levels see updated progress**
   - Each superior sees their team collection increase
   - Progress percentage updates automatically

## 📊 Dashboard Views by Role

### Central President Dashboard
- Total national collection
- State-wise performance breakdown
- Top performing states
- Overall achievement percentage

### State President Dashboard
- State total collection (own + team)
- Coordinator-wise breakdown
- Zone-wise performance
- Top performers in state

### Zone/District/Block Coordinators
- Regional collection totals
- Subordinate performance
- District/Block breakdown
- Personal vs team collection

### Volunteer Dashboard
- Personal contribution
- Progress toward target
- Recent collections
- Achievement percentage

## 🎯 Success Metrics

✅ Hierarchical target assignment
✅ Automatic collection aggregation
✅ Real-time progress tracking
✅ Upward propagation through all levels
✅ Team performance breakdown
✅ Leaderboard rankings
✅ Dashboard analytics
✅ Permission-based access

---

**System Status:** ✅ **Fully Operational**

All core backend APIs are implemented and ready to use.
