# Deep Linking Mobile App Implementation

## Overview
Deep linking has been fully implemented in the mobile app to allow users to:
- Join cooperatives via shareable invitation links
- Sign up directly from invitation links with pre-filled cooperative codes
- Seamlessly navigate between authentication and main app flows

## Implementation Summary

### 1. **Deep Linking Configuration** ✅

#### Native Platform Files
- **Android**: `android/app/src/main/AndroidManifest.xml`
  - Universal links: `https://coopmanager.app` and `https://www.coopmanager.app`
  - Custom scheme: `coopmanager://`
  - Auto-verification enabled for App Links

- **iOS**: `ios/CooperativeManagerBare/Info.plist`
  - Associated domains for Universal Links
  - Custom URL scheme configuration

#### React Native Configuration
- **Deep Linking Handler**: `src/utils/deepLinking.ts`
  - URL parsing and routing logic
  - Authentication state handling
  - Navigation parameter passing

- **Navigation Setup**: `src/navigation/RootNavigator.tsx`
  - Integrated linking configuration
  - Deep link event listeners
  - Initial URL handling

### 2. **Authentication Flow** ✅

#### SignupScreen (`src/screens/auth/SignupScreen.tsx`)
**New Features:**
- Accepts `cooperativeCode` parameter from deep links
- Displays invitation hint banner when code is present
- Shows cooperative code prominently during signup
- Automatic handling after successful registration

**User Experience:**
1. User clicks invitation link: `https://coopmanager.app/join/COOP123`
2. Signup screen opens with blue hint banner showing the cooperative code
3. User completes registration
4. After signup, they're directed to join the cooperative

**Code Changes:**
```tsx
// Added state for cooperative code
const [cooperativeCode, setCooperativeCode] = useState('');
const [showCooperativeHint, setShowCooperativeHint] = useState(false);

// Handle deep link parameter
useEffect(() => {
  if (route.params?.cooperativeCode) {
    setCooperativeCode(route.params.cooperativeCode);
    setShowCooperativeHint(true);
  }
}, [route.params?.cooperativeCode]);

// Visual hint banner
{cooperativeCode && (
  <View style={styles.cooperativeHint}>
    <Icon name="Info" size={18} color="#0369a1" />
    <View style={styles.cooperativeHintContent}>
      <Text style={styles.cooperativeHintText}>
        You've been invited to join a cooperative!
      </Text>
      <Text style={styles.cooperativeCodeText}>
        Code: {cooperativeCode}
      </Text>
    </View>
  </View>
)}
```

**Styling:**
- Blue hint banner with info icon
- Prominent code display
- Subtle shadows for depth
- Responsive layout

#### AuthNavigator Type Updates
Updated `AuthStackParamList` to support cooperative code parameter:
```tsx
export type AuthStackParamList = {
  Login: undefined;
  Signup: { cooperativeCode?: string } | undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string; email: string };
};
```

### 3. **Authenticated User Flow** ✅

#### HomeScreen (`src/screens/home/HomeScreen.tsx`)
**New Features:**
- Handles `openModal` parameter to show join/create modals
- Accepts `cooperativeCode` parameter from deep links
- Pre-fills cooperative code in join modal

**User Experience:**
1. Authenticated user clicks: `https://coopmanager.app/join/COOP123`
2. App navigates to HomeScreen
3. Join modal opens automatically
4. Cooperative code is pre-filled
5. User can immediately submit to join

**Code Changes:**
```tsx
useEffect(() => {
  const params = route?.params as any;
  if (params?.openModal === 'create') {
    setShowCreateModal(true);
  }
  if (params?.openModal === 'join') {
    setShowJoinModal(true);
    // Pre-fill cooperative code if provided via deep link
    if (params?.cooperativeCode) {
      setCooperativeCode(params.cooperativeCode);
    }
  }
}, [route?.params]);
```

### 4. **Deep Linking Router** ✅

#### Deep Linking Utility (`src/utils/deepLinking.ts`)
**Features:**
- URL parsing and validation
- Authentication state checks
- Smart routing based on user state
- Support for multiple URL schemes

**Supported URL Patterns:**
- `https://coopmanager.app/join/COOP123`
- `https://www.coopmanager.app/join/COOP123`
- `coopmanager://join/COOP123`
- Query parameters: `?code=COOP123`

