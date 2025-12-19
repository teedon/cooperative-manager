import { Platform, PermissionsAndroid } from 'react-native';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Store } from '@reduxjs/toolkit';
import {
  setFcmToken,
  setPermissionStatus,
  addNotification,
  registerFcmToken,
  fetchUnreadCount,
} from '../store/slices/notificationSlice';
import { Notification, NotificationType } from '../models';
import logger from '../utils/logger';

const FCM_TOKEN_KEY = '@fcm_token';

let storeRef: Store | null = null;

/**
 * Initialize notification service with store reference
 * Call this from App.tsx on startup
 */
export async function initializeNotifications(store: Store): Promise<void> {
  storeRef = store;
  
  // Set up background message handler early
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    logger.info('Background message received', remoteMessage);
    // Background messages are typically handled by the system notification tray
    // The app will receive the notification when opened via onNotificationOpenedApp
  });
}

class NotificationService {
  private unsubscribeForeground: (() => void) | null = null;
  private unsubscribeTokenRefresh: (() => void) | null = null;

  /**
   * Initialize the notification service
   * Call this when the app starts and user is authenticated
   */
  async initialize(): Promise<void> {
    try {
      if (!storeRef) {
        logger.error('Store not initialized. Call initializeNotifications first.');
        return;
      }
      
      // Request permission
      const permissionGranted = await this.requestPermission();
      
      if (permissionGranted) {
        // Get and register FCM token
        await this.getFcmToken();
        
        // Set up message listeners
        this.setupMessageListeners();
        
        // Fetch initial unread count
        storeRef.dispatch(fetchUnreadCount() as any);
      }
    } catch (error) {
      logger.error('Failed to initialize notification service', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        // Android 13+ requires explicit permission
        if (Platform.Version >= 33) {
          const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          const granted = result === PermissionsAndroid.RESULTS.GRANTED;
          storeRef?.dispatch(setPermissionStatus(granted ? 'granted' : 'denied'));
          return granted;
        }
        // Android 12 and below don't need explicit permission
        storeRef?.dispatch(setPermissionStatus('granted'));
        return true;
      }

      // iOS
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      storeRef?.dispatch(setPermissionStatus(enabled ? 'granted' : 'denied'));
      return enabled;
    } catch (error) {
      logger.error('Failed to request notification permission', error);
      storeRef?.dispatch(setPermissionStatus('denied'));
      return false;
    }
  }

  /**
   * Get the FCM token and register it with the server
   */
  async getFcmToken(): Promise<string | null> {
    try {
      // Check if we have a stored token
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      
      // Get current token from Firebase
      const currentToken = await messaging().getToken();
      
      if (currentToken) {
        // If token changed or first time, register with server
        if (storedToken !== currentToken) {
          await this.registerToken(currentToken);
          await AsyncStorage.setItem(FCM_TOKEN_KEY, currentToken);
        }
        
        storeRef?.dispatch(setFcmToken(currentToken));
        return currentToken;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to get FCM token', error);
      return null;
    }
  }

  /**
   * Register the FCM token with the backend server
   */
  private async registerToken(token: string): Promise<void> {
    try {
      const platform = Platform.OS as 'ios' | 'android';
      await storeRef?.dispatch(registerFcmToken({ token, platform }) as any)?.unwrap?.();
      logger.info('FCM token registered successfully');
    } catch (error) {
      logger.error('Failed to register FCM token with server', error);
    }
  }

  /**
   * Set up message listeners for foreground and background
   */
  private setupMessageListeners(): void {
    // Handle foreground messages
    this.unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      logger.info('Foreground message received', remoteMessage);
      this.handleMessage(remoteMessage);
    });

    // Handle token refresh
    this.unsubscribeTokenRefresh = messaging().onTokenRefresh(async (token) => {
      logger.info('FCM token refreshed');
      await this.registerToken(token);
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      storeRef?.dispatch(setFcmToken(token));
    });

    // Handle notification opened app (from background state)
    messaging().onNotificationOpenedApp((remoteMessage) => {
      logger.info('Notification opened app from background', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // Check if app was opened from notification (from quit state)
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          logger.info('App opened from notification (quit state)', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });
  }

  /**
   * Handle incoming message (convert to in-app notification)
   */
  private handleMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const { notification, data } = remoteMessage;
    
    if (notification) {
      const authState = storeRef?.getState()?.auth;
      const inAppNotification: Notification = {
        id: remoteMessage.messageId || Date.now().toString(),
        userId: authState?.user?.id || '',
        type: (data?.type as NotificationType) || 'system',
        title: notification.title || 'Notification',
        body: notification.body || '',
        data: data as Record<string, any>,
        isRead: false,
        cooperativeId: data?.cooperativeId as string,
        actionType: data?.actionType as Notification['actionType'],
        actionRoute: data?.actionRoute as string,
        actionParams: data?.actionParams ? JSON.parse(data.actionParams as string) : undefined,
        createdAt: new Date().toISOString(),
      };


      storeRef?.dispatch(addNotification(inAppNotification));
      
      // Show local notification for foreground (optional - depends on UX preference)
      // this.showLocalNotification(inAppNotification);
    }
  }

  /**
   * Handle notification opened (navigate to relevant screen)
   */
  private handleNotificationOpen(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const { data } = remoteMessage;
    
    if (data?.actionRoute) {
      // Navigation will be handled by the app based on the route
      // This can be enhanced to use a navigation service
      logger.info('Should navigate to:', data.actionRoute, data.actionParams);
    }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.unsubscribeForeground) {
      this.unsubscribeForeground();
      this.unsubscribeForeground = null;
    }
    if (this.unsubscribeTokenRefresh) {
      this.unsubscribeTokenRefresh();
      this.unsubscribeTokenRefresh = null;
    }
  }

  /**
   * Unregister from push notifications (e.g., on logout)
   */
  async unregister(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (token) {
        // Optionally notify server to remove the token
        // await notificationApi.unregisterFcmToken(token);
        await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      }
      
      this.cleanup();
      storeRef?.dispatch(setFcmToken(null));
    } catch (error) {
      logger.error('Failed to unregister from notifications', error);
    }
  }

  /**
   * Check if notifications are enabled
   */
  async checkPermissionStatus(): Promise<'granted' | 'denied' | 'not_determined'> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const result = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return result ? 'granted' : 'denied';
        }
        return 'granted';
      }

      const authStatus = await messaging().hasPermission();
      if (authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL) {
        return 'granted';
      } else if (authStatus === messaging.AuthorizationStatus.DENIED) {
        return 'denied';
      }
      return 'not_determined';
    } catch (error) {
      logger.error('Failed to check permission status', error);
      return 'not_determined';
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
