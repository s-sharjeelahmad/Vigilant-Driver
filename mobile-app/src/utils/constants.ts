/**
 * App Constants - Colors, Theme, Config
 */

export const Colors = {
  // Primary Brand Colors
  primary: '#4CAF50', // Green - Alert/Safe
  primaryDark: '#2E7D32',
  primaryLight: '#81C784',

  // State Colors
  alert: '#4CAF50', // Green
  drowsy: '#F44336', // Red
  distracted: '#FF9800', // Orange

  // UI Colors
  background: '#F5F5F5',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#BDBDBD',
  border: '#E0E0E0',
  divider: '#EEEEEE',

  // Status Colors
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',

  // Gradients
  gradientStart: '#4CAF50',
  gradientEnd: '#2E7D32',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

// Mock Drivers for Demo
export const MOCK_DRIVERS = [
  { id: 1, name: 'Syed Sharjeel Ahmad', cnic: '12345-1234567-1', phone: '0314-2020202' },
  { id: 2, name: 'Abrar', cnic: '98765-9876543-2', phone: '0321-9876543' },
  { id: 3, name: 'Areeb', cnic: '54321-5432109-3', phone: '0333-5432109' },
];

// AI Prediction Settings
export const AI_CONFIG = {
  predictionInterval: 4000, // 4 seconds
  alertDistribution: {
    ALERT: 0.7, // 70%
    DROWSY: 0.2, // 20%
    DISTRACTED: 0.1, // 10%
  },
};

// Storage Keys
export const STORAGE_KEYS = {
  sessions: 'vigilant_driver_sessions',
  currentDriver: 'vigilant_driver_current_driver',
};

// API Configuration
// Change this to your backend URL
// For local testing: use your computer's IP address (not localhost)
// Find IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error('Missing EXPO_PUBLIC_API_URL. Set it in mobile-app/.env before starting the app.');
}

export const API_BASE_URL = apiBaseUrl;
