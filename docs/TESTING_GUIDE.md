# Authentication & Hierarchy Testing Guide

## ✅ Completed Fixes

1. **Framer Motion HMR Error** - Resolved
2. **Signup Page Redirect Issue** - Fixed (added /signup to middleware)
3. **Dashboard Layout Issue** - Fixed (flexbox layout, content visible)
4. **Header/Footer on Dashboard** - Hidden (conditional rendering with LayoutWrapper)

---

## 🧪 Testing Checklist

### 1. Header/Footer Visibility Test

**Public Pages (Header & Footer should be VISIBLE):**
- ✓ Home: http://localhost:3000/
- ✓ About: http://localhost:3000/about
- ✓ Programs: http://localhost:3000/programs
- ✓ Contact: http://localhost:3000/contact
- ✓ Donate: http://localhost:3000/donate
- ✓ Login: http://localhost:3000/login
- ✓ Signup: http://localhost:3000/signup

**Dashboard Pages (Header & Footer should be HIDDEN):**
- ✓ Admin Dashboard: http://localhost:3000/dashboard/admin
- ✓ Admin Donations: http://localhost:3000/dashboard/admin/donations
- ✓ Admin Users: http://localhost:3000/dashboard/admin/users
- ✓ Coordinator Dashboard: http://localhost:3000/dashboard/coordinator

---

### 2. Authentication Flow Test

#### A. Demo Admin Login
**Credentials:**
- Email: `admin@arpufrl.demo`
- Password: `DemoAdmin@2025`

**Expected Flow:**
1. Navigate to http://localhost:3000/login
2. Enter demo admin credentials
3. Click "Sign in"
4. Should redirect to `/dashboard/admin`
5. Header & Footer should NOT be visible
6. Sidebar should show: Overview, Donations, Users, Coordinators, Programs, Analytics, Settings
7. Content should be visible (not at bottom of screen)

#### B. Signup Test
**Steps:**
1. Navigate to http://localhost:3000/signup
2. Fill out the form with test data
3. Select a role from the dropdown
4. Verify referral code auto-generates
5. Submit form
6. Should redirect to `/login?message=signup_success`

---

### 3. Role Hierarchy Test

**10-Level Hierarchy (as defined in User model):**

| Level | Role | Value | Access |
|-------|------|-------|--------|
| 0 | Admin | ADMIN | Full system access |
| 1 | National Level | NATIONAL_LEVEL | National coordination |
| 2 | State Adhyaksh | STATE_ADHYAKSH | State leadership |
| 3 | State Coordinator | STATE_COORDINATOR | State coordination |
| 4 | Mandal Coordinator | MANDAL_COORDINATOR | Mandal coordination |
| 5 | Jila Adhyaksh | JILA_ADHYAKSH | District leadership |
| 6 | Jila Coordinator | JILA_COORDINATOR | District coordination |
| 7 | Block Coordinator | BLOCK_COORDINATOR | Block coordination |
| 8 | Nodel | NODEL | Local coordination |
| 9 | Prerak | PRERAK | Field worker |
| 10 | Prerna Sakhi | PRERNA_SAKHI | Community worker |
| 11 | Donor | DONOR | Donation only |

**Test Each Role:**
1. Create a user with each role via signup
2. Login with that user
3. Verify correct dashboard access
4. Verify role-based permissions

---

### 4. Dashboard Layout Test

**What to Check:**
1. ✓ Sidebar visible on desktop (left side, 256px width)
2. ✓ Sidebar overlays on mobile (with backdrop)
3. ✓ Main content takes remaining space (flex-1)
4. ✓ Content is scrollable (overflow-auto)
5. ✓ Content is NOT at bottom of screen
6. ✓ Header fixed at top with user info
7. ✓ No Header/Footer from public layout

**Test Pages:**
- Overview: `/dashboard/admin`
- Donations: `/dashboard/admin/donations` (check DonationTable)
- Users: `/dashboard/admin/users`
- Coordinators: `/dashboard/admin/coordinators`

---

### 5. DonationTable Test

**Features to Test:**
1. ✓ Pagination works (10 items per page)
2. ✓ "View Details" modal opens with X button
3. ✓ Filter functionality works
4. ✓ Loading skeleton shows while fetching
5. ✓ Error handling displays properly
6. ✓ Content displays correctly (not at bottom)

---

### 6. Middleware Protection Test

**Protected Routes (should redirect to login if not authenticated):**
- /dashboard/admin
- /dashboard/coordinator
- /api/admin/*
- /api/coordinator/*

**Public Routes (should be accessible without login):**
- /
- /about
- /programs
- /contact
- /donate
- /stories
- /login
- /register
- /signup
- /api/auth

**Auth Routes (should redirect to dashboard if already logged in):**
- /login (redirect to dashboard if authenticated)
- /register (redirect to dashboard if authenticated)
- /signup (redirect to dashboard if authenticated)

---

### 7. Responsive Design Test

**Desktop (≥1024px):**
- Sidebar always visible on left
- Main content on right with scrolling
- No Header/Footer on dashboard

**Tablet (768px - 1023px):**
- Sidebar hidden by default
- Menu button shows sidebar overlay
- Content takes full width

**Mobile (<768px):**
- Sidebar hidden by default
- Menu button shows sidebar overlay with backdrop
- Content takes full width
- User info condensed

---

## 🐛 Known Issues to Monitor

1. **Middleware Warning**: "The middleware file convention is deprecated. Please use proxy instead."
   - Not critical, can be addressed later

2. **UserRole Type Mismatch**: Middleware uses `COORDINATOR` and `SUB_COORDINATOR` which don't exist in UserRole enum
   - Currently uses STATE_COORDINATOR, JILA_COORDINATOR, etc. instead
   - May need middleware update if coordinator-specific routes are needed

3. **Peer Dependency Conflicts**: Next.js 16 with next-auth beta
   - Using `--legacy-peer-deps` flag
   - Monitor for updates

---

## 🎯 Testing Instructions

### Quick Test Script:

1. **Clear browser cache and cookies**
   ```
   Chrome: Cmd+Shift+Delete
   ```

2. **Test Public Pages**
   - Visit home page, verify Header & Footer visible
   - Navigate to /about, /programs, /contact
   - All should have Header & Footer

3. **Test Login**
   - Go to /login
   - Use demo admin credentials
   - Verify redirect to /dashboard/admin
   - Verify NO Header/Footer on dashboard

4. **Test Signup**
   - Go to /signup
   - Fill form with test data
   - Select role, verify referral code generates
   - Submit, verify redirect to /login

5. **Test Dashboard Layout**
   - Click through sidebar navigation
   - Verify content is visible and scrollable
   - Test mobile responsive (resize browser)

6. **Test Logout**
   - Click "Sign out" in sidebar
   - Should redirect to /login
   - Try accessing /dashboard/admin - should redirect to login

---

## ✨ Expected Results

- ✅ All authentication flows work smoothly
- ✅ Header/Footer hidden on dashboard, visible on public pages
- ✅ Dashboard layout is functional (content visible, scrollable)
- ✅ Signup page accessible and working
- ✅ Role hierarchy properly implemented
- ✅ Middleware correctly protects routes
- ✅ Responsive design works on all screen sizes

---

## 📝 Notes

- Dev server running at: http://localhost:3000
- MongoDB must be connected for authentication to work
- Demo admin credentials are in .env.local
- All Framer Motion animations have been removed
