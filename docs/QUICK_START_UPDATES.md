# Quick Start: App Update System

## Installation

### 1. Install Required Dependencies

For the mobile app to support automatic updates, install these native modules:

```bash
cd /Users/teedon/Desktop/Projects/cooperative-manager
npm install react-native-device-info@^13.2.0
```

Note: `react-native-blob-util` is already installed in your dependencies for file downloads.

For iOS, link the pod:
```bash
cd ios && pod install && cd ..
```

### 2. Configure Environment

Create or update `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:3001
```

For production, change to your production backend URL:
```env
REACT_APP_API_URL=https://api.yourapp.com
```

## Testing the Update System

### Test 1: Check for Updates (Current Version)

```bash
curl "http://localhost:3001/api/downloads/check-update/android?currentVersion=1.0.0" | python3 -m json.tool
```

Expected response:
```json
{
    "updateAvailable": false,
    "latestVersion": {
        "version": "1.0.0",
        ...
    },
    "forceUpdate": false,
    "isSupported": true
}
```

### Test 2: Check for Updates (Older Version)

```bash
curl "http://localhost:3001/api/downloads/check-update/android?currentVersion=0.9.0" | python3 -m json.tool
```

Expected response:
```json
{
    "updateAvailable": true,
    "latestVersion": {
        "version": "1.0.0",
        ...
    },
    "forceUpdate": true,  // ⬅️ True because version is below minimum
    "isSupported": false  // ⬅️ Version no longer supported
}
```

### Test 3: iOS Platform

```bash
curl "http://localhost:3001/api/downloads/check-update/ios?currentVersion=1.0.0" | python3 -m json.tool
```

## Releasing a New Version

### Step 1: Update App Version

Edit `app.json`:

```json
{
  "expo": {
    "version": "1.1.0",
    "android": {
      "versionCode": 2
    },
    "ios": {
      "buildNumber": "2"
    }
  }
}
```

### Step 2: Update Version Config

Edit `backend/src/downloads/app-versions.config.ts`:

```typescript
export const APP_VERSIONS = {
  android: {
    version: '1.1.0',              // ⬅️ New version
    buildNumber: 2,                 // ⬅️ Increment build number
    releaseDate: '2026-01-15',      // ⬅️ Today's date
    downloadUrl: '/api/downloads/app/android',
    changeLog: [
      'Added new feature X',        // ⬅️ What's new
      'Fixed bug Y',
      'Improved performance',
    ],
    minSupportedVersion: '1.0.0',   // ⬅️ Minimum version users must have
    forceUpdate: false,             // ⬅️ Set true for critical updates
  },
  ios: {
    // ... same for iOS
  }
};
```

### Step 3: Build the App

For Android:
```bash
npm run android:release
# APK will be in: android/app/build/outputs/apk/release/app-release.apk
```

For iOS:
```bash
npm run ios:release
# Archive will be in: ios/build/CooperativeManager.xcarchive
```

### Step 4: Upload the New App File

#### Using curl:

```bash
# Get JWT token first (login as admin)
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")

# Upload APK
curl -X POST http://localhost:3001/api/downloads/upload/android \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@android/app/build/outputs/apk/release/app-release.apk"
```

#### Using Postman:

1. **Login:**
   - Method: POST
   - URL: `http://localhost:3001/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "admin@example.com",
       "password": "your-password"
     }
     ```
   - Copy the `accessToken` from response

2. **Upload File:**
   - Method: POST
   - URL: `http://localhost:3001/api/downloads/upload/android`
   - Headers: `Authorization: Bearer YOUR_TOKEN_HERE`
   - Body: form-data
     - Key: `file`
     - Value: Select file (app-release.apk)
   - Click "Send"

### Step 5: Verify Update is Available

```bash
curl "http://localhost:3001/api/downloads/check-update/android?currentVersion=1.0.0" | python3 -m json.tool
```

Should now return:
```json
{
    "updateAvailable": true,
    "latestVersion": {
        "version": "1.1.0",  // ⬅️ New version detected
        ...
    }
}
```

### Step 6: Test on Device

1. Launch the app (version 1.0.0)
2. Should automatically see "Update Available" dialog
3. Click "Update Now"
4. App downloads and installs new version
5. Verify app is now version 1.1.0

## Manual Update Check (For Testing)

On the mobile app:
1. Go to Profile screen
2. Tap "Check for Updates"
3. If update available, see dialog with details
4. If up-to-date, see "Up to Date" message

## Troubleshooting

### "Cannot find module 'react-native-device-info'"

Install the required dependency:
```bash
npm install react-native-device-info@^13.2.0
cd ios && pod install && cd ..
```

Then rebuild the app:
```bash
# For Android
npm run android

# For iOS
npm run ios
```

### Update check returns 404

Ensure backend is running:
```bash
cd backend
npm start
```

Verify endpoint exists:
```bash
curl http://localhost:3001/api/downloads/check-update/android?currentVersion=1.0.0
```

### APK download fails

1. Check file exists on server:
```bash
ls backend/storage/app-files/cooperative-manager.apk
```

2. If missing, upload it using the admin API

### Installation blocked on Android

Enable "Install from Unknown Sources":
1. Settings > Security
2. Enable "Unknown Sources"
3. Or Settings > Apps > Special Access > Install unknown apps

### iOS updates not working

iOS requires App Store distribution. Update the App Store URL in:
`src/utils/updateChecker.ts` line 113:

```typescript
const appStoreUrl = 'https://apps.apple.com/app/your-app-id';
```

## Production Checklist

Before deploying to production:

- [ ] Update `EXPO_PUBLIC_API_URL` to production URL
- [ ] Upload signed APK/IPA files
- [ ] Test update flow on real devices
- [ ] Enable HTTPS for file downloads
- [ ] Configure proper CORS settings
- [ ] Set appropriate rate limits
- [ ] Test force update scenario
- [ ] Update App Store/Play Store listings
- [ ] Document rollback procedure

## Environment Variables

Required environment variables:

### Mobile App (.env)
```env
REACT_APP_API_URL=http://localhost:3001  # Backend URL
```

### Backend (.env)
```env
# No specific variables needed for update system
# It uses existing authentication and file upload configuration
```

## API Endpoints

All update-related endpoints:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/downloads/check-update/:platform` | GET | No | Check for app updates |
| `/api/downloads/app/:platform` | GET | No | Download app file |
| `/api/downloads/upload/:platform` | POST | Yes (JWT) | Upload new app version |
| `/api/downloads/stats` | GET | No | Download statistics |
| `/api/downloads/files` | GET | Yes (JWT) | List available files |

## Next Steps

1. Install Expo dependencies
2. Configure environment variables
3. Test update check locally
4. Build and upload first version
5. Test complete update flow
6. Deploy to production

For detailed documentation, see [UPDATE_SYSTEM.md](../docs/UPDATE_SYSTEM.md)
