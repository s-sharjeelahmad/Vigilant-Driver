import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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

export default function ProfileScreen() {
  const { currentDriver, sessionHistory, setCurrentDriver, clearHistory } =
    useSession();
  const { colors, fontSize } = useTheme();

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  // Calculate profile stats
  const totalSessions = sessionHistory.length;
  const totalDuration = sessionHistory.reduce(
    (sum, s) => sum + (s?.duration || 0),
    0
  );
  const avgScore =
    totalSessions > 0
      ? Math.round(
          sessionHistory.reduce((sum, s) => sum + (s?.attentionScore || 0), 0) /
            totalSessions
        )
      : 0;

  const totalAlerts = sessionHistory.reduce((sum, s) => {
    const drowsy = s?.stateBreakdown?.DROWSY || 0;
    const distracted = s?.stateBreakdown?.DISTRACTED || 0;
    return sum + drowsy + distracted;
  }, 0);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout? Your session history will be preserved.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await setCurrentDriver(null);
            router.replace("/(auth)/login");
          },
        },
      ]
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "This will permanently delete all your session history. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await clearHistory();
            Alert.alert("Success", "Session history cleared!");
          },
        },
      ]
    );
  };

  if (!currentDriver) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.centerContent}>
          <Ionicons
            name="person-circle-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text
            style={[
              styles.messageText,
              {
                color: colors.textSecondary,
                fontSize: getFontSize(FontSizes.md),
              },
            ]}
          >
            No driver logged in
          </Text>
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text
              style={[
                styles.loginButtonText,
                { fontSize: getFontSize(FontSizes.md) },
              ]}
            >
              Go to Login
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Gradient */}
        <LinearGradient
          colors={[colors.primary, colors.primary]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/(tabs)")}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={64} color="#FFF" />
          </View>
          <Text
            style={[
              styles.driverName,
              { fontSize: getFontSize(FontSizes.xxl) },
            ]}
          >
            {currentDriver.name}
          </Text>
          <Text
            style={[styles.driverCnic, { fontSize: getFontSize(FontSizes.md) }]}
          >
            {currentDriver.cnic}
          </Text>
          {currentDriver.phone && (
            <View style={styles.phoneContainer}>
              <Ionicons
                name="call"
                size={16}
                color="rgba(255, 255, 255, 0.9)"
              />
              <Text
                style={[
                  styles.driverPhone,
                  { fontSize: getFontSize(FontSizes.sm) },
                ]}
              >
                {currentDriver.phone}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
            ]}
          >
            Your Statistics
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="calendar" size={32} color={colors.primary} />
              <Text
                style={[
                  styles.statValue,
                  { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
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
              <Ionicons name="time" size={32} color={colors.info} />
              <Text
                style={[
                  styles.statValue,
                  { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
                ]}
              >
                {formatDuration(totalDuration)}
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
                Total Time
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Ionicons name="star" size={32} color={colors.warning} />
              <Text
                style={[
                  styles.statValue,
                  { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
                ]}
              >
                {avgScore}%
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
              <Ionicons name="warning" size={32} color={colors.error} />
              <Text
                style={[
                  styles.statValue,
                  { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
                ]}
              >
                {totalAlerts}
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
                Total Alerts
              </Text>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
            ]}
          >
            Account
          </Text>

          <TouchableOpacity
            style={[styles.actionItem, { backgroundColor: colors.card }]}
            onPress={() => router.push("/(tabs)")}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="home" size={24} color={colors.primary} />
              <Text
                style={[
                  styles.actionText,
                  { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                Dashboard
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, { backgroundColor: colors.card }]}
            onPress={() => router.push("/edit-profile")}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="create" size={24} color={colors.info} />
              <Text
                style={[
                  styles.actionText,
                  { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                Edit Profile
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, { backgroundColor: colors.card }]}
            onPress={() => router.push("/settings")}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="settings" size={24} color={colors.warning} />
              <Text
                style={[
                  styles.actionText,
                  { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                Settings & Personalization
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, { backgroundColor: colors.card }]}
            onPress={() =>
              Alert.alert("Coming Soon", "Notification settings coming soon!")
            }
          >
            <View style={styles.actionLeft}>
              <Ionicons name="notifications" size={24} color={colors.info} />
              <Text
                style={[
                  styles.actionText,
                  { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                Notifications
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, { backgroundColor: colors.card }]}
            onPress={handleClearHistory}
          >
            <View style={styles.actionLeft}>
              <Ionicons name="trash" size={24} color={colors.error} />
              <Text
                style={[
                  styles.actionText,
                  { color: colors.error, fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                Clear History
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.card, borderColor: colors.error },
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={24} color={colors.error} />
          <Text
            style={[
              styles.logoutText,
              { color: colors.error, fontSize: getFontSize(FontSizes.md) },
            ]}
          >
            Logout
          </Text>
        </TouchableOpacity>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: colors.textLight, fontSize: getFontSize(FontSizes.xs) },
            ]}
          >
            Vigilant Driver v1.0
          </Text>
          <Text
            style={[
              styles.footerText,
              { color: colors.textLight, fontSize: getFontSize(FontSizes.xs) },
            ]}
          >
            © 2025 FYP Project
          </Text>
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
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  messageText: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  loginButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  loginButtonText: {
    fontWeight: FontWeights.semibold,
    color: "#FFF",
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: Spacing.xl,
    left: Spacing.lg,
    zIndex: 10,
    padding: Spacing.xs,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 4,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  driverName: {
    fontWeight: FontWeights.bold,
    color: "#FFF",
    marginBottom: Spacing.xs,
  },
  driverCnic: {
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: Spacing.sm,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  driverPhone: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  statsSection: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: "47%",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadow.small,
  },
  statValue: {
    fontWeight: FontWeights.bold,
    marginTop: Spacing.sm,
  },
  statLabel: {
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  actionsSection: {
    padding: Spacing.lg,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadow.small,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  actionText: {
    fontWeight: FontWeights.medium,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 2,
  },
  logoutText: {
    fontWeight: FontWeights.semibold,
  },
  footer: {
    alignItems: "center",
    marginTop: Spacing.xl,
    gap: Spacing.xs,
  },
  footerText: {},
});
