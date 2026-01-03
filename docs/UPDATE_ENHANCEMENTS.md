# Update System Enhancements

This document covers the three new enhancements added to the app update system:

1. **Automated Version Bump Scripts**
2. **Download Progress Indicator**
3. **Push Notifications for Critical Updates**

---

## 1. Automated Version Bump Script

### Overview

The version bump script automatically updates version numbers across all necessary files in your project, making releases consistent and error-free.

### Files Updated by Script

- `package.json` - App version
- `android/app/build.gradle` - versionCode and versionName
- `backend/src/downloads/app-versions.config.ts` - Backend version config

### Usage

```bash
# Increment patch version (1.0.0 -> 1.0.1)
npm run bump-version patch

# Increment minor version (1.0.0 -> 1.1.0)
npm run bump-version minor

# Increment major version (1.0.0 -> 2.0.0)
npm run bump-version major

# Set specific version
npm run bump-version 1.5.0
```

### Interactive Flow

The script will prompt you for:

1. **Platform**: android, ios, or both
2. **Changelog**: Enter new features/fixes (one per line, empty to finish)
3. **Critical Update**: Whether to mark as force update (y/N)
4. **Confirmation**: Review summary before applying changes

### Example Session

```bash
$ npm run bump-version minor

🚀 Version Bump Tool
Current version: 1.0.0
New version: 1.1.0

Build number: 1 -> 2

Platform (android/ios/both) [both]: android

Enter changelog items (one per line, empty line to finish):
1. Added offline mode support
2. Fixed payment verification bug
3. Improved performance
4. 

Is this a critical update? (y/N): y

📋 Summary:
  Version: 1.0.0 -> 1.1.0
  Build: 1 -> 2
  Platform: android
  Force Update: Yes
  Changelog:
    1. Added offline mode support
    2. Fixed payment verification bug
    3. Improved performance

Proceed with version bump? (Y/n): Y

📝 Updating files...

✓ Updated package.json: 1.0.0 -> 1.1.0
✓ Updated android/app/build.gradle: versionCode 2, versionName "1.1.0"
✓ Updated backend/src/downloads/app-versions.config.ts (Android)
✓ Set forceUpdate to true for android

✅ Version bump complete!

Next steps:
  1. Build the app:
     npm run android:release  # For Android
     npm run ios:release      # For iOS
  2. Upload the build to the backend:
     See QUICK_START_UPDATES.md for instructions
  3. Send push notification for critical update:
     npm run notify-update -- --platform android --version 1.1.0
```

### What Gets Updated

**package.json**
```json
{
  "version": "1.1.0"  // ⬅️ Updated
}
```

**android/app/build.gradle**
```gradle
defaultConfig {
    versionCode 2        // ⬅️ Auto-incremented
    versionName "1.1.0"  // ⬅️ Updated
}
```

**backend/src/downloads/app-versions.config.ts**
```typescript
export const APP_VERSIONS = {
  android: {
    version: '1.1.0',              // ⬅️ Updated
    buildNumber: 2,                 // ⬅️ Updated
    releaseDate: '2026-01-03',      // ⬅️ Auto-set to today
    changeLog: [                    // ⬅️ Updated
      'Added offline mode support',
      'Fixed payment verification bug',
      'Improved performance',
    ],
    forceUpdate: true,              // ⬅️ Set if critical
  },
}
```

---

## 2. Download Progress Indicator

### Overview

The app now shows real-time download progress when updating, using Android's built-in download manager notification system.

### Features

- **Progress Tracking**: Real-time progress updates during download
- **Notification Bar**: Shows download progress in Android notification bar
- **Automatic Install**: After download completes, prompts for installation
- **Error Handling**: Graceful error messages if download fails

### Implementation

Located in `src/utils/updateChecker.ts`:

```typescript
.fetch('GET', downloadUrl)
.progress((received, total) => {
  const progress = Math.floor((received / total) * 100);
  console.log(`Download progress: ${progress}%`);
});
```

### User Experience

1. **User taps "Update Now"**
   ```
   Alert: "Downloading Update"
   "Downloading version 1.1.0...
   
   Progress will be shown in your notification bar."
   ```

