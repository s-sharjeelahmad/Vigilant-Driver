import apiClient from './apiClient';

// Thrown when the backend returns 401 – token expired or invalid
export class AuthError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthError';
  }
}

export interface SessionCreateResponse {
  session_id: string;
  driver_id: string;
  cnic: string;
  session_status: string;
  start_time: string;
  end_time?: string;
  total_frames_processed: number;
  alert_frames: number;
  drowsy_frames: number;
  distracted_frames: number;
  average_confidence: number;
  attention_score: number;
  termination_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface SessionEndRequest {
  session_status: 'completed' | 'interrupted' | 'error';
  termination_reason?: string;
}

class SessionService {
  /**
   * Start a new monitoring session
   * Throws AuthError on 401 (token expired / invalid)
   */
  async startSession(): Promise<SessionCreateResponse> {
    try {
      const response = await apiClient.post<SessionCreateResponse>('/driver/newsession', {
        start_time: new Date().toISOString(),
        session_status: 'active',
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new AuthError('Session expired. Please log in again.');
      }
      if (error.response?.status === 400) {
        throw new Error(error.response.data?.detail || 'You already have an active session');
      }
      throw new Error('Failed to start session. Check your connection.');
    }
  }

  /**
   * End the active monitoring session
   */
  async endSession(
    sessionStatus: 'completed' | 'interrupted' | 'error' = 'completed',
    terminationReason?: string
  ): Promise<SessionCreateResponse> {
    try {
      const payload: SessionEndRequest = {
        session_status: sessionStatus,
        termination_reason: terminationReason,
      };
      const response = await apiClient.put<SessionCreateResponse>('/driver/endsession', payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new AuthError('Session expired. Please log in again.');
      }
      if (error.response?.status === 404) {
        throw new Error('No active session found');
      }
      throw new Error('Failed to end session');
    }
  }

  /**
   * Sync local session data with backend
   * This will be called periodically to update frame counts and metrics
   */
  async syncSessionStats(stats: {
    alertCount: number;
    drowsyCount: number;
    distractedCount: number;
  }): Promise<void> {
    // Note: Backend doesn't have an update endpoint yet
    // This is a placeholder for future implementation
    // For now, all stats are sent when ending the session
    console.log('Session stats will be synced on session end:', stats);
  }
}

export const sessionService = new SessionService();
