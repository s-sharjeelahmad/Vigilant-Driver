import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '@/src/utils/constants';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // 8 s is aggressive enough for Pakistani 4G/3G and fast enough to not freeze the UI
  timeout: 8000,
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

      if (status === 401) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        console.warn('[API] 401 Unauthorized — token cleared');
      } else if (status >= 500) {
        // Server-side errors are always unexpected
        console.error('[API] Server error:', { url: error.config?.url, status, data });
      } else {
        // 4xx are client/validation errors — service layer handles them; log as warn only
        console.warn('[API] Client error:', { url: error.config?.url, status, data });
      }
    } else if (error.code === 'ECONNABORTED') {
      // Timeout — very common in Pakistan with load-shedding and 3G fallback
      console.warn('[API] Request timed out:', error.config?.url);
    } else if (error.request) {
      console.warn('[API] No response (offline?):', error.message);
    } else {
      console.error('[API] Request setup error:', error.message);
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
