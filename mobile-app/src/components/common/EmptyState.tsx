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
      <Ionicons name={icon} size={80} color={colors.textLight} />
      <Text
        style={[
          styles.title,
          { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.message,
          { color: colors.textSecondary, fontSize: getFontSize(FontSizes.md) },
        ]}
      >
        {message}
      </Text>
      {buttonTitle && onButtonPress && (
        <ActionButton
          title={buttonTitle}
          icon="add-circle"
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
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontWeight: FontWeights.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  button: {
    minWidth: 200,
  },
});
