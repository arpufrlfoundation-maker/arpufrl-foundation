# 🔧 Troubleshooting Guide - Coordinator Management Blank Screen

## Issue: Blank Screen on /dashboard/admin/coordinators

---

## ✅ Changes Made to Fix:

### 1. **Enhanced Error Handling**
Added better error handling in `fetchCoordinators()` function:
- Catches API response errors
- Sets empty array on error
- Displays error message to user
- Provides "Try Again" button

### 2. **Error Display Component**
Added prominent error alert at top of page:
- Red warning box with error details
- Retry button to re-fetch data
- Clear error messaging

---

## 🔍 Debugging Steps:

### Step 1: Check Browser Console
Open browser DevTools (F12) and check Console tab for errors:
```
Right-click → Inspect → Console tab
```

Look for:
- `Error fetching coordinators:` message
- Network errors (CORS, 401, 500, etc.)
- JavaScript errors

### Step 2: Check Network Tab
In DevTools, go to Network tab:
```
DevTools → Network → Filter: Fetch/XHR
```

Look for:
- `/api/admin/coordinators` request
- Status code (should be 200)
- Response data
- Request headers (authentication)

### Step 3: Verify Authentication
Check if admin user is logged in:
```javascript
// In browser console, type:
localStorage.getItem('next-auth.session-token')
// or
document.cookie
```

### Step 4: Test API Directly
Open new browser tab and visit:
```
http://localhost:3000/api/admin/coordinators
```

Expected response:
```json
{
  "coordinators": [...],
  "pagination": {
    "totalPages": 1,
    "totalCount": 0
  }
}
```

If you get error:
- `401 Unauthorized` → Not logged in as admin
- `500 Server Error` → Database connection issue
- `404 Not Found` → API route missing

### Step 5: Check MongoDB Connection
Verify MongoDB is connected:
1. Check `.env.local` file has `MONGODB_URI`
2. Check MongoDB service is running
3. Test connection with MongoDB Compass

### Step 6: Check Admin Role
Verify user has ADMIN role:
1. Open MongoDB database
2. Find your user in `users` collection
3. Check `role` field = `"ADMIN"`

---

## 🎯 Quick Fixes:

### Fix 1: Not Logged In
```
1. Go to http://localhost:3000/login
2. Log in with admin credentials
3. Return to /dashboard/admin/coordinators
```

### Fix 2: Not Admin Role
Update user role in MongoDB:
```javascript
db.users.updateOne(
  { email: "your-admin@email.com" },
  { $set: { role: "ADMIN" } }
)
```

### Fix 3: Database Not Connected
Check environment variables:
```bash
# In terminal:
echo $MONGODB_URI

# Or check .env.local file
cat .env.local | grep MONGODB_URI
```

### Fix 4: API Route Error
Restart dev server:
```bash
# Stop server (Ctrl+C)
# Start again:
npm run dev
```

### Fix 5: Clear Cache
```bash
# Stop dev server
# Delete .next folder
rm -rf .next

# Restart
npm run dev
```

---

## 📋 Expected Behavior:

### On Page Load:
1. Shows loading skeleton (gray animated boxes)
2. Fetches coordinators from API
3. Displays coordinator table with data
4. If no data: Shows "No coordinators found"
5. If error: Shows red error box with retry button

### On "Add Coordinator" Click:
1. Modal opens with form
2. All fields visible
3. Role dropdown shows all 11 hierarchy roles
4. Parent coordinator dropdown filtered by role
5. Submit creates new coordinator

---

## 🧪 Test Checklist:

- [ ] Page loads without errors
- [ ] Loading state shows briefly
- [ ] Coordinator table displays
- [ ] "Add Coordinator" button visible
- [ ] Modal opens on button click
- [ ] Form fields are filled correctly
- [ ] Role dropdown has all roles
- [ ] Parent coordinator filtering works
- [ ] Form submits successfully
- [ ] New coordinator appears in list

---

## 💡 Common Errors & Solutions:

### Error: "Unauthorized access"
**Cause:** Not logged in or not admin
**Solution:** Log in as admin user

### Error: "Failed to fetch coordinators"
**Cause:** API endpoint error
**Solution:** Check API route and MongoDB connection

### Error: "Network request failed"
**Cause:** Dev server not running
**Solution:** Ensure `npm run dev` is running

### Error: Modal doesn't open
**Cause:** State not updating
**Solution:** Check React state in DevTools

### Error: Empty table
**Cause:** No coordinators in database
**Solution:** Create coordinators via "Add Coordinator" button

---

## 📞 Still Having Issues?

### Collect This Information:

1. **Browser Console Errors:**
   ```
   Copy full error message from Console tab
   ```

2. **Network Response:**
   ```
   Copy response from /api/admin/coordinators call
   ```

3. **Environment:**
   ```
   - Node version: node --version
   - Next.js version: (check package.json)
   - MongoDB status: connected/disconnected
   ```

4. **Screenshots:**
   - Browser console
   - Network tab
   - Blank page

---

## 🎯 Next Steps After Fix:

1. ✅ Test Add Coordinator functionality
2. ✅ Verify all 11 hierarchy roles work
3. ✅ Test parent coordinator filtering
4. ✅ Create test coordinators at different levels
5. ✅ Verify data persists in MongoDB

---

**Need Help?** Share the error messages and network responses for faster debugging!

---

**ARPU Future Rise Life Foundation**
*Technical Support Guide*
