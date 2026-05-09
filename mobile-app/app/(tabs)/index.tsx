import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { formatDate } from "@/src/utils/helpers";
import GradientHeader from "@/src/components/common/GradientHeader";
import StatCard from "@/src/components/stats/StatCard";
import ActionButton from "@/src/components/common/ActionButton";

export default function DashboardScreen() {
  const { currentDriver, sessionHistory } = useSession();
  const { colors, fontSize } = useTheme();

  const totalSessions = sessionHistory.length;
  const riskScore = currentDriver?.risk_score ?? "84"; // Fallback to 84% for demo
  const lastSessionDate =
    totalSessions > 0 && sessionHistory[0]
      ? formatDate(sessionHistory[0].startTime)
      : "No sessions yet";

  const handleStartMonitoring = () => {
    router.push({ pathname: "/calibration", params: { autoStart: "1" } });
  };

  const handleViewHistory = () => {
    router.push("/(tabs)/history");
  };

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader
        title={`Welcome, ${currentDriver?.name?.split(' ')[0] || "Driver"}`}
        subtitle="Your fleet safety dashboard is ready."
        rightElement={
          <TouchableOpacity
            onPress={() => router.push("/profile")}
            style={styles.profileButton}
          >
            <Ionicons
              name="person-circle-outline"
              size={32}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        }
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Key Metrics */}
        <View style={styles.statsGrid}>
          <StatCard
            icon="calendar-outline"
            value={totalSessions}
            label="Total Sessions"
          />
          <StatCard
            icon="shield-checkmark-outline"
            value={`${riskScore}%`}
            label="Safety Score"
            iconColor={colors.success}
          />
        </View>

        <View style={[styles.lastSessionCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.lastSessionHeader}>
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.lastSessionLabel, { color: colors.textSecondary, fontSize: getFontSize(FontSizes.sm) }]}>
              LAST MONITORING SESSION
            </Text>
          </View>
          <Text style={[styles.lastSessionDate, { color: colors.text, fontSize: getFontSize(FontSizes.md) }]}>
            {lastSessionDate}
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(FontSizes.lg) }]}>
            Monitoring Control
          </Text>
          <ActionButton
            title="Start Live Monitoring"
            icon="play"
            onPress={handleStartMonitoring}
            style={styles.primaryAction}
          />
          <ActionButton
            title="Review Trip Logs"
            variant="outline"
            icon="list"
            onPress={handleViewHistory}
          />
        </View>

        {/* Feature Highlights */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: getFontSize(FontSizes.lg) }]}>
            System Intelligence
          </Text>
          
          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="eye-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text, fontSize: getFontSize(FontSizes.md) }]}>
                Attention Analysis
              </Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary, fontSize: getFontSize(FontSizes.sm) }]}>
                Edge-AI detects gaze distraction and head pose shifts in real-time.
              </Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={[styles.featureIcon, { backgroundColor: `${colors.error}10` }]}>
              <Ionicons name="notifications-outline" size={24} color={colors.error} />
            </View>
            <View style={styles.featureText}>
              <Text style={[styles.featureTitle, { color: colors.text, fontSize: getFontSize(FontSizes.md) }]}>
                Drowsiness Alerts
              </Text>
              <Text style={[styles.featureDesc, { color: colors.textSecondary, fontSize: getFontSize(FontSizes.sm) }]}>
                Multistage alerts trigger if microsleep patterns are detected.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileButton: {
    padding: Spacing.xs,
  },
  scrollView: {
    flex: 1,
    marginTop: -Spacing.lg,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  statsGrid: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  lastSessionCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    ...Shadow.small,
  },
  lastSessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: 4,
  },
  lastSessionLabel: {
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  lastSessionDate: {
    fontWeight: FontWeights.semibold,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
  },
  primaryAction: {
    marginBottom: Spacing.md,
  },
  featureCard: {
    flexDirection: "row",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: FontWeights.bold,
  },
  featureDesc: {
    marginTop: 2,
    lineHeight: 18,
  },
});
