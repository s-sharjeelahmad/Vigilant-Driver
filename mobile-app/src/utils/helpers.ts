/**
 * Utility Helper Functions
 */

import { StateBreakdown } from '@/src/types';

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Calculate attention score based on state breakdown
 * ALERT: 100 points, DROWSY: 50 points, DISTRACTED: 30 points
 */
export const calculateAttentionScore = (states: StateBreakdown): number => {
  const total = states.ALERT + states.DROWSY + states.DISTRACTED;
  if (total === 0) return 100;

  const score =
    (states.ALERT * 100 + states.DROWSY * 50 + states.DISTRACTED * 30) / total;

  return Math.round(score);
};

/**
 * Calculate state percentages
 */
export const calculateStatePercentages = (
  states: StateBreakdown
): StateBreakdown => {
  const total = states.ALERT + states.DROWSY + states.DISTRACTED;
  if (total === 0) {
    return { ALERT: 100, DROWSY: 0, DISTRACTED: 0 };
  }

  return {
    ALERT: Math.round((states.ALERT / total) * 100),
    DROWSY: Math.round((states.DROWSY / total) * 100),
    DISTRACTED: Math.round((states.DISTRACTED / total) * 100),
  };
};

/**
 * Get color for driver state
 */
export const getStateColor = (state: string): string => {
  switch (state) {
    case 'ALERT':
      return '#4CAF50'; // Green
    case 'DROWSY':
      return '#F44336'; // Red
    case 'DISTRACTED':
      return '#FF9800'; // Orange
    default:
      return '#9E9E9E'; // Gray
  }
};

/**
 * Get color based on attention score
 */
export const getScoreColor = (score: number): string => {
  if (score >= 80) return '#4CAF50'; // Green
  if (score >= 60) return '#FF9800'; // Orange
  return '#F44336'; // Red
};

/**
 * Get emoji for driver state
 */
export const getStateEmoji = (state: string): string => {
  switch (state) {
    case 'ALERT':
      return '✓';
    case 'DROWSY':
      return '😴';
    case 'DISTRACTED':
      return '👀';
    default:
      return '•';
  }
};

/**
 * Calculate session duration from start and end time
 */
export const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  return Math.floor((end.getTime() - start.getTime()) / 1000);
};
