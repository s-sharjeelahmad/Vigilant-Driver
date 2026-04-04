import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
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
import { useTheme, AccentColor } from "@/src/context/ThemeContext";

export default function SettingsScreen() {
  const {
    theme,
    toggleTheme,
    accentColor,
    setAccentColor,
    fontSize,
    setFontSize,
    colors,
  } = useTheme();

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  const accentColors: { name: string; value: AccentColor; color: string }[] = [
    { name: "Blue", value: "blue", color: "#2196F3" },
    { name: "Green", value: "green", color: "#4CAF50" },
    { name: "Purple", value: "purple", color: "#9C27B0" },
    { name: "Orange", value: "orange", color: "#FF9800" },
    { name: "Red", value: "red", color: "#F44336" },
  ];

  const fontSizes: { name: string; value: "small" | "medium" | "large" }[] = [
    { name: "Small", value: "small" },
    { name: "Medium", value: "medium" },
    { name: "Large", value: "large" },
  ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, colors.primary]}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings & Personalization</Text>
        </LinearGradient>

        {/* Theme Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: getFontSize(FontSizes.lg) },
            ]}
          >
            Appearance
          </Text>

          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons
                  name={theme === "dark" ? "moon" : "sunny"}
                  size={24}
                  color={colors.primary}
                />
                <View>
                  <Text
                    style={[
                      styles.settingTitle,
                      {
                        color: colors.text,
                        fontSize: getFontSize(FontSizes.md),
                      },
                    ]}
                  >
                    Dark Mode
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      {
                        color: colors.textSecondary,
                        fontSize: getFontSize(FontSizes.sm),
                      },
                    ]}
                  >
                    {theme === "dark" ? "Enabled" : "Disabled"}
                  </Text>
                </View>
              </View>
              <Switch
                value={theme === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>
          </View>
        </View>

        {/* Accent Color Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: getFontSize(FontSizes.lg) },
            ]}
          >
            Accent Color
          </Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <View style={styles.colorGrid}>
              {accentColors.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorOption,
                    {
                      backgroundColor: color.color,
                      borderWidth: accentColor === color.value ? 4 : 0,
                      borderColor: colors.text,
                    },
                  ]}
                  onPress={() => setAccentColor(color.value)}
                  activeOpacity={0.7}
                >
                  {accentColor === color.value && (
                    <Ionicons name="checkmark" size={24} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.colorLabels}>
              {accentColors.map((color) => (
                <Text
                  key={color.value}
                  style={[
                    styles.colorLabel,
                    {
                      color:
                        accentColor === color.value
                          ? colors.text
                          : colors.textSecondary,
                      fontWeight: accentColor === color.value ? "700" : "400",
                      fontSize: getFontSize(FontSizes.sm),
                    },
                  ]}
                >
                  {color.name}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Font Size Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: getFontSize(FontSizes.lg) },
            ]}
          >
            Font Size
          </Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            {fontSizes.map((size) => (
              <TouchableOpacity
                key={size.value}
                style={[
                  styles.fontSizeOption,
                  {
                    backgroundColor:
                      fontSize === size.value
                        ? `${colors.primary}20`
                        : "transparent",
                    borderColor:
                      fontSize === size.value ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setFontSize(size.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.fontSizeLabel,
                    {
                      color:
                        fontSize === size.value ? colors.primary : colors.text,
                      fontSize:
                        size.value === "small"
                          ? FontSizes.sm
                          : size.value === "large"
                            ? FontSizes.lg
                            : FontSizes.md,
                    },
                  ]}
                >
                  {size.name}
                </Text>
                {fontSize === size.value && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color={colors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preview Section */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: getFontSize(FontSizes.lg) },
            ]}
          >
            Preview
          </Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <View style={styles.previewContent}>
              <Ionicons name="eye-outline" size={32} color={colors.primary} />
              <Text
                style={[
                  styles.previewTitle,
                  {
                    color: colors.text,
                    fontSize: getFontSize(FontSizes.xl),
                  },
                ]}
              >
                Theme Preview
              </Text>
              <Text
                style={[
                  styles.previewDescription,
                  {
                    color: colors.textSecondary,
                    fontSize: getFontSize(FontSizes.md),
                  },
                ]}
              >
                Sample Text
              </Text>
              <Text
                style={[
                  styles.previewDescription,
                  {
                    color: colors.textSecondary,
                    fontSize: getFontSize(FontSizes.sm),
                  },
                ]}
              >
                This is how your text will look with current settings
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={[
              styles.footerText,
              { color: colors.textLight, fontSize: getFontSize(FontSizes.sm) },
            ]}
          >
            Theme: {theme === "dark" ? "Dark" : "Light"} • Color: {accentColor}{" "}
            • Font: {fontSize}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: "#FFF",
    flex: 1,
  },
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
  },
  settingCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadow.small,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  settingTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  settingDescription: {
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  colorGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: Spacing.sm,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.small,
  },
  colorLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  colorLabel: {
    fontSize: FontSizes.xs,
    width: 50,
    textAlign: "center",
  },
  fontSizeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.sm,
  },
  fontSizeLabel: {
    fontWeight: FontWeights.semibold,
  },
  previewContent: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  previewTitle: {
    fontWeight: FontWeights.bold,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  previewDescription: {
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  footerText: {
    fontSize: FontSizes.xs,
    textAlign: "center",
  },
});