2. **Download starts**
   - Notification appears in notification bar
   - Shows: "Cooperative Manager Update"
   - Progress bar updates in real-time
   - Shows percentage (0% → 100%)

3. **Download completes**
   ```
   Alert: "Install Update"
   "The update has been downloaded. 
   Please follow the prompts to install it."
   ```

4. **Installation prompt opens**
   - Android system installer opens
   - User approves installation
   - App updates automatically

### Progress Display Modes

**In-App Alert** (Initial notification)
```
┌─────────────────────────────┐
│  Downloading Update         │
├─────────────────────────────┤
│  Downloading version 1.1.0  │
│                             │
│  Progress will be shown in  │
│  your notification bar.     │
└─────────────────────────────┘
```

**Notification Bar** (During download)
```
╔═══════════════════════════════╗
║ Cooperative Manager Update    ║
║ Downloading version 1.1.0     ║
║ ████████████░░░░░░░░ 65%      ║
╚═══════════════════════════════╝
```

### Technical Details

- Uses `react-native-blob-util` with `addAndroidDownloads` config
- Downloads to device's Download folder
- Uses Android Download Manager for progress
- Progress callback fires throughout download
- File path retained for installation after download

---

## 3. Push Notifications for Critical Updates

### Overview

Automatically notify all users when a critical update is released, ensuring they update promptly.

### Backend Setup

#### New Service: `PushNotificationService`

Location: `backend/src/downloads/push-notification.service.ts`

Features:
- Topic-based notifications (all-users, android-users, ios-users)
- Firebase Cloud Messaging integration
- Platform-specific targeting
- Force update support

#### New API Endpoint

**POST** `/api/downloads/notify-update/:platform?version=x.x.x&forceUpdate=true`

**Authentication**: Requires JWT (Admin only)

**Parameters**:
- `platform` (path): `android` | `ios` | `all`
- `version` (query): Version number (e.g., `1.1.0`)
- `forceUpdate` (query): `true` | `false` (optional, default: false)

**Example**:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:3001/api/downloads/notify-update/android?version=1.1.0&forceUpdate=true"
```

**Response**:
```json
{
  "success": true,
  "message": "Push notification sent successfully for android version 1.1.0",
  "details": {
    "sentCount": 1,
    "failedCount": 0
  }
}
```

### Using the Notification Script

```bash
# Interactive mode
npm run notify-update

# Command-line mode
npm run notify-update -- --platform android --version 1.1.0 --force
npm run notify-update -- --platform ios --version 1.2.0
npm run notify-update -- --platform all --version 1.3.0 --force
```

### Interactive Flow

```bash
$ npm run notify-update

🔔 Push Notification Tool for App Updates

Platform (android/ios/all): android
Version (e.g., 1.2.0): 1.1.0
Is this a critical/force update? (y/N): y
API URL [http://localhost:3001]: 

🔐 Admin Authentication Required

Admin Email: admin@example.com
Admin Password: ********

📋 Summary:
  Platform: android
  Version: 1.1.0
  Force Update: Yes
  API URL: http://localhost:3001

Send push notification? (Y/n): Y

🔄 Authenticating...
✓ Authenticated successfully

📤 Sending push notification...
✅ Push notification sent successfully!

Details:
  Message: Push notification sent successfully for android version 1.1.0
  Sent: 1
  Failed: 0
```

### Notification Content

**Regular Update:**
```
🎉 New Update Available
Version 1.1.0 is now available with new features and improvements!
```

**Critical/Force Update:**
```
🚨 Critical Update Required
Version 1.1.0 is now available. Update required to continue using the app.
```

### Mobile App Handling

When notification is received, the app:

1. Shows notification in system tray
2. When tapped, opens app
3. Automatically triggers update check
4. Shows update dialog with details
5. User can update immediately

### Topic Subscription

Users are automatically subscribed to update topics when:
- They log in for the first time
- They update their FCM token

Topics:
- `all-users` - All app users
- `android-users` - Android users only
- `ios-users` - iOS users only

---

## Complete Release Workflow

### Step 1: Bump Version
```bash
npm run bump-version minor
```
- Updates all version files
- Adds changelog
- Marks as force update if critical

### Step 2: Build App
```bash
# Android
npm run android:release

# iOS
npm run ios:release
```

### Step 3: Upload to Backend
```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])")

