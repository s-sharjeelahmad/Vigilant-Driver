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
    background: string;
    card: string;
    text: string;
    textSecondary: string;
    textLight: string;
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
    background: theme === "light" ? "#F5F5F5" : "#121212",
    card: theme === "light" ? "#FFFFFF" : "#1E1E1E",
    text: theme === "light" ? "#212121" : "#FFFFFF",
    textSecondary: theme === "light" ? "#757575" : "#B0B0B0",
    textLight: theme === "light" ? "#9E9E9E" : "#808080",
    border: theme === "light" ? "#E0E0E0" : "#2C2C2C",
    divider: theme === "light" ? "#E0E0E0" : "#2C2C2C",
    error: "#F44336",
    success: "#4CAF50",
    warning: "#FF9800",
    info: "#2196F3",
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
