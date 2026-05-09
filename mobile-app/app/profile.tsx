import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
  Shadow,
} from "@/src/utils/constants";
import { useSession } from "@/src/context/SessionContext";
import { useTheme } from "@/src/context/ThemeContext";
import GradientHeader from "@/src/components/common/GradientHeader";
import StatCard from "@/src/components/stats/StatCard";

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
    0,
  );
  const avgScore =
    totalSessions > 0
      ? Math.round(
          sessionHistory.reduce((sum, s) => sum + (s?.attentionScore || 0), 0) /
            totalSessions,
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
      "Secure Logout",
      "Are you sure you want to logout? Telemetry data is synced to the cloud.",
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
      ],
    );
  };

  const handleClearHistory = () => {
    Alert.alert(
      "Purge Telemetry",
      "This will permanently delete all local session history. Cloud backups may persist.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Purge All",
          style: "destructive",
          onPress: async () => {
            await clearHistory();
            Alert.alert("Success", "Local history purged.");
          },
        },
      ],
    );
  };

  if (!currentDriver) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GradientHeader
        title={currentDriver.name}
        subtitle={currentDriver.cnic}
        showProfile={false}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* STATS GRID */}
        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Driver Performance</Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="TRIPS"
              value={String(totalSessions)}
              icon="calendar"
              iconColor={colors.primary}
            />
            <StatCard
              label="DRIVE TIME"
              value={formatDuration(totalDuration)}
              icon="time"
              iconColor={colors.info}
            />
            <StatCard
              label="AVG SCORE"
              value={`${avgScore}%`}
              icon="star"
              iconColor={colors.warning}
            />
            <StatCard
              label="EVENTS"
              value={String(totalAlerts)}
              icon="warning"
              iconColor={colors.error}
            />
          </View>
        </View>

        {/* ACCOUNT MANAGEMENT */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Management</Text>
          <View style={[styles.actionGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <ActionRow
              icon="create"
              label="Edit Driver Profile"
              onPress={() => router.push("/edit-profile")}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ActionRow
              icon="settings"
              label="System Configuration"
              onPress={() => router.push("/settings")}
              colors={colors}
            />
            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
            <ActionRow
              icon="trash"
              label="Purge Local Telemetry"
              onPress={handleClearHistory}
              isDestructive
              colors={colors}
            />
          </View>
        </View>

        {/* SESSION ACTIONS */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>TERMINATE SESSION</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            Vigilant Driver Enterprise v1.4.2
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function ActionRow({ icon, label, onPress, isDestructive, colors }: any) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <View style={styles.actionLeft}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={isDestructive ? colors.error : colors.primary} 
        />
        <Text style={[
          styles.actionLabel, 
          { color: isDestructive ? colors.error : colors.text }
        ]}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </TouchableOpacity>
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  statsSection: {
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  actionGroup: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Shadow.small,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  actionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  actionLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.lg + 34,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  logoutText: {
    fontWeight: FontWeights.bold,
    letterSpacing: 1,
  },
  footer: {
    marginTop: Spacing.xxl,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontWeight: FontWeights.medium,
  },
});
