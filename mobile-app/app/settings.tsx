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
    { name: "Fleet Blue", value: "blue", color: "#2E6CF6" },
    { name: "Safety Green", value: "green", color: "#2ECC71" },
    { name: "Vivid Purple", value: "purple", color: "#9B59B6" },
    { name: "Alert Orange", value: "orange", color: "#E67E22" },
    { name: "Critical Red", value: "red", color: "#E74C3C" },
  ];

  const fontSizes: { name: string; value: "small" | "medium" | "large"; desc: string }[] = [
    { name: "Compact", value: "small", desc: "Maximize information density" },
    { name: "Standard", value: "medium", desc: "Balanced for daily use" },
    { name: "Enhanced", value: "large", desc: "Improved legibility" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.appHeader, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.appHeaderTitle, { color: colors.text }]}>Configuration</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: getFontSize(12) }]}>
            VISUAL APPEARANCE
          </Text>

          <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text, fontSize: getFontSize(FontSizes.md) }]}>
                  Enterprise Dark Mode
                </Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary, fontSize: getFontSize(FontSizes.sm) }]}>
                  High-contrast surfaces for night operation
                </Text>
              </View>
              <Switch
                value={theme === "dark"}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFF"
              />
            </View>

            <View style={[styles.divider, { backgroundColor: colors.divider }]} />

            <View style={styles.colorSection}>
              <Text style={[styles.settingTitle, { color: colors.text, fontSize: getFontSize(FontSizes.md), marginBottom: Spacing.md }]}>
                Accent Palette
              </Text>
              <View style={styles.colorGrid}>
                {accentColors.map((color) => (
                  <TouchableOpacity
                    key={color.value}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color.color },
                      accentColor === color.value && { borderColor: colors.text, borderWidth: 3 }
                    ]}
                    onPress={() => setAccentColor(color.value)}
                  >
                    {accentColor === color.value && (
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Accessibility Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: getFontSize(12) }]}>
            ACCESSIBILITY
          </Text>

          <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            {fontSizes.map((size, index) => (
              <React.Fragment key={size.value}>
                <TouchableOpacity
                  style={styles.fontSizeOption}
                  onPress={() => setFontSize(size.value)}
                  activeOpacity={0.6}
                >
                  <View style={styles.settingInfo}>
                    <Text style={[
                      styles.settingTitle, 
                      { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                      fontSize === size.value && { color: colors.primary, fontWeight: FontWeights.bold }
                    ]}>
                      {size.name}
                    </Text>
                    <Text style={[styles.settingDesc, { color: colors.textSecondary, fontSize: getFontSize(FontSizes.sm) }]}>
                      {size.desc}
                    </Text>
                  </View>
                  <View style={[
                    styles.radioCircle, 
                    { borderColor: fontSize === size.value ? colors.primary : colors.divider },
                    fontSize === size.value && { backgroundColor: colors.primary }
                  ]}>
                    {fontSize === size.value && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
                {index < fontSizes.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.divider, marginLeft: 0 }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* System Info */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            Vigilant Driver Mobile v1.4.2
          </Text>
          <Text style={[styles.footerText, { color: colors.textLight }]}>
            Enterprise Fleet Analytics System
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    paddingTop: 48,
  },
  backIcon: { padding: Spacing.xs },
  appHeaderTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  headerRight: { width: 32 },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    paddingLeft: 4,
  },
  settingGroup: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
    ...Shadow.small,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontWeight: FontWeights.bold,
  },
  settingDesc: {
    marginTop: 2,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginLeft: Spacing.lg,
  },
  colorSection: {
    padding: Spacing.lg,
  },
  colorGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  fontSizeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    fontWeight: FontWeights.medium,
  },
});
