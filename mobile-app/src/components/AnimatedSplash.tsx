import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Parallel animations for smooth entrance
    Animated.sequence([
      // Icon appears and scales
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
      // Text slides up
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Hold for a moment then finish
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(onFinish);
      }, 1500);
    });
  }, [fadeAnim, onFinish, scaleAnim, slideAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      {/* Animated Icon */}
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.iconWrapper}>
          <Ionicons name="eye-outline" size={80} color="#FFFFFF" />
          <View style={styles.steeringOverlay}>
            <Ionicons name="car-outline" size={40} color="#FFFFFF" />
          </View>
        </View>
      </Animated.View>

      {/* Animated Text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Text style={styles.appName}>Vigilant Driver</Text>
        <Text style={styles.tagline}>Driver Monitoring and Safety</Text>
        <Text style={styles.tagline}>Assurance System</Text>

        {/* Loading indicator */}
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingDot,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.5, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.loadingDot,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 0.7, 1],
                  outputRange: [0, 0, 1],
                }),
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>Final Year Project 2025-26</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2196F3",
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconWrapper: {
    position: "relative",
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  steeringOverlay: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(33, 150, 243, 0.9)",
    borderRadius: 20,
    padding: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 4,
  },
  loadingContainer: {
    flexDirection: "row",
    marginTop: 30,
    gap: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "center",
  },
});
