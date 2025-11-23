# Production Deployment Checklist for ARPU Foundation Website

## ⚠️ CRITICAL SECURITY ITEMS

### 1. Environment Variables
- [ ] Generate new NEXTAUTH_SECRET using: `openssl rand -base64 32`
- [ ] Replace MongoDB URI with production database
- [ ] Switch Razorpay to LIVE keys (rzp_live_...)
- [ ] Update NEXTAUTH_URL to production domain
- [ ] Configure production email server credentials
- [ ] Set NODE_ENV=production
- [ ] Update APP_URL to production domain
- [ ] Remove or disable DEMO_ADMIN credentials in production

### 2. Database Security
- [ ] Enable MongoDB IP whitelist (only allow production servers)
- [ ] Create database backups and test restore procedure
- [ ] Enable MongoDB authentication
- [ ] Review and restrict database user permissions
- [ ] Add database indexes for performance (see models)
- [ ] Test database connection pooling under load

### 3. API Security
- [ ] Enable rate limiting on all API routes
- [ ] Validate all user inputs with Zod schemas
- [ ] Sanitize all string inputs to prevent XSS
- [ ] Review all API routes for proper authentication
- [ ] Ensure CORS is properly configured
- [ ] Add request size limits
- [ ] Enable API request logging

### 4. Authentication & Authorization
- [ ] Test all protected routes are actually protected
- [ ] Verify middleware catches unauthorized access
- [ ] Test password reset flow
- [ ] Verify email verification works
- [ ] Test session expiration and renewal
- [ ] Review role-based access control

### 5. Payment Security (Razorpay)
- [ ] Switch to LIVE mode Razorpay keys
- [ ] Verify webhook signature validation
- [ ] Test payment success flow
- [ ] Test payment failure handling
- [ ] Test refund processing
- [ ] Add payment audit logging
- [ ] Monitor for duplicate payment attempts

## 🚀 PERFORMANCE OPTIMIZATION

### 6. Next.js Configuration
- [ ] Run `npm run build` and fix all build warnings
- [ ] Enable compression in next.config.ts
- [ ] Configure proper cache headers
- [ ] Optimize images with Next.js Image component
- [ ] Enable static page generation where possible
- [ ] Review bundle size and eliminate unused dependencies

### 7. Database Performance
- [ ] Add indexes to frequently queried fields
- [ ] Test query performance under load
- [ ] Implement pagination on all list endpoints
- [ ] Use projection to limit returned fields
- [ ] Enable connection pooling (already configured)

### 8. Frontend Performance
- [ ] Lazy load components where appropriate
- [ ] Minimize JavaScript bundle size
- [ ] Optimize images (WebP, proper sizing)
- [ ] Enable service worker/PWA features
- [ ] Test lighthouse scores (aim for 90+)
- [ ] Add loading states for better UX

## 📊 MONITORING & LOGGING

### 9. Error Tracking
- [ ] Set up Sentry or similar error tracking
- [ ] Replace console.log with proper logger
- [ ] Add error boundaries in React components
- [ ] Log all payment transactions
- [ ] Monitor API error rates
- [ ] Set up alerts for critical errors

### 10. Analytics & Monitoring
- [ ] Add Google Analytics or similar
- [ ] Monitor server uptime
- [ ] Track API response times
- [ ] Monitor database performance
- [ ] Set up automated health checks
- [ ] Track donation conversion rates

## 🔒 FINAL SECURITY CHECKS

### 11. Headers & CSP
- [ ] Verify security headers (already in next.config.ts)
- [ ] Test Content Security Policy
- [ ] Enable HSTS in production
- [ ] Configure proper CORS policies
- [ ] Add Subresource Integrity for CDN assets

### 12. Data Privacy & Compliance
- [ ] Review GDPR compliance
- [ ] Implement data export functionality
- [ ] Add data deletion capabilities
- [ ] Review privacy policy accuracy
- [ ] Test consent management
- [ ] Anonymize donor data as requested

## 🧪 TESTING

### 13. Testing Before Launch
- [ ] Run all unit tests: `npm test`
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Test with screen readers for accessibility
- [ ] Perform load testing on API endpoints
- [ ] Test email delivery to various providers
- [ ] Test payment flow end-to-end
- [ ] Test form validations
- [ ] Test file upload limits

### 14. User Acceptance Testing
- [ ] Test admin dashboard functionality
- [ ] Test coordinator dashboards
- [ ] Test volunteer registration flow
- [ ] Test donation flow with real payment
- [ ] Test contact form submission
- [ ] Test document viewing
- [ ] Test survey responses

## 📦 DEPLOYMENT

### 15. Pre-Deployment
- [ ] Create production environment on Vercel/hosting
- [ ] Configure custom domain and SSL
- [ ] Set up database backups schedule
- [ ] Configure CDN for static assets
- [ ] Set up staging environment for testing
- [ ] Review and update package dependencies

### 16. Deployment Process
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Monitor staging for 24 hours
- [ ] Create deployment rollback plan
- [ ] Deploy to production
- [ ] Monitor production closely for first 24-48 hours

### 17. Post-Deployment
- [ ] Verify all environment variables loaded correctly
- [ ] Test critical user flows (donation, registration)
- [ ] Verify email delivery works
- [ ] Test payment processing with small amount
- [ ] Check database connections
- [ ] Monitor error logs
- [ ] Verify SSL certificate
- [ ] Test from different geographic locations

## 📋 ONGOING MAINTENANCE

### 18. Regular Tasks
- [ ] Weekly security updates check
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Regular database backups verification
- [ ] Monitor and rotate secrets/keys
- [ ] Review and archive old data
- [ ] Update documentation

## 🔧 CONFIGURATION FILES TO REVIEW

1. `.env.production` - All production secrets
2. `next.config.ts` - Production optimizations
3. `vercel.json` - Deployment configuration
4. `middleware.ts` - Route protection
5. `lib/auth.ts` - Authentication logic
6. `lib/db.ts` - Database connection
7. `lib/razorpay.ts` - Payment processing

## ⚡ QUICK FIXES NEEDED

### Critical Issues Found:
1. ✅ Logger utility created (replace console.log in production)
2. ✅ Rate limiting utility created
3. ✅ Input sanitization utility created
4. ⚠️ Need to apply sanitization to all API inputs
5. ⚠️ Need to add rate limiting to sensitive endpoints
6. ⚠️ Need to replace console.log/error with logger
7. ⚠️ MongoDB URI exposed in .env (secure this!)
8. ⚠️ Test Razorpay keys in .env (replace with LIVE)
9. ⚠️ Demo admin credentials should be removed in production

## 📞 EMERGENCY CONTACTS

- [ ] Document emergency rollback procedure
- [ ] List of on-call personnel
- [ ] Database admin contact
- [ ] Hosting provider support
- [ ] Payment gateway support (Razorpay)

---

## Sign-Off

- [ ] Technical Lead Review
- [ ] Security Review
- [ ] Final Testing Complete
- [ ] Deployment Approved
- [ ] Monitoring Configured
- [ ] Ready for Production ✅
