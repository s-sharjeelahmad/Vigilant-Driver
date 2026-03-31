import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import {
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
  Shadow,
} from "@/src/utils/constants";

interface ActionButtonProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: ViewStyle;
}

export default function ActionButton({
  title,
  icon,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: ActionButtonProps) {
  const { colors, fontSize } = useTheme();

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  const getColors = (): [string, string] => {
    if (disabled) return ["#BDBDBD", "#9E9E9E"];

    switch (variant) {
      case "danger":
        return [colors.error, colors.error];
      case "secondary":
        return [colors.card, colors.card];
      case "primary":
      default:
        return [colors.primary, colors.primary];
    }
  };

  const textColor = variant === "secondary" ? colors.text : "#FFF";

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <LinearGradient colors={getColors()} style={styles.gradient}>
        {icon && <Ionicons name={icon} size={24} color={textColor} />}
        <Text
          style={[
            styles.text,
            { color: textColor, fontSize: getFontSize(FontSizes.md) },
          ]}
        >
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    ...Shadow.medium,
  },
  disabled: {
    opacity: 0.6,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  text: {
    fontWeight: FontWeights.bold,
  },
});
