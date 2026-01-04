import { Platform, Alert, Linking, AlertButton } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import DeviceInfo from 'react-native-device-info';

// Production API URL
const PRODUCTION_API_URL = 'https://cooperative-manager-production.up.railway.app';

// Development URLs: For Android emulator, use 10.0.2.2 instead of localhost
// For iOS simulator, localhost works
const DEVELOPMENT_API_URL = Platform.select({
  android: 'http://10.0.2.2:3001', // Android emulator localhost
  ios: 'http://localhost:3001',     // iOS simulator
  default: 'http://localhost:3001',
});

// Use production URL in production, development URL in development
const API_BASE_URL = __DEV__ ? DEVELOPMENT_API_URL : PRODUCTION_API_URL;

interface VersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  downloadUrl: string;
  changeLog: string[];
  minSupportedVersion: string;
  forceUpdate: boolean;
  fileSize?: number;
}

interface UpdateCheckResponse {
  updateAvailable: boolean;
  latestVersion: VersionInfo;
  forceUpdate: boolean;
  isSupported: boolean;
}

export class UpdateChecker {
  private static getCurrentVersion(): string {
    // Get current app version from DeviceInfo
    return DeviceInfo.getVersion();
  }

  private static getPlatform(): 'android' | 'ios' {
    return Platform.OS as 'android' | 'ios';
  }

  /**
   * Check if an app update is available
   */
  static async checkForUpdates(): Promise<UpdateCheckResponse | null> {
    try {
      const currentVersion = this.getCurrentVersion();
      const platform = this.getPlatform();

      //log the the current API base URL
      console.log('Checking for updates using API base URL:', API_BASE_URL);

      const checkUpdateURl = `${API_BASE_URL}/api/downloads/check-update/${platform}?currentVersion=${currentVersion}`;
      //log the check update URL
      console.log('Check update URL:', checkUpdateURl);
      const response = await fetch(
        checkUpdateURl
      );

      console.log('Update check response status:', response);

      if (!response.ok) {
        console.error('Failed to check for updates:', response.statusText);
        return null;
      }

      const data: UpdateCheckResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return null;
    }
  }

  /**
   * Show update dialog to user
   */
  static async showUpdateDialog(updateInfo: UpdateCheckResponse): Promise<void> {
    const { latestVersion, forceUpdate, isSupported } = updateInfo;

    // Format file size for display
    const fileSizeText = latestVersion.fileSize
      ? `\n\nDownload size: ${(latestVersion.fileSize / 1024 / 1024).toFixed(2)} MB`
      : '';

    // Format changelog
    const changelogText =
      latestVersion.changeLog && latestVersion.changeLog.length > 0
        ? `\n\nWhat's new:\n${latestVersion.changeLog.map((item) => `• ${item}`).join('\n')}`
        : '';

    const message = isSupported
      ? `A new version (${latestVersion.version}) is available!${changelogText}${fileSizeText}`
      : `This version is no longer supported. Please update to version ${latestVersion.version} to continue using the app.${changelogText}${fileSizeText}`;

    return new Promise((resolve) => {
      const buttons: AlertButton[] = [
        ...(forceUpdate
          ? []
          : [
              {
                text: 'Later',
                style: 'cancel' as const,
                onPress: () => resolve(),
              },
            ]),
        {
          text: 'Update Now',
          onPress: async () => {
            await this.downloadAndInstallUpdate(latestVersion);
            resolve();
          },
        },
      ];

      Alert.alert(
        forceUpdate ? 'Update Required' : 'Update Available',
        message,
        buttons,
        { cancelable: !forceUpdate },
      );
    });
  }

  /**
   * Download and install the update
   */
  private static async downloadAndInstallUpdate(versionInfo: VersionInfo): Promise<void> {
    const platform = this.getPlatform();
    const downloadUrl = `${API_BASE_URL}${versionInfo.downloadUrl}`;

    if (platform === 'ios') {
      // For iOS, redirect to App Store
      // In production, this would be your App Store URL
      const appStoreUrl = 'https://apps.apple.com/app/your-app-id';
      await Linking.openURL(appStoreUrl);
      return;
    }

    // For Android, download and install APK
    try {
      const fileName = 'cooperative-manager-update.apk';
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const downloadPath = `${dirs.DownloadDir}/${fileName}`;

      // Show dismissible progress alert
      Alert.alert(
        'Downloading Update',
        `Downloading version ${versionInfo.version}...\n\nProgress will be shown in your notification bar.`,
        [{ text: 'OK', onPress: () => {} }],
        { cancelable: true } // Can dismiss this alert
      );

      let lastProgress = 0;

      // Download the file with progress tracking
      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: downloadPath,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          title: 'Cooperative Manager Update',
          description: `Downloading version ${versionInfo.version}`,
          mime: 'application/vnd.android.package-archive',
          mediaScannable: true,
        },
      })
        .fetch('GET', downloadUrl)
        .progress((received: number, total: number) => {
          const progress = Math.floor((received / total) * 100);
          
          // Log progress for debugging
          if (progress - lastProgress >= 10 || progress === 100) {
            lastProgress = progress;
            console.log(`Download progress: ${progress}%`);
          }
        });

      const path = response.path();
      
      // Install the APK
      await this.installAPK(path);
    } catch (error) {
      console.error('Error downloading update:', error);
      Alert.alert(
        'Update Error',
        'An error occurred while updating the app. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Install APK on Android
   */
  private static async installAPK(filePath: string): Promise<void> {
    try {
      // Open the APK file for installation
      await ReactNativeBlobUtil.android.actionViewIntent(
        filePath,
        'application/vnd.android.package-archive',
      );
      
      // Dismissible alert for installation
      Alert.alert(
        'Install Update',
        'The update has been downloaded. Please follow the prompts to install it.',
        [{ text: 'OK' }],
        { cancelable: true } // Can dismiss
      );
    } catch (error) {
      console.error('Error installing APK:', error);
      Alert.alert(
        'Installation Error',
        'Could not install the update automatically. Please download it from the website.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Check for updates on app launch
   * Call this in your App.tsx or root component
   */
  static async checkAndPromptForUpdates(): Promise<void> {
    // Skip check in development mode
    if (__DEV__) {
      console.log('Skipping update check in development mode');
      return;
    }

    const updateInfo = await this.checkForUpdates();

    if (!updateInfo) {
      console.log('Could not check for updates');
      return;
    }

    // If update is available or force update is required
    if (updateInfo.updateAvailable || updateInfo.forceUpdate) {
      await this.showUpdateDialog(updateInfo);
    }
  }

  /**
   * Manual update check (for settings screen)
   */
  static async manualUpdateCheck(): Promise<void> {
    const updateInfo = await this.checkForUpdates();

    if (!updateInfo) {
      Alert.alert('Update Check Failed', 'Could not check for updates. Please try again later.');
      return;
    }

    if (updateInfo.updateAvailable) {
      await this.showUpdateDialog(updateInfo);
    } else {
      Alert.alert('Up to Date', `You are running the latest version (${this.getCurrentVersion()}).`);
    }
  }
}
