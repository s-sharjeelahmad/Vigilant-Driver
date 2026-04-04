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

export interface SessionEndResponse {
  detail: string;
  session?: SessionCreateResponse;
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
        const detail: string = error.response.data?.detail || '';

        // Recover from a previously stuck active session and continue monitoring.
        const match = detail.match(/already has an active session \(session_id: ([a-f0-9-]+)\)/i);
        if (match?.[1]) {
          console.warn('[Session] Recovering stuck active session:', match[1]);

          try {
            const sessionsResponse = await apiClient.get<SessionCreateResponse[]>('/driver/sessions');
            const activeSession = sessionsResponse.data.find(
              (session) => session.session_status === 'active',
            );

            if (activeSession) {
              return activeSession;
            }
          } catch (sessionsError) {
            console.warn('[Session] Failed to fetch active sessions, using fallback payload.', sessionsError);
          }

          return {
            session_id: match[1],
            driver_id: '',
            cnic: '',
            session_status: 'active',
            start_time: new Date().toISOString(),
            total_frames_processed: 0,
            alert_frames: 0,
            drowsy_frames: 0,
            distracted_frames: 0,
            average_confidence: 0,
            attention_score: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }

        throw new Error(detail || 'You already have an active session.');
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
  ): Promise<SessionCreateResponse | null> {
    try {
      const payload: SessionEndRequest = {
        session_status: sessionStatus,
        termination_reason: terminationReason,
      };
      const response = await apiClient.put<SessionEndResponse | SessionCreateResponse>('/driver/endsession', payload);
      const responseData: any = response.data;

      if (responseData?.session) {
        return responseData.session as SessionCreateResponse;
      }

      if (responseData?.detail) {
        console.warn('[Session] endSession response:', responseData.detail);
        return null;
      }

      return responseData as SessionCreateResponse;
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
