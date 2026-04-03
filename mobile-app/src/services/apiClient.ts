import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/src/utils/constants';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const TOKEN_KEY = 'auth_token';

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;
      
      // Token expired or invalid
      if (status === 401) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        // You can add navigation to login here if needed
        console.warn('Authentication failed - token may be expired');
      }
      
      // Log error details for debugging
      console.error('API Error:', {
        url: error.config?.url,
        status,
        data,
      });
    } else if (error.request) {
      console.error('Network Error: No response received', error.message);
    } else {
      console.error('Request Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Token management functions
export const tokenManager = {
  async saveToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  
  async getToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  },
  
  async deleteToken(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  },
  
  async hasValidToken(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    return !!token;
  },
};

export type DriverState = 'ALERT' | 'DROWSY' | 'DISTRACTED';

export interface DriverEventPayload {
  session_id: string;
  state: DriverState;
  confidence: number;
  features: Record<string, unknown>;
}

export interface SessionMetricsPayload {
  session_id: string;
  total_frames_processed_increment?: number;
  alert_frames_increment?: number;
  drowsy_frames_increment?: number;
  distracted_frames_increment?: number;
  average_confidence?: number;
  attention_score?: number;
}

export const sendDriverEvent = async (payload: DriverEventPayload) => {
  const response = await apiClient.post('/driver/events', payload);
  return response.data;
};

export const updateSessionMetrics = async (payload: SessionMetricsPayload) => {
  const response = await apiClient.patch('/driver/sessions/metrics', payload);
  return response.data;
};

export default apiClient;
