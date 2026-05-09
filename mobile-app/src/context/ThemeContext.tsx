import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark";
export type AccentColor = "blue" | "green" | "purple" | "orange" | "red";

interface ThemeContextType {
  // Theme
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;

  // Accent Color
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;

  // Font Size
  fontSize: "small" | "medium" | "large";
  setFontSize: (size: "small" | "medium" | "large") => void;

  // Colors based on theme
  colors: {
    primary: string;
    primaryDark?: string;
    background: string;
    card: string;
    surfaceElevated: string;
    cardBorder: string;
    text: string;
    textSecondary: string;
    textLight: string;
    textMuted: string;
    border: string;
    divider: string;
    error: string;
    success: string;
    warning: string;
    info: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEYS = {
  THEME: "@theme_mode",
  ACCENT: "@accent_color",
  FONT_SIZE: "@font_size",
};

// Accent color palettes
const ACCENT_COLORS = {
  blue: "#2196F3",
  green: "#4CAF50",
  purple: "#9C27B0",
  orange: "#FF9800",
  red: "#F44336",
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [accentColor, setAccentColorState] = useState<AccentColor>("blue");
  const [fontSize, setFontSizeState] = useState<"small" | "medium" | "large">(
    "medium"
  );

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      const savedAccent = await AsyncStorage.getItem(STORAGE_KEYS.ACCENT);
      const savedFontSize = await AsyncStorage.getItem(STORAGE_KEYS.FONT_SIZE);

      if (savedTheme) setThemeState(savedTheme as ThemeMode);
      if (savedAccent) setAccentColorState(savedAccent as AccentColor);
      if (savedFontSize)
        setFontSizeState(savedFontSize as "small" | "medium" | "large");
    } catch (error) {
      console.error("Error loading theme preferences:", error);
    }
  };

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  };

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    await setTheme(newTheme);
  };

  const setAccentColor = async (color: AccentColor) => {
    setAccentColorState(color);
    await AsyncStorage.setItem(STORAGE_KEYS.ACCENT, color);
  };

  const setFontSize = async (size: "small" | "medium" | "large") => {
    setFontSizeState(size);
    await AsyncStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);
  };

  // Generate colors based on theme
  const colors = {
    primary: ACCENT_COLORS[accentColor],
    primaryDark: ACCENT_COLORS[accentColor], // Fallback if derived is needed
    background: theme === "light" ? "#F4F5F7" : "#090A0F",
    card: theme === "light" ? "#FFFFFF" : "#161922",
    surfaceElevated: theme === "light" ? "#FFFFFF" : "#1C1F2B",
    cardBorder: theme === "light" ? "#E2E4E9" : "#232736",
    text: theme === "light" ? "#111827" : "#FFFFFF",
    textSecondary: theme === "light" ? "#6B7280" : "#A1A7B8",
    textLight: theme === "light" ? "#9CA3AF" : "#6B7280",
    textMuted: theme === "light" ? "#D1D5DB" : "#4B5563",
    border: theme === "light" ? "#E5E7EB" : "#2A2E3D",
    divider: theme === "light" ? "#F3F4F6" : "#2A2E3D",
    error: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    setTheme,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
    colors,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
