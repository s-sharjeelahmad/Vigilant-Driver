import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/context/ThemeContext";
import { Spacing, FontSizes, FontWeights } from "@/src/utils/constants";

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export default function GradientHeader({
  title,
  subtitle,
  rightElement,
  children,
  style,
}: GradientHeaderProps) {
  const { colors, fontSize } = useTheme();

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  return (
    <LinearGradient
      colors={['#1E4DB7', '#2E6CF6']} // Fixed to brand gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.header, style]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text
            style={[styles.title, { fontSize: getFontSize(FontSizes.xl) }]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.subtitle, { fontSize: getFontSize(FontSizes.sm) }]}
            >
              {subtitle}
            </Text>
          )}
        </View>
        {rightElement}
        {children}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: FontWeights.bold,
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.85)",
  },
});
