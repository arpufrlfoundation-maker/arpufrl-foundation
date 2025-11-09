# 🚀 Quick Setup Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB database (local or Atlas)
- Razorpay account for payments

## Step 1: Environment Setup

Create `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/ngo-management
# or MongoDB Atlas
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Authentication (NextAuth)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-random-secret-here

# Razorpay (Payment Gateway)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email (Optional - for notifications)
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@example.com
```

## Step 2: Install Dependencies

```bash
npm install --legacy-peer-deps
```

## Step 3: Database Setup

### Option A: Migrate Existing Database
```bash
node scripts/migrate-hierarchy.js
```

### Option B: Fresh Start
1. Ensure MongoDB is running
2. The app will create collections automatically on first run

## Step 4: Create First Admin User

### Using MongoDB Compass or Shell:
```javascript
db.users.insertOne({
  name: "System Admin",
  email: "admin@ngo.org",
  role: "ADMIN",
  status: "ACTIVE",
  hashedPassword: "$2a$12$...",  // Use bcrypt to hash: "admin123"
  emailVerified: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
})
```

### Or use the API (after app is running):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "System Admin",
    "email": "admin@ngo.org",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!",
    "role": "ADMIN"
  }'
```

## Step 5: Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Step 6: Initial Configuration

### 1. Login as Admin
- Navigate to `/login`
- Use admin credentials

### 2. Create Hierarchy Structure

#### Create National Level User
```bash
POST /api/users
{
  "name": "National Coordinator",
  "email": "national@ngo.org",
  "phone": "+911234567890",
  "role": "NATIONAL_LEVEL",
  "password": "SecurePass123!",
  "region": "India"
}
```

#### Create State Level Users
```bash
POST /api/users
{
  "name": "Maharashtra State Adhyaksh",
  "email": "mh.adhyaksh@ngo.org",
  "role": "STATE_ADHYAKSH",
  "password": "SecurePass123!",
  "parentCoordinatorId": "[national_user_id]",
  "region": "Maharashtra",
  "state": "Maharashtra"
}
```

#### Continue Creating Hierarchy
Follow the same pattern for:
- State Coordinators
- Mandal Coordinators
- Jila Adhyaksh
- Jila Coordinators
- Block Coordinators
- Nodel
- Prerak
- Prerna Sakhi

### 3. Verify Referral Codes

Check that each user has a referral code:
```bash
GET /api/users?role=STATE_COORDINATOR
```

Response should include `referralCode` field for each user.

### 4. Assign First Targets

```bash
POST /api/targets
{
  "assignedTo": "[user_id]",
  "assignedBy": "[your_admin_id]",
  "type": "DONATION_AMOUNT",
  "targetValue": 100000,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "description": "Annual donation target"
}
```

## Step 7: Test Donation Flow

### 1. Get Referral Link
- Login as any coordinator
- Copy referral code from dashboard
- Share link: `http://localhost:3000/donate?ref=REFERRAL_CODE`

### 2. Make Test Donation
- Open referral link
- Fill donation form
- Complete Razorpay payment (use test mode)

### 3. Verify Attribution
```bash
GET /api/dashboard/[user_id]
```

Should show updated donation count and amount.

## Step 8: Export Initial Data

```bash
# Export users
GET /api/users?limit=1000

# Export donations
GET /api/donations

# Use CSV export buttons in dashboard
```

## Common Tasks

### Generate Referral Codes for Existing Users
```bash
node scripts/generate-referral-codes.js
```

### Bulk Create Users
```bash
node scripts/bulk-import-users.js users.csv
```

### Reset User Password
```bash
node scripts/reset-password.js user@email.com
```

## Troubleshooting

### Issue: "Cannot connect to MongoDB"
**Solution**: 
- Check MONGODB_URI in `.env.local`
- Ensure MongoDB is running
- Check network connectivity

### Issue: "Referral code already exists"
**Solution**:
- Codes are auto-generated and should be unique
- If conflict occurs, manually update user's referral code

### Issue: "Donations not attributed"
**Solution**:
- Verify referral code exists and is active
- Check user status is ACTIVE
- Run migration script to fix historical data

### Issue: "Hierarchy not displaying"
**Solution**:
- Ensure parentCoordinatorId is set correctly
- Verify role hierarchy levels are correct
- Check all users in chain have ACTIVE status

## Production Deployment

### 1. Update Environment Variables
```env
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
MONGODB_URI=mongodb+srv://prod-user:password@cluster.mongodb.net/prod-db
```

### 2. Build Application
```bash
npm run build
```

### 3. Start Production Server
```bash
npm start
```

### 4. Enable HTTPS
- Use reverse proxy (Nginx/Apache)
- Install SSL certificate (Let's Encrypt)

### 5. Setup Monitoring
- Configure error tracking (Sentry)
- Setup performance monitoring
- Enable database backups

## Security Checklist

- [ ] Strong admin password set
- [ ] Environment variables secured
- [ ] HTTPS enabled in production
- [ ] Database connection encrypted
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Session secrets are random and secure
- [ ] Razorpay webhook signature verification enabled

## Performance Optimization

- [ ] Enable database indexes (run migration script)
- [ ] Configure MongoDB connection pooling
- [ ] Enable Next.js image optimization
- [ ] Setup CDN for static assets
- [ ] Configure caching headers
- [ ] Monitor API response times

## Maintenance

### Regular Tasks
- **Daily**: Check donation processing
- **Weekly**: Review user registrations and hierarchy
- **Monthly**: Export reports and backup database
- **Quarterly**: Review and update targets

### Database Backup
```bash
# MongoDB backup
mongodump --uri="$MONGODB_URI" --out=./backup-$(date +%Y%m%d)

# Restore
mongorestore --uri="$MONGODB_URI" ./backup-20250101
```

## Support

For issues:
1. Check logs: `npm run dev` (development)
2. Review error messages in console
3. Check MongoDB logs
4. Refer to HIERARCHY_SYSTEM.md for detailed documentation

## Next Steps

1. ✅ Complete initial setup
2. ✅ Create hierarchy structure
3. ✅ Assign targets
4. 📊 Start tracking donations
5. 📈 Monitor analytics
6. 🎯 Optimize based on performance

---

🎉 **Congratulations!** Your NGO Management System is ready to use.

For detailed documentation, see [HIERARCHY_SYSTEM.md](./HIERARCHY_SYSTEM.md)
