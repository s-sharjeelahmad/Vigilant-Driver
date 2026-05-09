/**
 * TypeScript Type Definitions for Vigilant Driver App
 */

export interface Driver {
  id: string;
  name: string;
  cnic: string;
  phone?: string;
  risk_score?: number;
}

export type DriverState = 'ALERT' | 'DROWSY' | 'DISTRACTED';

export interface SessionEvent {
  timestamp: string; // ISO timestamp
  state: DriverState;
  confidence: number; // 0.0 to 1.0
}

export interface StateBreakdown {
  ALERT: number;
  DROWSY: number;
  DISTRACTED: number;
}

export interface Session {
  id: string;
  driverId: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  duration: number; // seconds
  attentionScore: number; // 0-100
  events: SessionEvent[];
  stateBreakdown: StateBreakdown;
  percentages: StateBreakdown;
}

export interface Prediction {
  state: DriverState;
  confidence: number;
  timestamp: string;
}

export interface StateCounts {
  ALERT: number;
  DROWSY: number;
  DISTRACTED: number;
}

export interface ActiveSession {
  id: string;
  driverId: string;
  startTime: string;
  /** Aggregate frame counts — O(1) increment, no array spread */
  counts: StateCounts;
  /** Sum of all confidence scores to calculate true average on endSession */
  confidenceSum: number;
  /** Last 20 events kept for real-time display only */
  recentEvents: SessionEvent[];
}
