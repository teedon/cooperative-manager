import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import logger from '../utils/logger';

// For Android emulator, localhost on the host machine is accessible at 10.0.2.2
const getApiBaseUrl = () => {
  const envUrl = process.env.API_BASE_URL || 'http://localhost:3001/api';

  if (Platform.OS === 'android' && envUrl.includes('localhost')) {
    return envUrl.replace('localhost', '10.0.2.2');
  }

  return envUrl;
};

const API_BASE_URL = getApiBaseUrl();

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      logger.error('Error getting auth token:', error);
    }
    logger.debug('api request', { url: config.url, method: config.method, data: config.data });
    return config;
  },
  (error: AxiosError) => {
    logger.error('api request error', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and refresh token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    logger.error('api response error', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });

    // If 401 and not already retrying, attempt to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        await clearAuthData();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise<AxiosResponse>((resolve, reject) => {
          failedQueue.push({
            resolve: async (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject: (err: Error) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('auth_refresh');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call refresh endpoint directly to avoid interceptor loop
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        if (response.data.success) {
          const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
          
          // Save new tokens
          await AsyncStorage.setItem('auth_token', newToken);
          if (newRefreshToken) {
            await AsyncStorage.setItem('auth_refresh', newRefreshToken);
          }

          // Update authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          processQueue(null, newToken);
          
          // Retry original request with new token
          return apiClient(originalRequest);
        } else {
          throw new Error('Token refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        await clearAuthData();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Helper to clear auth data
const clearAuthData = async () => {
  await AsyncStorage.removeItem('auth_token');
  await AsyncStorage.removeItem('auth_user');
  await AsyncStorage.removeItem('auth_refresh');
};

export default apiClient;
