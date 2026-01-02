# App Downloads System Setup Guide

## Overview
Secure app download system with tracking for Android, iOS, and Web apps.

## ✅ Completed Setup

### 1. Database Schema ✅
Added `AppDownload` model to Prisma schema:
```prisma
model AppDownload {
  id           String   @id @default(cuid())
  platform     String   // 'android', 'ios', 'web'
  version      String?  // App version
  ipAddress    String?  // IP for analytics
  userAgent    String?  // Device/browser info
  downloadedAt DateTime @default(now())

  @@index([platform])
  @@index([downloadedAt])
}
```

### 2. Backend Module ✅
Created complete downloads module:
- `downloads.module.ts` - Module configuration
- `downloads.service.ts` - Business logic
- `downloads.controller.ts` - API endpoints

### 3. Storage Directory ✅
Created secure storage at: `backend/storage/app-files/`
- Not publicly accessible
- Files served through controlled API endpoint
- Automatic backup on file replacement

### 4. Frontend Integration ✅
- `downloadsApi.ts` - API client
- `DownloadStatsPage.tsx` - Statistics dashboard
- `LandingPage.tsx` - Updated with download buttons

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
npm install @nestjs/platform-express multer @types/multer
```

### Step 2: Run Database Migration

```bash
cd backend
npx prisma migrate dev --name add_app_downloads
```

Or if using push:
```bash
npx prisma db push
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Upload App Files

You have two options:

#### Option A: Manual Upload (Easiest)
Place your app files directly in the storage directory:
```bash
cd backend/storage/app-files/

# Copy your files here with these exact names:
# - cooperative-manager.apk (Android)
# - cooperative-manager.ipa (iOS)
# - cooperative-manager-web.zip (Web PWA)
```

#### Option B: API Upload (Programmatic)
Use the upload endpoint (requires authentication):
```bash
# Get auth token first
TOKEN="your_jwt_token_here"

# Upload Android APK
curl -X POST http://localhost:3001/api/downloads/upload/android \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your-app.apk"

# Upload iOS IPA
curl -X POST http://localhost:3001/api/downloads/upload/ios \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your-app.ipa"

# Upload Web ZIP
curl -X POST http://localhost:3001/api/downloads/upload/web \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your-web-app.zip"
```

### Step 5: Restart Backend

```bash
cd backend
npm run start:dev
```

## 📊 API Endpoints

### Public Endpoints

#### Download App
```
GET /api/downloads/app/:platform
```
- **Platforms:** `android`, `ios`, `web`
- **Response:** Binary file stream
- **Tracking:** Automatically logs download with IP and user agent

Example:
```
https://your-api.com/api/downloads/app/android
```

#### Get Statistics
```
GET /api/downloads/stats?platform=android
```
- **Query Params:** `platform` (optional)
- **Response:**
```json
{
  "total": 150,
  "byPlatform": {
    "android": 80,
    "ios": 50,
    "web": 20
  },
  "last30Days": 45,
  "dailyDownloads": [
    { "date": "2026-01-02", "count": 5 }
  ]
}
```

### Protected Endpoints (Require Authentication)

#### Upload App File
```
POST /api/downloads/upload/:platform
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body: file (binary)
```

#### List Available Files
```
GET /api/downloads/files
Authorization: Bearer <token>
```

Response:
```json
{
  "files": [
    {
      "platform": "android",
      "fileName": "cooperative-manager.apk",
      "exists": true,
      "size": 45678900,
      "lastModified": "2026-01-02T10:30:00.000Z",
      "path": "/path/to/file"
    }
  ]
}
```

#### Delete App File
```
DELETE /api/downloads/app/:platform
Authorization: Bearer <token>
```

## 🌐 Frontend Integration

### Landing Page
Download buttons automatically use the download API:
```typescript
const handleDownload = (platform: 'android' | 'ios' | 'web') => {
  const downloadUrl = downloadsApi.downloadApp(platform)
  window.location.href = downloadUrl
}
```

### Statistics Dashboard
Access at: `/download-stats` (add to your routing)

Shows:
- Total downloads
- Downloads by platform
- Last 30 days activity
- Daily breakdown (last 7 days)
- Platform distribution chart

## 📁 File Structure

```
backend/
├── src/
│   └── downloads/
│       ├── downloads.module.ts
│       ├── downloads.service.ts
│       └── downloads.controller.ts
└── storage/
    └── app-files/
        ├── README.md
        ├── cooperative-manager.apk
        ├── cooperative-manager.ipa
        └── cooperative-manager-web.zip

new-webapp/
└── src/
    ├── api/
    │   └── downloadsApi.ts
    └── pages/
        ├── LandingPage.tsx (updated)
        └── DownloadStatsPage.tsx
```

## 🔐 Security Features

1. **File Storage:** Files stored outside public directory
2. **Controlled Access:** Only served through API endpoint
3. **Download Tracking:** All downloads logged with metadata
4. **Protected Uploads:** Only authenticated users can upload
5. **Automatic Backups:** Old versions backed up on replacement
6. **IP Tracking:** Anonymous usage analytics

## 📈 Analytics Capabilities

Track:
- ✅ Total downloads across all platforms
- ✅ Downloads per platform
- ✅ Daily/monthly trends
- ✅ User IP addresses (optional)
- ✅ User agents (device/browser info)
- ✅ Download timestamps

## 🎯 Testing

### Test Download Endpoint
```bash
# Download Android app
curl -O http://localhost:3001/api/downloads/app/android

# Check if file downloaded
ls -lh cooperative-manager.apk
```

### Test Statistics
```bash
curl http://localhost:3001/api/downloads/stats | jq
```

### Test Upload (with auth)
```bash
TOKEN="your_jwt_token"
curl -X POST http://localhost:3001/api/downloads/upload/android \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-app.apk" | jq
```

## 🚨 Troubleshooting

### "App file not found" Error
**Solution:** Upload files to `backend/storage/app-files/` with correct names

### "Cannot find module @nestjs/platform-express"
**Solution:** 
```bash
cd backend
npm install @nestjs/platform-express multer @types/multer
```

### Database Migration Error
**Solution:** 
```bash
cd backend
npx prisma migrate reset
npx prisma migrate dev
```

### Download Not Tracking
**Solution:** Check that Prisma client is generated:
```bash
npx prisma generate
```

## 📝 Environment Variables

No additional environment variables needed. The system uses:
- Existing database connection
- Local file storage
- Express/NestJS built-in features

## 🔄 Updating App Files

### Via API (Recommended for CI/CD)
```bash
# In your CI/CD pipeline
TOKEN="${AUTH_TOKEN}"
curl -X POST ${API_URL}/downloads/upload/android \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@dist/app-release.apk"
```

### Manual Update
1. Navigate to: `backend/storage/app-files/`
2. Replace the file
3. Old version automatically backed up

## 📱 Integration with App Stores

For production, consider:
- **Android:** Host APK for direct download + Google Play link
- **iOS:** App Store link (direct IPA only for enterprise)
- **Web:** Deploy PWA separately + provide backup ZIP

## 🎉 Next Steps

1. ✅ Run database migration
2. ✅ Install missing dependencies
3. ✅ Upload your app files
4. ✅ Test download endpoints
5. ✅ View statistics dashboard
6. 🔄 Configure production URLs
7. 🔄 Add download links to landing page
8. 🔄 Set up automated builds

## 📞 Support

If you encounter issues:
1. Check backend logs: `npm run start:dev`
2. Verify file permissions on `storage/` directory
3. Test with curl commands above
4. Check database connection

---

**Status:** ✅ Implementation Complete - Ready for Testing