# Upload APK
curl -X POST http://localhost:3001/api/downloads/upload/android \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@android/app/build/outputs/apk/release/app-release.apk"
```

### Step 4: Send Push Notification (Critical Updates Only)
```bash
npm run notify-update -- --platform android --version 1.1.0 --force
```

### Step 5: Verify
```bash
# Test update check
curl "http://localhost:3001/api/downloads/check-update/android?currentVersion=1.0.0"
```

---

## Testing

### Test Version Bump Script

```bash
# Dry run - check current version
cat package.json | grep version

# Run bump script
npm run bump-version patch

# Verify changes
cat package.json | grep version
cat android/app/build.gradle | grep version
cat backend/src/downloads/app-versions.config.ts | grep version
```

### Test Download Progress

1. Build app with old version
2. Update backend config to new version
3. Launch app
4. Tap "Update Now"
5. Watch notification bar for progress
6. Verify installation prompt appears

### Test Push Notifications

```bash
# Send test notification
npm run notify-update -- --platform android --version 1.1.0

# Check Firebase console for delivery stats
# Check device receives notification
# Tap notification and verify app opens
```

---

## Configuration

### Firebase Setup (Required for Push Notifications)

1. **Ensure Firebase is configured** in your app
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)

2. **FCM Token collection** is already set up in your app

3. **Topic subscription** happens automatically on app launch

### Android Notification Channel

Update notifications use the channel: `cooperative_manager_updates`

Configure in `android/app/src/main/res/values/strings.xml`:
```xml
<string name="update_channel_name">App Updates</string>
<string name="update_channel_description">Notifications for app updates</string>
```

---

## Troubleshooting

### Version Bump Script Issues

**Issue**: Script can't find files
```bash
# Run from project root
cd /path/to/cooperative-manager
npm run bump-version patch
```

**Issue**: Version format error
- Use semantic versioning: `MAJOR.MINOR.PATCH`
- Example: `1.0.0`, `2.5.3`, `10.2.1`

### Progress Indicator Not Showing

**Issue**: Progress not visible
- Check Android notification permissions
- Ensure Download Manager is enabled
- Progress shows in notification bar, not in-app

**Issue**: Download fails
- Check storage permissions
- Ensure sufficient storage space
- Verify backend URL is correct

### Push Notifications Not Received

**Issue**: No notifications received
- Verify Firebase is configured
- Check FCM token is being collected
- Ensure device has internet connection
- Check notification permissions

**Issue**: Only some users receive notifications
- Verify users are subscribed to topics
- Check Firebase console for delivery stats
- Ensure backend Firebase admin SDK is configured

**Debug Push Notifications**:
```bash
# Check Firebase logs
# Backend console should show:
# "Sent update notification for android version 1.1.0"

# Check FCM response
# Response ID indicates successful send
```

---

## Security Considerations

### Version Bump Script
- ✅ Runs locally, no network access
- ✅ Prompts for confirmation before changes
- ✅ Updates files atomically

### Download Progress
- ✅ Uses secure HTTPS in production
- ✅ Files downloaded to secure app directory
- ⚠️ APK signature verified by Android system

### Push Notifications
- ✅ Requires admin JWT authentication
- ✅ Topic-based (no individual device targeting)
- ✅ Firebase handles secure delivery
- ⚠️ Rate limit notification endpoint in production

---

## Future Improvements

- [ ] Add rollback capability for failed version bumps
- [ ] Support for beta/staging channels in version bump
- [ ] In-app progress bar (in addition to notification)
- [ ] Scheduled notifications (notify at specific time)
- [ ] A/B testing for updates (partial rollout)
- [ ] Analytics tracking for update adoption rates

---

## Summary

These three enhancements make the update system production-ready:

1. **Version Bump Script**: Eliminates manual version management errors
2. **Progress Indicator**: Better user experience during downloads
3. **Push Notifications**: Ensures users know about critical updates

All tools are npm scripts:
- `npm run bump-version [type]` - Automated version management
- `npm run notify-update` - Send push notifications

The complete workflow takes minutes instead of hours, with zero manual file editing required.
