import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import {
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
  Shadow,
} from "@/src/utils/constants";

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  iconColor?: string;
  style?: ViewStyle;
}

export default function StatCard({
  icon,
  value,
  label,
  iconColor,
  style,
}: StatCardProps) {
  const { colors, fontSize } = useTheme();

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, style]}>
      <Ionicons name={icon} size={32} color={iconColor || colors.primary} />
      <Text
        style={[
          styles.value,
          { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          { color: colors.textSecondary, fontSize: getFontSize(FontSizes.xs) },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: "47%",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadow.small,
  },
  value: {
    fontWeight: FontWeights.bold,
    marginTop: Spacing.sm,
  },
  label: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
});
