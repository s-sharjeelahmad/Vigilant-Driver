/**
 * Rule-Based AI Service for Driver State Detection
 * SIMPLIFIED VERSION - Mock detection for now
 * Ready for custom trained model integration later
 */

import { DriverState } from '@/src/types';

export interface Prediction {
  state: DriverState;
  confidence: number;
  timestamp: string;
  metrics?: DetectionMetrics;
}

interface DetectionMetrics {
  leftEyeOpen: number;
  rightEyeOpen: number;
  avgEyeOpen: number;
  headYaw: number;
  faceDetected: boolean;
}

export class RuleBasedAI {
  private isModelLoaded = false;
  private blinkCount: number = 0;
  private lastBlinkTime: number = Date.now();
  private sessionStartTime: number = Date.now();

  /**
   * Initialize - simplified, always returns true
   */
  async initialize(timeoutMs = 15000): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate loading
    this.isModelLoaded = true;
    return true;
  }

  /**
   * Main analysis function - returns mock predictions for now
   * You can replace this with your trained model later
   */
  async analyzeFrame(imageTensor: any): Promise<Prediction> {
    // Mock prediction - weighted toward ALERT for realistic behavior
    const rand = Math.random();
    let state: DriverState;
    let confidence: number;

    if (rand < 0.75) {
      // 75% ALERT
      state = 'ALERT';
      confidence = 0.85 + Math.random() * 0.1;
    } else if (rand < 0.90) {
      // 15% DROWSY
      state = 'DROWSY';
      confidence = 0.7 + Math.random() * 0.15;
    } else {
      // 10% DISTRACTED
      state = 'DISTRACTED';
      confidence = 0.7 + Math.random() * 0.15;
    }

    return {
      state,
      confidence,
      timestamp: new Date().toISOString(),
      metrics: {
        leftEyeOpen: 80 + Math.floor(Math.random() * 20),
        rightEyeOpen: 80 + Math.floor(Math.random() * 20),
        avgEyeOpen: 80 + Math.floor(Math.random() * 20),
        headYaw: Math.floor(Math.random() * 30) - 15,
        faceDetected: true,
      },
    };
  }

  /**
   * Get current detection statistics
   */
  getStats() {
    const now = Date.now();

    return {
      modelLoaded: this.isModelLoaded,
      blinkCount: this.blinkCount,
      avgEyeOpen: 85,
      avgHeadYaw: 10,
      consecutiveDrowsy: 0,
      consecutiveDistracted: 0,
      historySize: 10,
      timeSinceLastBlink: Number(((now - this.lastBlinkTime) / 1000).toFixed(1)),
    };
  }

  /**
   * Reset all state (call when session ends)
   */
  reset() {
    this.lastBlinkTime = Date.now();
    this.blinkCount = 0;
    this.sessionStartTime = Date.now();
  }
}

// Singleton instance
export const ruleBasedAI = new RuleBasedAI();
