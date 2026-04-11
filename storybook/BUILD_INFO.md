# Cooperative Manager - Build Information

## Version 1.1.0 (Build 2)

### Build Date
December 27, 2025

### Changes in This Release

#### Backend Improvements
1. **Loan Visibility Fix**: Regular members now only see their own loans; admins with LOANS_VIEW permission see all loans
2. **Ledger Deduplication**: Fixed duplicate transactions in ledger by deduplicating virtual entries that already exist as real entries
3. **Invitation System**: Complete member invitation system with email/WhatsApp support and 30-day expiration

#### Mobile App Improvements
1. **Cooperative Code Copy**: Users can now tap the cooperative code badge to copy it to clipboard
2. **Loan Filtering**: Proper permission-based loan filtering
3. **Ledger Fix**: Transactions no longer appear twice
4. **Navigation Fix**: Invite Members screen properly added to navigation stack

### Build Instructions

#### Android Release APK
```bash
# Clean and build release APK
npm run android:clean
npm run android:release

# Or directly with Gradle
cd android
./gradlew clean assembleRelease
cd ..
```

#### Android App Bundle (AAB) for Play Store
```bash
npm run android:bundle

# Or directly with Gradle
cd android
./gradlew bundleRelease
cd ..
```

#### iOS Release (Archive)
```bash
npm run ios:release

# Or directly with Xcode
cd ios
xcodebuild -workspace CooperativeManager.xcworkspace \
           -scheme CooperativeManager \
           -configuration Release \
           -archivePath ./build/CooperativeManager.xcarchive \
           archive
cd ..
```

### Build Output Locations

#### Android
- **APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

#### iOS
- **Archive**: `ios/build/CooperativeManager.xcarchive`

### Signing Configuration

#### Android
- **Keystore**: `android/app/cooperative-manager-release.keystore`
- **Key Alias**: `cooperative-manager`
- **Store Password**: Set in `build.gradle`

#### iOS
- Configured via Xcode signing settings
- Requires Apple Developer account and provisioning profiles

### Testing the Release Build

#### Android
```bash
# Install on connected device
adb install android/app/build/outputs/apk/release/app-release.apk

# Or drag and drop APK to emulator
```

#### iOS
- Use Xcode to install on device
- Or use TestFlight for distribution

### Distribution

#### Android
1. **Direct Distribution**: Share the APK file directly
2. **Google Play Store**: Upload the AAB file to Play Console
3. **Third-party stores**: Use APK or AAB as required

#### iOS
1. **TestFlight**: Upload to App Store Connect for beta testing
2. **App Store**: Submit for review and publication
3. **Enterprise**: Use enterprise distribution (requires enterprise account)

### Version History

- **v1.1.0 (Build 2)**: Current release with loan visibility, ledger deduplication, and code copy features
- **v1.0.0 (Build 1)**: Initial release

### Notes

- The APK file is approximately 65-70 MB
- Minimum Android version: As configured in `minSdkVersion`
- Target Android version: As configured in `targetSdkVersion`
- Release builds use Hermes engine for better performance
- ProGuard/R8 is configured for code minification

### Troubleshooting

If the build fails:

1. **Clean build artifacts**:
   ```bash
   npm run android:clean
   rm -rf android/.gradle
   rm -rf android/app/build
   ```

2. **Check Gradle daemon**:
   ```bash
   cd android
   ./gradlew --stop
   ./gradlew assembleRelease
   ```

3. **Verify keystore exists**:
   ```bash
   ls -la android/app/*.keystore
   ```

4. **Check Java version**:
   ```bash
   java -version  # Should be Java 17
   ```

### Support

For build issues or questions, check the build logs:
- Android: `android-release-build.log`
- General Metro bundler: `metro-build.log`
