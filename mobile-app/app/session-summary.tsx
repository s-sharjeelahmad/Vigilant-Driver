import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import type { Session } from "@/src/types";
import { sessionService } from "@/src/services/sessionService";

interface ExtendedSession extends Session {
  averageConfidence: number;
  terminationReason: string;
  totalFrames: number;
}

export default function SessionSummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { sessionHistory } = useSession();
  const { colors, theme } = useTheme();
  const [session, setSession] = useState<ExtendedSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const resolvedSessionId = Array.isArray(sessionId) ? sessionId[0] : sessionId;

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!resolvedSessionId) {
        router.replace("/(tabs)");
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const remoteSession = await sessionService.getSessionById(resolvedSessionId);

        const drowsyFrames = remoteSession.drowsy_frames ?? 0;
        const distractedFrames = remoteSession.distracted_frames ?? 0;
        const unsafeFrames = drowsyFrames + distractedFrames;

        const backendTotal = remoteSession.total_frames_processed ?? 0;
        const totalFrames = Math.max(backendTotal, unsafeFrames, 1);
        const safeFrames = Math.max(0, totalFrames - unsafeFrames);

        const alertPct = (safeFrames / totalFrames) * 100;
        const drowsyPct = (drowsyFrames / totalFrames) * 100;
        const distractedPct = (distractedFrames / totalFrames) * 100;

        const mappedSession: ExtendedSession = {
          id: remoteSession.session_id,
          driverId: remoteSession.driver_id,
          startTime: remoteSession.start_time,
          endTime:
            remoteSession.end_time ||
            remoteSession.updated_at ||
            remoteSession.start_time,
          duration: calculateDuration(
            remoteSession.start_time,
            remoteSession.end_time ||
              remoteSession.updated_at ||
              remoteSession.start_time
          ),
          attentionScore: remoteSession.attention_score ?? 0,
          averageConfidence: remoteSession.average_confidence ?? 0,
          terminationReason: remoteSession.termination_reason || "Completed",
          totalFrames: totalFrames,
          events: [],
          stateBreakdown: {
            ALERT: safeFrames,
            DROWSY: drowsyFrames,
            DISTRACTED: distractedFrames,
          },
          percentages: {
            ALERT: Number(alertPct.toFixed(1)),
            DROWSY: Number(drowsyPct.toFixed(1)),
            DISTRACTED: Number(distractedPct.toFixed(1)),
          },
        };

        if (!cancelled) setSession(mappedSession);
      } catch {
        setLoadError("Failed to load session details from server.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [resolvedSessionId]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Compiling Telemetry...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session || loadError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {loadError || "Session not found."}
          </Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(tabs)")}
          >
            <Text style={styles.backButtonText}>Return to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const scoreColor = getScoreColor(session.attentionScore);
  const date = formatDate(session.startTime);
  const clockTime = formatSessionTime(session.startTime);
  const realDurationSeconds = calculateDuration(session.startTime, session.endTime);
  const duration = formatTime(realDurationSeconds);

  const riskLabel =
    session.attentionScore >= 85
      ? "LOW RISK"
      : session.attentionScore >= 60
      ? "MODERATE RISK"
      : "HIGH RISK";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sleek App Header */}
      <View style={[styles.appHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.appHeaderTitle, { color: colors.text }]}>Trip Telemetry</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SCORE SUMMARY CARD */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={[styles.heroDate, { color: colors.text }]}>{date}</Text>
              <Text style={[styles.heroTime, { color: colors.textSecondary }]}>{clockTime}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: `${colors.success}15` }]}>
              <Text style={[styles.statusBadgeText, { color: colors.success }]}>TRIP COMPLETED</Text>
            </View>
          </View>

          <View style={styles.scoreContainer}>
            <View style={styles.scoreLeft}>
              <Text style={[styles.scoreValue, { color: scoreColor }]}>{session.attentionScore}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>ATTENTION SCORE</Text>
            </View>
            <View style={[styles.riskBadge, { backgroundColor: `${scoreColor}15` }]}>
              <Text style={[styles.riskText, { color: scoreColor }]}>{riskLabel}</Text>
            </View>
          </View>
        </View>

        {/* METRICS GRID */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="time"
            label="DURATION"
            value={duration}
            colors={colors}
          />
          <MetricCard
            icon="scan"
            label="INFERENCES"
            value={String(session.totalFrames)}
            colors={colors}
          />
          <MetricCard
            icon="checkmark-circle"
            label="CONFIDENCE"
            value={`${(session.averageConfidence * 100).toFixed(1)}%`}
            colors={colors}
          />
          <MetricCard
            icon="warning"
            label="TOTAL ISSUES"
            value={String(session.stateBreakdown.DROWSY + session.stateBreakdown.DISTRACTED)}
            colors={colors}
            isWarning={(session.stateBreakdown.DROWSY + session.stateBreakdown.DISTRACTED) > 0}
          />
        </View>

        {/* STATE BREAKDOWN TRACK */}
        <View style={[styles.analyticsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Telemetry Breakdown</Text>
          
          <View style={[styles.trackContainer, { backgroundColor: theme === 'dark' ? '#333' : '#E0E0E0' }]}>
            <View style={[styles.trackSegment, { flex: session.percentages.ALERT, backgroundColor: colors.success }]} />
            <View style={[styles.trackSegment, { flex: session.percentages.DISTRACTED, backgroundColor: colors.warning }]} />
            <View style={[styles.trackSegment, { flex: session.percentages.DROWSY, backgroundColor: colors.error }]} />
          </View>

          <View style={styles.breakdownList}>
            <BreakdownRow
              label="SAFE"
              value={session.stateBreakdown.ALERT}
              percent={session.percentages.ALERT}
              color={colors.success}
              colors={colors}
            />
            <BreakdownRow
              label="DISTRACTED"
              value={session.stateBreakdown.DISTRACTED}
              percent={session.percentages.DISTRACTED}
              color={colors.warning}
              colors={colors}
            />
            <BreakdownRow
              label="DROWSY"
              value={session.stateBreakdown.DROWSY}
              percent={session.percentages.DROWSY}
              color={colors.error}
              colors={colors}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ icon, label, value, colors, isWarning }: any) {
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.metricHeader}>
        <Ionicons name={icon} size={16} color={isWarning ? colors.warning : colors.textSecondary} />
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.metricValue, { color: isWarning ? colors.warning : colors.text }]}>{value}</Text>
    </View>
  );
}

