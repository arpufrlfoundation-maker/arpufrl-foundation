# Production Deployment Guide

## 📋 Prerequisites

Before deploying to production, ensure you have:

- [ ] Node.js 20+ installed
- [ ] MongoDB Atlas account with cluster created
- [ ] Razorpay account with LIVE keys
- [ ] Email service configured (Gmail/SendGrid/etc.)
- [ ] Domain name registered and configured
- [ ] SSL certificate (automatic with Vercel/Netlify)

## 🚀 Deployment Steps

### Step 1: Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.production.example .env.production
   ```

2. Fill in all required environment variables:
   - Generate strong NEXTAUTH_SECRET: `openssl rand -base64 32`
   - Use production MongoDB URI
   - Use Razorpay LIVE keys (rzp_live_...)
   - Set production domain URLs

3. **NEVER** commit .env.production to git!

### Step 2: Database Preparation

1. Create production MongoDB database
2. Configure IP whitelist for production servers
3. Create database indexes:
   ```bash
   npm run create-indexes
   ```
4. Test database connection

### Step 3: Security Verification

Run through the security checklist:
```bash
# Check for security issues
npm audit
npm audit fix

# Verify environment variables
node -e "require('./lib/env-validation')"

# Check build
npm run build
```

### Step 4: Deploy to Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   # First deployment
   vercel

   # Production deployment
   vercel --prod
   ```

4. Configure environment variables in Vercel dashboard

### Step 5: Post-Deployment Checks

1. **Health Check**:
   ```bash
   curl https://yourdomain.com/api/health
   ```

2. **Test Critical Flows**:
   - [ ] User login
   - [ ] Donation with ₹1 (real payment)
   - [ ] Form submissions (contact, volunteer)
   - [ ] Email delivery
   - [ ] Admin dashboard access

3. **Monitor Logs**:
   - Check Vercel logs for errors
   - Monitor database connections
   - Watch for failed payments

### Step 6: DNS & SSL

1. Configure custom domain in Vercel
2. Add DNS records (automatic with Vercel)
3. Verify SSL certificate is active
4. Test HTTPS redirect

## 🔒 Security Hardening

### Critical Security Steps

1. **Secrets Management**:
   ```bash
   # Never log secrets
   grep -r "console.log" app/api/
   
   # Verify .env is in .gitignore
   git check-ignore .env.production
   ```

2. **Database Security**:
   - Enable MongoDB encryption at rest
   - Configure IP whitelist
   - Use strong passwords (32+ characters)
   - Enable audit logging

3. **Rate Limiting**:
   - Already configured in lib/rate-limit.ts
   - Monitor for abuse in logs

4. **Input Validation**:
   - All API routes use Zod schemas
   - Sanitization applied (lib/sanitize.ts)

## 📊 Monitoring Setup

### 1. Error Tracking

Recommended: Sentry
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Add to environment:
```
SENTRY_DSN=your_sentry_dsn
```

### 2. Uptime Monitoring

Use services like:
- UptimeRobot (free tier available)
- Pingdom
- StatusCake

Monitor: `https://yourdomain.com/api/health`

### 3. Performance Monitoring

- Vercel Analytics (built-in)
- Google Analytics
- Lighthouse CI

## 🔄 Backup Strategy

### Database Backups

1. **Automated Backups**:
   MongoDB Atlas provides automatic backups

2. **Manual Backup**:
   ```bash
   npm run db:backup
   ```

3. **Backup Schedule**:
   - Daily: Automatic (Atlas)
   - Weekly: Manual verification
   - Monthly: Full backup download

### Restore Procedure

```bash
npm run db:restore
```

## 🚨 Rollback Plan

If issues occur after deployment:

1. **Immediate Rollback**:
   ```bash
   vercel rollback
   ```

2. **Database Rollback**:
   - Restore from latest backup
   - Contact MongoDB Atlas support if needed

3. **Notify Users**:
   - Status page update
   - Email notification if necessary

## 📈 Performance Optimization

### Before Launch

1. **Build Optimization**:
   ```bash
   npm run build
   npm run start
   # Check bundle size and loading times
   ```

2. **Image Optimization**:
   - Use Next.js Image component
   - Serve WebP/AVIF formats
   - Configure CDN caching

3. **API Optimization**:
   - Database indexes created
   - Connection pooling enabled
   - Pagination implemented

### After Launch

Monitor and optimize:
- Page load times (target: < 3s)
- API response times (target: < 500ms)
- Database query times (target: < 100ms)

## 🔍 Testing Checklist

### Functional Testing

- [ ] User registration and login
- [ ] Password reset flow
- [ ] Donation with real payment (₹1)
- [ ] Referral code tracking
- [ ] Email notifications
- [ ] Admin user management
- [ ] Report generation
- [ ] File uploads (if applicable)

### Security Testing

- [ ] SQL/NoSQL injection attempts
- [ ] XSS attempts
- [ ] CSRF protection
- [ ] Rate limiting triggers
- [ ] Authentication bypass attempts
- [ ] Authorization checks

### Performance Testing

- [ ] Load test with 100 concurrent users
- [ ] Database query performance
- [ ] API response times
- [ ] Image loading times
- [ ] Mobile performance

## 📞 Support & Maintenance

### Regular Maintenance

**Weekly**:
- Check error logs
- Review failed payments
- Update dependencies

**Monthly**:
- Security audit
- Performance review
- Backup verification

**Quarterly**:
- Full system audit
- Dependency major updates
- Security penetration testing

### Emergency Contacts

- Hosting: Vercel Support
- Database: MongoDB Atlas Support
- Payments: Razorpay Support
- Domain: Your registrar support

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Razorpay Docs](https://razorpay.com/docs/)

## ✅ Production Checklist Summary

Use `PRODUCTION_CHECKLIST.md` for complete pre-launch checklist.

Quick reference:
- [ ] Environment variables configured
- [ ] Database secured and indexed
- [ ] Payment gateway in LIVE mode
- [ ] Security headers enabled
- [ ] Error tracking set up
- [ ] Monitoring configured
- [ ] Backups automated
- [ ] SSL certificate active
- [ ] DNS configured correctly
- [ ] All tests passing

---

**🎉 Once all checks pass, you're ready to launch!**

Remember: Monitor closely for the first 24-48 hours after launch.
