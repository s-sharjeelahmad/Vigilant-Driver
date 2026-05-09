/**
 * App Constants - Colors, Theme, Config
 */

import Constants from 'expo-constants';

export const Colors = {
  // Brand & Accent Colors
  primary: '#2E6CF6', // Trustworthy enterprise blue
  primaryDark: '#1E4DB7',
  primaryLight: '#5B8EF7',

  // Semantic State Colors
  alert: '#10B981', // Emerald Safe
  drowsy: '#EF4444', // Rose Critical
  distracted: '#F59E0B', // Amber Warning
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Base Colors (Light Mode Default Fallbacks - Use ThemeContext for actual rendering)
  background: '#F4F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: '#E2E4E9',
  
  // Text Colors
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  divider: '#F3F4F6',

  // Gradients
  gradientStart: '#2E6CF6',
  gradientEnd: '#1E4DB7',
};

// Strict 4px Grid Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Subtle, modern radii
export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  round: 9999,
};

// Predictable Typography Hierarchy
export const FontSizes = {
  xs: 11, // Badges, fine print
  sm: 13, // Secondary text, captions
  md: 15, // Body text
  lg: 18, // Subheaders, Buttons
  xl: 24, // Screen Titles
  xxl: 32, // Metrics
  xxxl: 48, // Display Metrics (e.g. Score)
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Premium, soft, multi-layered shadows
export const Shadow = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  sessions: 'vigilant_driver_sessions',
  currentDriver: 'vigilant_driver_current_driver',
};

// API Configuration
// For local testing: use your computer's IP address (not localhost)
// Find IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
const extractHost = (hostUri?: string | null) => {
  if (!hostUri) return null;

  const cleaned = hostUri
    .replace(/^https?:\/\//, '')
    .replace(/^exp\+.*?:\/\//, '')
    .replace(/^exps?:\/\//, '');

  const hostPort = cleaned.split('/')[0] || '';
  const host = hostPort.split(':')[0];
  return host || null;
};

const resolveDevHost = () => {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.manifest2?.extra?.expoClient?.hostUri as string | undefined);

  return extractHost(hostUri);
};

const resolveApiBaseUrl = () => {
  const rawValue = process.env.EXPO_PUBLIC_API_URL?.trim();
  const isAuto = !rawValue || rawValue.toLowerCase() === 'auto';

  if (!isAuto) {
    return rawValue;
  }

  const devHost = resolveDevHost();
  if (devHost) {
    return `http://${devHost}:8000`;
  }

  return rawValue || null;
};

const apiBaseUrl = resolveApiBaseUrl();

if (!apiBaseUrl) {
  throw new Error(
    'Missing EXPO_PUBLIC_API_URL. Set it in mobile-app/.env (use "auto" for QR-based LAN).',
  );
}

export const API_BASE_URL = apiBaseUrl;
