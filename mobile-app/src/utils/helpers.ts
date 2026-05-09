/**
 * Utility Helper Functions
 */

import { StateBreakdown } from '@/src/types';

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export const formatTime = (timeInput: number | string): string => {
  let seconds = 0;
  
  if (typeof timeInput === 'string') {
    // If it's already HH:MM:SS format from backend (e.g., "00:00:11.619253")
    if (timeInput.includes(':')) {
      const parts = timeInput.split('.')[0].split(':'); // Drop milliseconds
      if (parts.length >= 3) {
        // If hours is 00, just return MM:SS, else HH:MM:SS
        return parts[0] === '00' ? `${parts[1]}:${parts[2]}` : timeInput.split('.')[0];
      }
      return timeInput.split('.')[0];
    }
    seconds = parseFloat(timeInput);
  } else {
    seconds = timeInput;
  }
  
  if (isNaN(seconds)) return "00:00";

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
 * Normalizes backend date strings (e.g., "2026-05-02 11:25:10.285286") 
 * by replacing the space with 'T' and appending 'Z' so JS parses it as UTC.
 */
const parseUTCDate = (dateString: string): Date => {
  let isoString = dateString;
  if (isoString.includes(" ") && !isoString.includes("T")) {
    isoString = isoString.replace(" ", "T");
  }
  // If it doesn't already have timezone info, assume UTC by appending Z
  if (!isoString.endsWith("Z") && !isoString.match(/[+-]\d{2}:\d{2}$/)) {
    isoString += "Z";
  }
  return new Date(isoString);
};

/**
 * Format a UTC ISO date string to a human-readable date in Pakistan Standard Time (UTC+5).
 * Example: "2026-05-02 10:57:00" → "2 May 2026"
 */
export const formatDate = (dateString: string): string => {
  const date = parseUTCDate(dateString);
  return date.toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format a UTC ISO date string to just the clock time in PKT.
 * Example: "2026-05-02T10:57:00Z" → "3:57 PM"
 */
export const formatSessionTime = (dateString: string): string => {
  const date = parseUTCDate(dateString);
  return date.toLocaleString('en-PK', {
    timeZone: 'Asia/Karachi',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
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
  const start = parseUTCDate(startTime);
  const end = parseUTCDate(endTime);
  return Math.floor((end.getTime() - start.getTime()) / 1000);
};
