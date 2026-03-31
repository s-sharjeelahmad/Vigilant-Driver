import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import {
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
  Shadow,
} from "@/src/utils/constants";
import { Session } from "@/src/types";
import { formatDate, formatTime, getScoreColor } from "@/src/utils/helpers";

interface SessionCardProps {
  session: Session;
  onPress: () => void;
  onDelete: () => void;
}

export default function SessionCard({
  session,
  onPress,
  onDelete,
}: SessionCardProps) {
  const { colors, fontSize } = useTheme();

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  const date = formatDate(session.startTime);
  const duration = formatTime(session.duration);
  const scoreColor = getScoreColor(session.attentionScore);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Delete Button */}
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: `${colors.error}15` }]}
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text
            style={[
              styles.dateText,
              { color: colors.text, fontSize: getFontSize(FontSizes.md) },
            ]}
          >
            {date}
          </Text>
        </View>
        <View
          style={[styles.scoreBadge, { backgroundColor: `${scoreColor}20` }]}
        >
          <Text
            style={[
              styles.scoreText,
              { color: scoreColor, fontSize: getFontSize(FontSizes.md) },
            ]}
          >
            {session.attentionScore}%
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={[styles.stats, { borderColor: colors.divider }]}>
        <View style={styles.statItem}>
          <Ionicons name="time" size={18} color={colors.textSecondary} />
          <Text
            style={[
              styles.statText,
              {
                color: colors.textSecondary,
                fontSize: getFontSize(FontSizes.sm),
              },
            ]}
          >
            {duration}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text
            style={[
              styles.statText,
              {
                color: colors.textSecondary,
                fontSize: getFontSize(FontSizes.sm),
              },
            ]}
          >
            {session.stateBreakdown.ALERT} Alert
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <View style={styles.statItem}>
          <Ionicons name="warning" size={18} color={colors.error} />
          <Text
            style={[
              styles.statText,
              {
                color: colors.textSecondary,
                fontSize: getFontSize(FontSizes.sm),
              },
            ]}
          >
            {session.stateBreakdown.DROWSY + session.stateBreakdown.DISTRACTED}{" "}
            Issues
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text
          style={[
            styles.footerText,
            { color: colors.textLight, fontSize: getFontSize(FontSizes.xs) },
          ]}
        >
          Tap to view details
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.medium,
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 10,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dateText: {
    fontWeight: FontWeights.semibold,
  },
  scoreBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  scoreText: {
    fontWeight: FontWeights.bold,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  divider: {
    width: 1,
    height: 20,
  },
  statText: {},
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  footerText: {},
});
