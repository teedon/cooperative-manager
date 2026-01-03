# App Update System

## Overview

The Cooperative Manager app includes an automatic update checking system that allows users to download and install new versions of the app directly from the backend server.

## Features

- **Automatic Update Checks**: App checks for updates on launch
- **Manual Update Check**: Users can manually check for updates from the Profile screen
- **Force Updates**: Support for mandatory updates when minimum version requirements are not met
- **Changelog Display**: Shows users what's new in the latest version
- **File Size Display**: Shows download size before downloading
- **Semantic Versioning**: Uses semantic versioning (MAJOR.MINOR.PATCH) for version comparison
- **Platform-Specific**: Separate version management for Android and iOS

## Architecture

### Backend Components

#### 1. Version Configuration (`backend/src/downloads/app-versions.config.ts`)

Central configuration file that defines current app versions:

```typescript
export const APP_VERSIONS = {
  android: {
    version: '1.0.0',              // Current version
    buildNumber: 1,                 // Build number
    releaseDate: '2026-01-02',      // Release date
    downloadUrl: '/api/downloads/app/android',
    changeLog: [                    // What's new
      'Initial release',
      'Cooperative management features',
      'Group buying functionality',
      'Loan management system',
    ],
    minSupportedVersion: '1.0.0',   // Minimum supported version
    forceUpdate: false,             // Whether to force update
  },
  ios: { /* similar structure */ }
};
```

#### 2. Downloads Service (`backend/src/downloads/downloads.service.ts`)

Contains the `checkForUpdates()` method:

```typescript
async checkForUpdates(platform: 'android' | 'ios', currentVersion: string) {
  // Compares current version with latest
  // Determines if update is available
  // Checks if current version is still supported
  // Returns update information including file size
}
```

#### 3. API Endpoint

**GET** `/api/downloads/check-update/:platform?currentVersion=x.x.x`

- **Platform**: `android` or `ios`
- **Query Parameter**: `currentVersion` (required)

**Response:**
```json
{
  "updateAvailable": true,
  "latestVersion": {
    "version": "1.1.0",
    "buildNumber": 2,
    "releaseDate": "2026-01-15",
    "downloadUrl": "/api/downloads/app/android",
    "changeLog": [
      "New feature X",
      "Bug fix Y",
      "Performance improvements"
    ],
    "minSupportedVersion": "1.0.0",
    "forceUpdate": false,
    "fileSize": 45678901
  },
  "forceUpdate": false,
  "isSupported": true
}
```

### Mobile App Components

#### 1. Update Checker (`src/utils/updateChecker.ts`)

Main utility class for checking and installing updates:

**Methods:**
- `checkForUpdates()`: Checks backend for available updates
- `showUpdateDialog()`: Displays update prompt to user
- `downloadAndInstallUpdate()`: Downloads and installs the update
- `checkAndPromptForUpdates()`: Automatic check on app launch
- `manualUpdateCheck()`: Manual check from settings

#### 2. Integration Points

**App.tsx:**
- Automatically checks for updates on app launch
- Only runs in production mode (skips in development)

**ProfileScreen.tsx:**
- "Check for Updates" menu item
- Manual update check functionality
- Displays current app version

## Usage

### For Developers

#### Releasing a New Version

1. **Update the app version in `app.json`:**
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

2. **Build the app:**
```bash
# For Android
npm run android:release

# For iOS
npm run ios:release
```

3. **Update version configuration** in `backend/src/downloads/app-versions.config.ts`:
```typescript
export const APP_VERSIONS = {
  android: {
    version: '1.1.0',              // ⬅️ Update this
    buildNumber: 2,                 // ⬅️ Update this
    releaseDate: '2026-01-15',      // ⬅️ Update this
    changeLog: [                    // ⬅️ Add changelog
      'New feature: X',
      'Improved: Y',
      'Fixed: Z',
    ],
    minSupportedVersion: '1.0.0',   // ⬅️ Update if dropping support for old versions
    forceUpdate: false,             // ⬅️ Set to true if critical update
  },
  // ... repeat for ios
};
```

