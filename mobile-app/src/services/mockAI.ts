/**
 * Mock AI Service - Simulates driver state predictions
 * This will be replaced with real AI model in production
 */
import { DriverState, Prediction } from "@/src/types";

/**
 * Simulates AI prediction with realistic distribution
 * Distribution: 70% ALERT, 20% DROWSY, 10% DISTRACTED
 */
export const predictDriverState = (): Prediction => {
  const random = Math.random();
  let state: DriverState;
  let confidence: number;

  // Determine state based on probability distribution
  if (random < 0.7) {
    // 70% ALERT
    state = "ALERT";
    confidence = 0.85 + Math.random() * 0.15; // 0.85-1.0
  } else if (random < 0.9) {
    // 20% DROWSY
    state = "DROWSY";
    confidence = 0.75 + Math.random() * 0.2; // 0.75-0.95
  } else {
    // 10% DISTRACTED
    state = "DISTRACTED";
    confidence = 0.7 + Math.random() * 0.25; // 0.7-0.95
  }

  const prediction = {
    state,
    confidence: Number(confidence.toFixed(2)),
    timestamp: new Date().toISOString(),
  };

  console.log(`🤖 MockAI Prediction: ${state} (${Math.round(confidence * 100)}%)`);
  
  return prediction;
};

/**
 * Simulates continuous monitoring with periodic predictions
 * Calls the callback function every interval with a new prediction
 */
export const startContinuousMonitoring = (
  callback: (prediction: Prediction) => void,
  intervalMs: number = 4000
): ReturnType<typeof setInterval> => {
  console.log(`🤖 MockAI: Starting continuous monitoring (${intervalMs}ms intervals)`);
  
  // Make initial prediction
  const initialPrediction = predictDriverState();
  console.log("🤖 MockAI: Sending initial prediction");
  callback(initialPrediction);

  // Start interval for continuous predictions
  const interval = setInterval(() => {
    console.log("🤖 MockAI: Interval fired, generating prediction...");
    callback(predictDriverState());
  }, intervalMs);

  console.log("🤖 MockAI: Continuous monitoring started successfully");
  return interval;
};

/**
 * Stops continuous monitoring
 */
export const stopContinuousMonitoring = (
  interval: ReturnType<typeof setInterval>
): void => {
  console.log("🤖 MockAI: Stopping continuous monitoring");
  clearInterval(interval);
};
