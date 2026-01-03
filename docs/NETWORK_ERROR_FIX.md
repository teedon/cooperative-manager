# Fixing "Network Request Error" in React Native

## Problem
Getting "Network Request Error" when fetching from backend in React Native app, but Postman works fine.

## Root Causes

### 1. ❌ `process.env` doesn't work in React Native
```typescript
// This is UNDEFINED in React Native:
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

### 2. ❌ `localhost` on Android Emulator
- `localhost` refers to the emulator itself, not your computer
- Need to use `10.0.2.2` instead

### 3. ❌ Android blocks HTTP (cleartext) traffic by default
- Since Android 9, HTTP connections are blocked by default
- Need to enable cleartext traffic for development

## Solutions Applied

### ✅ Fix 1: Use Platform-Specific URLs
```typescript
const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3001', // Android emulator
  ios: 'http://localhost:3001',     // iOS simulator
  default: 'http://localhost:3001',
});
```

### ✅ Fix 2: Enable Cleartext Traffic (Android)

**In `android/app/build.gradle`:**
```gradle
defaultConfig {
    applicationId "com.cooperativemanagerbare"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 2
    versionName "1.1.0"
    
    // Allow HTTP traffic for development
    manifestPlaceholders = [
        usesCleartextTraffic: "true"
    ]
}
```

**In `AndroidManifest.xml`** (already present):
```xml
<application
    android:usesCleartextTraffic="${usesCleartextTraffic}"
    ...>
```

## Testing

### 1. Rebuild the Android App

```bash
# Clean build
cd android && ./gradlew clean && cd ..

# Rebuild
npm run android
```

### 2. Verify Backend is Running

```bash
# In another terminal
cd backend
npm start

# Should see: "Server is running on http://localhost:3001"
```

### 3. Test the Endpoint

From your computer (what Postman does):
```bash
curl "http://localhost:3001/api/downloads/check-update/android?currentVersion=1.0.0"
```

From Android emulator perspective:
```bash
curl "http://10.0.2.2:3001/api/downloads/check-update/android?currentVersion=1.0.0"
```

### 4. Check App Logs

In the app, the console logs should now show:
```
Checking for updates using API base URL: http://10.0.2.2:3001
Check update URL: http://10.0.2.2:3001/api/downloads/check-update/android?currentVersion=1.0.0
Update check response status: [Response object]
```

## Network Reference Table

| Device/Emulator | Backend URL | Notes |
|-----------------|-------------|-------|
| Android Emulator | `http://10.0.2.2:3001` | Special alias for host machine |
| iOS Simulator | `http://localhost:3001` | Works as-is |
| Real Android Device | `http://YOUR_IP:3001` | Use your computer's IP address |
| Real iOS Device | `http://YOUR_IP:3001` | Use your computer's IP address |
| Production | `https://api.yourapp.com` | Use HTTPS in production |

## Finding Your Computer's IP Address

For testing on real devices:

### macOS/Linux:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Windows:
```bash
ipconfig
```

Then update the code:
```typescript
const API_BASE_URL = Platform.select({
  android: __DEV__ ? 'http://10.0.2.2:3001' : 'https://api.production.com',
  ios: __DEV__ ? 'http://localhost:3001' : 'https://api.production.com',
  default: 'https://api.production.com',
});
```

## Production Considerations

### For Production, Update to HTTPS:

```typescript
const API_BASE_URL = __DEV__ 
  ? Platform.select({
      android: 'http://10.0.2.2:3001',
      ios: 'http://localhost:3001',
      default: 'http://localhost:3001',
    })
  : 'https://api.yourapp.com'; // Production API
```

### Disable Cleartext Traffic in Production:

In `android/app/build.gradle`:
```gradle
buildTypes {
    debug {
        manifestPlaceholders = [
            usesCleartextTraffic: "true"  // Allow HTTP in debug
        ]
    }
    release {
        manifestPlaceholders = [
            usesCleartextTraffic: "false" // Block HTTP in production
        ]
    }
}
```

## Common Issues

### Still getting Network Error?

1. **Check if backend is running:**
   ```bash
   curl http://localhost:3001/api/downloads/check-update/android?currentVersion=1.0.0
   ```

2. **Check Android logs:**
   ```bash
   npx react-native log-android
   ```

3. **Verify emulator can reach host:**
   ```bash
   # From within emulator (use adb shell)
   adb shell
   ping 10.0.2.2
   ```

4. **Firewall blocking?**
   - Check if firewall is blocking port 3001
   - Try temporarily disabling firewall

### Real Device Connection Issues

1. **Ensure device and computer are on same WiFi**
2. **Use computer's IP address instead of localhost**
3. **Check firewall allows connections from local network**

## Environment Variables (Alternative Approach)

If you want to use environment variables, use `react-native-config`:

```bash
npm install react-native-config
```

Then in `.env`:
```env
API_URL=http://10.0.2.2:3001
```

And in code:
```typescript
import Config from 'react-native-config';
const API_BASE_URL = Config.API_URL || 'http://10.0.2.2:3001';
```

But for now, the hardcoded Platform.select() approach works fine for development!
