import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from './push-notification.service';
import * as fs from 'fs';
import * as path from 'path';
import { APP_VERSIONS, compareVersions, AppVersionInfo } from './app-versions.config';

@Injectable()
export class DownloadsService {
  private readonly storageDir = path.join(
    process.cwd(),
    'storage',
    'app-files',
  );

  constructor(
    private prisma: PrismaService,
    private pushNotificationService: PushNotificationService,
  ) {
    // Ensure storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Check for app updates
   * Returns version info and whether an update is available
   */
  async checkForUpdates(
    platform: 'android' | 'ios',
    currentVersion: string,
  ): Promise<{
    updateAvailable: boolean;
    latestVersion: AppVersionInfo;
    forceUpdate: boolean;
    isSupported: boolean;
  }> {
    const latestVersion = APP_VERSIONS[platform];
    
    if (!latestVersion) {
      throw new NotFoundException('Platform not supported');
    }

    const versionComparison = compareVersions(latestVersion.version, currentVersion);
    const updateAvailable = versionComparison > 0;

    const minVersionComparison = compareVersions(currentVersion, latestVersion.minSupportedVersion);
    const isSupported = minVersionComparison >= 0;

    // Check if file exists
    const fileName = platform === 'android' ? 'cooperative-manager.apk' : 'cooperative-manager.ipa';
    const filePath = path.join(this.storageDir, fileName);
    const fileExists = fs.existsSync(filePath);

    // Add file size if file exists
    let fileSize: number | undefined;
    if (fileExists) {
      const stats = fs.statSync(filePath);
      fileSize = stats.size;
    }

    return {
      updateAvailable,
      latestVersion: {
        ...latestVersion,
        fileSize,
      },
      forceUpdate: latestVersion.forceUpdate || !isSupported,
      isSupported,
    };
  }

  async getAppFile(
    platform: 'android' | 'ios' | 'web',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ filePath: string; fileName: string; version: string }> {
    // Get version from config
    const appInfo = platform === 'web' 
      ? { fileName: 'cooperative-manager-web.zip', version: '1.0.0' }
      : { 
          fileName: platform === 'android' ? 'cooperative-manager.apk' : 'cooperative-manager.ipa',
          version: APP_VERSIONS[platform].version 
        };

    const filePath = path.join(this.storageDir, appInfo.fileName);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(
        `App file for ${platform} not found. Please upload the file to: ${filePath}`,
      );
    }

    // Track the download
    try {
      await this.prisma.appDownload.create({
        data: {
          platform,
          version: appInfo.version,
          ipAddress: ipAddress || null,
          userAgent: userAgent || null,
        },
      });
    } catch (error) {
      console.error('Failed to track download:', error);
      // Don't fail the download if tracking fails
    }

    return {
      filePath,
      fileName: appInfo.fileName,
      version: appInfo.version,
    };
  }

  async getDownloadStats(platform?: string) {
    const where = platform ? { platform } : {};

    const [total, byPlatform, recent] = await Promise.all([
      // Total downloads
      this.prisma.appDownload.count({ where }),

      // Downloads by platform
      this.prisma.appDownload.groupBy({
        by: ['platform'],
        _count: {
          id: true,
        },
        where,
      }),

      // Recent downloads (last 30 days)
      this.prisma.appDownload.count({
        where: {
          ...where,
          downloadedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    // Downloads per day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDownloads = await this.prisma.appDownload.findMany({
      where: {
        ...where,
        downloadedAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        downloadedAt: true,
      },
    });

    // Group by date
    const downloadsPerDay = recentDownloads.reduce(
      (acc: Record<string, number>, item: { downloadedAt: Date }) => {
        const date = item.downloadedAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {},
    );

    return {
      total,
      byPlatform: byPlatform.reduce(
        (acc: Record<string, number>, item: { platform: string; _count: { id: number } }) => {
          acc[item.platform] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
      last30Days: recent,
      dailyDownloads: Object.entries(downloadsPerDay).map(([date, count]) => ({
        date,
        count,
      })),
    };
  }

  async uploadAppFile(
    platform: 'android' | 'ios' | 'web',
    file: Express.Multer.File,
  ): Promise<{ message: string; filePath: string }> {
    const appFiles = {
      android: 'cooperative-manager.apk',
      ios: 'cooperative-manager.ipa',
      web: 'cooperative-manager-web.zip',
    };

    const fileName = appFiles[platform];
    const destinationPath = path.join(this.storageDir, fileName);

    try {
      // If file already exists, back it up
      if (fs.existsSync(destinationPath)) {
        const backupPath = path.join(
          this.storageDir,
          `${fileName}.backup.${Date.now()}`,
        );
        fs.copyFileSync(destinationPath, backupPath);
      }

      // Write the new file
      fs.writeFileSync(destinationPath, file.buffer);

      return {
        message: `${platform} app file uploaded successfully`,
        filePath: destinationPath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to upload file: ${errorMessage}`,
      );
    }
  }

  async deleteAppFile(
    platform: 'android' | 'ios' | 'web',
  ): Promise<{ message: string }> {
    const appFiles = {
      android: 'cooperative-manager.apk',
      ios: 'cooperative-manager.ipa',
      web: 'cooperative-manager-web.zip',
    };

    const fileName = appFiles[platform];
    const filePath = path.join(this.storageDir, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`App file for ${platform} not found`);
    }

    try {
      fs.unlinkSync(filePath);
      return {
        message: `${platform} app file deleted successfully`,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new InternalServerErrorException(
        `Failed to delete file: ${errorMessage}`,
      );
    }
  }

  async listAvailableFiles() {
    const platforms = ['android', 'ios', 'web'];
    const appFiles = {
      android: 'cooperative-manager.apk',
      ios: 'cooperative-manager.ipa',
      web: 'cooperative-manager-web.zip',
    };

    const files = platforms.map((platform) => {
      const fileName = appFiles[platform as keyof typeof appFiles];
      const filePath = path.join(this.storageDir, fileName);
      const exists = fs.existsSync(filePath);

      let size = null;
      let lastModified = null;

      if (exists) {
        const stats = fs.statSync(filePath);
        size = stats.size;
        lastModified = stats.mtime;
      }

      return {
        platform,
        fileName,
        exists,
        size,
        lastModified,
        path: exists ? filePath : null,
      };
    });

    return { files };
  }

  /**
   * Send push notification for app update
   */
  async notifyUpdate(
    platform: 'android' | 'ios' | 'all',
    version: string,
    forceUpdate: boolean,
  ): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const result = await this.pushNotificationService.sendUpdateNotification(
        platform,
        version,
        forceUpdate,
      );

      return {
        success: result.success,
        message: result.success
          ? `Push notification sent successfully for ${platform} version ${version}`
          : 'Failed to send push notification',
        details: result,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Error sending push notification',
        details: { error: error.message },
      };
    }
  }
}