**Routing Logic:**
```
User Not Authenticated:
  Deep Link → Auth Stack → Signup Screen (with code)

User Authenticated:
  Deep Link → Main Stack → Home Screen → Join Modal (with code)
```

**Implementation:**
```tsx
export const handleDeepLink = (url, navigation, isAuthenticated) => {
  const urlObj = new URL(url);
  const path = urlObj.pathname;
  const code = path.split('/join/')[1] || params.code;
  
  if (!isAuthenticated) {
    navigation?.navigate('Auth', { 
      screen: 'Signup', 
      params: { cooperativeCode: code } 
    });
  } else {
    navigation?.navigate('Main', {
      screen: 'HomeTab',
      params: {
        screen: 'Home',
        params: { openModal: 'join', cooperativeCode: code },
      },
    });
  }
};
```

### 5. **Root Navigator Integration** ✅

#### RootNavigator (`src/navigation/RootNavigator.tsx`)
**New Features:**
- Navigation ref for programmatic navigation
- Deep link event listeners
- Initial URL handling on app launch
- Cleanup on unmount

**Implementation:**
```tsx
const navigationRef = useRef<NavigationContainerRef<any>>(null);

// Setup deep linking
useEffect(() => {
  if (!isCheckingAuth) {
    const cleanup = setupDeepLinking(navigationRef.current, isAuthenticated);
    return cleanup;
  }
}, [isAuthenticated, isCheckingAuth]);

return (
  <NavigationContainer ref={navigationRef} linking={linking}>
    {/* Navigation stacks */}
  </NavigationContainer>
);
```

**Linking Configuration:**
```tsx
export const linking = {
  prefixes: [
    'coopmanager://', 
    'https://coopmanager.app', 
    'https://www.coopmanager.app'
  ],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: {
            screens: {
              Home: {
                path: 'join/:code?',
                parse: {
                  code: (code: string) => code,
                },
              },
            },
          },
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          Signup: 'register',
        },
      },
    },
  },
};
```

## Testing Deep Links

### Development Testing

#### iOS Simulator
```bash
# Test join link with code
xcrun simctl openurl booted "https://coopmanager.app/join/COOP123"

# Test custom scheme
xcrun simctl openurl booted "coopmanager://join/COOP123"
```

#### Android Emulator
```bash
# Test join link with code
adb shell am start -W -a android.intent.action.VIEW \
  -d "https://coopmanager.app/join/COOP123" \
  com.yourcompany.cooperativemanager

# Test custom scheme
adb shell am start -W -a android.intent.action.VIEW \
  -d "coopmanager://join/COOP123" \
  com.yourcompany.cooperativemanager
```

### Manual Testing on Physical Devices

1. **Send via messaging app**: Send yourself the link via SMS/WhatsApp/Email
2. **Click the link**: Tap the link to open the app
3. **Verify flow**: Check that the app opens correctly and code is populated

### Test Cases

#### Test Case 1: Unauthenticated User
1. User is not logged in
2. Clicks: `https://coopmanager.app/join/COOP123`
3. **Expected**: Signup screen opens with blue banner showing "Code: COOP123"
4. User completes signup
5. **Expected**: After signup, user can join the cooperative

#### Test Case 2: Authenticated User
1. User is logged in
2. Clicks: `https://coopmanager.app/join/COOP456`
3. **Expected**: App opens to Home screen with join modal
4. **Expected**: Cooperative code field shows "COOP456"
5. User clicks "Join Cooperative"
6. **Expected**: Membership request submitted

#### Test Case 3: Custom Scheme
1. Clicks: `coopmanager://join/TEST789`
2. **Expected**: Same behavior as HTTPS links
3. Works on both iOS and Android

#### Test Case 4: Link Without Code
1. Clicks: `https://coopmanager.app/join`
2. **Expected**: Opens join modal/screen without pre-filled code
3. User must manually enter code

## Production Deployment Requirements

### Web Server Configuration

Before deploying to production, you **MUST** host these files on your web server:

#### 1. Apple App Site Association (iOS)
**Location**: `https://coopmanager.app/.well-known/apple-app-site-association`

