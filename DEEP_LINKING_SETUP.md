# Deep Linking Setup - coopmanager.app

## Overview
Deep linking has been configured to allow users to:
- Join cooperatives via shareable links
- Sign up directly from invitation links
- Navigate to specific screens from external sources

## Configuration

### Domain
- Primary: `https://coopmanager.app`
- Alternative: `https://www.coopmanager.app`
- App Scheme: `coopmanager://`

### Platform Setup

#### Android
Deep linking is configured in `android/app/src/main/AndroidManifest.xml`:
- Universal links with `autoVerify` for https://coopmanager.app
- Custom URI scheme: `coopmanager://`

#### iOS
Deep linking is configured in `ios/CooperativeManagerBare/Info.plist`:
- Associated domains for Universal Links
- Custom URL scheme: `coopmanager://`

**Note:** For iOS Universal Links to work in production, you need to host an Apple App Site Association (AASA) file at:
- `https://coopmanager.app/.well-known/apple-app-site-association`
- `https://www.coopmanager.app/.well-known/apple-app-site-association`

### Web Server Configuration

#### Apple App Site Association (AASA) File
Create a file at `https://coopmanager.app/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.yourcompany.cooperativemanager",
        "paths": [
          "/join/*",
          "/signup/*"
        ]
      }
    ]
  }
}
```

**Important:** 
- Replace `TEAM_ID` with your Apple Developer Team ID
- Replace `com.yourcompany.cooperativemanager` with your actual bundle identifier
- Serve this file with `Content-Type: application/json`
- No file extension needed

#### Android Asset Links File
Create a file at `https://coopmanager.app/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.yourcompany.cooperativemanager",
    "sha256_cert_fingerprints": [
      "XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX"
    ]
  }
}]
```

**Important:**
- Replace `com.yourcompany.cooperativemanager` with your package name
- Replace the fingerprint with your app's SHA-256 certificate fingerprint
- Get fingerprint: `keytool -list -v -keystore your-release-key.keystore`

## Supported Deep Link Patterns

### Join Cooperative
```
https://coopmanager.app/join/COOP123
https://www.coopmanager.app/join/COOP123
coopmanager://join/COOP123
```

**Behavior:**
- **Not authenticated:** Redirects to registration with cooperative code pre-filled
- **Authenticated:** Opens Home screen with join modal and cooperative code pre-filled

### Future Patterns (can be added)
```
https://coopmanager.app/login
https://coopmanager.app/signup
https://coopmanager.app/cooperative/abc123
https://coopmanager.app/loan/xyz789
```

## Testing Deep Links

### iOS Simulator
```bash
xcrun simctl openurl booted "https://coopmanager.app/join/COOP123"
```

### Android Emulator
```bash
adb shell am start -W -a android.intent.action.VIEW -d "https://coopmanager.app/join/COOP123"
```

### Physical Devices
1. Send the link via email/message to yourself
2. Click the link on the device
3. Or use Notes app and tap the link

## Implementation Details

### Files Modified/Created

1. **`src/utils/deepLinking.ts`** - Deep linking configuration and handlers
2. **`src/navigation/RootNavigator.tsx`** - Navigation container with linking config
3. **`android/app/src/main/AndroidManifest.xml`** - Android intent filters
4. **`ios/CooperativeManagerBare/Info.plist`** - iOS URL schemes and associated domains
5. **`app.json`** - React Native config (if using Expo compatibility)

### Code Implementation

The deep linking system:
- Parses incoming URLs
- Handles authentication state
- Routes users to appropriate screens
- Pre-fills cooperative codes when joining

## Cooperative Switcher Enhancements

The cooperative switcher modal now includes:
- **Create New Cooperative** - Opens create modal from Home screen
- **Join Cooperative** - Opens join modal from Home screen
- Switch between existing cooperatives

## Bottom Navigation

The "My Cooperatives" tab is now visible in the bottom navigation and navigates directly to the user's default cooperative.

## Deployment Checklist

- [ ] Upload AASA file to `https://coopmanager.app/.well-known/apple-app-site-association`
- [ ] Upload assetlinks.json to `https://coopmanager.app/.well-known/assetlinks.json`
- [ ] Ensure both files are served with correct Content-Type
- [ ] Verify bundle identifier matches in AASA file
- [ ] Verify package name matches in assetlinks.json
- [ ] Get SHA-256 fingerprint for release keystore
- [ ] Test on physical iOS device
- [ ] Test on physical Android device
- [ ] Update DNS if needed for domain verification

## Troubleshooting

### iOS Links Not Working
1. Check AASA file is accessible and valid
2. Verify Team ID and Bundle ID are correct
3. Ensure associated domains entitlement is enabled in Xcode
4. Uninstall and reinstall app after domain changes

### Android Links Not Working
1. Verify assetlinks.json is accessible
2. Check package name and SHA-256 fingerprint
3. Use correct signing key for fingerprint
4. Test with `adb shell am start` command
5. Clear app data and retry

### General Issues
1. Ensure domain is publicly accessible (not localhost)
2. Check SSL certificate is valid
3. Verify no redirects on well-known URLs
4. Test custom scheme first: `coopmanager://join/TEST123`
