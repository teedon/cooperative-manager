// App Version Configuration
// Update these values when releasing new versions

export interface AppVersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  downloadUrl: string;
  changeLog: string[];
  minSupportedVersion: string;
  forceUpdate: boolean;
  fileSize?: number;
}

export const APP_VERSIONS = {
  android: {
    version: '1.1.3',
    buildNumber: 7,
    releaseDate: '2026-01-06',
    downloadUrl: '/api/downloads/app/android',
    changeLog: [
      'Fix Splash screen onboarding',
    ],
    minSupportedVersion: '1.0.0',
    forceUpdate: false,
  } as AppVersionInfo,

  ios: {
    version: '1.0.0',
    buildNumber: 1,
    releaseDate: '2026-01-02',
    downloadUrl: '/api/downloads/app/ios',
    changeLog: [
      'Initial release',
      'Member management',
      'Contribution tracking',
      'Loan processing',
    ],
    minSupportedVersion: '1.0.0',
    forceUpdate: false,
  } as AppVersionInfo,
};

/**
 * Compare semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}
