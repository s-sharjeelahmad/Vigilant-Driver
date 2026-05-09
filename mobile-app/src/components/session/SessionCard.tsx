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
import { formatDate, formatTime, formatSessionTime, calculateDuration, getScoreColor } from "@/src/utils/helpers";

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
  const clockTime = formatSessionTime(session.startTime);
  const realDurationSeconds = calculateDuration(session.startTime, session.endTime);
  const duration = formatTime(realDurationSeconds);
  const scoreColor = getScoreColor(session.attentionScore);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Delete Button */}
      <TouchableOpacity
        style={[styles.deleteButton, { backgroundColor: `${colors.error}15` }]}
        onPress={onDelete}
        activeOpacity={0.7}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={18} color={colors.textLight} />
          <Text
            style={[
              styles.dateText,
              { color: colors.text, fontSize: getFontSize(FontSizes.sm) },
            ]}
          >
            {date} • {clockTime}
          </Text>
        </View>
        <View
          style={[styles.scoreBadge, { backgroundColor: `${scoreColor}15` }]}
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
          <Ionicons name="timer-outline" size={16} color={colors.textSecondary} />
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
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
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
          <Ionicons name="warning-outline" size={16} color={colors.error} />
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
            { color: colors.textMuted, fontSize: getFontSize(FontSizes.xs) },
          ]}
        >
          View Telemetry
        </Text>
        <Ionicons
          name="arrow-forward"
          size={16}
          color={colors.textMuted}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadow.small,
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
    paddingRight: Spacing.xl, // Space for delete button
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  dateText: {
    fontWeight: FontWeights.medium,
  },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  scoreText: {
    fontWeight: FontWeights.bold,
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
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
    height: 16,
  },
  statText: {
    fontWeight: FontWeights.medium,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  footerText: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: FontWeights.semibold,
  },
});