4. **Upload the new app file:**
```bash
# Using curl
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@path/to/app-release.apk" \
  http://localhost:3001/api/downloads/upload/android
```

Or use the admin interface/Postman.

### For Users

#### Automatic Updates

The app automatically checks for updates when launched:
1. Opens app
2. If update available, sees dialog with changelog
3. Can choose "Update Now" or "Later" (if not forced)
4. If "Update Now", downloads and installs automatically

#### Manual Updates

From the Profile screen:
1. Tap "Check for Updates"
2. If update available, sees dialog with details
3. If up-to-date, sees confirmation message

## Version Comparison

The system uses semantic versioning:

- **MAJOR.MINOR.PATCH** (e.g., `1.2.3`)
- Compares each component numerically
- `1.2.1` < `1.2.2` < `1.3.0` < `2.0.0`

## Force Updates

When `forceUpdate: true` or current version < `minSupportedVersion`:
- User cannot dismiss the update dialog
- App functionality is blocked until updated
- Only "Update Now" button is shown

## Platform-Specific Behavior

### Android
- Downloads APK directly from server
- Uses `expo-file-system` to download file
- Opens APK for installation via system installer
- User must approve installation

### iOS
- Redirects to App Store
- Cannot install directly from file
- Requires App Store URL in production

## Testing

### Test Update Check Endpoint

```bash
# Check for updates (Android)
curl "http://localhost:3001/api/downloads/check-update/android?currentVersion=1.0.0"

# Check for updates (iOS)
curl "http://localhost:3001/api/downloads/check-update/ios?currentVersion=1.0.0"
```

### Test Update Flow

1. Set app version to `1.0.0` in `app.json`
2. Update `APP_VERSIONS` to `1.1.0`
3. Launch app
4. Should see update dialog

## Required Dependencies

The update system uses these React Native packages:

```json
{
  "react-native-device-info": "^13.2.0",
  "react-native-blob-util": "^0.24.5"
}
```

Install if not already present:
```bash
npm install react-native-device-info@^13.2.0
cd ios && pod install && cd ..
```

Note: `react-native-blob-util` is already in your dependencies.

## Security Considerations

1. **File Integrity**: Consider adding SHA256 checksum verification
2. **HTTPS Only**: Use HTTPS in production for secure downloads
3. **Code Signing**: Ensure APK/IPA files are properly signed
4. **API Rate Limiting**: Prevent abuse of update check endpoint
5. **File Size Limits**: Configure appropriate upload limits

## Troubleshoads

### Update Check Fails
- Verify backend is running
- Check API_BASE_URL in `updateChecker.ts`
- Ensure network connectivity

### Download Fails
- Check file exists on server
- Verify storage permissions on device
- Ensure sufficient storage space

### Installation Fails (Android)
- Enable "Install from Unknown Sources"
- Check APK signature
- Verify file integrity

### iOS Installation Not Working
- Update App Store URL in `updateChecker.ts`
- Ensure TestFlight or App Store configured

## Future Enhancements

- [ ] Add SHA256 checksum verification
- [ ] Implement delta updates (only changed files)
- [ ] Add download progress indicator
- [ ] Support for beta/staging channels
- [ ] Automated version bump scripts
- [ ] Admin UI for version management
- [ ] Push notification for critical updates
- [ ] Rollback mechanism for failed updates

## API Reference

### Check for Updates

**Endpoint:** `GET /api/downloads/check-update/:platform`

**Parameters:**
- `platform` (path): `android` | `ios`
- `currentVersion` (query): Semantic version string (e.g., `1.0.0`)

**Response:** UpdateCheckResponse object

**Example:**
```bash
curl "http://localhost:3001/api/downloads/check-update/android?currentVersion=1.0.0"
```

### Download App

**Endpoint:** `GET /api/downloads/app/:platform`

**Parameters:**
- `platform` (path): `android` | `ios` | `web`

**Response:** File download

**Example:**
```bash
curl -O http://localhost:3001/api/downloads/app/android
```

## License

This update system is part of the Cooperative Manager application.
