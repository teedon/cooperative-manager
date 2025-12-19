import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, UpdatePreferencesDto } from './dto/notifications.dto';
import * as admin from 'firebase-admin';

// Notification types that map to preference keys
const NOTIFICATION_TYPE_TO_PREFERENCE: Record<string, string> = {
  contribution_reminder: 'contributionReminders',
  contribution_received: 'contributionReminders',
  contribution_approved: 'contributionReminders',
  contribution_rejected: 'contributionReminders',
  loan_requested: 'loanUpdates',
  loan_approved: 'loanUpdates',
  loan_rejected: 'loanUpdates',
  loan_disbursed: 'loanUpdates',
  loan_repayment_due: 'loanUpdates',
  loan_overdue: 'loanUpdates',
  groupbuy_created: 'groupBuyUpdates',
  groupbuy_joined: 'groupBuyUpdates',
  groupbuy_completed: 'groupBuyUpdates',
  groupbuy_cancelled: 'groupBuyUpdates',
  member_joined: 'memberUpdates',
  member_approved: 'memberUpdates',
  member_rejected: 'memberUpdates',
  member_removed: 'memberUpdates',
  role_changed: 'memberUpdates',
  announcement: 'announcements',
  mention: 'mentions',
};

@Injectable()
export class NotificationsService {
  private firebaseInitialized = false;

  constructor(private prisma: PrismaService) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // Initialize Firebase Admin SDK if credentials are available
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            }),
          });
          this.firebaseInitialized = true;
          console.log('Firebase Admin SDK initialized');
        } else {
          this.firebaseInitialized = true;
        }
      } else {
        console.warn('Firebase credentials not configured. Push notifications will be disabled.');
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK:', error);
    }
  }

  // ==================== Notifications CRUD ====================

  async getAll(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        include: {
          cooperative: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      include: {
        cooperative: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return { count: result.count };
  }

  async delete(notificationId: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    return { success: true };
  }

  async clearAll(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });
    return { count: result.count };
  }

  // ==================== FCM Token Management ====================

  async registerFcmToken(userId: string, token: string, platform: 'ios' | 'android') {
    // Check if token already exists
    const existingToken = await this.prisma.fcmToken.findUnique({
      where: { token },
    });

    if (existingToken) {
      // Update existing token to new user if needed
      if (existingToken.userId !== userId) {
        await this.prisma.fcmToken.update({
          where: { token },
          data: { userId, isActive: true },
        });
      }
      return { success: true };
    }

    // Create new token
    await this.prisma.fcmToken.create({
      data: {
        userId,
        token,
        platform,
        isActive: true,
      },
    });

    return { success: true };
  }

  async unregisterFcmToken(token: string) {
    try {
      await this.prisma.fcmToken.delete({
        where: { token },
      });
    } catch (error) {
      // Token might not exist, that's okay
    }
    return { success: true };
  }

  // ==================== Preferences ====================

  async getPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: {
          userId,
          pushEnabled: true,
          contributionReminders: true,
          loanUpdates: true,
          groupBuyUpdates: true,
          memberUpdates: true,
          announcements: true,
          mentions: true,
        },
      });
    }

    return preferences;
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    // Ensure preferences exist
    await this.getPreferences(userId);

    return this.prisma.notificationPreference.update({
      where: { userId },
      data: dto,
    });
  }

  // ==================== Send Notifications ====================

  async createNotification(dto: CreateNotificationDto) {
    // Create in-app notification
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        cooperativeId: dto.cooperativeId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        data: dto.data,
        actionType: dto.actionType,
        actionRoute: dto.actionRoute,
        actionParams: dto.actionParams,
      },
      include: {
        cooperative: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Send push notification
    await this.sendPushNotification(dto.userId, dto.title, dto.body, {
      type: dto.type,
      notificationId: notification.id,
      cooperativeId: dto.cooperativeId,
      actionType: dto.actionType,
      actionRoute: dto.actionRoute,
      actionParams: dto.actionParams ? JSON.stringify(dto.actionParams) : undefined,
      ...dto.data,
    });

    return notification;
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    if (!this.firebaseInitialized) {
      console.warn('Firebase not initialized, skipping push notification');
      return;
    }

    try {
      // Check user's notification preferences
      const preferences = await this.getPreferences(userId);
      if (!preferences.pushEnabled) {
        return;
      }

      // Check specific preference based on notification type
      if (data?.type) {
        const preferenceKey = NOTIFICATION_TYPE_TO_PREFERENCE[data.type] as keyof typeof preferences;
        if (preferenceKey && !(preferences as any)[preferenceKey]) {
          return;
        }
      }

      // Get user's active FCM tokens
      const tokens = await this.prisma.fcmToken.findMany({
        where: { userId, isActive: true },
      });

      if (tokens.length === 0) {
        return;
      }

      // Build the message
      const message: admin.messaging.MulticastMessage = {
        tokens: tokens.map((t) => t.token),
        notification: {
          title,
          body,
        },
        data: data ? this.sanitizeData(data) : undefined,
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: 'default',
              badge: await this.getUnreadCount(userId).then((r) => r.count),
            },
          },
        },
      };

      // Send the notification
      const response = await admin.messaging().sendEachForMulticast(message);

      // Handle failed tokens
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            // Invalid or expired token
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered'
            ) {
              failedTokens.push(tokens[idx].token);
            }
          }
        });

        // Remove invalid tokens
        if (failedTokens.length > 0) {
          await this.prisma.fcmToken.deleteMany({
            where: { token: { in: failedTokens } },
          });
        }
      }
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  // Helper to ensure all data values are strings (FCM requirement)
  private sanitizeData(data: Record<string, any>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null) {
        sanitized[key] = typeof value === 'string' ? value : JSON.stringify(value);
      }
    }
    return sanitized;
  }

  // ==================== Bulk Notification Helpers ====================

  async notifyCooperativeMembers(
    cooperativeId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, any>,
    excludeUserIds: string[] = [],
  ) {
    // Get all active members of the cooperative
    const members = await this.prisma.member.findMany({
      where: {
        cooperativeId,
        status: 'active',
        userId: { not: null },
      },
      select: { userId: true },
    });

    const userIds = members
      .map((m) => m.userId)
      .filter((id): id is string => id !== null && !excludeUserIds.includes(id));

    // Create notifications for all members
    await Promise.all(
      userIds.map((userId) =>
        this.createNotification({
          userId,
          cooperativeId,
          type,
          title,
          body,
          data,
        }),
      ),
    );
  }

  async notifyCooperativeAdmins(
    cooperativeId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, any>,
    excludeUserIds: string[] = [],
  ) {
    // Get all admins of the cooperative
    const admins = await this.prisma.member.findMany({
      where: {
        cooperativeId,
        status: 'active',
        role: { in: ['admin', 'owner'] },
        userId: { not: null },
      },
      select: { userId: true },
    });

    const userIds = admins
      .map((m) => m.userId)
      .filter((id): id is string => id !== null && !excludeUserIds.includes(id));

    // Create notifications for all admins
    await Promise.all(
      userIds.map((userId) =>
        this.createNotification({
          userId,
          cooperativeId,
          type,
          title,
          body,
          data,
        }),
      ),
    );
  }
}
