/**
 * TypeScript Type Definitions for Vigilant Driver App
 */

export interface Driver {
  id: number;
  name: string;
  cnic: string;
  phone?: string;
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
  driverId: number;
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

export interface ActiveSession {
  id: string;
  driverId: number;
  startTime: string;
  events: SessionEvent[];
}
