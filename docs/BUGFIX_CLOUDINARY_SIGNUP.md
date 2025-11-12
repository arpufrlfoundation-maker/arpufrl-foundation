# Bug Fixes: Cloudinary Upload & Signup Redirect

## Fixed Issues

### 1. ❌ Cloudinary Upload Error: "Transformation parameter is not allowed"

**Error Message:**
```json
{
  "error": {
    "message": "Transformation parameter is not allowed when using unsigned upload. Only upload_preset,callback,public_id,folder,asset_folder,tags,context,metadata,face_coordinates,custom_coordinates,source,filename_override,manifest_transformation,manifest_json,template,template_vars,regions,public_id_prefix upload parameters are allowed."
  }
}
```

**Root Cause:**
- In `/lib/cloudinary.ts`, the upload function was sending a `transformation` parameter in the FormData
- Unsigned upload presets don't allow transformation parameters to be passed during upload
- Only specific parameters are allowed with unsigned uploads

**Fix Applied:**
```typescript
// ❌ Before (lib/cloudinary.ts line 74)
formData.append('transformation', 'c_fill,w_400,h_400,g_face') // Not allowed!

// ✅ After
// Removed transformation parameter
// Apply transformations on retrieval using getOptimizedUrl() instead
```

**How Transformations Work Now:**
1. **Upload**: Images are uploaded at original size without transformations
2. **Display**: Use `CloudinaryService.getOptimizedUrl(url, size)` to get optimized versions
3. **Benefits**:
   - Original images preserved in full quality
   - On-demand transformation via URL manipulation
   - No upload restrictions
   - Automatic face detection and cropping when displaying

**Example Usage:**
```typescript
// Upload (unchanged)
const result = await CloudinaryService.uploadProfilePhoto(file)
const uploadedUrl = result.url

// Display with transformation
const optimizedUrl = CloudinaryService.getOptimizedUrl(uploadedUrl, 200)
// Returns: https://res.cloudinary.com/[cloud]/image/upload/c_fill,w_200,h_200,g_face/[path]
```

---

### 2. ❌ Signup Page Redirect Loop: "login?callbackUrl=%2Fsignup"

**Problem:**
- Users couldn't access `/signup` page
- Were being redirected to `/login?callbackUrl=/signup`
- Created a confusing loop when trying to create an account

**Root Cause:**
- In `/middleware.ts`, auth routes (`/login`, `/signup`, `/register`) were in `authRoutes` array
- But they were NOT in `publicRoutes` array
- Unauthenticated users trying to access `/signup` were redirected to login
- The middleware logic checked `publicRoutes` AFTER the auth redirect check

**Fix Applied:**
```typescript
// ✅ middleware.ts - Improved logic

// Check if route is an auth route
const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

// If user is authenticated and trying to access auth routes, redirect to dashboard
if (session && isAuthRoute) {
  const redirectUrl = getRedirectUrl(session.user.role)
  return NextResponse.redirect(new URL(redirectUrl, request.url))
}

// Check if route is public (NOW includes auth routes for unauthenticated users)
const isPublicRoute = publicRoutes.some(route =>
  pathname === route || pathname.startsWith(`${route}/`)
) || isAuthRoute  // 👈 Added this!

// If route is public, allow access
if (isPublicRoute) {
  return NextResponse.next()
}
```

**Behavior Now:**
1. ✅ **Unauthenticated users** → Can access `/signup`, `/login`, `/register`
2. ✅ **Authenticated users** → Redirected to their dashboard from auth pages
3. ✅ **Protected routes** → Redirect to login with callbackUrl (unchanged)

---

## Files Modified

### `/lib/cloudinary.ts`
- **Line 74**: Removed `formData.append('transformation', ...)`
- **Added comment**: Explaining transformation should be applied via `getOptimizedUrl()`

### `/middleware.ts`
- **Lines 73-82**: Reordered auth checks and public route logic
- **Line 79**: Added `|| isAuthRoute` to include auth routes as public for unauthenticated users

### `/docs/CLOUDINARY_SETUP.md`
- **Updated**: "Image Transformations" section to explain on-the-fly transformations
- **Added**: Troubleshooting section for transformation error

---

## Testing Instructions

### Test 1: Cloudinary Upload
1. Go to `/signup` or `/profile`
2. Upload a profile photo (JPG, PNG, or WebP < 5MB)
3. ✅ Should upload successfully without transformation error
4. ✅ Image should appear in preview
5. ✅ Check Cloudinary dashboard - image uploaded at original size

### Test 2: Signup Page Access
1. Open browser in incognito/private mode (not logged in)
2. Navigate to `http://localhost:3000/signup`
3. ✅ Should show signup page directly
4. ❌ Should NOT redirect to `/login?callbackUrl=/signup`
5. Fill form and submit
6. ✅ Should redirect to `/login?message=signup_success`

### Test 3: Authenticated User Redirect
1. Log in as any user
2. Try to navigate to `/signup`
3. ✅ Should redirect to your dashboard (admin → `/dashboard/admin`, coordinator → `/dashboard/coordinator`)
4. ❌ Should NOT show signup page

---

## Additional Notes

### Cloudinary Free Tier
- **Storage**: 25 GB
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month
- URL transformations are free and don't count against quota

### Transformation Examples
```typescript
// Profile photo - small (200x200)
CloudinaryService.getOptimizedUrl(url, 200)

// Profile photo - medium (400x400)
CloudinaryService.getOptimizedUrl(url, 400)

// Custom transformations
const url = 'https://res.cloudinary.com/[cloud]/image/upload/[path]'
const transformed = url.replace('/upload/', '/upload/c_fill,w_300,h_300,g_face/')
```

---

## Related Documentation
- [`/docs/CLOUDINARY_SETUP.md`](./CLOUDINARY_SETUP.md) - Complete Cloudinary setup guide
- [`/docs/COMPLETE_AUTH_SYSTEM.md`](./COMPLETE_AUTH_SYSTEM.md) - Authentication flow documentation
- [`/docs/SIGNUP_FLOW_DIAGRAM.md`](./SIGNUP_FLOW_DIAGRAM.md) - Signup process diagram

---

**Status**: ✅ Both issues fixed and tested
**Date**: 2025-11-11
**Version**: v1.0.0
