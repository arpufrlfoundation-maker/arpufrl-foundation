# 🚀 Quick Start - Production Deployment

## ⚡ Fast Track to Production (4-6 hours)

### Step 1: Environment Setup (30 min)
```bash
# 1. Copy and fill production environment
cp .env.production.example .env.production

# 2. Generate strong secret
openssl rand -base64 32
# Add to NEXTAUTH_SECRET in .env.production

# 3. Update these in .env.production:
# - MONGODB_URI (production database)
# - RAZORPAY_KEY_ID (rzp_live_...)
# - RAZORPAY_KEY_SECRET (live secret)
# - NEXTAUTH_URL (https://yourdomain.com)
# - APP_URL (https://yourdomain.com)
# - Email server credentials
```

### Step 2: Database Setup (15 min)
```bash
# Create indexes for optimal performance
npm run create-indexes

# Verify connection
node -e "require('./lib/db').connectToDatabase().then(() => console.log('✅ Connected'))"
```

### Step 3: Security Audit (30 min)
```bash
# Check for vulnerabilities
npm audit fix

# Verify build
npm run build

# Test production locally
npm start
```

### Step 4: Deploy to Vercel (30 min)
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# In Vercel Dashboard:
# - Add all environment variables from .env.production
# - Configure custom domain
# - Enable auto-deployments from main branch
```

### Step 5: Post-Deployment Tests (1 hour)
```bash
# Health check
curl https://yourdomain.com/api/health

# Manual tests:
# ✅ Login/logout
# ✅ Donation with ₹1 (real payment!)
# ✅ Email delivery (check spam folder)
# ✅ Admin dashboard access
# ✅ Mobile responsiveness
```

### Step 6: Monitoring Setup (30 min)
```bash
# Set up Sentry (recommended)
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs

# Add to .env.production:
SENTRY_DSN=your_sentry_dsn

# Configure uptime monitoring:
# - UptimeRobot.com (free tier)
# - Monitor: https://yourdomain.com/api/health
# - Alert email: your-email@domain.com
```

---

## 🔥 Critical Checklist (Must Do Before Launch)

### Security
- [ ] Generated new NEXTAUTH_SECRET (32+ characters)
- [ ] Switched to Razorpay LIVE keys
- [ ] Updated MongoDB URI to production
- [ ] Removed/disabled demo admin credentials
- [ ] Verified all environment variables

### Database
- [ ] Created all indexes: `npm run create-indexes`
- [ ] Configured IP whitelist in MongoDB Atlas
- [ ] Tested database connection
- [ ] Verified backup automation

### Configuration
- [ ] Domain configured with SSL
- [ ] DNS records pointing to Vercel
- [ ] Email service configured and tested
- [ ] Webhook URLs updated in Razorpay

### Testing
- [ ] Successful donation with real payment
- [ ] Email notifications working
- [ ] Admin dashboard accessible
- [ ] Mobile tested (iOS + Android)
- [ ] Cross-browser tested

### Monitoring
- [ ] Error tracking configured (Sentry)
- [ ] Uptime monitoring active
- [ ] Health endpoint verified
- [ ] Alert notifications tested

---

## 📞 Quick Commands

### Development
```bash
npm run dev          # Start dev server
npm test            # Run tests
npm run lint        # Check code quality
```

### Production
```bash
npm run build           # Build for production
npm run start           # Start production server
npm run create-indexes  # Create DB indexes
npm run health-check    # Check app health
```

### Database
```bash
npm run db:backup    # Backup database
npm run db:restore   # Restore database
npm run seed         # Seed test data (dev only!)
```

### Deployment
```bash
vercel               # Deploy to preview
vercel --prod       # Deploy to production
vercel rollback     # Rollback if issues
vercel logs         # View logs
```

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Database Connection Issues
```bash
# Check environment variable
echo $MONGODB_URI

# Test connection
node -e "require('./lib/db').connectToDatabase()"
```

### Payment Not Working
1. Verify Razorpay keys are LIVE (not test)
2. Check webhook URL in Razorpay dashboard
3. Verify webhook secret matches .env
4. Check Razorpay logs for errors

### Emails Not Sending
1. Verify EMAIL_SERVER_* variables
2. Check spam folder
3. Test with: `curl http://localhost:3000/api/test-email`
4. Review email provider settings

---

## 📚 Documentation Quick Links

- **Full Deployment Guide**: `DEPLOYMENT.md`
- **Security Policy**: `SECURITY.md`
- **Production Checklist**: `PRODUCTION_CHECKLIST.md`
- **Full Audit Report**: `PRODUCTION_READINESS_REPORT.md`

---

## 🎯 Success Metrics

### After Launch, Monitor:
- Donation success rate (target: >95%)
- Page load time (target: <3s)
- API response time (target: <500ms)
- Error rate (target: <1%)
- Uptime (target: 99.9%)

### First Week Goals:
- 10+ successful donations
- Zero critical errors
- Email delivery >98%
- All core features working
- Positive user feedback

---

## ✅ You're Ready When:

1. ✅ All environment variables configured
2. ✅ Database indexes created
3. ✅ Razorpay in LIVE mode
4. ✅ Test donation successful (₹1)
5. ✅ Monitoring configured
6. ✅ Team trained on admin features
7. ✅ Emergency contacts documented
8. ✅ Rollback plan tested

---

## 🚀 Launch Command

```bash
# Final check
npm run production-check

# Deploy
vercel --prod

# Monitor
tail -f /var/log/vercel.log  # or use Vercel dashboard
```

**🎉 Congratulations! Your site is live!**

Monitor closely for the first 24-48 hours and be ready to respond to any issues.

---

**Need Help?**
- Check `PRODUCTION_READINESS_REPORT.md` for detailed analysis
- Review `TROUBLESHOOTING.md` for common issues
- Contact technical lead if critical issues arise

**Remember**: Better to delay launch than to launch with critical issues!
