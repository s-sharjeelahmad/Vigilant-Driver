import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
  Shadow,
} from "@/src/utils/constants";
import { useSession } from "@/src/context/SessionContext";
import { useTheme } from "@/src/context/ThemeContext";
import { formatDate, formatTime, getScoreColor } from "@/src/utils/helpers";
import { Session } from "@/src/types";

export default function HistoryScreen() {
  const { sessionHistory, currentDriver, deleteSession } = useSession();
  const { colors, fontSize } = useTheme();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(
    new Set()
  );

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  const toggleSelection = (sessionId: string) => {
    const newSelection = new Set(selectedSessions);
    if (newSelection.has(sessionId)) {
      newSelection.delete(sessionId);
    } else {
      newSelection.add(sessionId);
    }
    setSelectedSessions(newSelection);

    // Exit selection mode if no items selected
    if (newSelection.size === 0) {
      setSelectionMode(false);
    }
  };

  const handleLongPress = (sessionId: string) => {
    setSelectionMode(true);
    setSelectedSessions(new Set([sessionId]));
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedSessions(new Set());
  };

  const handleDeleteSelected = () => {
    const count = selectedSessions.size;
    Alert.alert(
      "Delete Sessions",
      `Are you sure you want to delete ${count} session${
        count > 1 ? "s" : ""
      }? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            for (const sessionId of selectedSessions) {
              await deleteSession(sessionId);
            }
            setSelectionMode(false);
            setSelectedSessions(new Set());
            Alert.alert(
              "Success",
              `${count} session${count > 1 ? "s" : ""} deleted successfully!`
            );
          },
        },
      ]
    );
  };

  const renderSessionCard = ({ item }: { item: Session }) => {
    const scoreColor = getScoreColor(item.attentionScore);
    const date = formatDate(item.startTime);
    const duration = formatTime(item.duration);
    const isSelected = selectedSessions.has(item.id);

    const handleCardPress = () => {
      if (selectionMode) {
        toggleSelection(item.id);
      } else {
        // TODO: Create session-summary screen
        Alert.alert(
          "Session Details",
          `Date: ${date}\nDuration: ${duration}\nScore: ${item.attentionScore}%\n\nAlert: ${item.stateBreakdown.ALERT}\nDrowsy: ${item.stateBreakdown.DROWSY}\nDistracted: ${item.stateBreakdown.DISTRACTED}`
        );
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.sessionCard,
          { backgroundColor: colors.card },
          isSelected && {
            backgroundColor: `${colors.primary}20`,
            borderColor: colors.primary,
            borderWidth: 2,
          },
        ]}
        onPress={handleCardPress}
        onLongPress={() => handleLongPress(item.id)}
        activeOpacity={0.7}
      >
        {/* Selection Indicator */}
        {selectionMode && (
          <View
            style={[
              styles.selectionIndicator,
              {
                backgroundColor: isSelected ? colors.primary : colors.border,
                borderColor: colors.border,
              },
            ]}
          >
            {isSelected && <Ionicons name="checkmark" size={18} color="#FFF" />}
          </View>
        )}

        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
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
              {item.attentionScore}%
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.cardStats, { borderColor: colors.divider }]}>
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
          <View
            style={[styles.statDivider, { backgroundColor: colors.divider }]}
          />
          <View style={styles.statItem}>
            <Ionicons
              name="checkmark-circle"
              size={18}
              color={colors.success}
            />
            <Text
              style={[
                styles.statText,
                {
                  color: colors.textSecondary,
                  fontSize: getFontSize(FontSizes.sm),
                },
              ]}
            >
              {item?.stateBreakdown?.ALERT || 0} Alert
            </Text>
          </View>
          <View
            style={[styles.statDivider, { backgroundColor: colors.divider }]}
          />
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
              {(item?.stateBreakdown?.DROWSY || 0) +
                (item?.stateBreakdown?.DISTRACTED || 0)}{" "}
              Issues
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
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
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="document-text-outline"
        size={80}
        color={colors.textLight}
      />
      <Text
        style={[
          styles.emptyTitle,
          { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
        ]}
      >
        No Sessions Yet
      </Text>
      <Text
        style={[
          styles.emptyText,
          { color: colors.textSecondary, fontSize: getFontSize(FontSizes.md) },
        ]}
      >
        Complete your first monitoring session to see your history here
      </Text>
      <TouchableOpacity
        style={styles.startButton}
        onPress={() => router.push("/monitoring")}
      >
        <LinearGradient
          colors={[colors.primary, colors.primary]}
          style={styles.startButtonGradient}
        >
          <Ionicons name="videocam" size={24} color="#FFF" />
          <Text
            style={[
              styles.startButtonText,
              { fontSize: getFontSize(FontSizes.md) },
            ]}
          >
            Start Monitoring
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {selectionMode ? (
            // Selection Mode Header
            <>
              <View style={styles.selectionHeader}>
                <TouchableOpacity
                  onPress={cancelSelection}
                  style={styles.cancelButton}
                >
                  <Ionicons name="close" size={28} color="#FFF" />
                </TouchableOpacity>
                <Text
                  style={[
                    styles.selectionText,
                    { fontSize: getFontSize(FontSizes.lg) },
                  ]}
                >
                  {selectedSessions.size} Selected
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleDeleteSelected}
                style={styles.deleteIconButton}
              >
                <Ionicons name="trash" size={28} color="#FFF" />
              </TouchableOpacity>
            </>
          ) : (
            // Normal Header
            <>
              <View>
                <Text
                  style={[
                    styles.headerTitle,
                    { fontSize: getFontSize(FontSizes.xxl) },
                  ]}
                >
                  Session History
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { fontSize: getFontSize(FontSizes.sm) },
                  ]}
                >
                  {currentDriver?.name || "Driver"} • {sessionHistory.length}{" "}
                  Sessions
                </Text>
              </View>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => router.push("/profile")}
              >
                <Ionicons name="person-circle-outline" size={40} color="#FFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </LinearGradient>

      {/* Sessions List */}
      <FlatList
        data={sessionHistory}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontWeight: FontWeights.bold,
    color: "#FFF",
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  profileButton: {
    padding: Spacing.xs,
  },
  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  cancelButton: {
    padding: Spacing.xs,
  },
  selectionText: {
    fontWeight: FontWeights.bold,
    color: "#FFF",
  },
  deleteIconButton: {
    padding: Spacing.xs,
  },
  selectionIndicator: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sessionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.medium,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardHeaderLeft: {
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
  cardStats: {
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
  statDivider: {
    width: 1,
    height: 20,
  },
  statText: {},
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  footerText: {},
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontWeight: FontWeights.bold,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  startButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    ...Shadow.medium,
  },
  startButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  startButtonText: {
    fontWeight: FontWeights.bold,
    color: "#FFF",
  },
});
