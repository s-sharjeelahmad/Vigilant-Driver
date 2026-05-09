import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
} from "@/src/utils/constants";
import { useSession } from "@/src/context/SessionContext";
import { useTheme } from "@/src/context/ThemeContext";
import {
  formatDate,
  formatTime,
  formatSessionTime,
  calculateDuration,
  getScoreColor,
} from "@/src/utils/helpers";
import { Session } from "@/src/types";

export default function HistoryScreen() {
  const { sessionHistory, currentDriver, deleteSession } = useSession();
  const { colors, theme } = useTheme();

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(
    new Set()
  );

  const getDriveStatus = (score: number) => {
    if (score >= 90) return { label: "SAFE", color: colors.success };
    if (score >= 75) return { label: "MODERATE", color: colors.info };
    if (score >= 50) return { label: "WARNING", color: colors.warning };
    return { label: "CRITICAL", color: colors.error };
  };

  const toggleSelection = (sessionId: string) => {
    const updated = new Set(selectedSessions);
    if (updated.has(sessionId)) {
      updated.delete(sessionId);
    } else {
      updated.add(sessionId);
    }
    setSelectedSessions(updated);
    if (updated.size === 0) setSelectionMode(false);
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
    Alert.alert("Purge Logs", "Permanently remove selected telemetry logs?", [
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
        },
      },
    ]);
  };

  const renderSessionCard = ({ item }: { item: Session }) => {
    const scoreColor = getScoreColor(item.attentionScore);
    const status = getDriveStatus(item.attentionScore);
    const date = formatDate(item.startTime);
    const clockTime = formatSessionTime(item.startTime);
    const realDurationSeconds = calculateDuration(item.startTime, item.endTime);
    const duration = formatTime(realDurationSeconds);
    const isSelected = selectedSessions.has(item.id);
    const totalIssues = item.stateBreakdown.DROWSY + item.stateBreakdown.DISTRACTED;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (selectionMode) {
            toggleSelection(item.id);
          } else {
            router.push({
              pathname: "/session-summary",
              params: { sessionId: item.id },
            });
          }
        }}
        onLongPress={() => handleLongPress(item.id)}
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: isSelected ? colors.primary : colors.border },
          isSelected && { backgroundColor: theme === 'dark' ? 'rgba(46, 108, 246, 0.1)' : 'rgba(46, 108, 246, 0.05)' },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateTimeWrap}>
            <Text style={[styles.dateText, { color: colors.text }]}>{date}</Text>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>
              {clockTime}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${status.color}15` }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.scoreBlock}>
            <Text style={[styles.scoreValue, { color: scoreColor }]}>
              {item.attentionScore}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              SCORE
            </Text>
          </View>

          <View style={[styles.dividerVertical, { backgroundColor: colors.divider }]} />

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{duration}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                DURATION
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: totalIssues > 0 ? colors.warning : colors.text }]}>
                {totalIssues}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
                ISSUES
              </Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.appHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        {selectionMode ? (
          <View style={styles.selectionHeader}>
            <TouchableOpacity onPress={cancelSelection} style={styles.iconButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.selectionText, { color: colors.text }]}>
              {selectedSessions.size} Selected
            </Text>
            <TouchableOpacity onPress={handleDeleteSelected} style={styles.iconButton}>
              <Ionicons name="trash-outline" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.headerContent}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Trip Telemetry
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Fleet Database • {sessionHistory.length} Logs
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push("/profile")} 
              style={[styles.profileBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="person" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={sessionHistory}
        renderItem={renderSessionCard}
        keyExtractor={(item, index) => (item.id ? `${item.id}-${index}` : String(index))}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    paddingTop: 48,
  },
  headerContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: FontWeights.medium,
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  selectionHeader: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectionText: {
    fontWeight: FontWeights.bold,
    fontSize: FontSizes.md,
  },
  iconButton: {
    padding: Spacing.xs,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  card: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  dateTimeWrap: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  timeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  cardBody: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  scoreBlock: {
    width: 70,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    letterSpacing: -1,
  },
  dividerVertical: {
    width: 1,
    height: 36,
    marginHorizontal: Spacing.lg,
  },
  statsGrid: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: Spacing.xl,
  },
  statItem: {
    justifyContent: "center",
  },
  statValue: {
    fontSize: 18,
    fontWeight: FontWeights.bold,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
    marginTop: 2,
  },
});