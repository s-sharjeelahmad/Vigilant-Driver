import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { Spacing, FontSizes, FontWeights } from "@/src/utils/constants";
import ActionButton from "./ActionButton";

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message: string;
  buttonTitle?: string;
  onButtonPress?: () => void;
}

export default function EmptyState({
  icon,
  title,
  message,
  buttonTitle,
  onButtonPress,
}: EmptyStateProps) {
  const { colors, fontSize } = useTheme();

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
        <Ionicons name={icon} size={48} color={colors.textMuted} />
      </View>
      <Text
        style={[
          styles.title,
          { color: colors.text, fontSize: getFontSize(FontSizes.lg) },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.message,
          { color: colors.textSecondary, fontSize: getFontSize(FontSizes.sm) },
        ]}
      >
        {message}
      </Text>
      {buttonTitle && onButtonPress && (
        <ActionButton
          title={buttonTitle}
          icon="add"
          onPress={onButtonPress}
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl * 1.5,
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  title: {
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.xl,
    maxWidth: "80%",
    lineHeight: 20,
  },
  button: {
    minWidth: 200,
  },
});
