import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationState, NotificationPreferences } from '../../models';
import notificationApi from '../../api/notificationApi';
import { getThunkErrorMessage } from '../../utils/errorHandler';

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  fcmToken: null,
  permissionStatus: 'not_determined',
};

// Async thunks
export const fetchNotifications = createAsyncThunk(
  'notification/fetchAll',
  async ({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getAll(page, limit);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getUnreadCount();
      return response.data.count;
    } catch (error: any) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAsRead(notificationId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.markAllAsRead();
      return response.data.count;
    } catch (error: any) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notification/delete',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await notificationApi.delete(notificationId);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const clearAllNotifications = createAsyncThunk(
  'notification/clearAll',
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.clearAll();
      return true;
    } catch (error: any) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const registerFcmToken = createAsyncThunk(
  'notification/registerFcmToken',
  async ({ token, platform }: { token: string; platform: 'ios' | 'android' }, { rejectWithValue }) => {
    try {
      await notificationApi.registerFcmToken(token, platform);
      return token;
    } catch (error: any) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const unregisterFcmToken = createAsyncThunk(
  'notification/unregisterFcmToken',
  async (token: string, { rejectWithValue }) => {
    try {
      await notificationApi.unregisterFcmToken(token);
      return true;
    } catch (error: any) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const fetchNotificationPreferences = createAsyncThunk(
  'notification/fetchPreferences',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationApi.getPreferences();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

export const updateNotificationPreferences = createAsyncThunk(
  'notification/updatePreferences',
  async (preferences: Partial<NotificationPreferences>, { rejectWithValue }) => {
    try {
      const response = await notificationApi.updatePreferences(preferences);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(getThunkErrorMessage(error));
    }
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFcmToken: (state, action: PayloadAction<string | null>) => {
      state.fcmToken = action.payload;
    },
    setPermissionStatus: (state, action: PayloadAction<'granted' | 'denied' | 'not_determined'>) => {
      state.permissionStatus = action.payload;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Add new notification at the beginning
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    resetNotifications: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload.id);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = action.payload.readAt;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
          n.readAt = new Date().toISOString();
        });
        state.unreadCount = 0;
      })
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload);
        if (notification && !notification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications = state.notifications.filter((n) => n.id !== action.payload);
      })
      // Clear all notifications
      .addCase(clearAllNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      })
      // Register FCM token
      .addCase(registerFcmToken.fulfilled, (state, action) => {
        state.fcmToken = action.payload;
      });
  },
});

export const {
  clearError,
  setFcmToken,
  setPermissionStatus,
  addNotification,
  resetNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