function BreakdownRow({ label, value, percent, color, colors }: any) {
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownLeft}>
        <View style={[styles.breakdownDot, { backgroundColor: color }]} />
        <Text style={[styles.breakdownLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <View style={styles.breakdownRight}>
        <Text style={[styles.breakdownValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.breakdownPercent, { color: colors.textSecondary }]}>{percent}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backIcon: { padding: Spacing.xs },
  appHeaderTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  headerRight: { width: 32 }, // balance back icon
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  heroCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.lg,
  },
  heroDate: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  heroTime: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  scoreLeft: {},
  scoreValue: {
    fontSize: 48,
    fontWeight: FontWeights.bold,
    letterSpacing: -2,
    lineHeight: 52,
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  riskText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.sm,
  },
  metricCard: {
    width: "48%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
  },
  analyticsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.lg,
  },
  trackContainer: {
    flexDirection: "row",
    height: 12,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: Spacing.xl,
    gap: 2, // gaps between segments
  },
  trackSegment: {
    height: "100%",
    borderRadius: 6,
  },
  breakdownList: {
    gap: Spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  breakdownLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  breakdownDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  breakdownLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  breakdownRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    width: 80,
    justifyContent: "flex-end",
  },
  breakdownValue: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  breakdownPercent: {
    fontSize: FontSizes.sm,
    width: 45,
    textAlign: "right",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    textAlign: "center",
  },
  backButton: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    color: "#FFF",
    fontWeight: FontWeights.bold,
  },
});