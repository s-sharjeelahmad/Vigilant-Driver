import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
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
  API_BASE_URL,
} from "@/src/utils/constants";
import { useSession } from "@/src/context/SessionContext";
import { useTheme } from "@/src/context/ThemeContext";
import { authService } from "@/src/services/authService";

export default function LoginScreen() {
  const [driverId, setDriverId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { setCurrentDriver } = useSession();
  const { colors, fontSize } = useTheme();

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  const handleLogin = async () => {
    const trimmedId = driverId.trim();
    const trimmedPassword = password.trim();

    if (!trimmedId || !trimmedPassword) {
      Alert.alert(
        "Missing Credentials",
        "Please enter both Driver ID and Password.",
      );
      return;
    }

    setIsLoading(true);

    try {
      const loginUrl = `${API_BASE_URL}/auth/login`;
      console.log("[Login] Calling backend endpoint:", loginUrl);

      await authService.login({
        driver_id: trimmedId,
        password: trimmedPassword,
      });

      const driverProfile = await authService.getCurrentDriver();

      // Persisted by SessionContext storage service so login survives app restarts.
      await setCurrentDriver({
        id: driverProfile.driver_id as any,
        name: driverProfile.full_name,
        cnic: driverProfile.cnic,
        phone: driverProfile.phone_number || undefined,
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error.message || "An unexpected error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.primary]}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <Ionicons name="car-sport" size={64} color="#FFF" />
        </View>
        <Text style={[styles.title, { fontSize: getFontSize(FontSizes.xxxl) }]}>
          Vigilant Driver
        </Text>
        <Text
          style={[styles.subtitle, { fontSize: getFontSize(FontSizes.md) }]}
        >
          Real-time Driver Monitoring System
        </Text>
      </LinearGradient>

      {/* Login Card */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons
            name="person-circle-outline"
            size={32}
            color={colors.primary}
          />
          <Text
            style={[
              styles.cardTitle,
              { color: colors.text, fontSize: getFontSize(FontSizes.xl) },
            ]}
          >
            Driver Login
          </Text>
        </View>

        {/* Driver ID Input */}
        <Text
          style={[
            styles.label,
            { color: colors.text, fontSize: getFontSize(FontSizes.md) },
          ]}
        >
          Driver ID
        </Text>
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter your Driver ID (UUID)"
            placeholderTextColor={colors.textSecondary}
            value={driverId}
            onChangeText={setDriverId}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
          />
        </View>

        {/* Password Input */}
        <Text
          style={[
            styles.label,
            { color: colors.text, fontSize: getFontSize(FontSizes.md) },
          ]}
        >
          Password
        </Text>
        <View
          style={[
            styles.pickerContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Enter your password"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity
          style={[
            styles.loginButton,
            (!driverId || !password || isLoading) && styles.loginButtonDisabled,
          ]}
          onPress={handleLogin}
          disabled={!driverId || !password || isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={
              driverId && password && !isLoading
                ? [colors.primary, colors.primary]
                : ["#BDBDBD", "#9E9E9E"]
            }
            style={styles.loginButtonGradient}
          >
            {isLoading ? (
              <Text
                style={[
                  styles.loginButtonText,
                  { fontSize: getFontSize(FontSizes.lg) },
                ]}
              >
                Signing in...
              </Text>
            ) : (
              <>
                <Text
                  style={[
                    styles.loginButtonText,
                    { fontSize: getFontSize(FontSizes.lg) },
                  ]}
                >
                  Start Monitoring
                </Text>
                <Ionicons name="arrow-forward" size={24} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Info Banner */}
        <View
          style={[styles.infoBanner, { backgroundColor: `${colors.info}15` }]}
        >
          <Ionicons name="information-circle" size={20} color={colors.info} />
          <Text
            style={[
              styles.infoBannerText,
              { color: colors.info, fontSize: getFontSize(FontSizes.sm) },
            ]}
          >
            Enter the Driver ID and Password provided by your company admin.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <Text
        style={[
          styles.footer,
          { color: colors.textLight, fontSize: getFontSize(FontSizes.xs) },
        ]}
      >
        Powered by AI • Secure • Real-time Monitoring
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontWeight: FontWeights.bold,
    color: "#FFF",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  card: {
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.xl,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.large,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  cardTitle: {
    fontWeight: FontWeights.bold,
  },
  label: {
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
  },
  pickerContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  input: {
    height: 50,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.md,
  },
  driverInfo: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoLabel: {
    fontWeight: FontWeights.medium,
    width: 60,
  },
  infoValue: {
    fontWeight: FontWeights.semibold,
    flex: 1,
  },
  loginButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  loginButtonText: {
    fontWeight: FontWeights.bold,
    color: "#FFF",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  infoBannerText: {
    flex: 1,
  },
  footer: {
    textAlign: "center",
    marginTop: Spacing.xl,
  },
});
