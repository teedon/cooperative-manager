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

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    logger.error('api response error', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
    });
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      await AsyncStorage.removeItem('auth_token');
      // Could dispatch a logout action here if needed
    }

    return Promise.reject(error);
  }
);

export default apiClient;
