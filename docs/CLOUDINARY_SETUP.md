# Cloudinary Setup Guide

This guide will help you configure Cloudinary for profile photo uploads in the ARPUFRL application.

## Why Cloudinary?

Cloudinary provides:
- Free cloud storage for images
- Automatic image optimization
- CDN delivery for fast loading
- Built-in transformations (resize, crop, etc.)
- Face detection for smart cropping

## Setup Steps

### 1. Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up for Free"
3. Complete the registration process
4. Verify your email address

### 2. Get Your Cloud Name

1. Log in to your Cloudinary Dashboard
2. Look for the **Cloud name** in the Account Details section
3. It will look something like: `your-app-name` or `dxxxxxxxx`
4. Copy this value

### 3. Create an Upload Preset

An upload preset is required for unsigned uploads from the browser.

1. In your Cloudinary Dashboard, click on **Settings** (⚙️ icon)
2. Navigate to **Upload** tab
3. Scroll down to **Upload presets** section
4. Click **Add upload preset**
5. Configure the preset:
   - **Preset name**: `arpufrl_profiles` (or any name you prefer)
   - **Signing Mode**: Select **Unsigned** ⚠️ (Important!)
   - **Folder**: `arpufrl/profiles` (optional but recommended for organization)
   - **Use filename or externally defined Public ID**: No
   - **Unique filename**: Yes
6. Click **Save**
7. Copy the preset name

### 4. Configure Environment Variables

1. Create or edit `.env.local` file in the project root:

```bash
# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=arpufrl_profiles
```

2. Replace `your_cloud_name_here` with your actual Cloud Name from Step 2
3. Replace `arpufrl_profiles` with your preset name from Step 3 (if different)

### 5. Restart Development Server

```bash
npm run dev
```

The server needs to restart to load the new environment variables.

## Testing the Upload

1. Go to the signup page: `http://localhost:3000/signup`
2. Fill in the form details
3. Click on "Upload Profile Photo"
4. Select an image file (JPG, PNG, or WebP, max 5MB)
5. You should see a preview of the uploaded image
6. The image will be stored in your Cloudinary account

## Verifying Uploads

1. Go to your Cloudinary Dashboard
2. Click on **Media Library**
3. Navigate to the `arpufrl/profiles` folder (if you set one)
4. You should see your uploaded images

## Troubleshooting

### Error: "Cloudinary configuration missing"

**Solution**: Make sure both environment variables are set in `.env.local`:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

Then restart your development server.

### Error: "Upload preset must be unsigned"

**Solution**:
1. Go to Settings > Upload > Upload presets in Cloudinary
2. Edit your preset
3. Change **Signing Mode** to **Unsigned**
4. Save the preset

### Error: "Invalid file type"

**Solution**: Only JPG, PNG, and WebP images are accepted. Make sure your file has one of these extensions.

### Error: "File size too large"

**Solution**: Maximum file size is 5MB. Compress your image or use a smaller file.

## Image Transformations

The uploaded images are automatically transformed with:
- **Width**: 400px
- **Height**: 400px
- **Crop mode**: Fill with face detection (`c_fill,g_face`)

This ensures consistent profile photo sizes and automatically centers on faces.

## Free Tier Limits

Cloudinary's free tier includes:
- 25 GB storage
- 25 GB monthly bandwidth
- 25,000 monthly transformations
- More than enough for development and small deployments

## Security Notes

- ✅ Using **unsigned uploads** is safe for this use case
- ✅ File type and size validation is done on the client side
- ✅ Upload preset restricts the folder and transformation options
- ⚠️ For production, consider adding server-side validation
- ⚠️ Monitor your Cloudinary usage dashboard regularly

## Production Considerations

For production deployments:

1. **Set the same environment variables** in your hosting platform (Vercel, Netlify, etc.)
2. **Enable upload restrictions** in Cloudinary preset settings
3. **Set up webhooks** for upload notifications (optional)
4. **Configure transformation presets** for different image sizes
5. **Enable automatic backup** in Cloudinary settings

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify environment variables are correctly set
3. Ensure the upload preset is set to "Unsigned"
4. Check Cloudinary dashboard for upload logs

For more information, visit [Cloudinary Documentation](https://cloudinary.com/documentation)
