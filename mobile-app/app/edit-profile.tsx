import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
  Shadow,
} from "@/src/utils/constants";
import { useSession } from "@/src/context/SessionContext";
import { useTheme } from "@/src/context/ThemeContext";

export default function EditProfileScreen() {
  const { currentDriver, setCurrentDriver } = useSession();
  const { colors, fontSize } = useTheme();

  const getFontSize = (base: number) => {
    const multiplier =
      fontSize === "small" ? 0.9 : fontSize === "large" ? 1.1 : 1;
    return base * multiplier;
  };

  const [name, setName] = useState(currentDriver?.name || "");
  const [cnic, setCnic] = useState(currentDriver?.cnic || "");
  const [phone, setPhone] = useState(currentDriver?.phone || "");
  const [isLoading, setIsLoading] = useState(false);

  const formatCNIC = (text: string) => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, "");
    // Format as XXXXX-XXXXXXX-X
    if (numbers.length <= 5) {
      return numbers;
    } else if (numbers.length <= 12) {
      return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    } else {
      return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(
        12,
        13,
      )}`;
    }
  };

  const formatPhone = (text: string) => {
    // Remove all non-numeric characters
    const numbers = text.replace(/\D/g, "");
    // Format as XXXX-XXXXXXX
    if (numbers.length <= 4) {
      return numbers;
    } else {
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 11)}`;
    }
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    const cnicNumbers = cnic.replace(/\D/g, "");
    if (cnicNumbers.length !== 13) {
      Alert.alert("Error", "CNIC must be 13 digits");
      return;
    }

    if (phone) {
      const phoneNumbers = phone.replace(/\D/g, "");
      if (phoneNumbers.length !== 11) {
        Alert.alert("Error", "Phone number must be 11 digits");
        return;
      }
    }

    setIsLoading(true);

    try {
      const updatedDriver = {
        id: currentDriver?.id || "",
        name: name.trim(),
        cnic: cnic,
        phone: phone || undefined,
      };

      await setCurrentDriver(updatedDriver);
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
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
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </LinearGradient>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View
              style={[styles.avatarContainer, { borderColor: colors.primary }]}
            >
              <Ionicons name="person" size={64} color={colors.primary} />
            </View>
            <TouchableOpacity
              style={[
                styles.changePhotoButton,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="camera" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                Full Name <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                  ]}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* CNIC Input */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                CNIC <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                  ]}
                  placeholder="XXXXX-XXXXXXX-X"
                  placeholderTextColor={colors.textLight}
                  value={cnic}
                  onChangeText={(text) => setCnic(formatCNIC(text))}
                  keyboardType="numeric"
                  maxLength={15}
                />
              </View>
              <Text
                style={[
                  styles.hint,
                  {
                    color: colors.textLight,
                    fontSize: getFontSize(FontSizes.xs),
                  },
                ]}
              >
                13-digit CNIC number
              </Text>
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                ]}
              >
                Phone Number <Text style={styles.optional}>(Optional)</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <TextInput
                  style={[
                    styles.input,
                    { color: colors.text, fontSize: getFontSize(FontSizes.md) },
                  ]}
                  placeholder="XXXX-XXXXXXX"
                  placeholderTextColor={colors.textLight}
                  value={phone}
                  onChangeText={(text) => setPhone(formatPhone(text))}
                  keyboardType="phone-pad"
                  maxLength={12}
                />
              </View>
              <Text
                style={[
                  styles.hint,
                  {
                    color: colors.textLight,
                    fontSize: getFontSize(FontSizes.xs),
                  },
                ]}
              >
                11-digit mobile number
              </Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                isLoading && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary]}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                <Text
                  style={[
                    styles.saveButtonText,
                    { fontSize: getFontSize(FontSizes.md) },
                  ]}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border }]}
              onPress={() => router.back()}
            >
              <Text
                style={[
                  styles.cancelButtonText,
                  {
                    color: colors.textSecondary,
                    fontSize: getFontSize(FontSizes.md),
                  },
                ]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  avatarSection: {
    alignItems: "center",
    paddingVertical: Spacing.xl,
    position: "relative",
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(33, 150, 243, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
  },
  changePhotoButton: {
    position: "absolute",
    bottom: Spacing.xl,
    right: "35%",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.medium,
  },
  formSection: {
    padding: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.error,
  },
  optional: {
    color: Colors.textLight,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    ...Shadow.small,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.sm,
  },
  hint: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  saveButton: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginTop: Spacing.md,
    ...Shadow.medium,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  saveButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: "#FFF",
  },
  cancelButton: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.sm,
    borderWidth: 2,
  },
  cancelButtonText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
});
