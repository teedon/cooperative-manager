import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as admin from 'firebase-admin';

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Send push notification for critical app updates
   */
  async sendUpdateNotification(
    platform: 'android' | 'ios' | 'all',
    version: string,
    forceUpdate: boolean,
  ): Promise<{ success: boolean; sentCount: number; failedCount: number }> {
    try {
      // Get all users with FCM tokens
      // Note: You'll need to add fcmToken field to User model
      const users = await this.prisma.user.findMany({
        where: {
          // Filter by platform if specified
          ...(platform !== 'all' && {
            // Add platform field to User model if you want to filter by platform
          }),
        },
        select: {
          id: true,
          email: true,
          // fcmToken: true, // Add this field to User model
        },
      });

      // For now, we'll use a topic-based approach
      const topic = platform === 'all' ? 'all-users' : `${platform}-users`;

      const notification: NotificationPayload = {
        title: forceUpdate ? '🚨 Critical Update Required' : '🎉 New Update Available',
        body: forceUpdate
          ? `Version ${version} is now available. Update required to continue using the app.`
          : `Version ${version} is now available with new features and improvements!`,
        data: {
          type: 'app_update',
          version,
          platform,
          forceUpdate: forceUpdate.toString(),
          action: 'check_update',
        },
      };

      // Send to topic
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
        topic,
        android: {
          priority: 'high' as const,
          notification: {
            channelId: 'cooperative_manager_updates',
            priority: 'high' as const,
            sound: 'default',
            color: '#4F46E5',
            icon: 'ic_notification',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);

      this.logger.log(
        `Sent update notification for ${platform} version ${version}. Response: ${response}`,
      );

      return {
        success: true,
        sentCount: 1, // Topic-based, so we count as 1
        failedCount: 0,
      };
    } catch (error) {
      this.logger.error('Error sending update notification:', error);
      return {
        success: false,
        sentCount: 0,
        failedCount: 1,
      };
    }
  }

  /**
   * Subscribe users to update notification topics
   */
  async subscribeToUpdateNotifications(
    fcmToken: string,
    platform: 'android' | 'ios',
  ): Promise<void> {
    try {
      await admin.messaging().subscribeToTopic([fcmToken], `${platform}-users`);
      await admin.messaging().subscribeToTopic([fcmToken], 'all-users');
      
      this.logger.log(`Subscribed device to update notifications: ${platform}`);
    } catch (error) {
      this.logger.error('Error subscribing to topic:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe users from update notification topics
   */
  async unsubscribeFromUpdateNotifications(
    fcmToken: string,
    platform: 'android' | 'ios',
  ): Promise<void> {
    try {
      await admin.messaging().unsubscribeFromTopic([fcmToken], `${platform}-users`);
      await admin.messaging().unsubscribeFromTopic([fcmToken], 'all-users');
      
      this.logger.log(`Unsubscribed device from update notifications: ${platform}`);
    } catch (error) {
      this.logger.error('Error unsubscribing from topic:', error);
      throw error;
    }
  }
}
