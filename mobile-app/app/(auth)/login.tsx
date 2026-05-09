import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
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
import { authService } from "@/src/services/authService";
import ActionButton from "@/src/components/common/ActionButton";

export default function LoginScreen() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const {
    currentDriver,
    isLoading: isSessionLoading,
    setCurrentDriver,
  } = useSession();
  const { colors, fontSize } = useTheme();

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  useEffect(() => {
    if (isSessionLoading || !currentDriver) return;

    setIsValidatingToken(true);

    const timeoutPromise = new Promise<"timeout">((resolve) =>
      setTimeout(() => resolve("timeout"), 4000),
    );

    Promise.race([authService.getCurrentDriver(), timeoutPromise])
      .then((result) => {
        if (result === "timeout") {
          console.warn("[Auth] Token validation timed out — proceeding offline-first");
        }
        router.replace("/(tabs)");
      })
      .catch(() => {
        void setCurrentDriver(null);
      })
      .finally(() => {
        setIsValidatingToken(false);
      });
  }, [currentDriver, isSessionLoading, setCurrentDriver]);


  const handleLogin = async () => {
    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      Alert.alert(
        "Missing Credentials",
        "Please enter both CNIC/Email and Password.",
      );
      return;
    }

    setIsLoading(true);

    try {
      await authService.login({
        username: trimmedIdentifier,
        password: trimmedPassword,
      });

      const driverProfile = await authService.getCurrentDriver();

      await setCurrentDriver({
        id: driverProfile.driver_id,
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

  if (isSessionLoading || isValidatingToken) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Branding Section */}
        <View style={styles.brandingSection}>
          <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={48} color="#FFFFFF" />
          </View>
          <Text style={[styles.title, { color: colors.text, fontSize: getFontSize(FontSizes.xl) }]}>
            Vigilant Driver
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: getFontSize(FontSizes.md) }]}>
            Enterprise Fleet Safety Monitoring
          </Text>
        </View>

        {/* Login Form */}
        <View style={[styles.formContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.formTitle, { color: colors.text, fontSize: getFontSize(FontSizes.lg) }]}>
            Sign In
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary, fontSize: getFontSize(FontSizes.sm) }]}>
              CNIC OR EMAIL
            </Text>
            <View style={[styles.inputWrapper, { borderColor: colors.cardBorder, backgroundColor: colors.background }]}>
              <Ionicons name="person-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter identifier"
                placeholderTextColor={colors.textLight}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary, fontSize: getFontSize(FontSizes.sm) }]}>
              PASSWORD
            </Text>
            <View style={[styles.inputWrapper, { borderColor: colors.cardBorder, backgroundColor: colors.background }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.textLight} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textLight}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ActionButton
            title={isLoading ? "Authenticating..." : "Sign In"}
            onPress={handleLogin}
            disabled={!identifier || !password || isLoading}
            style={styles.loginButton}
          />

          <View style={[styles.infoBox, { backgroundColor: `${colors.info}10` }]}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <Text style={[styles.infoText, { color: colors.info, fontSize: getFontSize(FontSizes.xs) }]}>
              Credentials provided by your organization admin.
            </Text>
          </View>
        </View>

        <Text style={[styles.footerText, { color: colors.textMuted, fontSize: getFontSize(FontSizes.xs) }]}>
          © 2024 Vigilant Driver System • v1.2.0
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === "ios" ? 100 : 80,
    paddingBottom: Spacing.xl,
  },
  brandingSection: {
    alignItems: "center",
    marginBottom: Spacing.xxl,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadow.medium,
  },
  title: {
    fontWeight: FontWeights.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 4,
    fontWeight: FontWeights.medium,
  },
  formContainer: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    ...Shadow.large,
  },
  formTitle: {
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontWeight: FontWeights.bold,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    height: 56,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  loginButton: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontWeight: FontWeights.medium,
    lineHeight: 16,
  },
  footerText: {
    textAlign: "center",
    marginTop: "auto",
    paddingTop: Spacing.xxl,
    fontWeight: FontWeights.semibold,
  },
});
