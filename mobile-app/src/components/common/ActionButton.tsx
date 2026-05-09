import React from "react";
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import {
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
} from "@/src/utils/constants";

interface ActionButtonProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline";
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

  const getBackgroundColor = () => {
    if (disabled) return colors.cardBorder;
    switch (variant) {
      case "danger":
        return colors.error;
      case "secondary":
        return colors.surfaceElevated;
      case "outline":
        return "transparent";
      case "primary":
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textMuted;
    if (variant === "secondary" || variant === "outline") return colors.text;
    return "#FFFFFF";
  };

  const getBorderColor = () => {
    if (disabled) return colors.cardBorder;
    if (variant === "outline" || variant === "secondary") return colors.cardBorder;
    return "transparent";
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === "outline" || variant === "secondary" ? 1 : 0,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.85}
    >
      <View style={styles.content}>
        {icon && <Ionicons name={icon} size={20} color={getTextColor()} />}
        <Text
          style={[
            styles.text,
            { color: getTextColor(), fontSize: getFontSize(FontSizes.md) },
          ]}
        >
          {title}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    minHeight: 48,
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  text: {
    fontWeight: FontWeights.semibold,
  },
});
