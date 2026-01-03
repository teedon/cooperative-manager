# Installing Update System Dependencies

## Overview

The app update system has been refactored to use **React Native native modules** instead of Expo dependencies, since this is a standard React Native app.

## Dependencies

### Already Installed ✅
- `react-native-blob-util@^0.24.5` - For downloading APK files

### Need to Install 📦
- `react-native-device-info@^13.2.0` - For getting app version and device information

## Installation Steps

### 1. Install react-native-device-info

```bash
npm install react-native-device-info@^13.2.0
```

### 2. Link Native Modules (iOS only)

```bash
cd ios && pod install && cd ..
```

### 3. Rebuild the App

#### For Android:
```bash
npm run android
```

#### For iOS:
```bash
npm run ios
```

## What Changed

### Before (Expo Dependencies)
```typescript
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Updates from 'expo-updates';
```

### After (React Native Native Modules)
```typescript
import DeviceInfo from 'react-native-device-info';
import ReactNativeBlobUtil from 'react-native-blob-util';
```

## Features Using These Dependencies

### react-native-device-info
- **Get app version**: `DeviceInfo.getVersion()` - Returns current app version (e.g., "1.0.0")
- **Platform detection**: Already handled by React Native's `Platform.OS`

### react-native-blob-util
- **Download APK files**: Downloads update files with progress tracking
- **Android installation**: Opens downloaded APK for installation
- **Download manager integration**: Shows download progress in Android notification bar

## Environment Variables

Update your `.env` file:

```env
# Use REACT_APP_API_URL instead of EXPO_PUBLIC_API_URL
REACT_APP_API_URL=http://localhost:3001
```

For production:
```env
REACT_APP_API_URL=https://api.yourapp.com
```

## Android Permissions

The app already has the necessary permissions in `android/app/src/main/AndroidManifest.xml`:

```xml
<!-- For downloading files -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />

<!-- For installing APK (Android 8.0+) -->
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
```

If not present, add them.

## iOS Configuration

For iOS, the app will redirect to the App Store instead of downloading directly. Update the App Store URL in `src/utils/updateChecker.ts`:

```typescript
const appStoreUrl = 'https://apps.apple.com/app/your-app-id';
```

## Verification

After installation, verify everything works:

### 1. Check if DeviceInfo is working:
```typescript
import DeviceInfo from 'react-native-device-info';
console.log('App Version:', DeviceInfo.getVersion());
```

### 2. Test update check:
- Launch the app
- Go to Profile screen
- Tap "Check for Updates"
- Should see either "Up to Date" or update dialog

### 3. Test automatic check:
- The app automatically checks for updates on launch
- This only runs in production builds (not development)

## Troubleshooting

### Module not found after installation
```bash
# Clear cache and rebuild
npm start -- --reset-cache

# For Android
cd android && ./gradlew clean && cd ..
npm run android

# For iOS
cd ios && pod install && cd ..
npm run ios
```

### Android: Can't install from unknown sources
Enable in device settings:
- Settings > Security > Unknown Sources (Android < 8.0)
- Settings > Apps > Special Access > Install unknown apps (Android 8.0+)

### iOS: App Store redirect not working
Update the App Store URL in `updateChecker.ts` with your actual App Store URL.

## Next Steps

After installing dependencies:

1. ✅ Install `react-native-device-info`
2. ✅ Link iOS pods
3. ✅ Rebuild app
4. ✅ Update `.env` with `REACT_APP_API_URL`
5. ✅ Test update check functionality
6. ✅ Deploy and test on real devices

## Complete Installation Command

```bash
# Install dependency
npm install react-native-device-info@^13.2.0

# Link iOS (if on macOS)
cd ios && pod install && cd ..

# Rebuild for Android
npm run android

# Or rebuild for iOS
npm run ios
```

That's it! The update system will now work with native React Native modules instead of Expo dependencies.