**Content**:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.yourcompany.cooperativemanager",
        "paths": ["/join/*", "/signup/*"]
      }
    ]
  }
}
```

**Important**:
- Replace `TEAM_ID` with your Apple Developer Team ID
- Replace bundle identifier with your actual app ID
- Serve with `Content-Type: application/json`
- **No file extension**
- Must be accessible via HTTPS

#### 2. Android Asset Links (Android)
**Location**: `https://coopmanager.app/.well-known/assetlinks.json`

**Content**:
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

**Get SHA-256 Fingerprint**:
```bash
keytool -list -v -keystore your-release-key.keystore
```

**Important**:
- Replace package name with your actual package
- Use release keystore fingerprint for production
- Serve with `Content-Type: application/json`

### Nginx Configuration Example
```nginx
server {
  listen 443 ssl;
  server_name coopmanager.app www.coopmanager.app;
  
  location /.well-known/apple-app-site-association {
    default_type application/json;
    add_header Content-Type application/json;
  }
  
  location /.well-known/assetlinks.json {
    default_type application/json;
    add_header Content-Type application/json;
  }
}
```

### Verification

#### iOS Universal Links
1. Upload AASA file to server
2. Verify accessible: `curl https://coopmanager.app/.well-known/apple-app-site-association`
3. Validate with Apple: https://search.developer.apple.com/appsearch-validation-tool/
4. Test on physical device (not simulator)

#### Android App Links
1. Upload assetlinks.json to server
2. Verify accessible: `curl https://coopmanager.app/.well-known/assetlinks.json`
3. Validate: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://coopmanager.app
4. Test with `adb` command on device

## Troubleshooting

### iOS Issues

**Problem**: Links open in browser instead of app
- **Solution**: Verify AASA file is accessible and valid
- **Solution**: Check Team ID and Bundle ID match
- **Solution**: Uninstall and reinstall app
- **Solution**: Test on physical device, not simulator

**Problem**: Associated domains not working
- **Solution**: Enable in Xcode: Signing & Capabilities → Associated Domains
- **Solution**: Add: `applinks:coopmanager.app` and `applinks:www.coopmanager.app`

### Android Issues

**Problem**: Links open in browser
- **Solution**: Verify assetlinks.json is valid
- **Solution**: Check package name matches
- **Solution**: Use correct SHA-256 fingerprint for release build
- **Solution**: Enable auto-verify in manifest

**Problem**: App Links not verified
- **Solution**: Wait up to 24 hours for Google to verify
- **Solution**: Test with debug build using debug keystore fingerprint
- **Solution**: Check logcat for verification errors

### General Issues

**Problem**: Deep link not triggering
- **Solution**: Test with custom scheme first: `coopmanager://join/TEST`
- **Solution**: Check navigation ref is initialized
- **Solution**: Verify URL pattern matches expected format
- **Solution**: Check authentication state handling

**Problem**: Parameters not passing correctly
- **Solution**: Verify route params are being parsed correctly
- **Solution**: Check navigation structure matches linking config
- **Solution**: Log URL in handleDeepLink to debug

## Future Enhancements

### Potential Additional Deep Links
1. **Direct Cooperative Access**: `https://coopmanager.app/cooperative/:id`
2. **Loan Details**: `https://coopmanager.app/loan/:id`
3. **Payment Links**: `https://coopmanager.app/pay/:id`
4. **Event Invitations**: `https://coopmanager.app/event/:id`
5. **Direct Login**: `https://coopmanager.app/login`

### Analytics Integration
```tsx
// Track deep link opens
analytics.logEvent('deep_link_opened', {
  url: url,
  authenticated: isAuthenticated,
  path: path,
  code: code,
});
```

### Dynamic Links (Firebase)
Consider implementing Firebase Dynamic Links for:
- Link shortening
- Analytics tracking
- Cross-platform consistency
- Deferred deep linking (install attribution)

## Summary

✅ **Complete Implementation**:
- Native platform configuration (iOS & Android)
- React Native deep linking setup
- Authentication flow handling
- Pre-filled cooperative codes
- Visual feedback for users
- Comprehensive testing instructions

🎯 **Next Steps**:
1. Deploy well-known files to production server
2. Update bundle ID and package name
3. Get SHA-256 fingerprint for release
4. Test on physical devices
5. Monitor analytics for deep link usage

📚 **Documentation**:
- See `DEEP_LINKING_SETUP.md` for server configuration
- See this file for implementation details
- See code comments for inline documentation
