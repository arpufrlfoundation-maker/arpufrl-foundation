# Quick Reference - Target System API

## 🚀 Quick Start

### 1. Assign a Target

```javascript
// Single user assignment
POST /api/targets/assign
{
  "assignedTo": "userId",
  "targetAmount": 200000,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "description": "Q1 2025 Target"
}

// Subdivide among multiple users
POST /api/targets/assign
{
  "targetAmount": 200000,
  "subdivisions": [
    { "userId": "user1", "amount": 50000 },
    { "userId": "user2", "amount": 150000 }
  ],
  "startDate": "2025-01-01",
  "endDate": "2025-12-31"
}
```

### 2. Record Collection

```javascript
POST /api/targets/collect
{
  "amount": 5000,
  "paymentMode": "upi",
  "donorName": "John Doe",
  "donorContact": "9876543210",
  "notes": "Village collection drive"
}
```

### 3. Get Dashboard

```javascript
GET /api/targets/dashboard

// Response includes:
// - User info
// - Target progress
// - Team performance
// - Recent activity
// - Analytics
```

### 4. Get Team Stats

```javascript
GET /api/targets/hierarchy

// Shows:
// - Your target
// - Team breakdown
// - Top performers
// - Subordinates' progress
```

### 5. Get Leaderboard

```javascript
GET /api/targets/leaderboard?limit=10

// Shows top performers in your region
```

### 6. List Your Targets

```javascript
GET /api/targets?status=active

// Query params:
// - status: 'active' | 'all'
// - includeHistory: 'true' | 'false'
```

---

## 📊 Data Structure

### Target Object
```typescript
{
  _id: "targetId",
  assignedTo: "userId",
  assignedBy: "managerId",
  targetAmount: 200000,

  // Collections
  personalCollection: 50000,  // Your collections
  teamCollection: 75000,      // Team collections
  totalCollection: 125000,    // Total (personal + team)

  // Progress
  progressPercentage: 62.5,
  remainingAmount: 75000,
  daysRemaining: 180,
  isOverdue: false,
  status: "IN_PROGRESS",

  // Dates
  startDate: "2025-01-01",
  endDate: "2025-12-31"
}
```

---

## 🎯 How It Works

### Collection Flow
1. Volunteer collects ₹1,000
2. System updates volunteer's `personalCollection`
3. System finds volunteer's parent (Prerak)
4. System updates Prerak's `teamCollection`
5. Continues upward to Central President

### Calculation
```
totalCollection = personalCollection + teamCollection
progressPercentage = (totalCollection / targetAmount) * 100
remainingAmount = targetAmount - totalCollection
```

---

## 💡 Tips

- Only assign targets to subordinates
- Collection auto-propagates upward
- Progress updates automatically
- Status changes automatically
- Use subdivision for team targets

---

## 📞 Support

For questions, see full documentation:
- `/docs/HIERARCHICAL_TARGET_SYSTEM.md`
- `/docs/TARGET_SYSTEM_COMPLETE.md`
