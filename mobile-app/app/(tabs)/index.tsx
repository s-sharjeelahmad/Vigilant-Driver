import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { formatDate } from "@/src/utils/helpers";

export default function DashboardScreen() {
  const { currentDriver, sessionHistory } = useSession();
  const { colors, fontSize } = useTheme();

  // Calculate stats from session history
  const totalSessions = sessionHistory.length;
  const avgAttentionScore =
    totalSessions > 0
      ? Math.round(
          sessionHistory.reduce((sum, s) => sum + (s?.attentionScore || 0), 0) /
            totalSessions,
        )
      : 0;
  const lastSessionDate =
    totalSessions > 0 && sessionHistory[0]
      ? formatDate(sessionHistory[0].startTime)
      : "No sessions yet";

  const handleStartMonitoring = () => {
    router.push("/monitoring");
  };

  const handleViewHistory = () => {
    router.push("/(tabs)/history");
  };

  const handleViewProfile = () => {
    router.push("/profile");
  };

  // Dynamic font sizes based on user preference
  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary, colors.primary]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text
                style={[
                  styles.greeting,
                  { fontSize: getFontSize(FontSizes.xl) },
                ]}
              >
                Welcome back,
              </Text>
              <Text
                style={[
                  styles.driverName,
                  { fontSize: getFontSize(FontSizes.xxl) },
                ]}
              >
                {currentDriver?.name || "Driver"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleViewProfile}
            >
              <Ionicons name="person-circle-outline" size={40} color="#FFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="calendar" size={28} color={colors.primary} />
            <Text
              style={[
                styles.statValue,
                { color: colors.text, fontSize: getFontSize(FontSizes.lg) },
              ]}
            >
              {totalSessions}
            </Text>
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.textSecondary,
                  fontSize: getFontSize(FontSizes.xs),
                },
              ]}
            >
              Total Sessions
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="star" size={28} color={colors.warning} />
            <Text
              style={[
                styles.statValue,
                { color: colors.text, fontSize: getFontSize(FontSizes.lg) },
              ]}
            >
              {avgAttentionScore}%
            </Text>
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.textSecondary,
                  fontSize: getFontSize(FontSizes.xs),
                },
              ]}
            >
              Avg Score
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name="time" size={28} color={colors.info} />
            <Text
              style={[
                styles.statValue,
                { color: colors.text, fontSize: getFontSize(FontSizes.xs) },
              ]}
            >
              {lastSessionDate}
            </Text>
            <Text
              style={[
                styles.statLabel,
                {
                  color: colors.textSecondary,
                  fontSize: getFontSize(FontSizes.xs),
                },
              ]}
            >
              Last Session
            </Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
            ]}
          >
            Quick Actions
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartMonitoring}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary]}
              style={styles.buttonGradient}
            >
              <Ionicons name="videocam" size={28} color="#FFF" />
              <Text
                style={[
                  styles.primaryButtonText,
                  { fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                Start Monitoring Session
              </Text>
              <Ionicons name="arrow-forward" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: colors.card, borderColor: colors.primary },
            ]}
            onPress={handleViewHistory}
            activeOpacity={0.7}
          >
            <Ionicons name="list" size={24} color={colors.primary} />
            <Text
              style={[
                styles.secondaryButtonText,
                { color: colors.primary, fontSize: getFontSize(FontSizes.md) },
              ]}
            >
              View Session History
            </Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.featuresContainer}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
            ]}
          >
            How It Works
          </Text>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Ionicons name="camera" size={32} color={colors.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text
                style={[
                  styles.featureTitle,
                  { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                Real-time Monitoring
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  {
                    color: colors.textSecondary,
                    fontSize: getFontSize(FontSizes.sm),
                  },
                ]}
              >
                AI-powered camera monitors your alertness while driving
              </Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: `${colors.error}15` },
              ]}
            >
              <Ionicons name="warning" size={32} color={colors.error} />
            </View>
            <View style={styles.featureContent}>
              <Text
                style={[
                  styles.featureTitle,
                  { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                Instant Alerts
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  {
                    color: colors.textSecondary,
                    fontSize: getFontSize(FontSizes.sm),
                  },
                ]}
              >
                Get immediate audio & vibration alerts for drowsiness
              </Text>
            </View>
          </View>

          <View style={[styles.featureCard, { backgroundColor: colors.card }]}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: `${colors.info}15` },
              ]}
            >
              <Ionicons name="analytics" size={32} color={colors.info} />
            </View>
            <View style={styles.featureContent}>
              <Text
                style={[
                  styles.featureTitle,
                  { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                Session Reports
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  {
                    color: colors.textSecondary,
                    fontSize: getFontSize(FontSizes.sm),
                  },
                ]}
              >
                Track your attention score and driving patterns
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: Spacing.xs,
  },
  driverName: {
    fontWeight: FontWeights.bold,
    color: "#FFF",
  },
  profileButton: {
    padding: Spacing.xs,
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadow.medium,
  },
  statValue: {
    fontWeight: FontWeights.bold,
    marginTop: Spacing.xs,
  },
  statLabel: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  actionContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
  },
  primaryButton: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginBottom: Spacing.md,
    ...Shadow.medium,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontWeight: FontWeights.bold,
    color: "#FFF",
    flex: 1,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontWeight: FontWeights.semibold,
    flex: 1,
  },
  featuresContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  featureCard: {
    flexDirection: "row",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadow.small,
  },
  featureIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
    justifyContent: "center",
  },
  featureTitle: {
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    lineHeight: 20,
  },
});
