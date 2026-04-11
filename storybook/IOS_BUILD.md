# iOS Release Build Guide

## Prerequisites

1. **macOS** with Xcode installed
2. **Apple Developer Account** with appropriate certificates and provisioning profiles
3. **CocoaPods** installed (`sudo gem install cocoapods`)
4. **React Native** dependencies installed

## Setup

### 1. Install Dependencies

```bash
# Install npm packages
npm install

# Install iOS pods
cd ios && pod install && cd ..
```

### 2. Configure Team ID

Edit `ios/exportOptions.plist` and replace `YOUR_TEAM_ID` with your Apple Developer Team ID:

```xml
<key>teamID</key>
<string>YOUR_TEAM_ID</string>
```

You can find your Team ID in:
- Apple Developer Portal > Membership
- Xcode > Preferences > Accounts > Select your account > View Details

### 3. Configure Signing in Xcode

1. Open the workspace in Xcode:
   ```bash
   open ios/CooperativeManagerBare.xcworkspace
   ```

2. Select the project in the Project Navigator
3. Select the target `CooperativeManagerBare`
4. Go to **Signing & Capabilities** tab
5. Ensure **Automatically manage signing** is checked
6. Select your **Team** from the dropdown
7. Verify the **Bundle Identifier** matches your App Store Connect app

## Build Options

### Option 1: Complete Build (Archive + Export)

Creates an IPA file ready for upload to App Store Connect:

```bash
npm run ios:build
```

This will:
- Create an archive at `ios/build/CooperativeManager.xcarchive`
- Export an IPA at `ios/build/CooperativeManagerBare.ipa`

### Option 2: Archive Only

Creates an archive without exporting:

```bash
npm run ios:archive
```

### Option 3: Export from Existing Archive

If you already have an archive:

```bash
npm run ios:export
```

### Option 4: Run Release Build on Simulator/Device

Test the release configuration without creating an archive:

```bash
npm run ios:release
```

## Upload to App Store Connect

### Method 1: Using Xcode

1. Open Xcode Organizer:
   - Xcode > Window > Organizer
2. Select your archive
3. Click **Distribute App**
4. Select **App Store Connect**
5. Follow the wizard

### Method 2: Using Transporter App

1. Open Transporter app (download from Mac App Store)
2. Drag and drop the IPA file from `ios/build/`
3. Click **Deliver**

### Method 3: Using Command Line (xcrun altool)

```bash
xcrun altool --upload-app \
  --type ios \
  --file ios/build/CooperativeManagerBare.ipa \
  --username "your-apple-id@example.com" \
  --password "app-specific-password"
```

**Note:** You need to generate an app-specific password in your Apple ID account settings.

## Troubleshooting

### Code Signing Issues

If you encounter code signing errors:

1. **Delete derived data:**
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData
   ```

2. **Clean build:**
   ```bash
   cd ios
   xcodebuild clean -workspace CooperativeManagerBare.xcworkspace -scheme CooperativeManagerBare
   cd ..
   ```

3. **Verify certificates:**
   - Open Keychain Access
   - Look for valid Apple Development/Distribution certificates
   - Ensure they're not expired

### Provisioning Profile Issues

1. Delete old profiles:
   ```bash
   rm -rf ~/Library/MobileDevice/Provisioning\ Profiles/*
   ```

2. Download fresh profiles in Xcode:
   - Xcode > Preferences > Accounts
   - Select your account > Download Manual Profiles

### Build Failed

1. **Update CocoaPods:**
   ```bash
   cd ios
   pod repo update
   pod install
   cd ..
   ```

2. **Clean and rebuild:**
   ```bash
   cd ios
   xcodebuild clean
   cd ..
   npm run ios:build
   ```

## Export Options

The `exportOptions.plist` supports different export methods:

- **app-store**: For App Store submission (default)
- **ad-hoc**: For distribution to registered devices
- **enterprise**: For enterprise distribution
- **development**: For development testing

To change the export method, edit `ios/exportOptions.plist`:

```xml
<key>method</key>
<string>ad-hoc</string>  <!-- or app-store, enterprise, development -->
```

## Version Management

Before building, ensure you've updated the version:

```bash
npm run bump-version [patch|minor|major]
```

This updates:
- package.json version
- iOS CFBundleShortVersionString
- iOS CFBundleVersion
- Android versionName
- Android versionCode

## CI/CD Integration

For automated builds, you can use Fastlane:

1. Install Fastlane:
   ```bash
   sudo gem install fastlane
   ```

2. Initialize Fastlane in the ios directory:
   ```bash
   cd ios
   fastlane init
   ```

3. Create a Fastfile with your build lanes

## Additional Resources

- [React Native iOS Setup](https://reactnative.dev/docs/environment-setup)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Xcode Help](https://help.apple.com/xcode/)
